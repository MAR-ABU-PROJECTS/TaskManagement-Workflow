import prisma from "../db/prisma";
import { TaskStatus } from "../types/enums";
import NotificationService from "./NotificationService";

export enum DependencyType {
  BLOCKS = "BLOCKS",
  IS_BLOCKED_BY = "IS_BLOCKED_BY",
  RELATES_TO = "RELATES_TO",
}

export interface TaskDependency {
  id: string;
  dependentTaskId: string;
  blockingTaskId: string;
  type: DependencyType;
  createdAt: Date;
  dependentTask?: any;
  blockingTask?: any;
}

export interface BlockingInfo {
  taskId: string;
  isBlocked: boolean;
  blockedBy: Array<{
    taskId: string;
    taskKey: string;
    title: string;
    status: string;
    type: DependencyType;
  }>;
  blocking: Array<{
    taskId: string;
    taskKey: string;
    title: string;
    status: string;
    type: DependencyType;
  }>;
  canStart: boolean;
  blockedReason?: string;
}

export interface SubtaskSummary {
  parentTaskId: string;
  totalSubtasks: number;
  completedSubtasks: number;
  inProgressSubtasks: number;
  todoSubtasks: number;
  completionPercentage: number;
  estimatedHours: number;
  loggedHours: number;
  remainingHours: number;
}

export class TaskDependencyService {
  /**
   * Create task dependency
   */
  async createDependency(
    dependentTaskId: string,
    blockingTaskId: string,
    type: DependencyType = DependencyType.BLOCKS
  ): Promise<TaskDependency> {
    // Validate both tasks exist
    const [dependentTask, blockingTask] = await Promise.all([
      prisma.task.findUnique({ where: { id: dependentTaskId } }),
      prisma.task.findUnique({ where: { id: blockingTaskId } }),
    ]);

    if (!dependentTask || !blockingTask) {
      throw new Error("One or both tasks not found");
    }

    // Prevent self-dependency
    if (dependentTaskId === blockingTaskId) {
      throw new Error("Task cannot depend on itself");
    }

    // Check for circular dependency
    const wouldCreateCycle = await this.wouldCreateCycle(
      dependentTaskId,
      blockingTaskId
    );
    if (wouldCreateCycle) {
      throw new Error(
        "This dependency would create a circular dependency chain"
      );
    }

    // Check if dependency already exists
    const existing = await prisma.taskDependency.findFirst({
      where: {
        dependentTaskId,
        blockingTaskId,
      },
    });

    if (existing) {
      throw new Error("Dependency already exists");
    }

    const dependency = await prisma.taskDependency.create({
      data: {
        dependentTaskId,
        blockingTaskId,
        type,
      },
      include: {
        dependentTask: {
          select: {
            id: true,
            title: true,
            status: true,
            assignees: { select: { userId: true } },
          },
        },
        blockingTask: {
          select: {
            id: true,
            title: true,
            status: true,
          },
        },
      },
    });

    // Notify all assignees about the dependency
    for (const assignment of dependency.dependentTask.assignees) {
      await NotificationService.createNotification(
        assignment.userId,
        "DEPENDENCY_ADDED" as any,
        {
          taskId: dependency.dependentTask.id,
          taskTitle: dependency.dependentTask.title,
          blockingTaskTitle: dependency.blockingTask.title,
          message: `Task "${dependency.dependentTask.title}" now depends on "${dependency.blockingTask.title}"`,
        }
      );
    }

    return dependency as TaskDependency;
  }

  /**
   * Get all dependencies for a task
   */
  async getTaskDependencies(taskId: string): Promise<{
    blocking: TaskDependency[];
    blockedBy: TaskDependency[];
  }> {
    const [blocking, blockedBy] = await Promise.all([
      prisma.taskDependency.findMany({
        where: { blockingTaskId: taskId },
        include: {
          dependentTask: {
            select: {
              id: true,
              title: true,
              status: true,
              priority: true,
            },
          },
        },
      }),
      prisma.taskDependency.findMany({
        where: { dependentTaskId: taskId },
        include: {
          blockingTask: {
            select: {
              id: true,
              title: true,
              status: true,
              priority: true,
            },
          },
        },
      }),
    ]);

    return {
      blocking: blocking as any,
      blockedBy: blockedBy as any,
    };
  }

  /**
   * Get blocking information for a task
   */
  async getBlockingInfo(taskId: string): Promise<BlockingInfo> {
    const dependencies = await this.getTaskDependencies(taskId);

    const blockedBy = dependencies.blockedBy
      .filter((dep) => {
        const status = dep.blockingTask.status as TaskStatus;
        return status !== TaskStatus.COMPLETED;
      })
      .map((dep) => ({
        taskId: dep.blockingTask.id,
        taskKey: dep.blockingTask.id,
        title: dep.blockingTask.title,
        status: dep.blockingTask.status,
        type: dep.type,
      }));

    const blocking = dependencies.blocking.map((dep) => ({
      taskId: dep.dependentTask.id,
      taskKey: dep.dependentTask.id,
      title: dep.dependentTask.title,
      status: dep.dependentTask.status,
      type: dep.type,
    }));

    const isBlocked = blockedBy.length > 0;
    const canStart = !isBlocked;

    let blockedReason: string | undefined;
    if (isBlocked) {
      const blockingTitles = blockedBy.map((t) => t.title).join(", ");
      blockedReason = `Blocked by: ${blockingTitles}`;
    }

    return {
      taskId,
      isBlocked,
      blockedBy,
      blocking,
      canStart,
      blockedReason,
    };
  }

  /**
   * Get subtask summary for a parent task
   */
  async getSubtaskSummary(parentTaskId: string): Promise<SubtaskSummary> {
    const subtasks = await prisma.task.findMany({
      where: { parentTaskId },
      include: {
        timeEntries: {
          select: {
            hours: true,
          },
        },
      },
    });

    const totalSubtasks = subtasks.length;
    const completedSubtasks = subtasks.filter(
      (t) => t.status === TaskStatus.COMPLETED
    ).length;
    const inProgressSubtasks = subtasks.filter(
      (t) => t.status === TaskStatus.IN_PROGRESS
    ).length;
    const todoSubtasks = subtasks.filter(
      (t) => t.status === TaskStatus.DRAFT || t.status === TaskStatus.ASSIGNED
    ).length;

    const completionPercentage =
      totalSubtasks > 0
        ? Math.round((completedSubtasks / totalSubtasks) * 100)
        : 0;

    const estimatedHours = subtasks.reduce(
      (sum, task) => sum + (task.estimatedHours || 0),
      0
    );

    const loggedHours = subtasks.reduce((sum, task) => {
      const taskHours = task.timeEntries.reduce(
        (taskSum, entry) => taskSum + entry.hours,
        0
      );
      return sum + taskHours;
    }, 0);

    const remainingHours = Math.max(0, estimatedHours - loggedHours);

    return {
      parentTaskId,
      totalSubtasks,
      completedSubtasks,
      inProgressSubtasks,
      todoSubtasks,
      completionPercentage,
      estimatedHours,
      loggedHours,
      remainingHours,
    };
  }

  /**
   * Delete dependency
   */
  async deleteDependency(dependencyId: string): Promise<boolean> {
    const dependency = await prisma.taskDependency.findUnique({
      where: { id: dependencyId },
    });

    if (!dependency) {
      return false;
    }

    await prisma.taskDependency.delete({
      where: { id: dependencyId },
    });

    return true;
  }

  /**
   * Check if creating a dependency would create a cycle
   */
  private async wouldCreateCycle(
    dependentTaskId: string,
    blockingTaskId: string
  ): Promise<boolean> {
    // Use DFS to detect cycle
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const dfs = async (taskId: string): Promise<boolean> => {
      visited.add(taskId);
      recursionStack.add(taskId);

      // Get all tasks that this task depends on
      const dependencies = await prisma.taskDependency.findMany({
        where: { dependentTaskId: taskId },
        select: { blockingTaskId: true },
      });

      for (const dep of dependencies) {
        const nextTaskId = dep.blockingTaskId;

        if (!visited.has(nextTaskId)) {
          if (await dfs(nextTaskId)) {
            return true;
          }
        } else if (recursionStack.has(nextTaskId)) {
          return true; // Cycle detected
        }
      }

      recursionStack.delete(taskId);
      return false;
    };

    // Temporarily add the new dependency to check
    const tempDeps = await prisma.taskDependency.findMany({
      where: { dependentTaskId: blockingTaskId },
    });

    // Check if dependentTaskId appears in the chain of blockingTaskId
    for (const dep of tempDeps) {
      if (dep.blockingTaskId === dependentTaskId) {
        return true;
      }
    }

    // Full cycle check starting from the dependent task
    return await dfs(blockingTaskId);
  }

  /**
   * Get all dependencies (for admin/reports)
   */
  async getAllDependencies(filters?: {
    projectId?: string;
    type?: DependencyType;
  }): Promise<TaskDependency[]> {
    const where: any = {};

    if (filters?.type) {
      where.type = filters.type;
    }

    if (filters?.projectId) {
      where.OR = [
        { dependentTask: { projectId: filters.projectId } },
        { blockingTask: { projectId: filters.projectId } },
      ];
    }

    const dependencies = await prisma.taskDependency.findMany({
      where,
      include: {
        dependentTask: {
          select: {
            id: true,
            title: true,
            status: true,
            projectId: true,
          },
        },
        blockingTask: {
          select: {
            id: true,
            title: true,
            status: true,
            projectId: true,
          },
        },
      },
    });

    return dependencies as any;
  }
}

export default new TaskDependencyService();

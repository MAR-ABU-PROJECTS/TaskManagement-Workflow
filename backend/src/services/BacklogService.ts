import prisma from "../db/prisma";
import { TaskPriority } from "../types/enums";

class BacklogService {
  /**
   * Get project backlog (tasks not in any sprint)
   */
  async getProjectBacklog(
    projectId: string,
    options?: {
      epicId?: string;
      priority?: string;
      assigneeId?: string;
    }
  ) {
    const where: any = {
      projectId,
      sprintId: null, // Not in any sprint
    };

    if (options?.epicId) {
      where.epicId = options.epicId;
    }

    if (options?.priority) {
      where.priority = options.priority;
    }

    if (options?.assigneeId) {
      where.assignees = { some: { userId: options.assigneeId } };
    }

    const tasks = await prisma.task.findMany({
      where,
      include: {
        assignees: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        epic: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
        dependentOn: {
          include: {
            blockingTask: {
              select: {
                id: true,
                title: true,
                status: true,
              },
            },
          },
        },
      },
      orderBy: [{ priority: "asc" }, { createdAt: "desc" }],
    });

    return tasks;
  }

  /**
   * Get backlog grouped by epic
   */
  async getBacklogByEpic(projectId: string) {
    const epics = await prisma.epic.findMany({
      where: { projectId },
      include: {
        tasks: {
          where: { sprintId: null },
          include: {
            assignees: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
          orderBy: [{ priority: "asc" }, { createdAt: "desc" }],
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Get tasks without epic
    const tasksWithoutEpic = await prisma.task.findMany({
      where: {
        projectId,
        sprintId: null,
        epicId: null,
      },
      include: {
        assignees: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: [{ priority: "asc" }, { createdAt: "desc" }],
    });

    return {
      epics: epics.map((epic) => ({
        ...epic,
        taskCount: epic.tasks.length,
        totalStoryPoints: epic.tasks.reduce(
          (sum: number, t: any) => sum + (t.storyPoints || 0),
          0
        ),
      })),
      unassignedTasks: tasksWithoutEpic,
    };
  }

  /**
   * Update task priority/order in backlog
   */
  async updateBacklogPriority(taskId: string, priority: string) {
    const task = await prisma.task.update({
      where: { id: taskId },
      data: { priority: priority as any },
      include: {
        assignees: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        epic: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return task;
  }

  /**
   * Estimate task story points
   */
  async estimateTask(taskId: string, storyPoints: number) {
    if (storyPoints < 0) {
      throw new Error("Story points cannot be negative");
    }

    const task = await prisma.task.update({
      where: { id: taskId },
      data: { storyPoints },
    });

    return task;
  }

  /**
   * Bulk estimate multiple tasks
   */
  async bulkEstimate(estimates: { taskId: string; storyPoints: number }[]) {
    const updatePromises = estimates.map(({ taskId, storyPoints }) =>
      prisma.task.update({
        where: { id: taskId },
        data: { storyPoints },
      })
    );

    await Promise.all(updatePromises);

    return { message: `${estimates.length} tasks estimated` };
  }

  /**
   * Get backlog statistics
   */
  async getBacklogStats(projectId: string) {
    const backlogTasks = await prisma.task.findMany({
      where: {
        projectId,
        sprintId: null,
      },
      select: {
        id: true,
        priority: true,
        storyPoints: true,
        status: true,
      },
    });

    const totalTasks = backlogTasks.length;
    const estimatedTasks = backlogTasks.filter((t) => t.storyPoints).length;
    const totalStoryPoints = backlogTasks.reduce(
      (sum, t) => sum + (t.storyPoints || 0),
      0
    );

    const byPriority = {
      LOW: backlogTasks.filter((t) => t.priority === TaskPriority.LOW).length,
      MEDIUM: backlogTasks.filter((t) => t.priority === TaskPriority.MEDIUM)
        .length,
      HIGH: backlogTasks.filter((t) => t.priority === TaskPriority.HIGH).length,
      CRITICAL: backlogTasks.filter((t) => t.priority === ("CRITICAL" as any))
        .length,
    };

    return {
      projectId,
      totalTasks,
      estimatedTasks,
      estimationPercentage:
        totalTasks > 0 ? Math.round((estimatedTasks / totalTasks) * 100) : 0,
      totalStoryPoints,
      byPriority,
    };
  }

  /**
   * Get ready tasks (estimated and not blocked)
   */
  async getReadyTasks(projectId: string) {
    const tasks = await prisma.task.findMany({
      where: {
        projectId,
        sprintId: null,
        storyPoints: { not: null },
      },
      include: {
        assignees: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        epic: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
        dependentOn: {
          include: {
            blockingTask: {
              select: {
                id: true,
                title: true,
                status: true,
              },
            },
          },
        },
      },
      orderBy: [{ priority: "asc" }, { createdAt: "desc" }],
    });

    // Filter out blocked tasks
    const readyTasks = tasks.filter(
      (task) =>
        !task.dependentOn.some(
          (dep: any) => dep.blockingTask.status !== "COMPLETED"
        )
    );

    return readyTasks;
  }

  /**
   * Move tasks to sprint
   */
  async moveTasksToSprint(taskIds: string[], sprintId: string) {
    // Verify sprint exists and is not completed
    const sprint = await prisma.sprint.findUnique({
      where: { id: sprintId },
    });

    if (!sprint) {
      throw new Error("Sprint not found");
    }

    if (sprint.status === "COMPLETED" || sprint.status === "CANCELLED") {
      throw new Error("Cannot add tasks to completed or cancelled sprint");
    }

    await prisma.task.updateMany({
      where: {
        id: { in: taskIds },
        projectId: sprint.projectId,
      },
      data: { sprintId },
    });

    return { message: `${taskIds.length} tasks moved to sprint` };
  }
}

export default new BacklogService();

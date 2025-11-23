import prisma from "../db/prisma";
import { CreateTaskDTO, UpdateTaskDTO, Task } from "../types/interfaces";
import {
  UserRole,
  TaskStatus,
  ALLOWED_STATUS_TRANSITIONS,
  ActivityAction,
  IssueType,
} from "../types/enums";
import NotificationService from "./NotificationService";
import ActivityLogService from "./ActivityLogService";

export class TaskService {
  /**
   * Create a new task
   */
  async createTask(
    data: CreateTaskDTO,
    creatorId: string,
    creatorRole: UserRole
  ): Promise<Task> {
    // Validate project exists if projectId provided
    if (data.projectId) {
      const project = await prisma.project.findUnique({
        where: { id: data.projectId },
      });

      if (!project) {
        throw new Error("Project not found");
      }
    }

    // Validate assignee exists if provided
    if (data.assigneeId) {
      const assignee = await prisma.user.findUnique({
        where: { id: data.assigneeId },
      });

      if (!assignee) {
        throw new Error("Assignee not found");
      }
    }

    // Determine if task requires approval
    // Admin creating task for Staff requires approval
    const requiresApproval = await this.checkIfRequiresApproval(
      creatorId,
      creatorRole,
      data.assigneeId
    );

    // Auto-approve for CEO, HOO, HR created tasks
    const autoApprove = [UserRole.CEO, UserRole.HOO, UserRole.HR].includes(
      creatorRole
    );

    const task = await prisma.task.create({
      data: {
        projectId: data.projectId || null,
        title: data.title,
        description: data.description || null,
        priority: data.priority || "MEDIUM",
        issueType: data.issueType || IssueType.TASK,
        status: TaskStatus.DRAFT,
        creatorId,
        assigneeId: data.assigneeId || null,
        parentTaskId: data.parentTaskId || null,
        requiresApproval,
        approvedById: autoApprove ? creatorId : null,
        labels: data.labels || [],
        dueDate: data.dueDate || null,
      },
    });

    // Log activity
    await ActivityLogService.logActivity({
      taskId: task.id,
      userId: creatorId,
      action: ActivityAction.CREATE,
      metadata: { taskData: data },
    });

    // Send notification if task is assigned
    if (data.assigneeId && data.assigneeId !== creatorId) {
      await NotificationService.notifyTaskAssigned(
        task.id,
        data.assigneeId,
        creatorId
      );
    }

    // Notify approvers if approval required
    if (requiresApproval && !autoApprove) {
      await NotificationService.notifyApprovalRequired(task.id);
    }

    return task as Task;
  }

  /**
   * Get all tasks with filtering
   */
  async getAllTasks(
    userId: string,
    userRole: UserRole,
    filters?: {
      projectId?: string;
      status?: TaskStatus;
      assigneeId?: string;
      creatorId?: string;
    }
  ): Promise<Task[]> {
    const where: any = {};

    // Apply filters
    if (filters?.projectId) where.projectId = filters.projectId;
    if (filters?.status) where.status = filters.status;
    if (filters?.assigneeId) where.assigneeId = filters.assigneeId;
    if (filters?.creatorId) where.creatorId = filters.creatorId;

    // Role-based filtering
    if (userRole === UserRole.STAFF) {
      // Staff only see their own tasks or tasks assigned to them
      where.OR = [{ creatorId: userId }, { assigneeId: userId }];
    } else if (userRole === UserRole.ADMIN) {
      // Admin sees tasks they created or are assigned to
      where.OR = [
        { creatorId: userId },
        { assigneeId: userId },
        { creator: { role: UserRole.STAFF } }, // Tasks created by staff they manage
      ];
    }
    // CEO, HOO, HR see all tasks (no additional filter)

    const tasks = await prisma.task.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            comments: true,
            subTasks: true,
          },
        },
      },
    });

    return tasks as any;
  }

  /**
   * Get task by ID
   */
  async getTaskById(
    id: string,
    userId: string,
    userRole: UserRole
  ): Promise<Task | null> {
    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        approvedBy: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        project: true,
        parentTask: true,
        subTasks: {
          select: {
            id: true,
            title: true,
            status: true,
            priority: true,
          },
        },
        comments: {
          orderBy: { createdAt: "desc" },
          take: 10,
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
      },
    });

    if (!task) {
      return null;
    }

    // Check access
    const hasAccess = this.checkTaskAccess(task, userId, userRole);
    if (!hasAccess) {
      return null;
    }

    return task as any;
  }

  /**
   * Update task
   */
  async updateTask(
    id: string,
    data: UpdateTaskDTO,
    userId: string,
    userRole: UserRole
  ): Promise<Task | null> {
    const task = await prisma.task.findUnique({ where: { id } });

    if (!task) {
      return null;
    }

    // Check permission
    const canUpdate =
      task.creatorId === userId ||
      task.assigneeId === userId ||
      [UserRole.CEO, UserRole.HOO, UserRole.HR].includes(userRole);

    if (!canUpdate) {
      throw new Error(
        "Forbidden: You do not have permission to update this task"
      );
    }

    const updated = await prisma.task.update({
      where: { id },
      data: {
        title: data.title,
        description: data.description,
        priority: data.priority,
        issueType: data.issueType,
        labels: data.labels,
        dueDate: data.dueDate,
      },
    });

    return updated as Task;
  }

  /**
   * Change task status
   */
  async changeStatus(
    id: string,
    newStatus: TaskStatus,
    userId: string,
    userRole: UserRole
  ): Promise<Task | null> {
    const task = await prisma.task.findUnique({ where: { id } });

    if (!task) {
      return null;
    }

    // Validate status transition
    const allowedTransitions =
      ALLOWED_STATUS_TRANSITIONS[task.status as TaskStatus];
    if (!allowedTransitions.includes(newStatus)) {
      throw new Error(
        `Invalid status transition from ${task.status} to ${newStatus}`
      );
    }

    // Check permission
    const canChange =
      task.creatorId === userId ||
      task.assigneeId === userId ||
      [UserRole.CEO, UserRole.HOO, UserRole.HR].includes(userRole);

    if (!canChange) {
      throw new Error(
        "Forbidden: You do not have permission to change this task status"
      );
    }

    const updated = await prisma.task.update({
      where: { id },
      data: { status: newStatus },
    });

    // Log activity
    await ActivityLogService.logActivity({
      taskId: id,
      userId,
      action: ActivityAction.STATUS_UPDATE,
      previousStatus: task.status as TaskStatus,
      newStatus,
      metadata: {},
    });

    // Notify relevant users
    await NotificationService.notifyStatusChanged(
      id,
      task.status as TaskStatus,
      newStatus
    );

    return updated as Task;
  }

  /**
   * Assign task to user
   */
  async assignTask(
    id: string,
    assigneeId: string,
    userId: string,
    userRole: UserRole
  ): Promise<Task | null> {
    const task = await prisma.task.findUnique({ where: { id } });

    if (!task) {
      return null;
    }

    // Check permission
    const canAssign =
      task.creatorId === userId ||
      [UserRole.CEO, UserRole.HOO, UserRole.HR, UserRole.ADMIN].includes(
        userRole
      );

    if (!canAssign) {
      throw new Error(
        "Forbidden: You do not have permission to assign this task"
      );
    }

    // Validate assignee exists
    const assignee = await prisma.user.findUnique({
      where: { id: assigneeId },
    });

    if (!assignee) {
      throw new Error("Assignee not found");
    }

    const updated = await prisma.task.update({
      where: { id },
      data: {
        assigneeId,
        status: TaskStatus.ASSIGNED,
      },
    });

    // Log activity
    await ActivityLogService.logActivity({
      taskId: id,
      userId,
      action: ActivityAction.ASSIGN,
      metadata: { assigneeId, assigneeName: assignee.name },
    });

    // Notify assignee
    await NotificationService.notifyTaskAssigned(id, assigneeId, userId);

    return updated as Task;
  }

  /**
   * Approve task
   */
  async approveTask(
    id: string,
    approverId: string,
    userRole: UserRole
  ): Promise<Task | null> {
    const task = await prisma.task.findUnique({ where: { id } });

    if (!task) {
      return null;
    }

    if (!task.requiresApproval) {
      throw new Error("This task does not require approval");
    }

    if (task.approvedById) {
      throw new Error("Task already approved");
    }

    // Only CEO, HOO, HR can approve
    if (![UserRole.CEO, UserRole.HOO, UserRole.HR].includes(userRole)) {
      throw new Error("Forbidden: Only CEO, HOO, or HR can approve tasks");
    }

    const updated = await prisma.task.update({
      where: { id },
      data: { approvedById: approverId },
    });

    // Log activity
    await ActivityLogService.logActivity({
      taskId: id,
      userId: approverId,
      action: ActivityAction.APPROVE,
      metadata: {},
    });

    // Notify creator and assignee
    await NotificationService.notifyTaskApproved(id);

    return updated as Task;
  }

  /**
   * Reject task
   */
  async rejectTask(
    id: string,
    rejectionReason: string,
    userId: string,
    userRole: UserRole
  ): Promise<Task | null> {
    const task = await prisma.task.findUnique({ where: { id } });

    if (!task) {
      return null;
    }

    // Only CEO, HOO, HR can reject
    if (![UserRole.CEO, UserRole.HOO, UserRole.HR].includes(userRole)) {
      throw new Error("Forbidden: Only CEO, HOO, or HR can reject tasks");
    }

    if (!rejectionReason) {
      throw new Error("Rejection reason is required");
    }

    const updated = await prisma.task.update({
      where: { id },
      data: {
        status: TaskStatus.REJECTED,
        rejectionReason,
      },
    });

    // Log activity
    await ActivityLogService.logActivity({
      taskId: id,
      userId,
      action: ActivityAction.REJECT,
      newStatus: TaskStatus.REJECTED,
      metadata: { rejectionReason },
    });

    // Notify creator and assignee
    await NotificationService.notifyTaskRejected(id, rejectionReason);

    return updated as Task;
  }

  /**
   * Helper: Check if task requires approval
   */
  private async checkIfRequiresApproval(
    _creatorId: string,
    creatorRole: UserRole,
    assigneeId?: string
  ): Promise<boolean> {
    // Auto-approve for CEO, HOO, HR
    if ([UserRole.CEO, UserRole.HOO, UserRole.HR].includes(creatorRole)) {
      return false;
    }

    // Admin creating task for Staff requires approval
    if (creatorRole === UserRole.ADMIN && assigneeId) {
      const assignee = await prisma.user.findUnique({
        where: { id: assigneeId },
      });

      if (assignee?.role === UserRole.STAFF) {
        return true;
      }
    }

    return false;
  }

  /**
   * Helper: Check if user has access to task
   */
  private checkTaskAccess(
    task: any,
    userId: string,
    userRole: UserRole
  ): boolean {
    // CEO, HOO, HR see all tasks
    if ([UserRole.CEO, UserRole.HOO, UserRole.HR].includes(userRole)) {
      return true;
    }

    // Creator and assignee have access
    if (task.creatorId === userId || task.assigneeId === userId) {
      return true;
    }

    // Admin sees tasks created by staff
    if (userRole === UserRole.ADMIN && task.creator?.role === UserRole.STAFF) {
      return true;
    }

    return false;
  }
}

export default new TaskService();

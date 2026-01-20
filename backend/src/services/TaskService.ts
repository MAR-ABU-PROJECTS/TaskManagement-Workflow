import prisma from "../db/prisma";
import { CreateTaskDTO, UpdateTaskDTO, Task } from "../types/interfaces";
import {
  UserRole,
  TaskStatus,
  ActivityAction,
  IssueType,
} from "../types/enums";
import { ProjectRole, WorkflowType, Permission } from "@prisma/client";
import {
  isTransitionAllowed,
  getAvailableTransitions as getWorkflowTransitions,
} from "../config/workflows";
import NotificationService from "./NotificationService";
import ActivityLogService from "./ActivityLogService";
import emailService from "./EmailService";
import PermissionService from "./PermissionService";

/**
 * Status Categories - Maps TaskStatus to Board Columns (Jira-style)
 * This is the "status category" concept from Jira
 */
const STATUS_CATEGORIES = {
  TODO: {
    name: "To Do",
    statuses: [TaskStatus.DRAFT, TaskStatus.ASSIGNED],
    description: "Work that has not started",
  },
  IN_PROGRESS: {
    name: "In Progress",
    statuses: [TaskStatus.IN_PROGRESS, TaskStatus.PAUSED],
    description: "Work that is currently being worked on",
  },
  REVIEW: {
    name: "Review",
    statuses: [TaskStatus.REVIEW],
    description: "Work that is being reviewed or tested",
  },
  DONE: {
    name: "Done",
    statuses: [TaskStatus.COMPLETED, TaskStatus.REJECTED],
    description: "Work that is finished",
  },
};

export class TaskService {
  /**
   * Create a new task
   */
  async createTask(
    data: CreateTaskDTO,
    creatorId: string,
    creatorRole: UserRole,
  ): Promise<Task> {
    // Validate project exists if projectId provided
    let projectCreatorId: string | null = null;
    if (data.projectId) {
      const project = await prisma.project.findUnique({
        where: { id: data.projectId },
        select: { id: true, creatorId: true },
      });

      if (!project) {
        throw new Error("Project not found");
      }
      projectCreatorId = project.creatorId;
    }

    // Validate assignees exist if provided
    const assigneeIds = data.assigneeIds || [];
    if (
      projectCreatorId &&
      projectCreatorId === creatorId &&
      !assigneeIds.includes(creatorId)
    ) {
      assigneeIds.push(creatorId);
    }
    if (assigneeIds.length > 0) {
      const users = await prisma.user.findMany({
        where: { id: { in: assigneeIds } },
      });

      if (users.length !== assigneeIds.length) {
        throw new Error("One or more assignees not found");
      }

      // Validate assignees are project members if task belongs to a project
      if (data.projectId) {
        const members = await prisma.projectMember.findMany({
          where: {
            projectId: data.projectId,
            userId: { in: assigneeIds },
          },
        });

        if (members.length !== assigneeIds.length) {
          throw new Error("All assignees must be project members");
        }
      } else {
        // For personal tasks, validate assignees are operational users (not SUPER_ADMIN)
        const invalidAssignees = users.filter(
          (u) => u.role === UserRole.SUPER_ADMIN,
        );
        if (invalidAssignees.length > 0) {
          throw new Error(
            "Cannot assign personal tasks to audit-only users (SUPER_ADMIN)",
          );
        }
      }
    }

    // AUTOMATION RULE: Determine if task requires approval
    // Based on creator role:
    // - STAFF tasks require approval
    // - ADMIN, HOO, HR, CEO tasks are auto-approved
    const requiresApproval = await this.checkIfRequiresApproval(
      creatorId,
      creatorRole,
    );

    // Calculate position for new task (place at end of status column)
    const position = await this.getNextPositionForStatus(
      data.projectId || null,
      TaskStatus.DRAFT,
    );

    const task = await prisma.task.create({
      data: {
        projectId: data.projectId || null,
        title: data.title,
        description: data.description || null,
        priority: (data.priority as any) || "MEDIUM",
        issueType: data.issueType || IssueType.TASK,
        status: assigneeIds.length > 0 ? TaskStatus.ASSIGNED : TaskStatus.DRAFT,
        creatorId,
        parentTaskId: data.parentTaskId || null,
        requiresApproval,
        approvedById: null, // Only set when explicitly approved by authorized person
        labels: data.labels || [],
        dueDate: data.dueDate || null,
        position,
        // Create assignee relations
        assignees: {
          create: assigneeIds.map((userId) => ({
            userId,
            assignedBy: creatorId,
          })),
        },
      },
      include: {
        assignees: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
              },
            },
          },
        },
      },
    });

    // AUTOMATION: Auto activity logs
    await ActivityLogService.logActivity({
      taskId: task.id,
      userId: creatorId,
      action: ActivityAction.CREATE,
      metadata: { taskData: data },
    });

    // AUTOMATION: Send notification to each assignee
    for (const assigneeId of assigneeIds) {
      if (assigneeId !== creatorId) {
        await NotificationService.notifyTaskAssigned(
          task.id,
          assigneeId,
          creatorId,
        );
      }
    }

    // AUTOMATION: Notify approvers if approval required
    if (requiresApproval) {
      await NotificationService.notifyApprovalRequired(task.id);
    }

    // AUTOMATION: Creator auto-added as watcher, plus all assignees
    await prisma.task.update({
      where: { id: task.id },
      data: {
        watchers: {
          connect: [{ id: creatorId }, ...assigneeIds.map((id) => ({ id }))],
        },
      },
    });

    return task as any;
  }

  /**
   * Create a personal task (no project required)
   */
  async createPersonalTask(
    data: {
      title: string;
      description?: string;
      priority?: string;
      issueType?: IssueType;
      labels?: string[];
      dueDate?: Date;
      estimatedHours?: number;
      storyPoints?: number;
    },
    creatorId: string,
  ): Promise<Task> {
    // Personal tasks:
    // - No project required
    // - Auto-assigned to creator
    // - No approval required
    // - Private to the creator

    // Validate that the creator is not a SUPER_ADMIN
    const creator = await prisma.user.findUnique({
      where: { id: creatorId },
      select: { role: true },
    });

    if (!creator) {
      throw new Error("User not found");
    }

    if (creator.role === UserRole.SUPER_ADMIN) {
      throw new Error(
        "SUPER_ADMIN users cannot create personal tasks. Personal tasks are for operational users only.",
      );
    }

    // Calculate position for personal task
    const position = await this.getNextPositionForStatus(
      null,
      TaskStatus.DRAFT,
    );

    const task = await prisma.task.create({
      data: {
        projectId: null, // Personal tasks have no project
        title: data.title,
        description: data.description || null,
        priority: (data.priority as any) || "MEDIUM",
        issueType: data.issueType || IssueType.TASK,
        status: TaskStatus.DRAFT,
        creatorId,
        requiresApproval: false, // Personal tasks don't need approval
        approvedById: creatorId, // Auto-approved
        labels: data.labels || [],
        dueDate: data.dueDate || null,
        estimatedHours: data.estimatedHours || null,
        storyPoints: data.storyPoints || null,
        position,
        // Auto-assign to creator
        assignees: {
          create: [
            {
              userId: creatorId,
              assignedBy: creatorId,
            },
          ],
        },
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        assignees: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
              },
            },
          },
        },
      },
    });

    // Log activity
    await ActivityLogService.logActivity({
      taskId: task.id,
      userId: creatorId,
      action: ActivityAction.CREATE,
      metadata: { taskType: "personal", taskData: data },
    });

    // Creator auto-added as watcher
    await prisma.task
      .update({
        where: { id: task.id },
        data: {
          watchers: {
            connect: { id: creatorId },
          },
        },
      })
      .catch(() => {}); // Ignore if watchers relation fails

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
      includePersonal?: boolean;
    },
  ): Promise<Task[]> {
    const where: any = {};

    // Apply filters
    if (filters?.projectId) where.projectId = filters.projectId;
    if (filters?.status) where.status = filters.status;
    if (filters?.assigneeId) {
      where.assignees = { some: { userId: filters.assigneeId } };
    }
    if (filters?.creatorId) where.creatorId = filters.creatorId;

    // Hierarchical visibility rules:
    // - SUPER_ADMIN: sees everything (all projects + all personal tasks) - audit
    // - CEO: sees all project tasks (management oversight), but NO personal tasks
    // - HOO/HR: see ADMIN + STAFF tasks only, but NO CEO tasks and NO personal tasks
    // - ADMIN/STAFF: see only tasks they created or are assigned to, NO personal tasks of others
    // - Personal tasks (projectId = null): ONLY visible to creator + SUPER_ADMIN

    if (userRole === UserRole.SUPER_ADMIN) {
      // SUPER_ADMIN sees everything including all personal tasks (audit)
      // No additional filtering needed
    } else if (userRole === UserRole.CEO) {
      // CEO sees all project tasks, but NO personal tasks
      where.projectId = { not: null };
    } else if (userRole === UserRole.HOO || userRole === UserRole.HR) {
      // HOO/HR see ADMIN and STAFF tasks, plus projects where they're members
      where.AND = [
        { projectId: { not: null } }, // Exclude personal tasks
        {
          OR: [
            {
              creator: {
                role: {
                  in: [UserRole.ADMIN, UserRole.STAFF],
                },
              },
            },
            { project: { members: { some: { userId } } } },
            { project: { creatorId: userId } },
          ],
        },
      ];
    } else {
      // ADMIN and STAFF see tasks for projects they belong to
      // plus any tasks they created or are assigned to
      where.AND = [
        {
          OR: [
            { project: { members: { some: { userId } } } },
            { project: { creatorId: userId } },
            { creatorId: userId },
            { assignees: { some: { userId } } },
          ],
        },
        // Explicitly exclude personal tasks they didn't create
        {
          OR: [
            { projectId: { not: null } }, // Project tasks they're involved in
            { AND: [{ projectId: null }, { creatorId: userId }] }, // Only their own personal tasks
          ],
        },
      ];
    }

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
        assignees: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
              },
            },
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
   * Get personal tasks for a user
   */
  async getPersonalTasks(userId: string, userRole: UserRole): Promise<Task[]> {
    const where: any = {
      projectId: null, // Personal tasks have no project
    };

    // Only creator can see their personal tasks (except SUPER_ADMIN who sees all)
    if (userRole !== UserRole.SUPER_ADMIN) {
      where.creatorId = userId;
    }

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
        assignees: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
              },
            },
          },
        },
        project: {
          select: {
            id: true,
            name: true,
            key: true,
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
    userRole: UserRole,
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
        assignees: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
              },
            },
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
    const hasAccess = await this.checkTaskAccess(task, userId, userRole);
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
    _userRole: UserRole,
  ): Promise<Task | null> {
    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        assignees: { select: { userId: true } },
      },
    });

    if (!task) {
      return null;
    }

    // Check permission
    const isCreator = task.creatorId === userId;
    const isAssignee = task.assignees.some((a) => a.userId === userId);
    let canEdit = isCreator || isAssignee;

    if (!canEdit && task.projectId) {
      const hasEditPermission = await PermissionService.hasProjectPermission(
        userId,
        task.projectId,
        Permission.EDIT_ISSUES,
      );
      canEdit = hasEditPermission;
    }

    if (!canEdit) {
      throw new Error("Forbidden: You do not have permission to update this task");
    }

    // Handle assignee updates if provided
    if (data.assigneeIds !== undefined) {
      // Validate all assignees exist
      const assignees = await prisma.user.findMany({
        where: { id: { in: data.assigneeIds } },
      });

      if (assignees.length !== data.assigneeIds.length) {
        throw new Error("One or more assignees not found");
      }

      // Validate assignees are not SUPER_ADMIN (audit-only role)
      const invalidAssignees = assignees.filter(
        (u) => u.role === UserRole.SUPER_ADMIN,
      );
      if (invalidAssignees.length > 0) {
        throw new Error(
          "Cannot assign tasks to audit-only users (SUPER_ADMIN)",
        );
      }

      // Validate assignees are project members if task belongs to a project
      if (task.projectId) {
        const members = await prisma.projectMember.findMany({
          where: {
            projectId: task.projectId,
            userId: { in: data.assigneeIds },
          },
        });

        if (members.length !== data.assigneeIds.length) {
          throw new Error("All assignees must be project members");
        }
      }

      // Delete existing assignees
      await prisma.taskAssignee.deleteMany({
        where: { taskId: id },
      });

      // Add new assignees
      if (data.assigneeIds.length > 0) {
        await prisma.taskAssignee.createMany({
          data: data.assigneeIds.map((assigneeId) => ({
            taskId: id,
            userId: assigneeId,
            assignedBy: userId,
          })),
        });

        // Log assignment activity
        await ActivityLogService.logActivity({
          taskId: id,
          userId,
          action: ActivityAction.ASSIGN,
          metadata: {
            assigneeIds: data.assigneeIds,
            assigneeNames: assignees.map((a) => a.name),
          },
        });

        // Notify new assignees
        for (const assignee of assignees) {
          await NotificationService.notifyTaskAssigned(id, assignee.id, userId);
        }
      }
    }

    await prisma.task.update({
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

    // AUTOMATION: Auto-set to In Progress when assignee updates work
    // Auto-transition to IN_PROGRESS if assignee changes status from ASSIGNED
    // Note: For multi-assignee tasks, first assignee to update triggers transition
    if (isAssignee && task.status === TaskStatus.ASSIGNED) {
      await prisma.task.update({
        where: { id },
        data: { status: TaskStatus.IN_PROGRESS },
      });

      await ActivityLogService.logActivity({
        taskId: id,
        userId,
        action: ActivityAction.STATUS_UPDATE,
        previousStatus: TaskStatus.ASSIGNED,
        newStatus: TaskStatus.IN_PROGRESS,
        metadata: { autoTriggered: true },
      });
    }

    // AUTOMATION: Auto activity logs
    await ActivityLogService.logActivity({
      taskId: id,
      userId,
      action: ActivityAction.STATUS_UPDATE,
      metadata: { updates: data },
    });

    // Refetch task with all relations to include updated assignees
    const taskWithRelations = await prisma.task.findUnique({
      where: { id },
      include: {
        assignees: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
              },
            },
          },
        },
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        project: true,
      },
    });

    return taskWithRelations as Task;
  }

  /**
   * Change task status (workflow-aware)
   * Note: This method only changes status, not position. For board moves, use moveTask()
   */
  async changeStatus(
    id: string,
    newStatus: TaskStatus,
    userId: string,
    userRole: UserRole,
  ): Promise<Task | null> {
    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        project: true,
        assignees: { select: { userId: true } },
      },
    });

    if (!task) {
      return null;
    }

    // Check permission
    const isAssignee = task.assignees.some((a) => a.userId === userId);
    const canChange =
      task.creatorId === userId ||
      isAssignee ||
      [UserRole.CEO, UserRole.HOO, UserRole.HR, UserRole.ADMIN].includes(
        userRole,
      );

    if (!canChange) {
      throw new Error(
        "Forbidden: You do not have permission to change this task status",
      );
    }

    // Get user's project role for workflow validation
    let projectRole: ProjectRole | undefined;
    if (task.project) {
      const membership = await prisma.projectMember.findFirst({
        where: {
          projectId: task.projectId!,
          userId,
        },
      });
      projectRole = membership?.role;
    }

    // Validate status transition using workflow configuration (Jira-style)
    // Personal tasks (no project) use BASIC workflow
    const workflowType = task.project
      ? task.project.workflowType
      : WorkflowType.BASIC;
    const isAllowed = isTransitionAllowed(
      workflowType,
      task.status as TaskStatus,
      newStatus,
      projectRole,
    );

    if (!isAllowed) {
      throw new Error(
        `Invalid status transition from ${task.status} to ${newStatus} in ${workflowType} workflow`,
      );
    }

    await prisma.task.update({
      where: { id },
      data: { status: newStatus },
    });

    // AUTOMATION: Auto-complete when approved (status moved to COMPLETED after approval)
    if (
      newStatus === TaskStatus.COMPLETED &&
      task.requiresApproval &&
      task.approvedById
    ) {
      // Task is being completed and has been approved
      await ActivityLogService.logActivity({
        taskId: id,
        userId,
        action: ActivityAction.STATUS_UPDATE,
        previousStatus: task.status as TaskStatus,
        newStatus,
        metadata: { autoCompleted: true, approved: true },
      });
    }

    // AUTOMATION: Auto-move to Review when assignee marks done
    // Auto-complete if assignee completes the task
    if (newStatus === TaskStatus.COMPLETED && isAssignee) {
      // Notify assignor when Review starts
      if (task.creatorId && task.creatorId !== userId) {
        await NotificationService.notifyTaskAssigned(
          id,
          task.creatorId,
          userId,
        );
      }
    }

    // AUTOMATION: Auto activity logs
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
      newStatus,
    );

    // AUTOMATION: Send status change email to assignees and creator
    const updatedTask = await prisma.task.findUnique({
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
        assignees: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
              },
            },
          },
        },
        project: true,
      },
    });

    // Send status change emails
    if (updatedTask) {
      const changedByUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { name: true },
      });

      // Email all assignees (except the person who made the change)
      for (const assignment of updatedTask.assignees) {
        if (assignment.user.id !== userId) {
          emailService
            .sendStatusChangeEmail(assignment.user.email, {
              userName: assignment.user.name,
              taskTitle: updatedTask.title,
              taskId: updatedTask.id,
              oldStatus: task.status,
              newStatus: newStatus,
              changedBy: changedByUser?.name || "Unknown",
            })
            .catch((err) =>
              console.error("Failed to send status change email:", err),
            );
        }
      }

      // Email creator if they're not the one who made the change and not an assignee
      if (
        updatedTask.creator &&
        updatedTask.creator.id !== userId &&
        !updatedTask.assignees.some(
          (a) => a.user.id === updatedTask.creator!.id,
        )
      ) {
        emailService
          .sendStatusChangeEmail(updatedTask.creator.email, {
            userName: updatedTask.creator.name,
            taskTitle: updatedTask.title,
            taskId: updatedTask.id,
            oldStatus: task.status,
            newStatus: newStatus,
            changedBy: changedByUser?.name || "Unknown",
          })
          .catch((err) =>
            console.error("Failed to send status change email:", err),
          );
      }
    }

    return updatedTask as Task;
  }

  /**
   * Assign task to user
   */
  async assignTask(
    id: string,
    assigneeIds: string[],
    userId: string,
    userRole: UserRole,
  ): Promise<Task | null> {
    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        assignees: true,
      },
    });

    if (!task) {
      return null;
    }

    // Check permission
    const canAssign =
      task.creatorId === userId ||
      [UserRole.CEO, UserRole.HOO, UserRole.HR, UserRole.ADMIN].includes(
        userRole,
      );

    if (!canAssign) {
      throw new Error(
        "Forbidden: You do not have permission to assign this task",
      );
    }

    // Validate all assignees exist
    const assignees = await prisma.user.findMany({
      where: { id: { in: assigneeIds } },
    });

    if (assignees.length !== assigneeIds.length) {
      throw new Error("One or more assignees not found");
    }

    // Validate assignees are not SUPER_ADMIN (audit-only role)
    const invalidAssignees = assignees.filter(
      (u) => u.role === UserRole.SUPER_ADMIN,
    );
    if (invalidAssignees.length > 0) {
      throw new Error("Cannot assign tasks to audit-only users (SUPER_ADMIN)");
    }

    // Validate assignees are project members if task belongs to a project
    if (task.projectId) {
      const members = await prisma.projectMember.findMany({
        where: {
          projectId: task.projectId,
          userId: { in: assigneeIds },
        },
      });

      if (members.length !== assigneeIds.length) {
        throw new Error("All assignees must be project members");
      }
    }

    // Add new assignees (don't remove existing ones)
    // Filter out assignees who are already assigned
    const existingAssigneeIds = task.assignees.map((a) => a.userId);
    const newAssigneeIds = assigneeIds.filter(
      (id) => !existingAssigneeIds.includes(id),
    );

    if (newAssigneeIds.length === 0) {
      throw new Error("All specified users are already assigned to this task");
    }

    const updated = await prisma.task.update({
      where: { id },
      data: {
        status: TaskStatus.ASSIGNED,
        assignees: {
          create: newAssigneeIds.map((assigneeId) => ({
            userId: assigneeId,
            assignedBy: userId,
          })),
        },
      },
      include: {
        project: {
          select: {
            name: true,
          },
        },
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        assignees: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
              },
            },
          },
        },
      },
    });

    // AUTOMATION: Auto activity logs
    await ActivityLogService.logActivity({
      taskId: id,
      userId,
      action: ActivityAction.ASSIGN,
      metadata: {
        assigneeIds,
        assigneeNames: assignees.map((a) => a.name),
      },
    });

    // AUTOMATION: Notify each assignee and send emails
    for (const assignee of assignees) {
      await NotificationService.notifyTaskAssigned(id, assignee.id, userId);

      emailService
        .sendTaskAssignmentEmail(assignee.email, {
          assigneeName: assignee.name,
          taskTitle: updated.title,
          taskId: updated.id,
          projectName: updated.project?.name || "No Project",
          assignedBy: updated.creator?.name || "Unknown",
          priority: updated.priority,
          dueDate: updated.dueDate?.toISOString(),
        })
        .catch((err) =>
          console.error("Failed to send task assignment email:", err),
        );
    }

    // AUTOMATION: Add all assignees as watchers
    await prisma.task
      .update({
        where: { id },
        data: {
          watchers: {
            connect: assigneeIds.map((assigneeId) => ({ id: assigneeId })),
          },
        },
      })
      .catch(() => {}); // Ignore if already exists or watchers relation fails

    return updated as Task;
  }

  /**
   * Unassign user from task
   */
  async unassignTask(
    taskId: string,
    userIdToRemove: string,
    requesterId: string,
    requesterRole: UserRole,
  ): Promise<Task> {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        assignees: true,
        project: { include: { members: true } },
      },
    });

    if (!task) {
      throw new Error("Task not found");
    }

    // Check permission
    const isCreator = task.creatorId === requesterId;
    const isAssignee = task.assignees.some((a) => a.userId === requesterId);
    const isManagement = [
      UserRole.CEO,
      UserRole.HOO,
      UserRole.HR,
      UserRole.ADMIN,
    ].includes(requesterRole);
    const isProjectAdmin = task.project?.members.some(
      (m) => m.userId === requesterId && m.role === "PROJECT_ADMIN",
    );

    if (!isCreator && !isAssignee && !isManagement && !isProjectAdmin) {
      throw new Error(
        "Forbidden: You do not have permission to unassign this task",
      );
    }

    // Remove the assignment
    await prisma.taskAssignee.deleteMany({
      where: {
        taskId,
        userId: userIdToRemove,
      },
    });

    // If no assignees left, update status appropriately
    const remainingAssignees = await prisma.taskAssignee.count({
      where: { taskId },
    });

    if (remainingAssignees === 0) {
      // If work was in progress, move to ASSIGNED (waiting for reassignment)
      // If still in early stages, keep as DRAFT or ASSIGNED
      if (
        [TaskStatus.IN_PROGRESS, TaskStatus.PAUSED, TaskStatus.REVIEW].includes(
          task.status as TaskStatus,
        )
      ) {
        await prisma.task.update({
          where: { id: taskId },
          data: { status: TaskStatus.ASSIGNED as any },
        });
      }
    }

    // Log activity
    await ActivityLogService.logActivity({
      taskId,
      userId: requesterId,
      action: "UNASSIGNED" as any,
      metadata: { removedUserId: userIdToRemove },
    });

    // Get updated task
    const updated = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        assignees: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
              },
            },
          },
        },
      },
    });

    return updated as Task;
  }

  /**
   * Approve task
   */
  async approveTask(
    id: string,
    approverId: string,
    userRole: UserRole,
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

    // CEO, HOO, HR, ADMIN can approve (ADMIN approves STAFF tasks)
    if (
      ![UserRole.CEO, UserRole.HOO, UserRole.HR, UserRole.ADMIN].includes(
        userRole,
      )
    ) {
      throw new Error(
        "Forbidden: Only CEO, HOO, HR, or ADMIN can approve tasks",
      );
    }

    const updated = await prisma.task.update({
      where: { id },
      data: { approvedById: approverId },
    });

    // AUTOMATION: Auto activity logs
    await ActivityLogService.logActivity({
      taskId: id,
      userId: approverId,
      action: ActivityAction.APPROVE,
      metadata: {},
    });

    // AUTOMATION: Notify assignee on approval
    await NotificationService.notifyTaskApproved(id);

    // AUTOMATION: Auto-complete when approved
    if (
      task.status === TaskStatus.COMPLETED ||
      task.status === TaskStatus.REVIEW
    ) {
      await prisma.task.update({
        where: { id },
        data: { status: TaskStatus.COMPLETED },
      });

      await ActivityLogService.logActivity({
        taskId: id,
        userId: approverId,
        action: ActivityAction.STATUS_UPDATE,
        previousStatus: task.status as TaskStatus,
        newStatus: TaskStatus.COMPLETED,
        metadata: { autoCompleted: true },
      });
    }

    return updated as Task;
  }

  /**
   * Reject task
   */
  async rejectTask(
    id: string,
    rejectionReason: string,
    userId: string,
    userRole: UserRole,
  ): Promise<Task | null> {
    const task = await prisma.task.findUnique({ where: { id } });

    if (!task) {
      return null;
    }

    // Only CEO, HOO, HR, ADMIN can reject
    if (
      ![UserRole.CEO, UserRole.HOO, UserRole.HR, UserRole.ADMIN].includes(
        userRole,
      )
    ) {
      throw new Error(
        "Forbidden: Only CEO, HOO, HR, and ADMIN can reject tasks",
      );
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

    // AUTOMATION: Auto activity logs
    await ActivityLogService.logActivity({
      taskId: id,
      userId,
      action: ActivityAction.REJECT,
      newStatus: TaskStatus.REJECTED,
      metadata: { rejectionReason },
    });

    // AUTOMATION: Notify assignee on rejection (Auto-reject with reason)
    await NotificationService.notifyTaskRejected(id, rejectionReason);

    return updated as Task;
  }

  /**
   * Helper: Check if task requires approval
   */
  private async checkIfRequiresApproval(
    _creatorId: string,
    creatorRole: UserRole,
  ): Promise<boolean> {
    // Approval based on creator's authority:
    // - STAFF tasks require approval (lower authority)
    // - ADMIN, HOO, HR, CEO tasks are auto-approved (have authority)
    if (
      [UserRole.CEO, UserRole.HOO, UserRole.HR, UserRole.ADMIN].includes(
        creatorRole,
      )
    ) {
      return false;
    }

    // STAFF tasks require approval
    return creatorRole === UserRole.STAFF;
  }

  /**
   * Helper: Check if user has access to task
   */
  private async checkTaskAccess(
    task: any,
    userId: string,
    userRole: UserRole,
  ): Promise<boolean> {
    // Personal task privacy: Only creator + SUPER_ADMIN can see
    if (!task.projectId) {
      return task.creatorId === userId || userRole === UserRole.SUPER_ADMIN;
    }

    // SUPER_ADMIN sees all tasks (audit)
    if (userRole === UserRole.SUPER_ADMIN) {
      return true;
    }

    // CEO sees all project tasks (no personal tasks)
    if (userRole === UserRole.CEO) {
      return true;
    }

    // Creator has access to their own tasks
    if (task.creatorId === userId) {
      return true;
    }

    // Check if user is assigned to the task
    if (
      task.assignees &&
      task.assignees.some((a: any) => a.userId === userId)
    ) {
      return true;
    }

    // HOO/HR can see ADMIN and STAFF tasks only (not CEO tasks)
    if (userRole === UserRole.HOO || userRole === UserRole.HR) {
      const creatorRole = task.creator?.role;
      if (creatorRole === UserRole.ADMIN || creatorRole === UserRole.STAFF) {
        return true;
      }
    }

    // Project members (including creator as PROJECT_ADMIN) can browse project tasks
    const membership = await prisma.projectMember.findFirst({
      where: { projectId: task.projectId, userId },
      select: { role: true },
    });

    if (membership) {
      return true;
    }

    if (task.project?.creatorId === userId) {
      return true;
    }

    return false;
  }

  /**
   * Search tasks using Prisma where clause (for JQL)
   */
  async searchTasks(whereClause: any): Promise<Task[]> {
    const tasks = await prisma.task.findMany({
      where: whereClause,
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
        assignees: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
              },
            },
          },
        },
        project: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
        sprint: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
      },
    });

    return tasks as Task[];
  }

  /**
   * Get next position for a task in a specific status column
   */
  private async getNextPositionForStatus(
    projectId: string | null,
    status: TaskStatus,
  ): Promise<number> {
    const lastTask = await prisma.task.findFirst({
      where: {
        projectId,
        status,
      },
      orderBy: { position: "desc" },
      select: { position: true },
    });

    return lastTask ? lastTask.position + 1 : 0;
  }

  /**
   * Get Kanban board view - tasks grouped by status categories (Jira-style)
   * Status is source of truth, columns are visual mappings
   */
  async getKanbanBoard(projectId: string): Promise<any> {
    // Check project access
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new Error("Project not found");
    }

    // Get all tasks for the project
    const tasks = await prisma.task.findMany({
      where: { projectId },
      orderBy: { position: "asc" },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        assignees: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
              },
            },
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

    // Group tasks by status categories (Jira-style: status → column mapping)
    const columns = Object.entries(STATUS_CATEGORIES).reduce(
      (acc, [key, category]) => {
        acc[key] = {
          name: category.name,
          description: category.description,
          statuses: category.statuses,
          tasks: tasks.filter((t) =>
            category.statuses.includes(t.status as TaskStatus),
          ),
        };
        return acc;
      },
      {} as any,
    );

    return {
      projectId,
      projectName: project.name,
      projectKey: project.key,
      workflowType: project.workflowType,
      columns,
      statusCategories: STATUS_CATEGORIES,
    };
  }

  /**
   * Move task to different status/column and update position (Jira-style workflow)
   * Validates transitions based on project's workflow configuration
   */
  async moveTask(
    taskId: string,
    newStatus: TaskStatus,
    newPosition: number,
    userId: string,
    userRole: UserRole,
  ): Promise<Task> {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        project: true,
        assignees: { select: { userId: true } },
      },
    });

    if (!task) {
      throw new Error("Task not found");
    }

    // Check permission
    const isAssignee = task.assignees.some((a: any) => a.userId === userId);
    const canMove =
      task.creatorId === userId ||
      isAssignee ||
      [UserRole.CEO, UserRole.HOO, UserRole.HR, UserRole.ADMIN].includes(
        userRole,
      );

    if (!canMove) {
      throw new Error(
        "Forbidden: You do not have permission to move this task",
      );
    }

    // Get user's project role for workflow validation
    let projectRole: ProjectRole | undefined;
    if (task.project) {
      const membership = await prisma.projectMember.findFirst({
        where: {
          projectId: task.projectId!,
          userId,
        },
      });
      projectRole = membership?.role;
    }

    // Validate status transition using workflow configuration (Jira-style)
    // Personal tasks (no project) use BASIC workflow
    const workflowType = task.project
      ? task.project.workflowType
      : WorkflowType.BASIC;
    const isAllowed = isTransitionAllowed(
      workflowType,
      task.status as TaskStatus,
      newStatus,
      projectRole,
    );

    if (!isAllowed) {
      throw new Error(
        `Invalid status transition from ${task.status} to ${newStatus} in ${workflowType} workflow`,
      );
    }

    // Update task status and position
    const updated = await prisma.task.update({
      where: { id: taskId },
      data: {
        status: newStatus,
        position: newPosition,
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        assignees: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
              },
            },
          },
        },
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Log activity
    await ActivityLogService.logActivity({
      taskId,
      userId,
      action: ActivityAction.STATUS_UPDATE,
      previousStatus: task.status as TaskStatus,
      newStatus,
      metadata: { position: newPosition },
    });

    // Notify relevant users
    await NotificationService.notifyStatusChanged(
      taskId,
      task.status as TaskStatus,
      newStatus,
    );

    return updated as Task;
  }

  /**
   * Get available workflow transitions for a task (Jira-style)
   * Returns list of statuses the task can transition to based on workflow rules
   */
  async getAvailableTransitions(
    taskId: string,
    userId: string,
  ): Promise<{
    currentStatus: TaskStatus;
    availableTransitions: Array<{
      name: string;
      to: TaskStatus;
      description?: string;
      requiredRole?: ProjectRole;
    }>;
    workflowType: WorkflowType;
  }> {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        project: true,
      },
    });

    if (!task) {
      throw new Error("Task not found");
    }

    // Get user's project role
    let projectRole: ProjectRole | undefined;
    if (task.project) {
      const membership = await prisma.projectMember.findFirst({
        where: {
          projectId: task.projectId!,
          userId,
        },
      });
      projectRole = membership?.role;
    }

    // Personal tasks (no project) use BASIC workflow
    const workflowType = task.project
      ? task.project.workflowType
      : WorkflowType.BASIC;

    // Get available transitions (already filtered by user's project role)
    // Only transitions the user has permission to perform are returned
    const transitions = getWorkflowTransitions(
      workflowType,
      task.status as TaskStatus,
      projectRole,
    );

    // Convert WorkflowTransitionRule to expected format
    const formattedTransitions = transitions.map((t) => ({
      name: t.name,
      to: t.to as TaskStatus,
      description: t.description,
      requiredRole: t.requiredRole,
    }));

    return {
      currentStatus: task.status as TaskStatus,
      availableTransitions: formattedTransitions,
      workflowType,
    };
  }

  /**
   * Get workflow information for a project
   */
  async getProjectWorkflow(projectId: string): Promise<{
    workflowType: WorkflowType;
    statusCategories: typeof STATUS_CATEGORIES;
    allStatuses: TaskStatus[];
  }> {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new Error("Project not found");
    }

    return {
      workflowType: project.workflowType,
      statusCategories: STATUS_CATEGORIES,
      allStatuses: Object.values(TaskStatus),
    };
  }

  /**
   * Bulk transition tasks with workflow validation
   * Validates each task individually against workflow rules
   */
  async bulkTransitionTasks(
    taskIds: string[],
    newStatus: TaskStatus,
    userId: string,
    userRole: UserRole,
  ): Promise<{
    successful: string[];
    failed: Array<{ taskId: string; reason: string }>;
  }> {
    const successful: string[] = [];
    const failed: Array<{ taskId: string; reason: string }> = [];

    for (const taskId of taskIds) {
      try {
        // Get task with project info
        const task = await prisma.task.findUnique({
          where: { id: taskId },
          include: {
            project: true,
            assignees: { select: { userId: true } },
          },
        });

        if (!task) {
          failed.push({ taskId, reason: "Task not found" });
          continue;
        }

        // Check permission
        const isAssignee = task.assignees.some((a) => a.userId === userId);
        const canChange =
          task.creatorId === userId ||
          isAssignee ||
          [UserRole.CEO, UserRole.HOO, UserRole.HR, UserRole.ADMIN].includes(
            userRole,
          );

        if (!canChange) {
          failed.push({
            taskId,
            reason: "Insufficient permissions",
          });
          continue;
        }

        // Get user's project role
        let projectRole: ProjectRole | undefined;
        if (task.project) {
          const membership = await prisma.projectMember.findFirst({
            where: {
              projectId: task.projectId!,
              userId,
            },
          });
          projectRole = membership?.role;
        }

        // Validate workflow transition
        const workflowType = task.project
          ? task.project.workflowType
          : WorkflowType.BASIC;
        const isAllowed = isTransitionAllowed(
          workflowType,
          task.status as TaskStatus,
          newStatus,
          projectRole,
        );

        if (!isAllowed) {
          failed.push({
            taskId,
            reason: `Invalid transition from ${task.status} to ${newStatus} in ${workflowType} workflow`,
          });
          continue;
        }

        // Update task status
        await prisma.task.update({
          where: { id: taskId },
          data: { status: newStatus },
        });

        // Log activity
        await ActivityLogService.logActivity({
          taskId,
          userId,
          action: ActivityAction.STATUS_UPDATE,
          previousStatus: task.status as TaskStatus,
          newStatus,
          metadata: { bulkOperation: true },
        });

        // Notify relevant users
        await NotificationService.notifyStatusChanged(
          taskId,
          task.status as TaskStatus,
          newStatus,
        );

        successful.push(taskId);
      } catch (error: any) {
        failed.push({
          taskId,
          reason: error.message || "Unknown error",
        });
      }
    }

    return { successful, failed };
  }

  /**
   * Delete a task
   */
  async deleteTask(
    id: string,
    userId: string,
    userRole: UserRole,
  ): Promise<boolean> {
    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        project: {
          include: {
            members: true,
          },
        },
      },
    });

    if (!task) {
      return false;
    }

    // Check permissions
    // Only PROJECT_ADMIN can delete tasks
    // CEO/HOO/HR/ADMIN can delete if they are project members (respect privacy)
    const isManagement = [
      UserRole.CEO,
      UserRole.HOO,
      UserRole.HR,
      UserRole.ADMIN,
    ].includes(userRole);

    let canDelete = false;

    // Check project permissions
    if (task.projectId) {
      const member = task.project?.members.find((m) => m.userId === userId);
      if (member) {
        // PROJECT_ADMIN can delete
        // Management (CEO/HOO/HR/ADMIN) can delete if they are project members
        if (member.role === "PROJECT_ADMIN" || isManagement) {
          canDelete = true;
        }
      }
    }

    // Personal tasks can be deleted by creator
    if (!task.projectId && task.creatorId === userId) {
      canDelete = true;
    }

    if (!canDelete) {
      throw new Error(
        "Forbidden: You do not have permission to delete this task",
      );
    }

    // Log deletion BEFORE deleting task to avoid FK constraint
    await ActivityLogService.logActivity({
      taskId: id,
      userId,
      action: ActivityAction.DELETE,
      metadata: { taskTitle: task.title },
    });

    // Delete task and related data (cascade deletes activity logs)
    await prisma.task.delete({
      where: { id },
    });

    return true;
  }
}

export default new TaskService();

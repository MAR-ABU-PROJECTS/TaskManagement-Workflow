import prisma from "../db/prisma";
import { NotificationType, TaskStatus, UserRole } from "../types/enums";

export class NotificationService {
  /**
   * Create a notification
   */
  async createNotification(
    userId: string,
    type: NotificationType,
    payload: Record<string, any>
  ): Promise<void> {
    await prisma.notification.create({
      data: {
        userId,
        type,
        payload,
        read: false,
      },
    });

    // Send email notification if enabled (optional feature)
    // Uncomment and configure EmailService when ready to use
    // if (process.env.EMAIL_NOTIFICATIONS_ENABLED === "true") {
    //   await EmailService.sendNotificationEmail(userId, type, payload);
    // }
  }

  /**
   * Notify user about task assignment
   */
  async notifyTaskAssigned(
    taskId: string,
    assigneeId: string,
    assignerId: string
  ): Promise<void> {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        creator: { select: { name: true } },
        project: { select: { name: true } },
      },
    });

    if (!task) return;

    const assigner = await prisma.user.findUnique({
      where: { id: assignerId },
      select: { name: true },
    });

    await this.createNotification(assigneeId, NotificationType.TASK_ASSIGNED, {
      taskId: task.id,
      taskTitle: task.title,
      projectName: task.project?.name || "Personal",
      assignedBy: assigner?.name || "System",
      message: `You have been assigned to task: ${task.title}`,
    });
  }

  /**
   * Notify about status change
   */
  async notifyStatusChanged(
    taskId: string,
    oldStatus: TaskStatus,
    newStatus: TaskStatus
  ): Promise<void> {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        creator: true,
        assignees: { include: { user: true } },
        project: { select: { name: true } },
      },
    });

    if (!task) return;

    const usersToNotify = new Set<string>();
    if (task.creatorId) usersToNotify.add(task.creatorId);
    for (const assignment of task.assignees) {
      usersToNotify.add(assignment.userId);
    }

    const payload = {
      taskId: task.id,
      taskTitle: task.title,
      projectName: task.project?.name || "Personal",
      oldStatus,
      newStatus,
      message: `Task status changed from ${oldStatus} to ${newStatus}`,
    };

    for (const userId of usersToNotify) {
      await this.createNotification(
        userId,
        NotificationType.STATUS_CHANGED,
        payload
      );
    }
  }

  /**
   * Notify about new comment
   */
  async notifyComment(
    taskId: string,
    commenterId: string,
    message: string
  ): Promise<void> {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        creator: true,
        assignees: { include: { user: true } },
        watchers: true,
      },
    });

    if (!task) return;

    const commenter = await prisma.user.findUnique({
      where: { id: commenterId },
      select: { name: true },
    });

    const usersToNotify = new Set<string>();
    if (task.creatorId && task.creatorId !== commenterId) {
      usersToNotify.add(task.creatorId);
    }
    for (const assignment of task.assignees) {
      if (assignment.userId !== commenterId) {
        usersToNotify.add(assignment.userId);
      }
    }

    // Check for mentions in the message (@username)
    const mentions = this.extractMentions(message);
    for (const mention of mentions) {
      const user = await prisma.user.findFirst({
        where: { name: { contains: mention, mode: "insensitive" } },
      });
      if (user) {
        usersToNotify.add(user.id);
        await this.createNotification(user.id, NotificationType.MENTION, {
          taskId: task.id,
          taskTitle: task.title,
          mentionedBy: commenter?.name || "Someone",
          message: `You were mentioned in a comment`,
        });
      }
    }

    const payload = {
      taskId: task.id,
      taskTitle: task.title,
      commenter: commenter?.name || "Someone",
      message: `${commenter?.name || "Someone"} commented on the task`,
    };

    for (const userId of usersToNotify) {
      await this.createNotification(userId, NotificationType.COMMENT, payload);
    }
  }

  /**
   * Notify approvers about pending approval
   */
  async notifyApprovalRequired(taskId: string): Promise<void> {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        creator: { select: { name: true } },
      },
    });

    if (!task) return;

    // Get all HOO and HR users
    const approvers = await prisma.user.findMany({
      where: {
        role: { in: [UserRole.CEO, UserRole.HOO, UserRole.HR] },
        isActive: true,
      },
    });

    const payload = {
      taskId: task.id,
      taskTitle: task.title,
      createdBy: task.creator.name,
      message: `Task requires your approval`,
    };

    for (const approver of approvers) {
      await this.createNotification(
        approver.id,
        NotificationType.APPROVAL_REQUIRED,
        payload
      );
    }
  }

  /**
   * Notify about task approval
   */
  async notifyTaskApproved(taskId: string): Promise<void> {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        creator: true,
        assignees: { include: { user: true } },
        approvedBy: { select: { name: true } },
      },
    });

    if (!task) return;

    const usersToNotify = new Set<string>();
    if (task.creatorId) usersToNotify.add(task.creatorId);
    for (const assignment of task.assignees) {
      usersToNotify.add(assignment.userId);
    }

    const payload = {
      taskId: task.id,
      taskTitle: task.title,
      approvedBy: task.approvedBy?.name || "Management",
      message: `Task has been approved`,
    };

    for (const userId of usersToNotify) {
      await this.createNotification(userId, NotificationType.APPROVED, payload);
    }
  }

  /**
   * Notify about task rejection
   */
  async notifyTaskRejected(taskId: string, reason: string): Promise<void> {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        creator: true,
        assignees: { include: { user: true } },
      },
    });

    if (!task) return;

    const usersToNotify = new Set<string>();
    if (task.creatorId) usersToNotify.add(task.creatorId);
    for (const assignment of task.assignees) {
      usersToNotify.add(assignment.userId);
    }

    const payload = {
      taskId: task.id,
      taskTitle: task.title,
      reason,
      message: `Task has been rejected: ${reason}`,
    };

    for (const userId of usersToNotify) {
      await this.createNotification(userId, NotificationType.REJECTED, payload);
    }
  }

  /**
   * Get user notifications
   */
  async getUserNotifications(
    userId: string,
    unreadOnly: boolean = false
  ): Promise<any[]> {
    const notifications = await prisma.notification.findMany({
      where: {
        userId,
        ...(unreadOnly && { read: false }),
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return notifications;
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string, userId: string): Promise<boolean> {
    const notification = await prisma.notification.findFirst({
      where: { id: notificationId, userId },
    });

    if (!notification) {
      return false;
    }

    await prisma.notification.update({
      where: { id: notificationId },
      data: { read: true },
    });

    return true;
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(userId: string): Promise<number> {
    const result = await prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    });

    return result.count;
  }

  /**
   * Extract mentions from text (@username)
   */
  private extractMentions(text: string): string[] {
    const mentionRegex = /@(\w+)/g;
    const mentions: string[] = [];
    let match;

    while ((match = mentionRegex.exec(text)) !== null) {
      if (match[1]) {
        mentions.push(match[1]);
      }
    }

    return mentions;
  }

  /**
   * Send email notification (currently disabled)
   * Commented out to avoid unused method warning
   */
  /*
  private async sendEmailNotification(
    userId: string,
    type: NotificationType,
    payload: Record<string, any>
  ): Promise<void> {
    // Implementation for email sending
    // Use nodemailer or similar service
    console.log(`Email notification sent to user ${userId}:`, type, payload);
  }
  */
}

export default new NotificationService();

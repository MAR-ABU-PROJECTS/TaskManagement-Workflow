import prisma from "../db/prisma";
import { ActivityAction, TaskStatus } from "../types/enums";

interface LogActivityDTO {
  taskId: string;
  userId: string;
  action: ActivityAction;
  previousStatus?: TaskStatus;
  newStatus?: TaskStatus;
  metadata?: Record<string, any>;
}

export class ActivityLogService {
  /**
   * Log an activity
   */
  async logActivity(data: LogActivityDTO): Promise<void> {
    await prisma.taskActivityLog.create({
      data: {
        taskId: data.taskId,
        userId: data.userId,
        action: data.action,
        previousStatus: data.previousStatus || null,
        newStatus: data.newStatus || null,
        metadata: data.metadata || undefined,
      },
    });
  }

  /**
   * Get activity logs for a task
   */
  async getTaskLogs(taskId: string): Promise<any[]> {
    const logs = await prisma.taskActivityLog.findMany({
      where: { taskId },
      orderBy: { timestamp: "desc" },
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
    });

    return logs;
  }

  /**
   * Get recent activities for a user
   */
  async getUserActivities(userId: string, limit: number = 20): Promise<any[]> {
    const logs = await prisma.taskActivityLog.findMany({
      where: {
        OR: [
          { userId },
          { task: { creatorId: userId } },
          { task: { assignees: { some: { userId } } } },
        ],
      },
      orderBy: { timestamp: "desc" },
      take: limit,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        task: {
          select: {
            id: true,
            title: true,
            status: true,
          },
        },
      },
    });

    return logs;
  }
}

export default new ActivityLogService();

import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';
import { TaskNotificationEvent } from '../types/task.types';

const prisma = new PrismaClient();

export class NotificationService {
  /**
   * Send task notification
   */
  async sendTaskNotification(event: TaskNotificationEvent): Promise<void> {
    try {
      // Create notifications for each recipient
      for (const recipientId of event.recipients) {
        if (recipientId === event.userId) {
          continue; // Don't notify the user who performed the action
        }

        await prisma.notification.create({
          data: {
            userId: recipientId,
            type: this.mapEventTypeToNotificationType(event.type),
            title: this.generateNotificationTitle(event),
            message: this.generateNotificationMessage(event),
            data: event.data,
            isRead: false,
            createdAt: new Date()
          }
        });
      }

      logger.info(`Task notification sent for event ${event.type} on task ${event.taskId}`);
    } catch (error) {
      logger.error('Error sending task notification:', error);
      // Don't throw error for notification failures
    }
  }

  private mapEventTypeToNotificationType(eventType: string): string {
    const mapping: Record<string, string> = {
      'CREATED': 'TASK_ASSIGNED',
      'UPDATED': 'TASK_UPDATED',
      'ASSIGNED': 'TASK_ASSIGNED',
      'STATUS_CHANGED': 'TASK_UPDATED',
      'COMMENTED': 'TASK_COMMENTED',
      'DUE_SOON': 'DEADLINE_APPROACHING',
      'OVERDUE': 'DEADLINE_APPROACHING'
    };

    return mapping[eventType] || 'TASK_UPDATED';
  }

  private generateNotificationTitle(event: TaskNotificationEvent): string {
    const task = event.data.task;
    const taskKey = task?.key || 'Task';

    switch (event.type) {
      case 'CREATED':
        return `New task created: ${taskKey}`;
      case 'UPDATED':
        return `Task updated: ${taskKey}`;
      case 'ASSIGNED':
        return `Task assigned to you: ${taskKey}`;
      case 'STATUS_CHANGED':
        return `Task status changed: ${taskKey}`;
      case 'COMMENTED':
        return `New comment on task: ${taskKey}`;
      case 'DUE_SOON':
        return `Task due soon: ${taskKey}`;
      case 'OVERDUE':
        return `Task overdue: ${taskKey}`;
      default:
        return `Task notification: ${taskKey}`;
    }
  }

  private generateNotificationMessage(event: TaskNotificationEvent): string {
    const task = event.data.task;
    const taskTitle = task?.title || 'Unknown task';

    switch (event.type) {
      case 'CREATED':
        return `A new task "${taskTitle}" has been created and assigned to you.`;
      case 'UPDATED':
        return `Task "${taskTitle}" has been updated.`;
      case 'ASSIGNED':
        return `You have been assigned to task "${taskTitle}".`;
      case 'STATUS_CHANGED':
        return `The status of task "${taskTitle}" has been changed.`;
      case 'COMMENTED':
        return `A new comment has been added to task "${taskTitle}".`;
      case 'DUE_SOON':
        return `Task "${taskTitle}" is due soon.`;
      case 'OVERDUE':
        return `Task "${taskTitle}" is overdue.`;
      default:
        return `Task "${taskTitle}" has been updated.`;
    }
  }
}
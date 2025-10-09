import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';
import { TaskActivity } from '../types/task.types';

const prisma = new PrismaClient();

export interface CreateActivityRequest {
  taskId: string;
  userId: string;
  action: string;
  field?: string;
  oldValue?: any;
  newValue?: any;
  comment?: string;
}

export interface ActivityFilters {
  taskId?: string;
  userId?: string;
  action?: string;
  field?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

export class TaskActivityService {
  /**
   * Create a new activity entry
   */
  async createActivity(activityData: CreateActivityRequest): Promise<TaskActivity> {
    try {
      // Validate task exists
      const task = await prisma.task.findUnique({
        where: { id: activityData.taskId },
        select: { id: true, key: true }
      });

      if (!task) {
        throw new Error('Task not found');
      }

      // Create activity entry using audit log
      const auditLog = await prisma.auditLog.create({
        data: {
          userId: activityData.userId,
          action: activityData.action,
          resource: 'TASK',
          resourceId: activityData.taskId,
          oldValues: activityData.field ? { [activityData.field]: activityData.oldValue } : activityData.oldValue,
          newValues: activityData.field ? { [activityData.field]: activityData.newValue } : activityData.newValue,
          createdAt: new Date()
        }
      });

      logger.info(`Task activity created: ${activityData.action} on task ${task.key} by user ${activityData.userId}`);
      
      return this.mapAuditLogToActivity(auditLog, activityData.field, activityData.comment);
    } catch (error) {
      logger.error('Error creating task activity:', error);
      throw error;
    }
  }

  /**
   * Get activity history for a task
   */
  async getTaskActivity(
    taskId: string,
    options: {
      page?: number;
      limit?: number;
      sortOrder?: 'asc' | 'desc';
    } = {}
  ): Promise<{
    activities: TaskActivity[];
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
  }> {
    try {
      const page = options.page || 1;
      const limit = options.limit || 50;
      const skip = (page - 1) * limit;

      const [auditLogs, total] = await Promise.all([
        prisma.auditLog.findMany({
          where: {
            resource: 'TASK',
            resourceId: taskId
          },
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            }
          },
          orderBy: { createdAt: options.sortOrder || 'desc' },
          skip,
          take: limit
        }),
        prisma.auditLog.count({
          where: {
            resource: 'TASK',
            resourceId: taskId
          }
        })
      ]);

      const activities = auditLogs.map(log => this.mapAuditLogToActivity(log));

      return {
        activities,
        total,
        page,
        limit,
        hasMore: skip + activities.length < total
      };
    } catch (error) {
      logger.error('Error getting task activity:', error);
      throw error;
    }
  }

  /**
   * Get activity feed for multiple tasks
   */
  async getActivityFeed(
    filters: ActivityFilters,
    options: {
      page?: number;
      limit?: number;
      sortOrder?: 'asc' | 'desc';
    } = {}
  ): Promise<{
    activities: TaskActivity[];
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
  }> {
    try {
      const page = options.page || 1;
      const limit = options.limit || 50;
      const skip = (page - 1) * limit;

      // Build where clause
      const whereClause: any = {
        resource: 'TASK'
      };

      if (filters.taskId) {
        whereClause.resourceId = filters.taskId;
      }

      if (filters.userId) {
        whereClause.userId = filters.userId;
      }

      if (filters.action) {
        whereClause.action = filters.action;
      }

      if (filters.dateFrom || filters.dateTo) {
        whereClause.createdAt = {};
        if (filters.dateFrom) {
          whereClause.createdAt.gte = filters.dateFrom;
        }
        if (filters.dateTo) {
          whereClause.createdAt.lte = filters.dateTo;
        }
      }

      const [auditLogs, total] = await Promise.all([
        prisma.auditLog.findMany({
          where: whereClause,
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            }
          },
          orderBy: { createdAt: options.sortOrder || 'desc' },
          skip,
          take: limit
        }),
        prisma.auditLog.count({ where: whereClause })
      ]);

      const activities = auditLogs.map(log => this.mapAuditLogToActivity(log));

      return {
        activities,
        total,
        page,
        limit,
        hasMore: skip + activities.length < total
      };
    } catch (error) {
      logger.error('Error getting activity feed:', error);
      throw error;
    }
  }

  /**
   * Get activity statistics
   */
  async getActivityStatistics(
    filters: ActivityFilters = {}
  ): Promise<{
    totalActivities: number;
    byAction: Record<string, number>;
    byUser: Record<string, number>;
    byDate: Record<string, number>;
    mostActiveUsers: Array<{
      userId: string;
      userName: string;
      activityCount: number;
    }>;
  }> {
    try {
      const whereClause: any = {
        resource: 'TASK'
      };

      if (filters.taskId) {
        whereClause.resourceId = filters.taskId;
      }

      if (filters.dateFrom || filters.dateTo) {
        whereClause.createdAt = {};
        if (filters.dateFrom) {
          whereClause.createdAt.gte = filters.dateFrom;
        }
        if (filters.dateTo) {
          whereClause.createdAt.lte = filters.dateTo;
        }
      }

      const [
        totalActivities,
        actionCounts,
        userCounts,
        mostActiveUsers
      ] = await Promise.all([
        prisma.auditLog.count({ where: whereClause }),
        prisma.auditLog.groupBy({
          by: ['action'],
          where: whereClause,
          _count: true
        }),
        prisma.auditLog.groupBy({
          by: ['userId'],
          where: whereClause,
          _count: true
        }),
        prisma.auditLog.groupBy({
          by: ['userId'],
          where: whereClause,
          _count: true,
          orderBy: { _count: { userId: 'desc' } },
          take: 10
        })
      ]);

      // Get user details for most active users
      const userIds = mostActiveUsers.map(u => u.userId).filter(Boolean);
      const users = await prisma.user.findMany({
        where: { id: { in: userIds } },
        select: {
          id: true,
          firstName: true,
          lastName: true
        }
      });

      const userMap = users.reduce((acc, user) => {
        acc[user.id] = `${user.firstName} ${user.lastName}`;
        return acc;
      }, {} as Record<string, string>);

      // Generate date-based statistics (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const dailyActivities = await prisma.auditLog.groupBy({
        by: ['createdAt'],
        where: {
          ...whereClause,
          createdAt: { gte: thirtyDaysAgo }
        },
        _count: true
      });

      const byDate = dailyActivities.reduce((acc, item) => {
        const date = item.createdAt.toISOString().split('T')[0];
        acc[date] = (acc[date] || 0) + item._count;
        return acc;
      }, {} as Record<string, number>);

      return {
        totalActivities,
        byAction: actionCounts.reduce((acc, item) => {
          acc[item.action] = item._count;
          return acc;
        }, {} as Record<string, number>),
        byUser: userCounts.reduce((acc, item) => {
          acc[item.userId || 'SYSTEM'] = item._count;
          return acc;
        }, {} as Record<string, number>),
        byDate,
        mostActiveUsers: mostActiveUsers.map(item => ({
          userId: item.userId || 'SYSTEM',
          userName: userMap[item.userId || ''] || 'System',
          activityCount: item._count
        }))
      };
    } catch (error) {
      logger.error('Error getting activity statistics:', error);
      throw error;
    }
  }

  /**
   * Get recent activity for a user
   */
  async getUserRecentActivity(
    userId: string,
    options: {
      limit?: number;
      taskIds?: string[];
    } = {}
  ): Promise<TaskActivity[]> {
    try {
      const limit = options.limit || 20;
      
      const whereClause: any = {
        resource: 'TASK',
        userId
      };

      if (options.taskIds && options.taskIds.length > 0) {
        whereClause.resourceId = { in: options.taskIds };
      }

      const auditLogs = await prisma.auditLog.findMany({
        where: whereClause,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: limit
      });

      return auditLogs.map(log => this.mapAuditLogToActivity(log));
    } catch (error) {
      logger.error('Error getting user recent activity:', error);
      throw error;
    }
  }

  /**
   * Delete old activity entries (cleanup)
   */
  async cleanupOldActivity(olderThanDays: number = 365): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

      const result = await prisma.auditLog.deleteMany({
        where: {
          resource: 'TASK',
          createdAt: { lt: cutoffDate }
        }
      });

      logger.info(`Cleaned up ${result.count} old task activity entries older than ${olderThanDays} days`);
      return result.count;
    } catch (error) {
      logger.error('Error cleaning up old activity:', error);
      throw error;
    }
  }

  // Private helper methods

  /**
   * Map audit log to task activity
   */
  private mapAuditLogToActivity(auditLog: any, field?: string, comment?: string): TaskActivity {
    return {
      id: auditLog.id,
      taskId: auditLog.resourceId,
      userId: auditLog.userId || 'SYSTEM',
      action: auditLog.action,
      field: field || this.extractFieldFromValues(auditLog.oldValues, auditLog.newValues),
      oldValue: auditLog.oldValues,
      newValue: auditLog.newValues,
      comment: comment,
      createdAt: auditLog.createdAt,
      user: auditLog.user ? {
        id: auditLog.user.id,
        firstName: auditLog.user.firstName,
        lastName: auditLog.user.lastName,
        email: auditLog.user.email
      } : undefined
    };
  }

  /**
   * Extract field name from old/new values
   */
  private extractFieldFromValues(oldValues: any, newValues: any): string | undefined {
    if (oldValues && typeof oldValues === 'object') {
      const keys = Object.keys(oldValues);
      if (keys.length === 1) {
        return keys[0];
      }
    }

    if (newValues && typeof newValues === 'object') {
      const keys = Object.keys(newValues);
      if (keys.length === 1) {
        return keys[0];
      }
    }

    return undefined;
  }
}
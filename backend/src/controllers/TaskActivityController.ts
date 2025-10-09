import { Request, Response } from 'express';
import { TaskActivityService, ActivityFilters } from '../services/TaskActivityService';
import { logger } from '../utils/logger';
import { AuthenticatedRequest } from '../middleware/auth';

export class TaskActivityController {
  private activityService: TaskActivityService;

  constructor() {
    this.activityService = new TaskActivityService();
  }

  /**
   * Get activity history for a task
   * GET /api/tasks/:taskId/activity
   */
  async getTaskActivity(req: Request, res: Response): Promise<void> {
    try {
      const { taskId } = req.params;
      const {
        page = '1',
        limit = '50',
        sortOrder = 'desc'
      } = req.query;

      const options = {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        sortOrder: sortOrder as 'asc' | 'desc'
      };

      const result = await this.activityService.getTaskActivity(taskId, options);

      res.json({
        success: true,
        data: result.activities,
        pagination: {
          total: result.total,
          page: result.page,
          limit: result.limit,
          hasMore: result.hasMore
        }
      });
    } catch (error) {
      logger.error('Error getting task activity:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to get task activity'
        }
      });
    }
  }

  /**
   * Get activity feed
   * GET /api/activity/feed
   */
  async getActivityFeed(req: Request, res: Response): Promise<void> {
    try {
      const {
        taskId,
        userId,
        action,
        field,
        dateFrom,
        dateTo,
        page = '1',
        limit = '50',
        sortOrder = 'desc'
      } = req.query;

      const filters: ActivityFilters = {
        taskId: taskId as string,
        userId: userId as string,
        action: action as string,
        field: field as string,
        dateFrom: dateFrom ? new Date(dateFrom as string) : undefined,
        dateTo: dateTo ? new Date(dateTo as string) : undefined
      };

      const options = {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        sortOrder: sortOrder as 'asc' | 'desc'
      };

      const result = await this.activityService.getActivityFeed(filters, options);

      res.json({
        success: true,
        data: result.activities,
        pagination: {
          total: result.total,
          page: result.page,
          limit: result.limit,
          hasMore: result.hasMore
        }
      });
    } catch (error) {
      logger.error('Error getting activity feed:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to get activity feed'
        }
      });
    }
  }

  /**
   * Get activity statistics
   * GET /api/activity/statistics
   */
  async getActivityStatistics(req: Request, res: Response): Promise<void> {
    try {
      const {
        taskId,
        userId,
        dateFrom,
        dateTo
      } = req.query;

      const filters: ActivityFilters = {
        taskId: taskId as string,
        userId: userId as string,
        dateFrom: dateFrom ? new Date(dateFrom as string) : undefined,
        dateTo: dateTo ? new Date(dateTo as string) : undefined
      };

      const statistics = await this.activityService.getActivityStatistics(filters);

      res.json({
        success: true,
        data: statistics
      });
    } catch (error) {
      logger.error('Error getting activity statistics:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to get activity statistics'
        }
      });
    }
  }

  /**
   * Get recent activity for current user
   * GET /api/activity/recent
   */
  async getUserRecentActivity(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const {
        limit = '20',
        taskIds
      } = req.query;

      const options = {
        limit: parseInt(limit as string),
        taskIds: taskIds ? (taskIds as string).split(',') : undefined
      };

      const activities = await this.activityService.getUserRecentActivity(userId, options);

      res.json({
        success: true,
        data: activities
      });
    } catch (error) {
      logger.error('Error getting user recent activity:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to get user recent activity'
        }
      });
    }
  }

  /**
   * Cleanup old activity entries (admin only)
   * DELETE /api/activity/cleanup
   */
  async cleanupOldActivity(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      // TODO: Add admin permission check
      const { olderThanDays = '365' } = req.query;

      const deletedCount = await this.activityService.cleanupOldActivity(
        parseInt(olderThanDays as string)
      );

      res.json({
        success: true,
        message: `Cleaned up ${deletedCount} old activity entries`,
        data: { deletedCount }
      });
    } catch (error) {
      logger.error('Error cleaning up old activity:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to cleanup old activity'
        }
      });
    }
  }
}
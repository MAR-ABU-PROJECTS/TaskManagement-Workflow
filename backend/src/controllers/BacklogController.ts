import { Request, Response } from 'express';
import { BacklogService } from '../services/BacklogService';
import { logger } from '../utils/logger';
import { AuthenticatedRequest } from '../middleware/auth';
import {
  CreateBacklogItemRequest,
  UpdateBacklogItemRequest,
  CreateEpicRequest,
  UpdateEpicRequest,
  BacklogFilters,
  EpicFilters,
  PrioritizationRequest,
  BulkPrioritizationRequest
} from '../types/backlog.types';

export class BacklogController {
  private backlogService: BacklogService;

  constructor() {
    this.backlogService = new BacklogService();
  }

  /**
   * Get or create project backlog
   * GET /api/projects/:projectId/backlog
   */
  async getProjectBacklog(req: Request, res: Response): Promise<void> {
    try {
      const { projectId } = req.params;

      const backlog = await this.backlogService.getOrCreateBacklog(projectId);

      res.json({
        success: true,
        data: backlog
      });
    } catch (error) {
      logger.error('Error getting project backlog:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to get project backlog'
        }
      });
    }
  }

  /**
   * Add item to backlog
   * POST /api/projects/:projectId/backlog/items
   */
  async addItemToBacklog(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { projectId } = req.params;
      const { taskId, priority, storyPoints, epicId, businessValue, riskLevel, acceptanceCriteria, dependencies } = req.body;
      const userId = req.user!.id;

      const itemData: CreateBacklogItemRequest = {
        taskId,
        priority,
        storyPoints,
        epicId,
        businessValue,
        riskLevel,
        acceptanceCriteria,
        dependencies
      };

      const backlogItem = await this.backlogService.addItemToBacklog(projectId, itemData, userId);

      res.status(201).json({
        success: true,
        data: backlogItem
      });
    } catch (error) {
      logger.error('Error adding item to backlog:', error);
      
      if (error.message === 'Task not found') {
        res.status(404).json({
          error: {
            code: 'TASK_NOT_FOUND',
            message: 'Task not found'
          }
        });
        return;
      }

      if (error.message.includes('already in the backlog')) {
        res.status(409).json({
          error: {
            code: 'ITEM_ALREADY_EXISTS',
            message: 'Task is already in the backlog'
          }
        });
        return;
      }

      if (error.message.includes('same project')) {
        res.status(400).json({
          error: {
            code: 'INVALID_PROJECT',
            message: 'Task must be in the same project as the backlog'
          }
        });
        return;
      }

      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to add item to backlog'
        }
      });
    }
  }

  /**
   * Update backlog item
   * PUT /api/backlog/items/:itemId
   */
  async updateBacklogItem(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { itemId } = req.params;
      const { priority, storyPoints, epicId, businessValue, riskLevel, readyForSprint, acceptanceCriteria, dependencies } = req.body;
      const userId = req.user!.id;

      const updateData: UpdateBacklogItemRequest = {
        priority,
        storyPoints,
        epicId,
        businessValue,
        riskLevel,
        readyForSprint,
        acceptanceCriteria,
        dependencies
      };

      const backlogItem = await this.backlogService.updateBacklogItem(itemId, updateData, userId);

      res.json({
        success: true,
        data: backlogItem
      });
    } catch (error) {
      logger.error('Error updating backlog item:', error);
      
      if (error.message === 'Backlog item not found') {
        res.status(404).json({
          error: {
            code: 'ITEM_NOT_FOUND',
            message: 'Backlog item not found'
          }
        });
        return;
      }

      if (error.message.includes('Epic not found')) {
        res.status(400).json({
          error: {
            code: 'EPIC_NOT_FOUND',
            message: 'Epic not found or not in the same project'
          }
        });
        return;
      }

      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to update backlog item'
        }
      });
    }
  }

  /**
   * Remove item from backlog
   * DELETE /api/backlog/items/:itemId
   */
  async removeItemFromBacklog(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { itemId } = req.params;
      const userId = req.user!.id;

      await this.backlogService.removeItemFromBacklog(itemId, userId);

      res.json({
        success: true,
        message: 'Item removed from backlog successfully'
      });
    } catch (error) {
      logger.error('Error removing item from backlog:', error);
      
      if (error.message === 'Backlog item not found') {
        res.status(404).json({
          error: {
            code: 'ITEM_NOT_FOUND',
            message: 'Backlog item not found'
          }
        });
        return;
      }

      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to remove item from backlog'
        }
      });
    }
  }

  /**
   * Prioritize backlog item
   * PUT /api/backlog/items/:itemId/priority
   */
  async prioritizeItem(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { itemId } = req.params;
      const { newPriority, reason } = req.body;
      const userId = req.user!.id;

      const prioritization: PrioritizationRequest = {
        itemId,
        newPriority,
        reason
      };

      const backlogItem = await this.backlogService.prioritizeItem(prioritization, userId);

      res.json({
        success: true,
        data: backlogItem
      });
    } catch (error) {
      logger.error('Error prioritizing backlog item:', error);
      
      if (error.message === 'Backlog item not found') {
        res.status(404).json({
          error: {
            code: 'ITEM_NOT_FOUND',
            message: 'Backlog item not found'
          }
        });
        return;
      }

      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to prioritize backlog item'
        }
      });
    }
  }

  /**
   * Bulk prioritize backlog items
   * PUT /api/backlog/items/bulk-priority
   */
  async bulkPrioritize(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { items, reason } = req.body;
      const userId = req.user!.id;

      const bulkPrioritization: BulkPrioritizationRequest = {
        items,
        reason
      };

      const updatedItems = await this.backlogService.bulkPrioritize(bulkPrioritization, userId);

      res.json({
        success: true,
        data: updatedItems,
        message: `${updatedItems.length} items prioritized successfully`
      });
    } catch (error) {
      logger.error('Error bulk prioritizing items:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to bulk prioritize items'
        }
      });
    }
  }

  /**
   * Search backlog items
   * GET /api/backlog/items
   */
  async searchBacklogItems(req: Request, res: Response): Promise<void> {
    try {
      const {
        projectId,
        epicId,
        assigneeId,
        status,
        priority,
        riskLevel,
        readyForSprint,
        hasStoryPoints,
        labels,
        search,
        page = '1',
        limit = '50',
        sortBy = 'priority',
        sortOrder = 'asc',
        includeTask,
        includeEpic
      } = req.query;

      const filters: BacklogFilters = {
        projectId: projectId as string,
        epicId: epicId as string,
        assigneeId: assigneeId as string,
        status: status as string,
        priority: priority as any,
        riskLevel: riskLevel as any,
        readyForSprint: readyForSprint === 'true',
        hasStoryPoints: hasStoryPoints === 'true',
        labels: labels ? (labels as string).split(',') : undefined,
        search: search as string
      };

      const options = {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        sortBy: sortBy as string,
        sortOrder: sortOrder as 'asc' | 'desc',
        includeTask: includeTask !== 'false',
        includeEpic: includeEpic !== 'false'
      };

      const result = await this.backlogService.searchBacklogItems(filters, options);

      res.json({
        success: true,
        data: result.items,
        pagination: {
          total: result.total,
          page: result.page,
          limit: result.limit,
          hasMore: result.hasMore
        }
      });
    } catch (error) {
      logger.error('Error searching backlog items:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to search backlog items'
        }
      });
    }
  }

  /**
   * Create epic
   * POST /api/epics
   */
  async createEpic(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { title, description, projectId, priority, ownerId, startDate, targetDate, businessValue, color, labels } = req.body;
      const userId = req.user!.id;

      const epicData: CreateEpicRequest = {
        title,
        description,
        projectId,
        priority,
        ownerId: ownerId || userId,
        startDate: startDate ? new Date(startDate) : undefined,
        targetDate: targetDate ? new Date(targetDate) : undefined,
        businessValue,
        color,
        labels
      };

      const epic = await this.backlogService.createEpic(epicData, userId);

      res.status(201).json({
        success: true,
        data: epic
      });
    } catch (error) {
      logger.error('Error creating epic:', error);
      
      if (error.message.includes('validation failed')) {
        res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: error.message
          }
        });
        return;
      }

      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to create epic'
        }
      });
    }
  }

  /**
   * Update epic
   * PUT /api/epics/:epicId
   */
  async updateEpic(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { epicId } = req.params;
      const { title, description, status, priority, ownerId, startDate, targetDate, businessValue, color, labels } = req.body;
      const userId = req.user!.id;

      const updateData: UpdateEpicRequest = {
        title,
        description,
        status,
        priority,
        ownerId,
        startDate: startDate ? new Date(startDate) : undefined,
        targetDate: targetDate ? new Date(targetDate) : undefined,
        businessValue,
        color,
        labels
      };

      const epic = await this.backlogService.updateEpic(epicId, updateData, userId);

      res.json({
        success: true,
        data: epic
      });
    } catch (error) {
      logger.error('Error updating epic:', error);
      
      if (error.message === 'Epic not found') {
        res.status(404).json({
          error: {
            code: 'EPIC_NOT_FOUND',
            message: 'Epic not found'
          }
        });
        return;
      }

      if (error.message === 'Epic owner not found') {
        res.status(400).json({
          error: {
            code: 'OWNER_NOT_FOUND',
            message: 'Epic owner not found'
          }
        });
        return;
      }

      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to update epic'
        }
      });
    }
  }

  /**
   * Search epics
   * GET /api/epics
   */
  async searchEpics(req: Request, res: Response): Promise<void> {
    try {
      const {
        projectId,
        status,
        ownerId,
        priority,
        startDateFrom,
        startDateTo,
        targetDateFrom,
        targetDateTo,
        search,
        page = '1',
        limit = '50',
        sortBy = 'createdAt',
        sortOrder = 'desc',
        includeStories,
        includeProgress
      } = req.query;

      const filters: EpicFilters = {
        projectId: projectId as string,
        status: status as any,
        ownerId: ownerId as string,
        priority: priority as any,
        startDateFrom: startDateFrom ? new Date(startDateFrom as string) : undefined,
        startDateTo: startDateTo ? new Date(startDateTo as string) : undefined,
        targetDateFrom: targetDateFrom ? new Date(targetDateFrom as string) : undefined,
        targetDateTo: targetDateTo ? new Date(targetDateTo as string) : undefined,
        search: search as string
      };

      const options = {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        sortBy: sortBy as string,
        sortOrder: sortOrder as 'asc' | 'desc',
        includeStories: includeStories === 'true',
        includeProgress: includeProgress === 'true'
      };

      const result = await this.backlogService.searchEpics(filters, options);

      res.json({
        success: true,
        data: result.epics,
        pagination: {
          total: result.total,
          page: result.page,
          limit: result.limit,
          hasMore: result.hasMore
        }
      });
    } catch (error) {
      logger.error('Error searching epics:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to search epics'
        }
      });
    }
  }

  /**
   * Get backlog metrics
   * GET /api/projects/:projectId/backlog/metrics
   */
  async getBacklogMetrics(req: Request, res: Response): Promise<void> {
    try {
      const { projectId } = req.params;

      const metrics = await this.backlogService.getBacklogMetrics(projectId);

      res.json({
        success: true,
        data: metrics
      });
    } catch (error) {
      logger.error('Error getting backlog metrics:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to get backlog metrics'
        }
      });
    }
  }

  /**
   * Get backlog health
   * GET /api/projects/:projectId/backlog/health
   */
  async getBacklogHealth(req: Request, res: Response): Promise<void> {
    try {
      const { projectId } = req.params;

      const health = await this.backlogService.getBacklogHealth(projectId);

      res.json({
        success: true,
        data: health
      });
    } catch (error) {
      logger.error('Error getting backlog health:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to get backlog health'
        }
      });
    }
  }
}
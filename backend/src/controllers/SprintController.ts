import { Request, Response } from 'express';
import { SprintService } from '../services/SprintService';
import { logger } from '../utils/logger';
import { AuthenticatedRequest } from '../middleware/auth';
import { CreateSprintRequest, UpdateSprintRequest, SprintFilters } from '../types/sprint.types';

export class SprintController {
  private sprintService: SprintService;

  constructor() {
    this.sprintService = new SprintService();
  }

  /**
   * Create a new sprint
   * POST /api/sprints
   */
  async createSprint(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { name, goal, projectId, startDate, endDate, capacity } = req.body;
      const userId = req.user!.id;

      const sprintData: CreateSprintRequest = {
        name,
        goal,
        projectId,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        capacity
      };

      const sprint = await this.sprintService.createSprint(sprintData, userId);

      res.status(201).json({
        success: true,
        data: sprint
      });
    } catch (error) {
      logger.error('Error creating sprint:', error);
      
      if (error.message.includes('validation failed')) {
        res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: error.message
          }
        });
        return;
      }

      if (error.message.includes('overlap')) {
        res.status(409).json({
          error: {
            code: 'SPRINT_OVERLAP',
            message: error.message
          }
        });
        return;
      }

      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to create sprint'
        }
      });
    }
  }

  /**
   * Get sprint by ID
   * GET /api/sprints/:sprintId
   */
  async getSprint(req: Request, res: Response): Promise<void> {
    try {
      const { sprintId } = req.params;
      const { includeTasks, includeMetrics } = req.query;

      const options = {
        includeTasks: includeTasks === 'true',
        includeMetrics: includeMetrics === 'true'
      };

      const sprint = await this.sprintService.getSprint(sprintId, options);

      if (!sprint) {
        res.status(404).json({
          error: {
            code: 'SPRINT_NOT_FOUND',
            message: 'Sprint not found'
          }
        });
        return;
      }

      res.json({
        success: true,
        data: sprint
      });
    } catch (error) {
      logger.error('Error getting sprint:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to get sprint'
        }
      });
    }
  }

  /**
   * Search sprints
   * GET /api/sprints
   */
  async searchSprints(req: Request, res: Response): Promise<void> {
    try {
      const {
        projectId,
        status,
        startDateFrom,
        startDateTo,
        endDateFrom,
        endDateTo,
        search,
        page = '1',
        limit = '50',
        sortBy = 'startDate',
        sortOrder = 'desc',
        includeTasks,
        includeMetrics
      } = req.query;

      const filters: SprintFilters = {
        projectId: projectId as string,
        status: status as any,
        startDateFrom: startDateFrom ? new Date(startDateFrom as string) : undefined,
        startDateTo: startDateTo ? new Date(startDateTo as string) : undefined,
        endDateFrom: endDateFrom ? new Date(endDateFrom as string) : undefined,
        endDateTo: endDateTo ? new Date(endDateTo as string) : undefined,
        search: search as string
      };

      const options = {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        sortBy: sortBy as string,
        sortOrder: sortOrder as 'asc' | 'desc',
        includeTasks: includeTasks === 'true',
        includeMetrics: includeMetrics === 'true'
      };

      const result = await this.sprintService.searchSprints(filters, options);

      res.json({
        success: true,
        data: result.sprints,
        pagination: {
          total: result.total,
          page: result.page,
          limit: result.limit,
          hasMore: result.hasMore
        }
      });
    } catch (error) {
      logger.error('Error searching sprints:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to search sprints'
        }
      });
    }
  }

  /**
   * Update sprint
   * PUT /api/sprints/:sprintId
   */
  async updateSprint(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { sprintId } = req.params;
      const { name, goal, startDate, endDate, status, capacity, velocity } = req.body;
      const userId = req.user!.id;

      const updateData: UpdateSprintRequest = {
        name,
        goal,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        status,
        capacity,
        velocity
      };

      const sprint = await this.sprintService.updateSprint(sprintId, updateData, userId);

      res.json({
        success: true,
        data: sprint
      });
    } catch (error) {
      logger.error('Error updating sprint:', error);
      
      if (error.message === 'Sprint not found') {
        res.status(404).json({
          error: {
            code: 'SPRINT_NOT_FOUND',
            message: 'Sprint not found'
          }
        });
        return;
      }

      if (error.message.includes('validation failed')) {
        res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: error.message
          }
        });
        return;
      }

      if (error.message.includes('overlap')) {
        res.status(409).json({
          error: {
            code: 'SPRINT_OVERLAP',
            message: error.message
          }
        });
        return;
      }

      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to update sprint'
        }
      });
    }
  }

  /**
   * Delete sprint
   * DELETE /api/sprints/:sprintId
   */
  async deleteSprint(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { sprintId } = req.params;
      const userId = req.user!.id;

      await this.sprintService.deleteSprint(sprintId, userId);

      res.json({
        success: true,
        message: 'Sprint deleted successfully'
      });
    } catch (error) {
      logger.error('Error deleting sprint:', error);
      
      if (error.message === 'Sprint not found') {
        res.status(404).json({
          error: {
            code: 'SPRINT_NOT_FOUND',
            message: 'Sprint not found'
          }
        });
        return;
      }

      if (error.message.includes('Cannot delete an active sprint')) {
        res.status(400).json({
          error: {
            code: 'INVALID_OPERATION',
            message: 'Cannot delete an active sprint'
          }
        });
        return;
      }

      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to delete sprint'
        }
      });
    }
  }

  /**
   * Add task to sprint
   * POST /api/sprints/:sprintId/tasks
   */
  async addTaskToSprint(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { sprintId } = req.params;
      const { taskId } = req.body;
      const userId = req.user!.id;

      const sprintTask = await this.sprintService.addTaskToSprint(sprintId, taskId, userId);

      res.status(201).json({
        success: true,
        data: sprintTask
      });
    } catch (error) {
      logger.error('Error adding task to sprint:', error);
      
      if (error.message === 'Sprint not found' || error.message === 'Task not found') {
        res.status(404).json({
          error: {
            code: 'RESOURCE_NOT_FOUND',
            message: error.message
          }
        });
        return;
      }

      if (error.message.includes('Cannot add tasks') || error.message.includes('already in this sprint')) {
        res.status(400).json({
          error: {
            code: 'INVALID_OPERATION',
            message: error.message
          }
        });
        return;
      }

      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to add task to sprint'
        }
      });
    }
  }

  /**
   * Remove task from sprint
   * DELETE /api/sprints/:sprintId/tasks/:taskId
   */
  async removeTaskFromSprint(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { sprintId, taskId } = req.params;
      const userId = req.user!.id;

      await this.sprintService.removeTaskFromSprint(sprintId, taskId, userId);

      res.json({
        success: true,
        message: 'Task removed from sprint successfully'
      });
    } catch (error) {
      logger.error('Error removing task from sprint:', error);
      
      if (error.message === 'Sprint not found') {
        res.status(404).json({
          error: {
            code: 'SPRINT_NOT_FOUND',
            message: 'Sprint not found'
          }
        });
        return;
      }

      if (error.message.includes('Cannot remove tasks') || error.message.includes('not in this sprint')) {
        res.status(400).json({
          error: {
            code: 'INVALID_OPERATION',
            message: error.message
          }
        });
        return;
      }

      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to remove task from sprint'
        }
      });
    }
  }

  /**
   * Start sprint
   * POST /api/sprints/:sprintId/start
   */
  async startSprint(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { sprintId } = req.params;
      const userId = req.user!.id;

      const sprint = await this.sprintService.startSprint(sprintId, userId);

      res.json({
        success: true,
        data: sprint,
        message: 'Sprint started successfully'
      });
    } catch (error) {
      logger.error('Error starting sprint:', error);
      
      if (error.message === 'Sprint not found') {
        res.status(404).json({
          error: {
            code: 'SPRINT_NOT_FOUND',
            message: 'Sprint not found'
          }
        });
        return;
      }

      if (error.message.includes('Only sprints in planning') || error.message.includes('already an active sprint')) {
        res.status(400).json({
          error: {
            code: 'INVALID_OPERATION',
            message: error.message
          }
        });
        return;
      }

      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to start sprint'
        }
      });
    }
  }

  /**
   * Complete sprint
   * POST /api/sprints/:sprintId/complete
   */
  async completeSprint(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { sprintId } = req.params;
      const userId = req.user!.id;

      const sprint = await this.sprintService.completeSprint(sprintId, userId);

      res.json({
        success: true,
        data: sprint,
        message: 'Sprint completed successfully'
      });
    } catch (error) {
      logger.error('Error completing sprint:', error);
      
      if (error.message === 'Sprint not found') {
        res.status(404).json({
          error: {
            code: 'SPRINT_NOT_FOUND',
            message: 'Sprint not found'
          }
        });
        return;
      }

      if (error.message.includes('Only active sprints')) {
        res.status(400).json({
          error: {
            code: 'INVALID_OPERATION',
            message: error.message
          }
        });
        return;
      }

      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to complete sprint'
        }
      });
    }
  }

  /**
   * Get sprint metrics
   * GET /api/sprints/:sprintId/metrics
   */
  async getSprintMetrics(req: Request, res: Response): Promise<void> {
    try {
      const { sprintId } = req.params;

      const metrics = await this.sprintService.getSprintMetrics(sprintId);

      res.json({
        success: true,
        data: metrics
      });
    } catch (error) {
      logger.error('Error getting sprint metrics:', error);
      
      if (error.message === 'Sprint not found') {
        res.status(404).json({
          error: {
            code: 'SPRINT_NOT_FOUND',
            message: 'Sprint not found'
          }
        });
        return;
      }

      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to get sprint metrics'
        }
      });
    }
  }

  /**
   * Get sprint capacity planning
   * GET /api/sprints/:sprintId/capacity
   */
  async getSprintCapacityPlanning(req: Request, res: Response): Promise<void> {
    try {
      const { sprintId } = req.params;

      const capacity = await this.sprintService.getSprintCapacityPlanning(sprintId);

      res.json({
        success: true,
        data: capacity
      });
    } catch (error) {
      logger.error('Error getting sprint capacity planning:', error);
      
      if (error.message === 'Sprint not found') {
        res.status(404).json({
          error: {
            code: 'SPRINT_NOT_FOUND',
            message: 'Sprint not found'
          }
        });
        return;
      }

      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to get sprint capacity planning'
        }
      });
    }
  }

  /**
   * Get velocity data for a project
   * GET /api/projects/:projectId/velocity
   */
  async getVelocityData(req: Request, res: Response): Promise<void> {
    try {
      const { projectId } = req.params;

      const velocity = await this.sprintService.getVelocityData(projectId);

      res.json({
        success: true,
        data: velocity
      });
    } catch (error) {
      logger.error('Error getting velocity data:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to get velocity data'
        }
      });
    }
  }

  /**
   * Get sprint statistics
   * GET /api/sprints/statistics
   */
  async getSprintStatistics(req: Request, res: Response): Promise<void> {
    try {
      const { projectId } = req.query;

      const filters = {
        projectId: projectId as string
      };

      const statistics = await this.sprintService.getSprintStatistics(filters);

      res.json({
        success: true,
        data: statistics
      });
    } catch (error) {
      logger.error('Error getting sprint statistics:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to get sprint statistics'
        }
      });
    }
  }
}
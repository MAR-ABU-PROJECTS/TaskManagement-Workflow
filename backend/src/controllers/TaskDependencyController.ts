import { Request, Response } from 'express';
import { TaskDependencyService } from '../services/TaskDependencyService';
import { logger } from '../utils/logger';
import {
  CreateTaskDependencyRequest,
  TaskDependencyFilters,
  BulkDependencyOperation,
  MoveTaskRequest,
  DependencyType
} from '../types/taskDependency.types';
import {
  ValidationError,
  NotFoundError,
  AuthorizationError
} from '../middleware/errorHandler';

export class TaskDependencyController {
  private dependencyService: TaskDependencyService;

  constructor() {
    this.dependencyService = new TaskDependencyService();
  }

  /**
   * Create a task dependency
   */
  createDependency = async (req: Request, res: Response): Promise<void> => {
    try {
      const dependencyData: CreateTaskDependencyRequest = req.body;
      const userId = req.user?.id;

      if (!userId) {
        throw new AuthorizationError('Authentication required');
      }

      // Validate required fields
      if (!dependencyData.dependentTaskId || !dependencyData.blockingTaskId || !dependencyData.type) {
        throw new ValidationError('Dependent task ID, blocking task ID, and type are required');
      }

      if (!Object.values(DependencyType).includes(dependencyData.type)) {
        throw new ValidationError('Invalid dependency type');
      }

      const dependency = await this.dependencyService.createDependency(dependencyData, userId);

      res.status(201).json({
        success: true,
        data: dependency,
        message: 'Task dependency created successfully'
      });
    } catch (error) {
      logger.error('Error creating task dependency:', error);
      throw error;
    }
  };

  /**
   * Get task dependencies
   */
  getDependencies = async (req: Request, res: Response): Promise<void> => {
    try {
      const filters: TaskDependencyFilters = {};

      if (req.query.taskId) {
        filters.taskId = req.query.taskId as string;
      }
      if (req.query.projectId) {
        filters.projectId = req.query.projectId as string;
      }
      if (req.query.type) {
        filters.type = req.query.type as DependencyType;
      }
      if (req.query.status) {
        filters.status = req.query.status as 'ACTIVE' | 'RESOLVED' | 'ALL';
      }

      const dependencies = await this.dependencyService.getDependencies(filters);

      res.json({
        success: true,
        data: dependencies,
        count: dependencies.length
      });
    } catch (error) {
      logger.error('Error getting task dependencies:', error);
      throw error;
    }
  };

  /**
   * Delete a task dependency
   */
  deleteDependency = async (req: Request, res: Response): Promise<void> => {
    try {
      const { dependencyId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        throw new AuthorizationError('Authentication required');
      }

      await this.dependencyService.deleteDependency(dependencyId, userId);

      res.json({
        success: true,
        message: 'Task dependency deleted successfully'
      });
    } catch (error) {
      logger.error('Error deleting task dependency:', error);
      throw error;
    }
  };

  /**
   * Get task blocking information
   */
  getTaskBlockingInfo = async (req: Request, res: Response): Promise<void> => {
    try {
      const { taskId } = req.params;

      const blockingInfo = await this.dependencyService.getTaskBlockingInfo(taskId);

      res.json({
        success: true,
        data: blockingInfo
      });
    } catch (error) {
      logger.error('Error getting task blocking info:', error);
      throw error;
    }
  };

  /**
   * Get subtask summary
   */
  getSubtaskSummary = async (req: Request, res: Response): Promise<void> => {
    try {
      const { taskId } = req.params;

      const summary = await this.dependencyService.getSubtaskSummary(taskId);

      res.json({
        success: true,
        data: summary
      });
    } catch (error) {
      logger.error('Error getting subtask summary:', error);
      throw error;
    }
  };

  /**
   * Get task tree
   */
  getTaskTree = async (req: Request, res: Response): Promise<void> => {
    try {
      const { taskId } = req.params;
      const maxDepth = req.query.maxDepth ? parseInt(req.query.maxDepth as string) : 5;

      const tree = await this.dependencyService.getTaskTree(taskId, maxDepth);

      res.json({
        success: true,
        data: tree
      });
    } catch (error) {
      logger.error('Error getting task tree:', error);
      throw error;
    }
  };

  /**
   * Move task in hierarchy
   */
  moveTask = async (req: Request, res: Response): Promise<void> => {
    try {
      const { taskId } = req.params;
      const { newParentId, position } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        throw new AuthorizationError('Authentication required');
      }

      const moveRequest: MoveTaskRequest = {
        taskId,
        newParentId,
        position
      };

      await this.dependencyService.moveTask(moveRequest, userId);

      res.json({
        success: true,
        message: 'Task moved successfully'
      });
    } catch (error) {
      logger.error('Error moving task:', error);
      throw error;
    }
  };

  /**
   * Generate dependency graph
   */
  getDependencyGraph = async (req: Request, res: Response): Promise<void> => {
    try {
      const { projectId } = req.params;

      const graph = await this.dependencyService.generateDependencyGraph(projectId);

      res.json({
        success: true,
        data: graph
      });
    } catch (error) {
      logger.error('Error generating dependency graph:', error);
      throw error;
    }
  };

  /**
   * Bulk dependency operations
   */
  bulkDependencyOperation = async (req: Request, res: Response): Promise<void> => {
    try {
      const operation: BulkDependencyOperation = req.body;
      const userId = req.user?.id;

      if (!userId) {
        throw new AuthorizationError('Authentication required');
      }

      if (!operation.dependencies || !Array.isArray(operation.dependencies) || operation.dependencies.length === 0) {
        throw new ValidationError('Dependencies array is required');
      }

      if (!operation.operation) {
        throw new ValidationError('Operation type is required');
      }

      const result = await this.dependencyService.bulkDependencyOperation(operation, userId);

      res.json({
        success: true,
        data: result,
        message: `Bulk dependency operation completed: ${result.successful.length} successful, ${result.failed.length} failed`
      });
    } catch (error) {
      logger.error('Error performing bulk dependency operation:', error);
      throw error;
    }
  };
}
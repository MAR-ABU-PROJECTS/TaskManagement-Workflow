import { Request, Response } from 'express';
import { TaskService } from '../services/TaskService';
import { logger } from '../utils/logger';
import {
  CreateTaskRequest,
  UpdateTaskRequest,
  TaskFilters,
  TaskQueryOptions,
  TaskType,
  Priority,
  TaskBulkOperation
} from '../types/task.types';
import {
  ValidationError,
  NotFoundError,
  AuthorizationError
} from '../middleware/errorHandler';

export class TaskController {
  private taskService: TaskService;

  constructor() {
    this.taskService = new TaskService();
  }

  /**
   * Create a new task
   */
  createTask = async (req: Request, res: Response): Promise<void> => {
    try {
      const taskData: CreateTaskRequest = req.body;
      const userId = req.user?.id;

      if (!userId) {
        throw new AuthorizationError('Authentication required');
      }

      // Validate required fields
      if (!taskData.title || !taskData.type || !taskData.projectId) {
        throw new ValidationError('Title, type, and projectId are required');
      }

      if (!Object.values(TaskType).includes(taskData.type)) {
        throw new ValidationError('Invalid task type');
      }

      const task = await this.taskService.createTask(taskData, {
        projectId: taskData.projectId,
        userId
      });

      res.status(201).json({
        success: true,
        data: task,
        message: 'Task created successfully'
      });
    } catch (error) {
      logger.error('Error creating task:', error);
      throw error;
    }
  };

  /**
   * Get task by ID
   */
  getTask = async (req: Request, res: Response): Promise<void> => {
    try {
      const { taskId } = req.params;
      const options: TaskQueryOptions = {
        includeSubtasks: req.query.includeSubtasks === 'true',
        includeComments: req.query.includeComments === 'true',
        includeAttachments: req.query.includeAttachments === 'true',
        includeTimeEntries: req.query.includeTimeEntries === 'true',
        includeCustomFields: req.query.includeCustomFields === 'true'
      };

      const task = await this.taskService.getTask(taskId, options);

      if (!task) {
        throw new NotFoundError('Task not found');
      }

      res.json({
        success: true,
        data: task
      });
    } catch (error) {
      logger.error('Error getting task:', error);
      throw error;
    }
  };

  /**
   * Get task by key
   */
  getTaskByKey = async (req: Request, res: Response): Promise<void> => {
    try {
      const { taskKey } = req.params;
      const options: TaskQueryOptions = {
        includeSubtasks: req.query.includeSubtasks === 'true',
        includeComments: req.query.includeComments === 'true',
        includeAttachments: req.query.includeAttachments === 'true',
        includeTimeEntries: req.query.includeTimeEntries === 'true',
        includeCustomFields: req.query.includeCustomFields === 'true'
      };

      const task = await this.taskService.getTaskByKey(taskKey, options);

      if (!task) {
        throw new NotFoundError('Task not found');
      }

      res.json({
        success: true,
        data: task
      });
    } catch (error) {
      logger.error('Error getting task by key:', error);
      throw error;
    }
  };

  /**
   * Search and filter tasks
   */
  searchTasks = async (req: Request, res: Response): Promise<void> => {
    try {
      const filters: TaskFilters = {};
      const options: TaskQueryOptions = {};

      // Parse filters from query parameters
      if (req.query.projectId) {
        filters.projectId = req.query.projectId as string;
      }
      if (req.query.assigneeId) {
        filters.assigneeId = req.query.assigneeId as string;
      }
      if (req.query.reporterId) {
        filters.reporterId = req.query.reporterId as string;
      }
      if (req.query.type) {
        filters.type = req.query.type as TaskType;
      }
      if (req.query.status) {
        filters.status = req.query.status as string;
      }
      if (req.query.priority) {
        filters.priority = req.query.priority as Priority;
      }
      if (req.query.parentId) {
        filters.parentId = req.query.parentId as string;
      }
      if (req.query.labels) {
        filters.labels = Array.isArray(req.query.labels) 
          ? req.query.labels as string[]
          : [req.query.labels as string];
      }
      if (req.query.components) {
        filters.components = Array.isArray(req.query.components)
          ? req.query.components as string[]
          : [req.query.components as string];
      }
      if (req.query.search) {
        filters.search = req.query.search as string;
      }

      // Parse date filters
      if (req.query.dueDateFrom || req.query.dueDateTo) {
        filters.dueDate = {};
        if (req.query.dueDateFrom) {
          filters.dueDate.from = new Date(req.query.dueDateFrom as string);
        }
        if (req.query.dueDateTo) {
          filters.dueDate.to = new Date(req.query.dueDateTo as string);
        }
      }

      // Parse options
      if (req.query.page) {
        options.page = parseInt(req.query.page as string);
      }
      if (req.query.limit) {
        options.limit = parseInt(req.query.limit as string);
      }
      if (req.query.sortBy) {
        options.sortBy = req.query.sortBy as string;
      }
      if (req.query.sortOrder) {
        options.sortOrder = req.query.sortOrder as 'asc' | 'desc';
      }

      options.includeSubtasks = req.query.includeSubtasks === 'true';

      const result = await this.taskService.searchTasks(filters, options);

      res.json({
        success: true,
        data: result.tasks,
        pagination: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          hasMore: result.hasMore
        },
        aggregations: result.aggregations
      });
    } catch (error) {
      logger.error('Error searching tasks:', error);
      throw error;
    }
  };

  /**
   * Update task
   */
  updateTask = async (req: Request, res: Response): Promise<void> => {
    try {
      const { taskId } = req.params;
      const updateData: UpdateTaskRequest = req.body;
      const userId = req.user?.id;

      if (!userId) {
        throw new AuthorizationError('Authentication required');
      }

      const task = await this.taskService.updateTask(taskId, updateData, {
        taskId,
        userId,
        reason: req.body.reason,
        notifyAssignee: req.body.notifyAssignee !== false,
        notifyWatchers: req.body.notifyWatchers !== false
      });

      res.json({
        success: true,
        data: task,
        message: 'Task updated successfully'
      });
    } catch (error) {
      logger.error('Error updating task:', error);
      throw error;
    }
  };

  /**
   * Delete task
   */
  deleteTask = async (req: Request, res: Response): Promise<void> => {
    try {
      const { taskId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        throw new AuthorizationError('Authentication required');
      }

      await this.taskService.deleteTask(taskId, userId);

      res.json({
        success: true,
        message: 'Task deleted successfully'
      });
    } catch (error) {
      logger.error('Error deleting task:', error);
      throw error;
    }
  };

  /**
   * Assign task to user
   */
  assignTask = async (req: Request, res: Response): Promise<void> => {
    try {
      const { taskId } = req.params;
      const { assigneeId, comment } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        throw new AuthorizationError('Authentication required');
      }

      if (!assigneeId) {
        throw new ValidationError('Assignee ID is required');
      }

      const task = await this.taskService.assignTask({
        taskId,
        assigneeId,
        assignedBy: userId,
        comment
      });

      res.json({
        success: true,
        data: task,
        message: 'Task assigned successfully'
      });
    } catch (error) {
      logger.error('Error assigning task:', error);
      throw error;
    }
  };

  /**
   * Transition task status
   */
  transitionTaskStatus = async (req: Request, res: Response): Promise<void> => {
    try {
      const { taskId } = req.params;
      const { toStatus, comment, transitionId } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        throw new AuthorizationError('Authentication required');
      }

      if (!toStatus) {
        throw new ValidationError('Target status is required');
      }

      // Get current task to determine fromStatus
      const currentTask = await this.taskService.getTask(taskId);
      if (!currentTask) {
        throw new NotFoundError('Task not found');
      }

      const task = await this.taskService.transitionTaskStatus({
        taskId,
        fromStatus: currentTask.status,
        toStatus,
        comment,
        userId,
        transitionId
      });

      res.json({
        success: true,
        data: task,
        message: 'Task status updated successfully'
      });
    } catch (error) {
      logger.error('Error transitioning task status:', error);
      throw error;
    }
  };

  /**
   * Get task statistics
   */
  getTaskStatistics = async (req: Request, res: Response): Promise<void> => {
    try {
      const filters: TaskFilters = {};

      if (req.query.projectId) {
        filters.projectId = req.query.projectId as string;
      }
      if (req.query.assigneeId) {
        filters.assigneeId = req.query.assigneeId as string;
      }

      const statistics = await this.taskService.getTaskStatistics(filters);

      res.json({
        success: true,
        data: statistics
      });
    } catch (error) {
      logger.error('Error getting task statistics:', error);
      throw error;
    }
  };

  /**
   * Bulk operations on tasks
   */
  bulkOperation = async (req: Request, res: Response): Promise<void> => {
    try {
      const operation: TaskBulkOperation = req.body;
      const userId = req.user?.id;

      if (!userId) {
        throw new AuthorizationError('Authentication required');
      }

      if (!operation.taskIds || !Array.isArray(operation.taskIds) || operation.taskIds.length === 0) {
        throw new ValidationError('Task IDs array is required');
      }

      if (!operation.operation) {
        throw new ValidationError('Operation type is required');
      }

      const result = await this.taskService.bulkOperation(operation, userId);

      res.json({
        success: true,
        data: result,
        message: `Bulk operation completed: ${result.successful.length} successful, ${result.failed.length} failed`
      });
    } catch (error) {
      logger.error('Error performing bulk operation:', error);
      throw error;
    }
  };
}
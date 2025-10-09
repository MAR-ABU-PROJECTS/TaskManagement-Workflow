import { PrismaClient, TaskType, Priority } from '@prisma/client';
import { logger } from '../utils/logger';
import {
  Task,
  CreateTaskRequest,
  UpdateTaskRequest,
  TaskFilters,
  TaskQueryOptions,
  TaskSearchResult,
  TaskStatusTransition,
  TaskAssignment,
  TaskValidationResult,
  TaskNotificationEvent,
  TaskBulkOperation,
  TaskBulkResult,
  TaskStatistics,
  TaskCreationContext,
  TaskUpdateContext
} from '../types/task.types';
import { WorkflowService } from './WorkflowService';
import { TaskCommentService } from './TaskCommentService';
import { TaskAttachmentService } from './TaskAttachmentService';
import { TaskActivityService } from './TaskActivityService';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

export class TaskService {
  private workflowService: WorkflowService;
  private commentService: TaskCommentService;
  private attachmentService: TaskAttachmentService;
  private activityService: TaskActivityService;

  constructor() {
    this.workflowService = new WorkflowService();
    this.commentService = new TaskCommentService();
    this.attachmentService = new TaskAttachmentService();
    this.activityService = new TaskActivityService();
  }

  /**
   * Create a new task
   */
  async createTask(
    taskData: CreateTaskRequest,
    context: TaskCreationContext
  ): Promise<Task> {
    try {
      // Validate task data
      const validation = await this.validateTaskData(taskData, context.projectId);
      if (!validation.isValid) {
        throw new Error(`Task validation failed: ${validation.errors.join(', ')}`);
      }

      // Generate task key
      const taskKey = await this.generateTaskKey(context.projectId, taskData.type);

      // Get default workflow if not specified
      let workflowId = taskData.workflowId;
      if (!workflowId) {
        workflowId = await this.getDefaultWorkflowId(context.projectId, taskData.type);
      }

      // Get initial state from workflow
      let initialStatus = 'TODO';
      let currentStateId: string | undefined;
      if (workflowId) {
        const workflow = await this.workflowService.getWorkflow(workflowId);
        if (workflow) {
          const initialState = workflow.states.find(state => state.isInitial);
          if (initialState) {
            initialStatus = initialState.name;
            currentStateId = initialState.id;
          }
        }
      }

      // Create task
      const task = await prisma.task.create({
        data: {
          key: taskKey,
          title: taskData.title,
          description: taskData.description,
          type: taskData.type,
          status: initialStatus,
          currentStateId,
          workflowId,
          priority: taskData.priority,
          assigneeId: taskData.assigneeId,
          reporterId: context.userId,
          projectId: context.projectId,
          parentId: taskData.parentId,
          estimatedHours: taskData.estimatedHours,
          remainingHours: taskData.estimatedHours,
          loggedHours: 0,
          dueDate: taskData.dueDate,
          labels: taskData.labels || [],
          components: taskData.components || [],
          storyPoints: taskData.storyPoints,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        include: {
          assignee: true,
          reporter: true,
          project: true,
          parent: true,
          workflow: true
        }
      });

      // Create custom field values if provided
      if (taskData.customFields) {
        await this.createCustomFieldValues(task.id, taskData.customFields);
      }

      // Log activity
      await this.logTaskActivity(task.id, context.userId, 'CREATED', undefined, undefined, task);

      logger.info(`Task created: ${task.key} by user ${context.userId}`);
      return this.mapTaskFromDb(task);
    } catch (error) {
      logger.error('Error creating task:', error);
      throw error;
    }
  } 
 /**
   * Get task by ID
   */
  async getTask(taskId: string, options: TaskQueryOptions = {}): Promise<Task | null> {
    try {
      const task = await prisma.task.findUnique({
        where: { id: taskId },
        include: {
          assignee: true,
          reporter: true,
          project: true,
          parent: true,
          subtasks: options.includeSubtasks,
          workflow: true,
          comments: options.includeComments ? {
            include: {
              author: true,
              replies: true
            },
            orderBy: { createdAt: 'desc' }
          } : false,
          attachments: options.includeAttachments,
          timeEntries: options.includeTimeEntries ? {
            include: { user: true }
          } : false,
          customFieldValues: options.includeCustomFields ? {
            include: { customField: true }
          } : false
        }
      });

      if (!task) {
        return null;
      }

      return this.mapTaskFromDb(task);
    } catch (error) {
      logger.error('Error getting task:', error);
      throw error;
    }
  }

  /**
   * Get task by key
   */
  async getTaskByKey(taskKey: string, options: TaskQueryOptions = {}): Promise<Task | null> {
    try {
      const task = await prisma.task.findUnique({
        where: { key: taskKey },
        include: {
          assignee: true,
          reporter: true,
          project: true,
          parent: true,
          subtasks: options.includeSubtasks,
          workflow: true
        }
      });

      if (!task) {
        return null;
      }

      return this.mapTaskFromDb(task);
    } catch (error) {
      logger.error('Error getting task by key:', error);
      throw error;
    }
  }

  /**
   * Search and filter tasks
   */
  async searchTasks(
    filters: TaskFilters,
    options: TaskQueryOptions = {}
  ): Promise<TaskSearchResult> {
    try {
      const page = options.page || 1;
      const limit = options.limit || 50;
      const skip = (page - 1) * limit;

      // Build where clause
      const whereClause: any = {};

      if (filters.projectId) {
        whereClause.projectId = filters.projectId;
      }

      if (filters.assigneeId) {
        whereClause.assigneeId = filters.assigneeId;
      }

      if (filters.reporterId) {
        whereClause.reporterId = filters.reporterId;
      }

      if (filters.type) {
        whereClause.type = filters.type;
      }

      if (filters.status) {
        whereClause.status = filters.status;
      }

      if (filters.priority) {
        whereClause.priority = filters.priority;
      }

      if (filters.parentId) {
        whereClause.parentId = filters.parentId;
      }

      if (filters.labels && filters.labels.length > 0) {
        whereClause.labels = {
          hasSome: filters.labels
        };
      }

      if (filters.components && filters.components.length > 0) {
        whereClause.components = {
          hasSome: filters.components
        };
      }

      if (filters.dueDate) {
        whereClause.dueDate = {};
        if (filters.dueDate.from) {
          whereClause.dueDate.gte = filters.dueDate.from;
        }
        if (filters.dueDate.to) {
          whereClause.dueDate.lte = filters.dueDate.to;
        }
      }

      if (filters.search) {
        whereClause.OR = [
          { title: { contains: filters.search, mode: 'insensitive' } },
          { description: { contains: filters.search, mode: 'insensitive' } },
          { key: { contains: filters.search, mode: 'insensitive' } }
        ];
      }

      // Build order by clause
      const orderBy: any = {};
      if (options.sortBy) {
        orderBy[options.sortBy] = options.sortOrder || 'asc';
      } else {
        orderBy.createdAt = 'desc';
      }

      // Get tasks
      const [tasks, total] = await Promise.all([
        prisma.task.findMany({
          where: whereClause,
          include: {
            assignee: true,
            reporter: true,
            project: true,
            parent: true,
            subtasks: options.includeSubtasks,
            workflow: true
          },
          orderBy,
          skip,
          take: limit
        }),
        prisma.task.count({ where: whereClause })
      ]);

      // Get aggregations if needed
      let aggregations;
      if (options.page === 1) { // Only calculate aggregations for first page
        aggregations = await this.getTaskAggregations(whereClause);
      }

      return {
        tasks: tasks.map(task => this.mapTaskFromDb(task)),
        total,
        page,
        limit,
        hasMore: skip + tasks.length < total,
        aggregations
      };
    } catch (error) {
      logger.error('Error searching tasks:', error);
      throw error;
    }
  }  /**

   * Update task
   */
  async updateTask(
    taskId: string,
    updateData: UpdateTaskRequest,
    context: TaskUpdateContext
  ): Promise<Task> {
    try {
      // Get existing task
      const existingTask = await this.getTask(taskId);
      if (!existingTask) {
        throw new Error('Task not found');
      }

      // Validate update data
      const validation = await this.validateTaskUpdate(existingTask, updateData);
      if (!validation.isValid) {
        throw new Error(`Task update validation failed: ${validation.errors.join(', ')}`);
      }

      // Handle status transition if status is being changed
      if (updateData.status && updateData.status !== existingTask.status) {
        await this.handleStatusTransition({
          taskId,
          fromStatus: existingTask.status,
          toStatus: updateData.status,
          userId: context.userId,
          comment: context.reason
        });
      }

      // Update task
      const updatedTask = await prisma.task.update({
        where: { id: taskId },
        data: {
          ...updateData,
          updatedAt: new Date()
        },
        include: {
          assignee: true,
          reporter: true,
          project: true,
          parent: true,
          workflow: true
        }
      });

      // Update custom field values if provided
      if (updateData.customFields) {
        await this.updateCustomFieldValues(taskId, updateData.customFields);
      }

      // Log activity for changed fields
      await this.logTaskChanges(existingTask, updatedTask, context.userId);

      // Handle assignment change
      if (updateData.assigneeId && updateData.assigneeId !== existingTask.assigneeId) {
        await this.handleTaskAssignment({
          taskId,
          assigneeId: updateData.assigneeId,
          assignedBy: context.userId
        });
      }

      logger.info(`Task updated: ${updatedTask.key} by user ${context.userId}`);
      return this.mapTaskFromDb(updatedTask);
    } catch (error) {
      logger.error('Error updating task:', error);
      throw error;
    }
  }

  /**
   * Delete task
   */
  async deleteTask(taskId: string, deletedBy: string): Promise<void> {
    try {
      const task = await this.getTask(taskId);
      if (!task) {
        throw new Error('Task not found');
      }

      // Check if task has subtasks
      const subtaskCount = await prisma.task.count({
        where: { parentId: taskId }
      });

      if (subtaskCount > 0) {
        throw new Error('Cannot delete task with subtasks. Delete subtasks first.');
      }

      // Delete related data
      await Promise.all([
        prisma.taskCustomFieldValue.deleteMany({ where: { taskId } }),
        prisma.comment.deleteMany({ where: { taskId } }),
        prisma.timeEntry.deleteMany({ where: { taskId } }),
        prisma.attachment.deleteMany({ where: { taskId } }),
        prisma.taskDependency.deleteMany({
          where: {
            OR: [
              { dependentTaskId: taskId },
              { blockingTaskId: taskId }
            ]
          }
        })
      ]);

      // Delete task
      await prisma.task.delete({
        where: { id: taskId }
      });

      logger.info(`Task deleted: ${task.key} by user ${deletedBy}`);
    } catch (error) {
      logger.error('Error deleting task:', error);
      throw error;
    }
  }

  /**
   * Assign task to user
   */
  async assignTask(assignment: TaskAssignment): Promise<Task> {
    try {
      const task = await this.updateTask(
        assignment.taskId,
        { assigneeId: assignment.assigneeId },
        {
          taskId: assignment.taskId,
          userId: assignment.assignedBy,
          reason: assignment.comment
        }
      );

      return task;
    } catch (error) {
      logger.error('Error assigning task:', error);
      throw error;
    }
  }

  /**
   * Transition task status
   */
  async transitionTaskStatus(transition: TaskStatusTransition): Promise<Task> {
    try {
      const task = await this.getTask(transition.taskId);
      if (!task) {
        throw new Error('Task not found');
      }

      // Validate transition
      if (task.workflowId) {
        const isValidTransition = await this.validateStatusTransition(
          task.workflowId,
          transition.fromStatus,
          transition.toStatus,
          transition.userId
        );

        if (!isValidTransition) {
          throw new Error(`Invalid status transition from ${transition.fromStatus} to ${transition.toStatus}`);
        }
      }

      // Update task status
      const updatedTask = await this.updateTask(
        transition.taskId,
        { status: transition.toStatus },
        {
          taskId: transition.taskId,
          userId: transition.userId,
          reason: transition.comment
        }
      );

      return updatedTask;
    } catch (error) {
      logger.error('Error transitioning task status:', error);
      throw error;
    }
  }  /
**
   * Get task statistics
   */
  async getTaskStatistics(filters: TaskFilters = {}): Promise<TaskStatistics> {
    try {
      const whereClause: any = {};
      
      if (filters.projectId) {
        whereClause.projectId = filters.projectId;
      }
      if (filters.assigneeId) {
        whereClause.assigneeId = filters.assigneeId;
      }

      const [
        total,
        statusCounts,
        typeCounts,
        priorityCounts,
        assigneeCounts,
        overdue,
        completed,
        inProgress
      ] = await Promise.all([
        prisma.task.count({ where: whereClause }),
        prisma.task.groupBy({
          by: ['status'],
          where: whereClause,
          _count: true
        }),
        prisma.task.groupBy({
          by: ['type'],
          where: whereClause,
          _count: true
        }),
        prisma.task.groupBy({
          by: ['priority'],
          where: whereClause,
          _count: true
        }),
        prisma.task.groupBy({
          by: ['assigneeId'],
          where: whereClause,
          _count: true
        }),
        prisma.task.count({
          where: {
            ...whereClause,
            dueDate: { lt: new Date() },
            status: { not: 'DONE' }
          }
        }),
        prisma.task.count({
          where: {
            ...whereClause,
            status: 'DONE'
          }
        }),
        prisma.task.count({
          where: {
            ...whereClause,
            status: { in: ['IN_PROGRESS', 'IN_REVIEW'] }
          }
        })
      ]);

      return {
        total,
        byStatus: statusCounts.reduce((acc, item) => {
          acc[item.status] = item._count;
          return acc;
        }, {} as Record<string, number>),
        byType: typeCounts.reduce((acc, item) => {
          acc[item.type] = item._count;
          return acc;
        }, {} as Record<string, number>),
        byPriority: priorityCounts.reduce((acc, item) => {
          acc[item.priority || 'NONE'] = item._count;
          return acc;
        }, {} as Record<string, number>),
        byAssignee: assigneeCounts.reduce((acc, item) => {
          acc[item.assigneeId || 'UNASSIGNED'] = item._count;
          return acc;
        }, {} as Record<string, number>),
        overdue,
        completed,
        inProgress
      };
    } catch (error) {
      logger.error('Error getting task statistics:', error);
      throw error;
    }
  }

  /**
   * Bulk operations on tasks
   */
  async bulkOperation(operation: TaskBulkOperation, userId: string): Promise<TaskBulkResult> {
    try {
      const result: TaskBulkResult = {
        successful: [],
        failed: [],
        warnings: []
      };

      for (const taskId of operation.taskIds) {
        try {
          switch (operation.operation) {
            case 'UPDATE':
              await this.updateTask(taskId, operation.data, { taskId, userId });
              result.successful.push(taskId);
              break;
            case 'DELETE':
              await this.deleteTask(taskId, userId);
              result.successful.push(taskId);
              break;
            case 'ASSIGN':
              await this.assignTask({
                taskId,
                assigneeId: operation.data.assigneeId,
                assignedBy: userId
              });
              result.successful.push(taskId);
              break;
            case 'STATUS_CHANGE':
              await this.transitionTaskStatus({
                taskId,
                fromStatus: operation.data.fromStatus,
                toStatus: operation.data.toStatus,
                userId
              });
              result.successful.push(taskId);
              break;
          }
        } catch (error) {
          result.failed.push({
            taskId,
            error: error.message
          });
        }
      }

      logger.info(`Bulk operation ${operation.operation} completed: ${result.successful.length} successful, ${result.failed.length} failed`);
      return result;
    } catch (error) {
      logger.error('Error performing bulk operation:', error);
      throw error;
    }
  }

  // Private helper methods

  private async validateTaskData(taskData: CreateTaskRequest, projectId: string): Promise<TaskValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate required fields
    if (!taskData.title || taskData.title.trim().length === 0) {
      errors.push('Title is required');
    }

    if (taskData.title && taskData.title.length > 255) {
      errors.push('Title must be less than 255 characters');
    }

    if (taskData.description && taskData.description.length > 10000) {
      errors.push('Description must be less than 10000 characters');
    }

    // Validate project exists
    const project = await prisma.project.findUnique({
      where: { id: projectId }
    });

    if (!project) {
      errors.push('Project not found');
    }

    // Validate assignee exists
    if (taskData.assigneeId) {
      const assignee = await prisma.user.findUnique({
        where: { id: taskData.assigneeId }
      });

      if (!assignee) {
        errors.push('Assignee not found');
      }
    }

    // Validate parent task exists and is in same project
    if (taskData.parentId) {
      const parentTask = await prisma.task.findUnique({
        where: { id: taskData.parentId }
      });

      if (!parentTask) {
        errors.push('Parent task not found');
      } else if (parentTask.projectId !== projectId) {
        errors.push('Parent task must be in the same project');
      }
    }

    // Validate story points
    if (taskData.storyPoints && (taskData.storyPoints < 0 || taskData.storyPoints > 100)) {
      errors.push('Story points must be between 0 and 100');
    }

    // Validate estimated hours
    if (taskData.estimatedHours && taskData.estimatedHours < 0) {
      errors.push('Estimated hours cannot be negative');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }  p
rivate async validateTaskUpdate(existingTask: Task, updateData: UpdateTaskRequest): Promise<TaskValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Similar validation as create, but for updates
    if (updateData.title !== undefined) {
      if (!updateData.title || updateData.title.trim().length === 0) {
        errors.push('Title is required');
      }
      if (updateData.title && updateData.title.length > 255) {
        errors.push('Title must be less than 255 characters');
      }
    }

    if (updateData.description && updateData.description.length > 10000) {
      errors.push('Description must be less than 10000 characters');
    }

    if (updateData.assigneeId) {
      const assignee = await prisma.user.findUnique({
        where: { id: updateData.assigneeId }
      });

      if (!assignee) {
        errors.push('Assignee not found');
      }
    }

    if (updateData.storyPoints && (updateData.storyPoints < 0 || updateData.storyPoints > 100)) {
      errors.push('Story points must be between 0 and 100');
    }

    if (updateData.estimatedHours && updateData.estimatedHours < 0) {
      errors.push('Estimated hours cannot be negative');
    }

    if (updateData.remainingHours && updateData.remainingHours < 0) {
      errors.push('Remaining hours cannot be negative');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  private async generateTaskKey(projectId: string, taskType: TaskType): Promise<string> {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { key: true }
    });

    if (!project) {
      throw new Error('Project not found');
    }

    // Get next sequence number for this project
    const lastTask = await prisma.task.findFirst({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
      select: { key: true }
    });

    let sequenceNumber = 1;
    if (lastTask) {
      const match = lastTask.key.match(/-(\d+)$/);
      if (match) {
        sequenceNumber = parseInt(match[1]) + 1;
      }
    }

    return `${project.key}-${sequenceNumber}`;
  }

  private async getDefaultWorkflowId(projectId: string, taskType: TaskType): Promise<string | undefined> {
    // Get project configuration
    const config = await prisma.projectConfiguration.findUnique({
      where: { projectId }
    });

    if (config && config.settings) {
      const settings = config.settings as any;
      if (settings.workflow?.defaultWorkflowId) {
        return settings.workflow.defaultWorkflowId;
      }
    }

    // Get default workflow for task type
    const defaultWorkflow = await prisma.workflow.findFirst({
      where: {
        type: taskType,
        isDefault: true,
        status: 'ACTIVE',
        projectId: null // Global workflow
      }
    });

    return defaultWorkflow?.id;
  }

  private async handleStatusTransition(transition: TaskStatusTransition): Promise<void> {
    // Execute workflow transition if workflow is defined
    if (transition.transitionId) {
      const task = await prisma.task.findUnique({
        where: { id: transition.taskId },
        select: { workflowId: true }
      });

      if (task?.workflowId) {
        await this.workflowService.executeTransition(
          task.workflowId,
          transition.transitionId,
          transition.taskId,
          transition.userId,
          { comment: transition.comment }
        );
      }
    }

    // Log status change
    await this.logTaskActivity(
      transition.taskId,
      transition.userId,
      'STATUS_CHANGED',
      'status',
      transition.fromStatus,
      transition.toStatus
    );
  }

  private async handleTaskAssignment(assignment: TaskAssignment): Promise<void> {
    // Log assignment
    await this.logTaskActivity(
      assignment.taskId,
      assignment.assignedBy,
      'ASSIGNED',
      'assigneeId',
      undefined,
      assignment.assigneeId
    );
  }

  private async validateStatusTransition(
    workflowId: string,
    fromStatus: string,
    toStatus: string,
    userId: string
  ): Promise<boolean> {
    try {
      const workflow = await this.workflowService.getWorkflow(workflowId);
      if (!workflow) {
        return true; // Allow transition if no workflow defined
      }

      const fromState = workflow.states.find(state => state.name === fromStatus);
      const toState = workflow.states.find(state => state.name === toStatus);

      if (!fromState || !toState) {
        return false;
      }

      // Check if transition exists
      const transition = workflow.transitions.find(
        t => t.fromStateId === fromState.id && t.toStateId === toState.id
      );

      return !!transition;
    } catch (error) {
      logger.error('Error validating status transition:', error);
      return false;
    }
  }  pri
vate async logTaskActivity(
    taskId: string,
    userId: string,
    action: string,
    field?: string,
    oldValue?: any,
    newValue?: any
  ): Promise<void> {
    try {
      // This would typically go to an audit log table
      // For now, we'll use the existing audit log
      await prisma.auditLog.create({
        data: {
          userId,
          action,
          resource: 'TASK',
          resourceId: taskId,
          oldValues: field ? { [field]: oldValue } : undefined,
          newValues: field ? { [field]: newValue } : newValue,
          createdAt: new Date()
        }
      });
    } catch (error) {
      logger.error('Error logging task activity:', error);
      // Don't throw error for logging failures
    }
  }

  private async logTaskChanges(existingTask: Task, updatedTask: any, userId: string): Promise<void> {
    const changes: Record<string, { old: any; new: any }> = {};

    // Compare fields and log changes
    const fieldsToCheck = ['title', 'description', 'type', 'status', 'priority', 'assigneeId', 'dueDate', 'estimatedHours', 'remainingHours', 'storyPoints'];

    for (const field of fieldsToCheck) {
      if (existingTask[field] !== updatedTask[field]) {
        changes[field] = {
          old: existingTask[field],
          new: updatedTask[field]
        };
      }
    }

    if (Object.keys(changes).length > 0) {
      await this.logTaskActivity(
        existingTask.id,
        userId,
        'UPDATED',
        undefined,
        changes,
        undefined
      );
    }
  }

  private async createCustomFieldValues(taskId: string, customFields: Record<string, any>): Promise<void> {
    for (const [fieldId, value] of Object.entries(customFields)) {
      try {
        await prisma.taskCustomFieldValue.create({
          data: {
            customFieldId: fieldId,
            taskId,
            value
          }
        });
      } catch (error) {
        logger.error(`Error creating custom field value for field ${fieldId}:`, error);
      }
    }
  }

  private async updateCustomFieldValues(taskId: string, customFields: Record<string, any>): Promise<void> {
    for (const [fieldId, value] of Object.entries(customFields)) {
      try {
        await prisma.taskCustomFieldValue.upsert({
          where: {
            customFieldId_taskId: {
              customFieldId: fieldId,
              taskId
            }
          },
          update: { value },
          create: {
            customFieldId: fieldId,
            taskId,
            value
          }
        });
      } catch (error) {
        logger.error(`Error updating custom field value for field ${fieldId}:`, error);
      }
    }
  }

  private async getTaskAggregations(whereClause: any): Promise<any> {
    const [statusCounts, typeCounts, priorityCounts, assigneeCounts] = await Promise.all([
      prisma.task.groupBy({
        by: ['status'],
        where: whereClause,
        _count: true
      }),
      prisma.task.groupBy({
        by: ['type'],
        where: whereClause,
        _count: true
      }),
      prisma.task.groupBy({
        by: ['priority'],
        where: whereClause,
        _count: true
      }),
      prisma.task.groupBy({
        by: ['assigneeId'],
        where: whereClause,
        _count: true
      })
    ]);

    return {
      byStatus: statusCounts.reduce((acc, item) => {
        acc[item.status] = item._count;
        return acc;
      }, {} as Record<string, number>),
      byType: typeCounts.reduce((acc, item) => {
        acc[item.type] = item._count;
        return acc;
      }, {} as Record<string, number>),
      byPriority: priorityCounts.reduce((acc, item) => {
        acc[item.priority || 'NONE'] = item._count;
        return acc;
      }, {} as Record<string, number>),
      byAssignee: assigneeCounts.reduce((acc, item) => {
        acc[item.assigneeId || 'UNASSIGNED'] = item._count;
        return acc;
      }, {} as Record<string, number>)
    };
  }

  private mapTaskFromDb(dbTask: any): Task {
    return {
      id: dbTask.id,
      key: dbTask.key,
      title: dbTask.title,
      description: dbTask.description,
      type: dbTask.type,
      status: dbTask.status,
      currentStateId: dbTask.currentStateId,
      workflowId: dbTask.workflowId,
      priority: dbTask.priority,
      assigneeId: dbTask.assigneeId,
      reporterId: dbTask.reporterId,
      projectId: dbTask.projectId,
      parentId: dbTask.parentId,
      estimatedHours: dbTask.estimatedHours ? parseFloat(dbTask.estimatedHours.toString()) : undefined,
      remainingHours: dbTask.remainingHours ? parseFloat(dbTask.remainingHours.toString()) : undefined,
      loggedHours: parseFloat(dbTask.loggedHours.toString()),
      dueDate: dbTask.dueDate,
      labels: dbTask.labels || [],
      components: dbTask.components || [],
      createdAt: dbTask.createdAt,
      updatedAt: dbTask.updatedAt,
      // Include related data if loaded
      assignee: dbTask.assignee ? {
        id: dbTask.assignee.id,
        firstName: dbTask.assignee.firstName,
        lastName: dbTask.assignee.lastName,
        email: dbTask.assignee.email,
        avatar: dbTask.assignee.avatar
      } : undefined,
      reporter: dbTask.reporter ? {
        id: dbTask.reporter.id,
        firstName: dbTask.reporter.firstName,
        lastName: dbTask.reporter.lastName,
        email: dbTask.reporter.email
      } : undefined,
      project: dbTask.project ? {
        id: dbTask.project.id,
        name: dbTask.project.name,
        key: dbTask.project.key
      } : undefined,
      parent: dbTask.parent ? {
        id: dbTask.parent.id,
        key: dbTask.parent.key,
        title: dbTask.parent.title
      } : undefined,
      subtasks: dbTask.subtasks ? dbTask.subtasks.map((subtask: any) => this.mapTaskFromDb(subtask)) : undefined,
      workflow: dbTask.workflow ? {
        id: dbTask.workflow.id,
        name: dbTask.workflow.name,
        states: dbTask.workflow.states as any[],
      } : undefined
    };
  }

  // Comment-related methods

  /**
   * Add a comment to a task
   */
  async addComment(taskId: string, authorId: string, content: string, parentId?: string) {
    return this.commentService.createComment({
      taskId,
      authorId,
      content,
      parentId
    });
  }

  /**
   * Get comments for a task
   */
  async getTaskComments(taskId: string, includeReplies: boolean = true) {
    return this.commentService.getTaskComments(taskId, includeReplies);
  }

  /**
   * Update a comment
   */
  async updateComment(commentId: string, content: string, userId: string) {
    return this.commentService.updateComment(commentId, { content }, userId);
  }

  /**
   * Delete a comment
   */
  async deleteComment(commentId: string, userId: string) {
    return this.commentService.deleteComment(commentId, userId);
  }

  // Attachment-related methods

  /**
   * Upload an attachment to a task
   */
  async uploadAttachment(taskId: string, uploadedBy: string, file: {
    originalName: string;
    mimeType: string;
    size: number;
    buffer: Buffer;
  }) {
    return this.attachmentService.uploadAttachment({
      taskId,
      uploadedBy,
      file
    });
  }

  /**
   * Get attachments for a task
   */
  async getTaskAttachments(taskId: string) {
    return this.attachmentService.getTaskAttachments(taskId);
  }

  /**
   * Download an attachment
   */
  async downloadAttachment(attachmentId: string, userId: string) {
    return this.attachmentService.downloadAttachment(attachmentId, userId);
  }

  /**
   * Delete an attachment
   */
  async deleteAttachment(attachmentId: string, userId: string) {
    return this.attachmentService.deleteAttachment(attachmentId, userId);
  }

  // Activity-related methods

  /**
   * Get task activity history
   */
  async getTaskActivity(taskId: string, options?: {
    page?: number;
    limit?: number;
    sortOrder?: 'asc' | 'desc';
  }) {
    return this.activityService.getTaskActivity(taskId, options);
  }

  /**
   * Log task activity
   */
  async logActivity(taskId: string, userId: string, action: string, field?: string, oldValue?: any, newValue?: any, comment?: string) {
    return this.activityService.createActivity({
      taskId,
      userId,
      action,
      field,
      oldValue,
      newValue,
      comment
    });
  }s || [],
      storyPoints: dbTask.storyPoints,
      createdAt: dbTask.createdAt,
      updatedAt: dbTask.updatedAt
    };
  }
}
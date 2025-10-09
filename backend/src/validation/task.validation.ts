import Joi from 'joi';
import { TaskType, TaskStatus, TaskPriority } from '../types/task.types';

export const taskValidation = {
  /**
   * Validation for creating a task
   */
  createTask: {
    body: Joi.object({
      title: Joi.string()
        .min(1)
        .max(500)
        .required()
        .messages({
          'string.min': 'Title cannot be empty',
          'string.max': 'Title cannot exceed 500 characters',
          'any.required': 'Title is required'
        }),
      
      description: Joi.string()
        .max(10000)
        .optional()
        .allow('')
        .messages({
          'string.max': 'Description cannot exceed 10000 characters'
        }),
      
      type: Joi.string()
        .valid(...Object.values(TaskType))
        .required()
        .messages({
          'any.only': `Type must be one of: ${Object.values(TaskType).join(', ')}`,
          'any.required': 'Type is required'
        }),
      
      priority: Joi.string()
        .valid(...Object.values(TaskPriority))
        .required()
        .messages({
          'any.only': `Priority must be one of: ${Object.values(TaskPriority).join(', ')}`,
          'any.required': 'Priority is required'
        }),
      
      assigneeId: Joi.string()
        .uuid()
        .optional()
        .messages({
          'string.uuid': 'Assignee ID must be a valid UUID'
        }),
      
      projectId: Joi.string()
        .uuid()
        .required()
        .messages({
          'string.uuid': 'Project ID must be a valid UUID',
          'any.required': 'Project ID is required'
        }),
      
      parentId: Joi.string()
        .uuid()
        .optional()
        .messages({
          'string.uuid': 'Parent ID must be a valid UUID'
        }),
      
      estimatedHours: Joi.number()
        .min(0)
        .max(9999)
        .optional()
        .messages({
          'number.min': 'Estimated hours cannot be negative',
          'number.max': 'Estimated hours cannot exceed 9999'
        }),
      
      dueDate: Joi.date()
        .optional()
        .messages({
          'date.base': 'Due date must be a valid date'
        }),
      
      labels: Joi.array()
        .items(Joi.string().max(50))
        .max(20)
        .optional()
        .messages({
          'array.max': 'Cannot have more than 20 labels',
          'string.max': 'Label cannot exceed 50 characters'
        }),
      
      components: Joi.array()
        .items(Joi.string().max(100))
        .max(10)
        .optional()
        .messages({
          'array.max': 'Cannot have more than 10 components',
          'string.max': 'Component cannot exceed 100 characters'
        }),
      
      customFields: Joi.object()
        .optional()
        .messages({
          'object.base': 'Custom fields must be an object'
        })
    })
  },

  /**
   * Validation for updating a task
   */
  updateTask: {
    body: Joi.object({
      title: Joi.string()
        .min(1)
        .max(500)
        .optional()
        .messages({
          'string.min': 'Title cannot be empty',
          'string.max': 'Title cannot exceed 500 characters'
        }),
      
      description: Joi.string()
        .max(10000)
        .optional()
        .allow('')
        .messages({
          'string.max': 'Description cannot exceed 10000 characters'
        }),
      
      type: Joi.string()
        .valid(...Object.values(TaskType))
        .optional()
        .messages({
          'any.only': `Type must be one of: ${Object.values(TaskType).join(', ')}`
        }),
      
      status: Joi.string()
        .valid(...Object.values(TaskStatus))
        .optional()
        .messages({
          'any.only': `Status must be one of: ${Object.values(TaskStatus).join(', ')}`
        }),
      
      priority: Joi.string()
        .valid(...Object.values(TaskPriority))
        .optional()
        .messages({
          'any.only': `Priority must be one of: ${Object.values(TaskPriority).join(', ')}`
        }),
      
      assigneeId: Joi.string()
        .uuid()
        .optional()
        .allow(null)
        .messages({
          'string.uuid': 'Assignee ID must be a valid UUID'
        }),
      
      parentId: Joi.string()
        .uuid()
        .optional()
        .allow(null)
        .messages({
          'string.uuid': 'Parent ID must be a valid UUID'
        }),
      
      estimatedHours: Joi.number()
        .min(0)
        .max(9999)
        .optional()
        .allow(null)
        .messages({
          'number.min': 'Estimated hours cannot be negative',
          'number.max': 'Estimated hours cannot exceed 9999'
        }),
      
      remainingHours: Joi.number()
        .min(0)
        .max(9999)
        .optional()
        .allow(null)
        .messages({
          'number.min': 'Remaining hours cannot be negative',
          'number.max': 'Remaining hours cannot exceed 9999'
        }),
      
      dueDate: Joi.date()
        .optional()
        .allow(null)
        .messages({
          'date.base': 'Due date must be a valid date'
        }),
      
      labels: Joi.array()
        .items(Joi.string().max(50))
        .max(20)
        .optional()
        .messages({
          'array.max': 'Cannot have more than 20 labels',
          'string.max': 'Label cannot exceed 50 characters'
        }),
      
      components: Joi.array()
        .items(Joi.string().max(100))
        .max(10)
        .optional()
        .messages({
          'array.max': 'Cannot have more than 10 components',
          'string.max': 'Component cannot exceed 100 characters'
        }),
      
      customFields: Joi.object()
        .optional()
        .messages({
          'object.base': 'Custom fields must be an object'
        })
    }).min(1).messages({
      'object.min': 'At least one field must be provided for update'
    }),
    
    params: Joi.object({
      taskId: Joi.string()
        .uuid()
        .required()
        .messages({
          'string.uuid': 'Task ID must be a valid UUID',
          'any.required': 'Task ID is required'
        })
    })
  },

  /**
   * Validation for searching tasks
   */
  searchTasks: {
    query: Joi.object({
      page: Joi.number()
        .integer()
        .min(1)
        .optional()
        .messages({
          'number.integer': 'Page must be an integer',
          'number.min': 'Page must be at least 1'
        }),
      
      limit: Joi.number()
        .integer()
        .min(1)
        .max(100)
        .optional()
        .messages({
          'number.integer': 'Limit must be an integer',
          'number.min': 'Limit must be at least 1',
          'number.max': 'Limit cannot exceed 100'
        }),
      
      sortBy: Joi.string()
        .valid('title', 'priority', 'status', 'dueDate', 'createdAt', 'updatedAt')
        .optional()
        .messages({
          'any.only': 'Sort by must be one of: title, priority, status, dueDate, createdAt, updatedAt'
        }),
      
      sortOrder: Joi.string()
        .valid('asc', 'desc')
        .optional()
        .messages({
          'any.only': 'Sort order must be asc or desc'
        }),
      
      includeSubtasks: Joi.boolean()
        .optional()
        .messages({
          'boolean.base': 'Include subtasks must be a boolean'
        }),
      
      includeComments: Joi.boolean()
        .optional()
        .messages({
          'boolean.base': 'Include comments must be a boolean'
        }),
      
      includeAttachments: Joi.boolean()
        .optional()
        .messages({
          'boolean.base': 'Include attachments must be a boolean'
        }),
      
      // Filters
      projectId: Joi.string()
        .uuid()
        .optional()
        .messages({
          'string.uuid': 'Project ID must be a valid UUID'
        }),
      
      assigneeId: Joi.string()
        .uuid()
        .optional()
        .messages({
          'string.uuid': 'Assignee ID must be a valid UUID'
        }),
      
      reporterId: Joi.string()
        .uuid()
        .optional()
        .messages({
          'string.uuid': 'Reporter ID must be a valid UUID'
        }),
      
      type: Joi.string()
        .valid(...Object.values(TaskType))
        .optional()
        .messages({
          'any.only': `Type must be one of: ${Object.values(TaskType).join(', ')}`
        }),
      
      status: Joi.string()
        .valid(...Object.values(TaskStatus))
        .optional()
        .messages({
          'any.only': `Status must be one of: ${Object.values(TaskStatus).join(', ')}`
        }),
      
      priority: Joi.string()
        .valid(...Object.values(TaskPriority))
        .optional()
        .messages({
          'any.only': `Priority must be one of: ${Object.values(TaskPriority).join(', ')}`
        }),
      
      parentId: Joi.string()
        .uuid()
        .optional()
        .messages({
          'string.uuid': 'Parent ID must be a valid UUID'
        }),
      
      search: Joi.string()
        .min(2)
        .max(100)
        .optional()
        .messages({
          'string.min': 'Search term must be at least 2 characters',
          'string.max': 'Search term cannot exceed 100 characters'
        }),
      
      labels: Joi.string()
        .optional()
        .messages({
          'string.base': 'Labels must be a comma-separated string'
        }),
      
      components: Joi.string()
        .optional()
        .messages({
          'string.base': 'Components must be a comma-separated string'
        }),
      
      dueDateFrom: Joi.date()
        .optional()
        .messages({
          'date.base': 'Due date from must be a valid date'
        }),
      
      dueDateTo: Joi.date()
        .optional()
        .messages({
          'date.base': 'Due date to must be a valid date'
        }),
      
      createdAfter: Joi.date()
        .optional()
        .messages({
          'date.base': 'Created after must be a valid date'
        }),
      
      createdBefore: Joi.date()
        .optional()
        .messages({
          'date.base': 'Created before must be a valid date'
        }),
      
      hasSubtasks: Joi.boolean()
        .optional()
        .messages({
          'boolean.base': 'Has subtasks must be a boolean'
        }),
      
      isSubtask: Joi.boolean()
        .optional()
        .messages({
          'boolean.base': 'Is subtask must be a boolean'
        })
    })
  },

  /**
   * Validation for bulk task operations
   */
  bulkUpdate: {
    body: Joi.object({
      taskIds: Joi.array()
        .items(Joi.string().uuid())
        .min(1)
        .max(100)
        .required()
        .messages({
          'array.min': 'At least one task ID is required',
          'array.max': 'Cannot update more than 100 tasks at once',
          'string.uuid': 'All task IDs must be valid UUIDs',
          'any.required': 'Task IDs are required'
        }),
      
      operation: Joi.string()
        .valid('UPDATE_STATUS', 'ASSIGN', 'UPDATE_PRIORITY', 'ADD_LABELS', 'DELETE')
        .required()
        .messages({
          'any.only': 'Operation must be one of: UPDATE_STATUS, ASSIGN, UPDATE_PRIORITY, ADD_LABELS, DELETE',
          'any.required': 'Operation is required'
        }),
      
      data: Joi.object({
        status: Joi.string()
          .valid(...Object.values(TaskStatus))
          .optional()
          .messages({
            'any.only': `Status must be one of: ${Object.values(TaskStatus).join(', ')}`
          }),
        
        assigneeId: Joi.string()
          .uuid()
          .optional()
          .messages({
            'string.uuid': 'Assignee ID must be a valid UUID'
          }),
        
        priority: Joi.string()
          .valid(...Object.values(TaskPriority))
          .optional()
          .messages({
            'any.only': `Priority must be one of: ${Object.values(TaskPriority).join(', ')}`
          }),
        
        labels: Joi.array()
          .items(Joi.string().max(50))
          .max(20)
          .optional()
          .messages({
            'array.max': 'Cannot have more than 20 labels',
            'string.max': 'Label cannot exceed 50 characters'
          })
      }).optional()
    })
  },

  /**
   * Validation for task assignment
   */
  assignTask: {
    body: Joi.object({
      assigneeId: Joi.string()
        .uuid()
        .required()
        .messages({
          'string.uuid': 'Assignee ID must be a valid UUID',
          'any.required': 'Assignee ID is required'
        })
    }),
    
    params: Joi.object({
      taskId: Joi.string()
        .uuid()
        .required()
        .messages({
          'string.uuid': 'Task ID must be a valid UUID',
          'any.required': 'Task ID is required'
        })
    })
  },

  /**
   * Validation for task status update
   */
  updateTaskStatus: {
    body: Joi.object({
      status: Joi.string()
        .valid(...Object.values(TaskStatus))
        .required()
        .messages({
          'any.only': `Status must be one of: ${Object.values(TaskStatus).join(', ')}`,
          'any.required': 'Status is required'
        })
    }),
    
    params: Joi.object({
      taskId: Joi.string()
        .uuid()
        .required()
        .messages({
          'string.uuid': 'Task ID must be a valid UUID',
          'any.required': 'Task ID is required'
        })
    })
  },

  /**
   * Validation for task parameters
   */
  taskParams: {
    params: Joi.object({
      taskId: Joi.string()
        .uuid()
        .required()
        .messages({
          'string.uuid': 'Task ID must be a valid UUID',
          'any.required': 'Task ID is required'
        })
    })
  },

  /**
   * Validation for task key parameters
   */
  taskKeyParams: {
    params: Joi.object({
      taskKey: Joi.string()
        .pattern(/^[A-Z]+-\d+$/)
        .required()
        .messages({
          'string.pattern.base': 'Task key must be in format PROJECT-123',
          'any.required': 'Task key is required'
        })
    })
  },

  /**
   * Validation for project parameters
   */
  projectParams: {
    params: Joi.object({
      projectId: Joi.string()
        .uuid()
        .required()
        .messages({
          'string.uuid': 'Project ID must be a valid UUID',
          'any.required': 'Project ID is required'
        })
    })
  }
};
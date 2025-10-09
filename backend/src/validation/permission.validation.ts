import Joi from 'joi';
import { UserRole } from '@prisma/client';

// Grant permission schema
export const grantPermissionSchema = Joi.object({
  userId: Joi.string()
    .uuid()
    .required()
    .messages({
      'string.uuid': 'User ID must be a valid UUID',
      'any.required': 'User ID is required',
    }),
  
  resource: Joi.string()
    .min(1)
    .max(50)
    .pattern(/^[a-zA-Z_][a-zA-Z0-9_]*$/)
    .required()
    .messages({
      'string.min': 'Resource must be at least 1 character long',
      'string.max': 'Resource must not exceed 50 characters',
      'string.pattern.base': 'Resource must contain only letters, numbers, and underscores, starting with a letter or underscore',
      'any.required': 'Resource is required',
    }),
  
  actions: Joi.array()
    .items(
      Joi.string()
        .min(1)
        .max(30)
        .pattern(/^[a-zA-Z_][a-zA-Z0-9_]*$/)
        .messages({
          'string.min': 'Action must be at least 1 character long',
          'string.max': 'Action must not exceed 30 characters',
          'string.pattern.base': 'Action must contain only letters, numbers, and underscores, starting with a letter or underscore',
        })
    )
    .min(1)
    .max(10)
    .unique()
    .required()
    .messages({
      'array.min': 'At least one action is required',
      'array.max': 'Maximum 10 actions allowed',
      'array.unique': 'Actions must be unique',
      'any.required': 'Actions are required',
    }),
});

// Revoke permission schema
export const revokePermissionSchema = Joi.object({
  userId: Joi.string()
    .uuid()
    .required()
    .messages({
      'string.uuid': 'User ID must be a valid UUID',
      'any.required': 'User ID is required',
    }),
  
  resource: Joi.string()
    .min(1)
    .max(50)
    .pattern(/^[a-zA-Z_][a-zA-Z0-9_]*$/)
    .required()
    .messages({
      'string.min': 'Resource must be at least 1 character long',
      'string.max': 'Resource must not exceed 50 characters',
      'string.pattern.base': 'Resource must contain only letters, numbers, and underscores, starting with a letter or underscore',
      'any.required': 'Resource is required',
    }),
  
  actions: Joi.array()
    .items(
      Joi.string()
        .min(1)
        .max(30)
        .pattern(/^[a-zA-Z_][a-zA-Z0-9_]*$/)
        .messages({
          'string.min': 'Action must be at least 1 character long',
          'string.max': 'Action must not exceed 30 characters',
          'string.pattern.base': 'Action must contain only letters, numbers, and underscores, starting with a letter or underscore',
        })
    )
    .min(0)
    .max(10)
    .unique()
    .optional()
    .messages({
      'array.max': 'Maximum 10 actions allowed',
      'array.unique': 'Actions must be unique',
    }),
});

// Change role schema
export const changeRoleSchema = Joi.object({
  role: Joi.string()
    .valid(...Object.values(UserRole))
    .required()
    .messages({
      'any.only': `Role must be one of: ${Object.values(UserRole).join(', ')}`,
      'any.required': 'Role is required',
    }),
});

// Bulk permission schema
export const bulkPermissionSchema = Joi.object({
  userIds: Joi.array()
    .items(
      Joi.string()
        .uuid()
        .messages({
          'string.uuid': 'Each user ID must be a valid UUID',
        })
    )
    .min(1)
    .max(100)
    .unique()
    .required()
    .messages({
      'array.min': 'At least one user ID is required',
      'array.max': 'Maximum 100 user IDs allowed',
      'array.unique': 'User IDs must be unique',
      'any.required': 'User IDs are required',
    }),
  
  resource: Joi.string()
    .min(1)
    .max(50)
    .pattern(/^[a-zA-Z_][a-zA-Z0-9_]*$/)
    .required()
    .messages({
      'string.min': 'Resource must be at least 1 character long',
      'string.max': 'Resource must not exceed 50 characters',
      'string.pattern.base': 'Resource must contain only letters, numbers, and underscores, starting with a letter or underscore',
      'any.required': 'Resource is required',
    }),
  
  actions: Joi.array()
    .items(
      Joi.string()
        .min(1)
        .max(30)
        .pattern(/^[a-zA-Z_][a-zA-Z0-9_]*$/)
        .messages({
          'string.min': 'Action must be at least 1 character long',
          'string.max': 'Action must not exceed 30 characters',
          'string.pattern.base': 'Action must contain only letters, numbers, and underscores, starting with a letter or underscore',
        })
    )
    .min(1)
    .max(10)
    .unique()
    .required()
    .messages({
      'array.min': 'At least one action is required',
      'array.max': 'Maximum 10 actions allowed',
      'array.unique': 'Actions must be unique',
      'any.required': 'Actions are required',
    }),
});

// Permission check schema
export const permissionCheckSchema = Joi.object({
  userId: Joi.string()
    .uuid()
    .required()
    .messages({
      'string.uuid': 'User ID must be a valid UUID',
      'any.required': 'User ID is required',
    }),
  
  resource: Joi.string()
    .min(1)
    .max(50)
    .pattern(/^[a-zA-Z_][a-zA-Z0-9_]*$/)
    .required()
    .messages({
      'string.min': 'Resource must be at least 1 character long',
      'string.max': 'Resource must not exceed 50 characters',
      'string.pattern.base': 'Resource must contain only letters, numbers, and underscores, starting with a letter or underscore',
      'any.required': 'Resource is required',
    }),
  
  action: Joi.string()
    .min(1)
    .max(30)
    .pattern(/^[a-zA-Z_][a-zA-Z0-9_]*$/)
    .required()
    .messages({
      'string.min': 'Action must be at least 1 character long',
      'string.max': 'Action must not exceed 30 characters',
      'string.pattern.base': 'Action must contain only letters, numbers, and underscores, starting with a letter or underscore',
      'any.required': 'Action is required',
    }),
  
  context: Joi.object({
    projectId: Joi.string().uuid().optional(),
    teamId: Joi.string().uuid().optional(),
    userId: Joi.string().uuid().optional(),
    resourceOwnerId: Joi.string().uuid().optional(),
  })
    .optional()
    .messages({
      'string.uuid': 'Context IDs must be valid UUIDs',
    }),
});

// Role validation helper
export const validateRole = (role: string): role is UserRole => {
  return Object.values(UserRole).includes(role as UserRole);
};

// Permission format validation helper
export const validatePermissionFormat = (permission: string): boolean => {
  const parts = permission.split(':');
  if (parts.length !== 2) return false;
  
  const [resource, action] = parts;
  const resourcePattern = /^[a-zA-Z_][a-zA-Z0-9_]*$/;
  const actionPattern = /^[a-zA-Z_][a-zA-Z0-9_]*$/;
  
  return resourcePattern.test(resource) && actionPattern.test(action);
};

// Common permission patterns
export const COMMON_PERMISSIONS = {
  // User management
  USER_CREATE: 'users:create',
  USER_READ: 'users:read',
  USER_UPDATE: 'users:update',
  USER_DELETE: 'users:delete',
  USER_MANAGE_ROLES: 'users:manage_roles',
  USER_MANAGE_PERMISSIONS: 'users:manage_permissions',
  
  // Project management
  PROJECT_CREATE: 'projects:create',
  PROJECT_READ: 'projects:read',
  PROJECT_UPDATE: 'projects:update',
  PROJECT_DELETE: 'projects:delete',
  PROJECT_MANAGE_MEMBERS: 'projects:manage_members',
  PROJECT_MANAGE_SETTINGS: 'projects:manage_settings',
  
  // Task management
  TASK_CREATE: 'tasks:create',
  TASK_READ: 'tasks:read',
  TASK_UPDATE: 'tasks:update',
  TASK_DELETE: 'tasks:delete',
  TASK_ASSIGN: 'tasks:assign',
  TASK_MANAGE_STATUS: 'tasks:manage_status',
  TASK_COMMENT: 'tasks:comment',
  
  // Team management
  TEAM_CREATE: 'teams:create',
  TEAM_READ: 'teams:read',
  TEAM_UPDATE: 'teams:update',
  TEAM_DELETE: 'teams:delete',
  TEAM_MANAGE_MEMBERS: 'teams:manage_members',
  
  // Sprint management
  SPRINT_CREATE: 'sprints:create',
  SPRINT_READ: 'sprints:read',
  SPRINT_UPDATE: 'sprints:update',
  SPRINT_DELETE: 'sprints:delete',
  SPRINT_MANAGE: 'sprints:manage',
  
  // Reporting
  REPORT_READ: 'reports:read',
  REPORT_CREATE: 'reports:create',
  REPORT_EXPORT: 'reports:export',
  ANALYTICS_READ: 'analytics:read',
  
  // Time tracking
  TIME_LOG: 'time:log',
  TIME_READ: 'time:read',
  TIME_MANAGE: 'time:manage',
  
  // System administration
  SYSTEM_CONFIGURE: 'system:configure',
  SYSTEM_BACKUP: 'system:backup',
  SYSTEM_MONITOR: 'system:monitor',
  INTEGRATIONS_MANAGE: 'integrations:manage',
} as const;

export type CommonPermission = typeof COMMON_PERMISSIONS[keyof typeof COMMON_PERMISSIONS];
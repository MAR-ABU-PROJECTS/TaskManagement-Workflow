import Joi from 'joi';
import { ProjectStatus, ProjectPriority, ProjectMethodology, ProjectMemberRole } from '@/types/project.types';

// Create project schema
export const createProjectSchema = Joi.object({
  name: Joi.string()
    .min(1)
    .max(100)
    .required()
    .messages({
      'string.min': 'Project name cannot be empty',
      'string.max': 'Project name must not exceed 100 characters',
      'any.required': 'Project name is required',
    }),
  
  description: Joi.string()
    .max(1000)
    .optional()
    .messages({
      'string.max': 'Description must not exceed 1000 characters',
    }),
  
  key: Joi.string()
    .min(2)
    .max(10)
    .pattern(/^[A-Z0-9]+$/)
    .optional()
    .messages({
      'string.min': 'Project key must be at least 2 characters',
      'string.max': 'Project key must not exceed 10 characters',
      'string.pattern.base': 'Project key must contain only uppercase letters and numbers',
    }),
  
  status: Joi.string()
    .valid(...Object.values(ProjectStatus))
    .optional()
    .messages({
      'any.only': `Status must be one of: ${Object.values(ProjectStatus).join(', ')}`,
    }),
  
  priority: Joi.string()
    .valid(...Object.values(ProjectPriority))
    .optional()
    .messages({
      'any.only': `Priority must be one of: ${Object.values(ProjectPriority).join(', ')}`,
    }),
  
  methodology: Joi.string()
    .valid(...Object.values(ProjectMethodology))
    .required()
    .messages({
      'any.only': `Methodology must be one of: ${Object.values(ProjectMethodology).join(', ')}`,
      'any.required': 'Methodology is required',
    }),
  
  startDate: Joi.date()
    .iso()
    .optional()
    .messages({
      'date.format': 'Start date must be a valid ISO date',
    }),
  
  endDate: Joi.date()
    .iso()
    .greater(Joi.ref('startDate'))
    .optional()
    .messages({
      'date.format': 'End date must be a valid ISO date',
      'date.greater': 'End date must be after start date',
    }),
  
  teamId: Joi.string()
    .uuid()
    .optional()
    .messages({
      'string.uuid': 'Team ID must be a valid UUID',
    }),
  
  settings: Joi.object({
    workflowStatuses: Joi.array()
      .items(Joi.object({
        id: Joi.string().required(),
        name: Joi.string().required(),
        color: Joi.string().required(),
        order: Joi.number().integer().min(1).required(),
        isDefault: Joi.boolean().required(),
        isResolved: Joi.boolean().required(),
        allowedTransitions: Joi.array().items(Joi.string()).required(),
        permissions: Joi.object({
          canTransitionTo: Joi.array().items(Joi.string()).required(),
          canEdit: Joi.array().items(Joi.string()).required(),
        }).required(),
      }))
      .optional(),
    
    defaultAssignee: Joi.string().uuid().allow(null).optional(),
    autoAssignOwner: Joi.boolean().optional(),
    allowGuestAccess: Joi.boolean().optional(),
    requireApprovalForChanges: Joi.boolean().optional(),
    notifyOnTaskCreation: Joi.boolean().optional(),
    notifyOnStatusChange: Joi.boolean().optional(),
    notifyOnAssignment: Joi.boolean().optional(),
    enableTimeTracking: Joi.boolean().optional(),
    requireTimeEstimates: Joi.boolean().optional(),
    
    gitIntegration: Joi.object({
      enabled: Joi.boolean().required(),
      repositoryUrl: Joi.string().uri().optional(),
      branch: Joi.string().optional(),
      webhookSecret: Joi.string().optional(),
    }).optional(),
    
    slackIntegration: Joi.object({
      enabled: Joi.boolean().required(),
      channelId: Joi.string().optional(),
      webhookUrl: Joi.string().uri().optional(),
    }).optional(),
    
    customSettings: Joi.object().optional(),
  }).optional(),
  
  customFields: Joi.object()
    .optional(),
  
  templateId: Joi.string()
    .uuid()
    .optional()
    .messages({
      'string.uuid': 'Template ID must be a valid UUID',
    }),
  
  members: Joi.array()
    .items(Joi.object({
      userId: Joi.string().uuid().required(),
      role: Joi.string().valid(...Object.values(ProjectMemberRole)).required(),
    }))
    .max(50)
    .optional()
    .messages({
      'array.max': 'Maximum 50 initial members allowed',
    }),
});

// Update project schema
export const updateProjectSchema = Joi.object({
  name: Joi.string()
    .min(1)
    .max(100)
    .optional()
    .messages({
      'string.min': 'Project name cannot be empty',
      'string.max': 'Project name must not exceed 100 characters',
    }),
  
  description: Joi.string()
    .max(1000)
    .allow('')
    .optional()
    .messages({
      'string.max': 'Description must not exceed 1000 characters',
    }),
  
  status: Joi.string()
    .valid(...Object.values(ProjectStatus))
    .optional()
    .messages({
      'any.only': `Status must be one of: ${Object.values(ProjectStatus).join(', ')}`,
    }),
  
  priority: Joi.string()
    .valid(...Object.values(ProjectPriority))
    .optional()
    .messages({
      'any.only': `Priority must be one of: ${Object.values(ProjectPriority).join(', ')}`,
    }),
  
  methodology: Joi.string()
    .valid(...Object.values(ProjectMethodology))
    .optional()
    .messages({
      'any.only': `Methodology must be one of: ${Object.values(ProjectMethodology).join(', ')}`,
    }),
  
  startDate: Joi.date()
    .iso()
    .optional()
    .messages({
      'date.format': 'Start date must be a valid ISO date',
    }),
  
  endDate: Joi.date()
    .iso()
    .optional()
    .messages({
      'date.format': 'End date must be a valid ISO date',
    }),
  
  teamId: Joi.string()
    .uuid()
    .allow(null)
    .optional()
    .messages({
      'string.uuid': 'Team ID must be a valid UUID',
    }),
  
  settings: Joi.object({
    workflowStatuses: Joi.array()
      .items(Joi.object({
        id: Joi.string().required(),
        name: Joi.string().required(),
        color: Joi.string().required(),
        order: Joi.number().integer().min(1).required(),
        isDefault: Joi.boolean().required(),
        isResolved: Joi.boolean().required(),
        allowedTransitions: Joi.array().items(Joi.string()).required(),
        permissions: Joi.object({
          canTransitionTo: Joi.array().items(Joi.string()).required(),
          canEdit: Joi.array().items(Joi.string()).required(),
        }).required(),
      }))
      .optional(),
    
    defaultAssignee: Joi.string().uuid().allow(null).optional(),
    autoAssignOwner: Joi.boolean().optional(),
    allowGuestAccess: Joi.boolean().optional(),
    requireApprovalForChanges: Joi.boolean().optional(),
    notifyOnTaskCreation: Joi.boolean().optional(),
    notifyOnStatusChange: Joi.boolean().optional(),
    notifyOnAssignment: Joi.boolean().optional(),
    enableTimeTracking: Joi.boolean().optional(),
    requireTimeEstimates: Joi.boolean().optional(),
    
    gitIntegration: Joi.object({
      enabled: Joi.boolean().required(),
      repositoryUrl: Joi.string().uri().optional(),
      branch: Joi.string().optional(),
      webhookSecret: Joi.string().optional(),
    }).optional(),
    
    slackIntegration: Joi.object({
      enabled: Joi.boolean().required(),
      channelId: Joi.string().optional(),
      webhookUrl: Joi.string().uri().optional(),
    }).optional(),
    
    customSettings: Joi.object().optional(),
  }).optional(),
  
  customFields: Joi.object()
    .optional(),
  
  isArchived: Joi.boolean()
    .optional(),
}).min(1).messages({
  'object.min': 'At least one field must be provided for update',
});

// Add project member schema
export const addProjectMemberSchema = Joi.object({
  userId: Joi.string()
    .uuid()
    .required()
    .messages({
      'string.uuid': 'User ID must be a valid UUID',
      'any.required': 'User ID is required',
    }),
  
  role: Joi.string()
    .valid(...Object.values(ProjectMemberRole))
    .required()
    .messages({
      'any.only': `Role must be one of: ${Object.values(ProjectMemberRole).join(', ')}`,
      'any.required': 'Role is required',
    }),
  
  permissions: Joi.array()
    .items(Joi.string())
    .optional()
    .messages({
      'array.base': 'Permissions must be an array of strings',
    }),
});

// Update project member schema
export const updateProjectMemberSchema = Joi.object({
  role: Joi.string()
    .valid(...Object.values(ProjectMemberRole))
    .optional()
    .messages({
      'any.only': `Role must be one of: ${Object.values(ProjectMemberRole).join(', ')}`,
    }),
  
  permissions: Joi.array()
    .items(Joi.string())
    .optional()
    .messages({
      'array.base': 'Permissions must be an array of strings',
    }),
  
  isActive: Joi.boolean()
    .optional(),
}).min(1).messages({
  'object.min': 'At least one field must be provided for update',
});

// Project search schema
export const projectSearchSchema = Joi.object({
  page: Joi.number()
    .integer()
    .min(1)
    .optional()
    .default(1)
    .messages({
      'number.integer': 'Page must be an integer',
      'number.min': 'Page must be at least 1',
    }),
  
  limit: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .optional()
    .default(20)
    .messages({
      'number.integer': 'Limit must be an integer',
      'number.min': 'Limit must be at least 1',
      'number.max': 'Limit must not exceed 100',
    }),
  
  search: Joi.string()
    .max(100)
    .optional()
    .messages({
      'string.max': 'Search term must not exceed 100 characters',
    }),
  
  status: Joi.string()
    .optional(),
  
  priority: Joi.string()
    .optional(),
  
  methodology: Joi.string()
    .optional(),
  
  ownerId: Joi.string()
    .uuid()
    .optional()
    .messages({
      'string.uuid': 'Owner ID must be a valid UUID',
    }),
  
  teamId: Joi.string()
    .uuid()
    .optional()
    .messages({
      'string.uuid': 'Team ID must be a valid UUID',
    }),
  
  memberUserId: Joi.string()
    .uuid()
    .optional()
    .messages({
      'string.uuid': 'Member user ID must be a valid UUID',
    }),
  
  isArchived: Joi.string()
    .valid('true', 'false')
    .optional()
    .messages({
      'any.only': 'isArchived must be "true" or "false"',
    }),
  
  isTemplate: Joi.string()
    .valid('true', 'false')
    .optional()
    .messages({
      'any.only': 'isTemplate must be "true" or "false"',
    }),
  
  createdAfter: Joi.date()
    .iso()
    .optional()
    .messages({
      'date.format': 'createdAfter must be a valid ISO date',
    }),
  
  createdBefore: Joi.date()
    .iso()
    .optional()
    .messages({
      'date.format': 'createdBefore must be a valid ISO date',
    }),
  
  includeMembers: Joi.string()
    .valid('true', 'false')
    .optional(),
  
  includeTeam: Joi.string()
    .valid('true', 'false')
    .optional(),
  
  includeStats: Joi.string()
    .valid('true', 'false')
    .optional(),
});

// Create team schema
export const createTeamSchema = Joi.object({
  name: Joi.string()
    .min(1)
    .max(100)
    .required()
    .messages({
      'string.min': 'Team name cannot be empty',
      'string.max': 'Team name must not exceed 100 characters',
      'any.required': 'Team name is required',
    }),
  
  description: Joi.string()
    .max(500)
    .optional()
    .messages({
      'string.max': 'Description must not exceed 500 characters',
    }),
  
  leaderId: Joi.string()
    .uuid()
    .required()
    .messages({
      'string.uuid': 'Leader ID must be a valid UUID',
      'any.required': 'Leader ID is required',
    }),
  
  members: Joi.array()
    .items(Joi.object({
      userId: Joi.string().uuid().required(),
      role: Joi.string().required(),
    }))
    .max(100)
    .optional()
    .messages({
      'array.max': 'Maximum 100 initial members allowed',
    }),
});

// Update team schema
export const updateTeamSchema = Joi.object({
  name: Joi.string()
    .min(1)
    .max(100)
    .optional()
    .messages({
      'string.min': 'Team name cannot be empty',
      'string.max': 'Team name must not exceed 100 characters',
    }),
  
  description: Joi.string()
    .max(500)
    .allow('')
    .optional()
    .messages({
      'string.max': 'Description must not exceed 500 characters',
    }),
  
  leaderId: Joi.string()
    .uuid()
    .optional()
    .messages({
      'string.uuid': 'Leader ID must be a valid UUID',
    }),
  
  isActive: Joi.boolean()
    .optional(),
}).min(1).messages({
  'object.min': 'At least one field must be provided for update',
});

// Project template schema
export const createProjectTemplateSchema = Joi.object({
  name: Joi.string()
    .min(1)
    .max(100)
    .required()
    .messages({
      'string.min': 'Template name cannot be empty',
      'string.max': 'Template name must not exceed 100 characters',
      'any.required': 'Template name is required',
    }),
  
  description: Joi.string()
    .max(1000)
    .optional()
    .messages({
      'string.max': 'Description must not exceed 1000 characters',
    }),
  
  methodology: Joi.string()
    .valid(...Object.values(ProjectMethodology))
    .required()
    .messages({
      'any.only': `Methodology must be one of: ${Object.values(ProjectMethodology).join(', ')}`,
      'any.required': 'Methodology is required',
    }),
  
  category: Joi.string()
    .min(1)
    .max(50)
    .required()
    .messages({
      'string.min': 'Category cannot be empty',
      'string.max': 'Category must not exceed 50 characters',
      'any.required': 'Category is required',
    }),
  
  tags: Joi.array()
    .items(Joi.string().max(30))
    .max(10)
    .optional()
    .messages({
      'array.max': 'Maximum 10 tags allowed',
      'string.max': 'Each tag must not exceed 30 characters',
    }),
  
  isPublic: Joi.boolean()
    .optional()
    .default(false),
  
  settings: Joi.object()
    .required(),
  
  customFields: Joi.object()
    .optional(),
  
  taskTemplates: Joi.array()
    .items(Joi.object({
      title: Joi.string().required(),
      description: Joi.string().optional(),
      type: Joi.string().required(),
      estimatedHours: Joi.number().min(0).optional(),
    }))
    .optional(),
});

// Validation helper functions
export const validateProjectKey = (key: string): boolean => {
  return /^[A-Z0-9]{2,10}$/.test(key);
};

export const validateProjectStatus = (status: string): status is ProjectStatus => {
  return Object.values(ProjectStatus).includes(status as ProjectStatus);
};

export const validateProjectPriority = (priority: string): priority is ProjectPriority => {
  return Object.values(ProjectPriority).includes(priority as ProjectPriority);
};

export const validateProjectMethodology = (methodology: string): methodology is ProjectMethodology => {
  return Object.values(ProjectMethodology).includes(methodology as ProjectMethodology);
};

export const validateProjectMemberRole = (role: string): role is ProjectMemberRole => {
  return Object.values(ProjectMemberRole).includes(role as ProjectMemberRole);
};

// Common validation patterns
export const PROJECT_VALIDATION_PATTERNS = {
  PROJECT_KEY: /^[A-Z0-9]{2,10}$/,
  COLOR_HEX: /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/,
  WORKFLOW_STATUS_ID: /^[a-z0-9-]+$/,
} as const;

// Project permission constants
export const PROJECT_PERMISSIONS = {
  PROJECT_READ: 'project:read',
  PROJECT_UPDATE: 'project:update',
  PROJECT_DELETE: 'project:delete',
  PROJECT_MANAGE_MEMBERS: 'project:manage_members',
  PROJECT_MANAGE_SETTINGS: 'project:manage_settings',
  
  TASK_CREATE: 'task:create',
  TASK_READ: 'task:read',
  TASK_UPDATE: 'task:update',
  TASK_DELETE: 'task:delete',
  TASK_ASSIGN: 'task:assign',
  TASK_COMMENT: 'task:comment',
  
  SPRINT_CREATE: 'sprint:create',
  SPRINT_READ: 'sprint:read',
  SPRINT_UPDATE: 'sprint:update',
  SPRINT_DELETE: 'sprint:delete',
  SPRINT_MANAGE: 'sprint:manage',
  
  REPORT_READ: 'report:read',
  REPORT_CREATE: 'report:create',
  REPORT_EXPORT: 'report:export',
} as const;

export type ProjectPermission = typeof PROJECT_PERMISSIONS[keyof typeof PROJECT_PERMISSIONS];
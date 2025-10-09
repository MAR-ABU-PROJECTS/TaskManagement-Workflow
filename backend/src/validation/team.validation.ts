import Joi from 'joi';

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

// Add team member schema
export const addTeamMemberSchema = Joi.object({
  userId: Joi.string()
    .uuid()
    .required()
    .messages({
      'string.uuid': 'User ID must be a valid UUID',
      'any.required': 'User ID is required',
    }),
  
  role: Joi.string()
    .min(1)
    .max(50)
    .required()
    .messages({
      'string.min': 'Role cannot be empty',
      'string.max': 'Role must not exceed 50 characters',
      'any.required': 'Role is required',
    }),
});

// Update team member schema
export const updateTeamMemberSchema = Joi.object({
  role: Joi.string()
    .min(1)
    .max(50)
    .optional()
    .messages({
      'string.min': 'Role cannot be empty',
      'string.max': 'Role must not exceed 50 characters',
    }),
  
  isActive: Joi.boolean()
    .optional(),
}).min(1).messages({
  'object.min': 'At least one field must be provided for update',
});

// Team search schema
export const teamSearchSchema = Joi.object({
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
  
  leaderId: Joi.string()
    .uuid()
    .optional()
    .messages({
      'string.uuid': 'Leader ID must be a valid UUID',
    }),
  
  isActive: Joi.string()
    .valid('true', 'false')
    .optional()
    .messages({
      'any.only': 'isActive must be "true" or "false"',
    }),
  
  memberUserId: Joi.string()
    .uuid()
    .optional()
    .messages({
      'string.uuid': 'Member user ID must be a valid UUID',
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
  
  includeProjects: Joi.string()
    .valid('true', 'false')
    .optional(),
});

// Team member role validation
export const validateTeamMemberRole = (role: string): boolean => {
  const validRoles = ['LEADER', 'SENIOR_MEMBER', 'MEMBER', 'JUNIOR_MEMBER'];
  return validRoles.includes(role);
};

// Team permission constants
export const TEAM_PERMISSIONS = {
  TEAM_READ: 'team:read',
  TEAM_UPDATE: 'team:update',
  TEAM_DELETE: 'team:delete',
  TEAM_MANAGE_MEMBERS: 'team:manage_members',
} as const;

export type TeamPermission = typeof TEAM_PERMISSIONS[keyof typeof TEAM_PERMISSIONS];
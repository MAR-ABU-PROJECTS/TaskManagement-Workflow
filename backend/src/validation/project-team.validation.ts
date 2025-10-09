import Joi from 'joi';
import { TeamRole } from '../types/team.types';

export const projectTeamValidation = {
  /**
   * Validation for adding a member to project team
   */
  addMember: {
    body: Joi.object({
      userId: Joi.string()
        .uuid()
        .required()
        .messages({
          'string.uuid': 'User ID must be a valid UUID',
          'any.required': 'User ID is required'
        }),
      
      role: Joi.string()
        .valid(...Object.values(TeamRole))
        .required()
        .messages({
          'any.only': `Role must be one of: ${Object.values(TeamRole).join(', ')}`,
          'any.required': 'Role is required'
        }),
      
      permissions: Joi.array()
        .items(Joi.string())
        .optional()
        .messages({
          'array.base': 'Permissions must be an array of strings'
        })
    }),
    
    params: Joi.object({
      projectId: Joi.string()
        .uuid()
        .required()
        .messages({
          'string.uuid': 'Project ID must be a valid UUID',
          'any.required': 'Project ID is required'
        })
    })
  },

  /**
   * Validation for updating member role
   */
  updateMemberRole: {
    body: Joi.object({
      role: Joi.string()
        .valid(...Object.values(TeamRole))
        .required()
        .messages({
          'any.only': `Role must be one of: ${Object.values(TeamRole).join(', ')}`,
          'any.required': 'Role is required'
        }),
      
      permissions: Joi.array()
        .items(Joi.string())
        .optional()
        .messages({
          'array.base': 'Permissions must be an array of strings'
        })
    }),
    
    params: Joi.object({
      projectId: Joi.string()
        .uuid()
        .required()
        .messages({
          'string.uuid': 'Project ID must be a valid UUID',
          'any.required': 'Project ID is required'
        }),
      
      userId: Joi.string()
        .uuid()
        .required()
        .messages({
          'string.uuid': 'User ID must be a valid UUID',
          'any.required': 'User ID is required'
        })
    })
  },

  /**
   * Validation for bulk adding members
   */
  bulkAddMembers: {
    body: Joi.object({
      members: Joi.array()
        .items(
          Joi.object({
            userId: Joi.string()
              .uuid()
              .required()
              .messages({
                'string.uuid': 'User ID must be a valid UUID',
                'any.required': 'User ID is required'
              }),
            
            role: Joi.string()
              .valid(...Object.values(TeamRole))
              .required()
              .messages({
                'any.only': `Role must be one of: ${Object.values(TeamRole).join(', ')}`,
                'any.required': 'Role is required'
              }),
            
            permissions: Joi.array()
              .items(Joi.string())
              .optional()
              .messages({
                'array.base': 'Permissions must be an array of strings'
              })
          })
        )
        .min(1)
        .max(50)
        .required()
        .messages({
          'array.min': 'At least one member is required',
          'array.max': 'Cannot add more than 50 members at once',
          'any.required': 'Members array is required'
        })
    }),
    
    params: Joi.object({
      projectId: Joi.string()
        .uuid()
        .required()
        .messages({
          'string.uuid': 'Project ID must be a valid UUID',
          'any.required': 'Project ID is required'
        })
    })
  },

  /**
   * Validation for transferring ownership
   */
  transferOwnership: {
    body: Joi.object({
      newOwnerId: Joi.string()
        .uuid()
        .required()
        .messages({
          'string.uuid': 'New owner ID must be a valid UUID',
          'any.required': 'New owner ID is required'
        })
    }),
    
    params: Joi.object({
      projectId: Joi.string()
        .uuid()
        .required()
        .messages({
          'string.uuid': 'Project ID must be a valid UUID',
          'any.required': 'Project ID is required'
        })
    })
  },

  /**
   * Validation for getting project members with filters
   */
  getMembers: {
    params: Joi.object({
      projectId: Joi.string()
        .uuid()
        .required()
        .messages({
          'string.uuid': 'Project ID must be a valid UUID',
          'any.required': 'Project ID is required'
        })
    }),
    
    query: Joi.object({
      role: Joi.string()
        .valid(...Object.values(TeamRole))
        .optional()
        .messages({
          'any.only': `Role must be one of: ${Object.values(TeamRole).join(', ')}`
        }),
      
      search: Joi.string()
        .min(2)
        .max(100)
        .optional()
        .messages({
          'string.min': 'Search term must be at least 2 characters',
          'string.max': 'Search term cannot exceed 100 characters'
        }),
      
      isActive: Joi.boolean()
        .optional()
        .messages({
          'boolean.base': 'isActive must be a boolean value'
        })
    })
  },

  /**
   * Validation for project and user ID parameters
   */
  projectUserParams: {
    params: Joi.object({
      projectId: Joi.string()
        .uuid()
        .required()
        .messages({
          'string.uuid': 'Project ID must be a valid UUID',
          'any.required': 'Project ID is required'
        }),
      
      userId: Joi.string()
        .uuid()
        .required()
        .messages({
          'string.uuid': 'User ID must be a valid UUID',
          'any.required': 'User ID is required'
        })
    })
  },

  /**
   * Validation for user memberships
   */
  userMemberships: {
    params: Joi.object({
      userId: Joi.string()
        .uuid()
        .required()
        .messages({
          'string.uuid': 'User ID must be a valid UUID',
          'any.required': 'User ID is required'
        })
    })
  }
};

/**
 * Available project permissions
 */
export const PROJECT_PERMISSIONS = [
  'VIEW_PROJECT',
  'EDIT_PROJECT',
  'MANAGE_PROJECT',
  'DELETE_PROJECT',
  'MANAGE_TEAM',
  'CREATE_TASKS',
  'EDIT_TASKS',
  'DELETE_TASKS',
  'ASSIGN_TASKS',
  'EDIT_ASSIGNED_TASKS',
  'LOG_TIME',
  'COMMENT_TASKS',
  'CREATE_BUGS',
  'MANAGE_SPRINTS',
  'VIEW_REPORTS',
  'MANAGE_WORKFLOWS',
  'MANAGE_PERMISSIONS'
] as const;

export type ProjectPermission = typeof PROJECT_PERMISSIONS[number];

/**
 * Default permissions by role
 */
export const DEFAULT_ROLE_PERMISSIONS: Record<TeamRole, ProjectPermission[]> = {
  [TeamRole.PROJECT_MANAGER]: [
    'VIEW_PROJECT',
    'EDIT_PROJECT',
    'MANAGE_PROJECT',
    'MANAGE_TEAM',
    'CREATE_TASKS',
    'EDIT_TASKS',
    'DELETE_TASKS',
    'ASSIGN_TASKS',
    'LOG_TIME',
    'COMMENT_TASKS',
    'CREATE_BUGS',
    'MANAGE_SPRINTS',
    'VIEW_REPORTS',
    'MANAGE_WORKFLOWS',
    'MANAGE_PERMISSIONS'
  ],
  [TeamRole.TEAM_LEAD]: [
    'VIEW_PROJECT',
    'CREATE_TASKS',
    'EDIT_TASKS',
    'ASSIGN_TASKS',
    'LOG_TIME',
    'COMMENT_TASKS',
    'CREATE_BUGS',
    'MANAGE_SPRINTS',
    'VIEW_REPORTS'
  ],
  [TeamRole.DEVELOPER]: [
    'VIEW_PROJECT',
    'CREATE_TASKS',
    'EDIT_ASSIGNED_TASKS',
    'LOG_TIME',
    'COMMENT_TASKS'
  ],
  [TeamRole.TESTER]: [
    'VIEW_PROJECT',
    'CREATE_BUGS',
    'EDIT_ASSIGNED_TASKS',
    'LOG_TIME',
    'COMMENT_TASKS'
  ],
  [TeamRole.VIEWER]: [
    'VIEW_PROJECT',
    'COMMENT_TASKS'
  ]
};
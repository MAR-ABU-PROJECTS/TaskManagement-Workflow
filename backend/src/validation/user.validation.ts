import Joi from 'joi';
import { UserRole } from '@prisma/client';

// User validation schemas
export const createUserSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required'
    }),
  
  password: Joi.string()
    .min(8)
    .max(128)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .required()
    .messages({
      'string.min': 'Password must be at least 8 characters long',
      'string.max': 'Password must not exceed 128 characters',
      'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
      'any.required': 'Password is required'
    }),
  
  firstName: Joi.string()
    .min(1)
    .max(100)
    .trim()
    .required()
    .messages({
      'string.min': 'First name cannot be empty',
      'string.max': 'First name must not exceed 100 characters',
      'any.required': 'First name is required'
    }),
  
  lastName: Joi.string()
    .min(1)
    .max(100)
    .trim()
    .required()
    .messages({
      'string.min': 'Last name cannot be empty',
      'string.max': 'Last name must not exceed 100 characters',
      'any.required': 'Last name is required'
    }),
  
  role: Joi.string()
    .valid(...Object.values(UserRole))
    .default(UserRole.DEVELOPER)
    .messages({
      'any.only': 'Role must be one of: ' + Object.values(UserRole).join(', ')
    }),
  
  isActive: Joi.boolean()
    .default(true),
  
  profilePicture: Joi.string()
    .uri()
    .messages({
      'string.uri': 'Profile picture must be a valid URL'
    }),
  
  phoneNumber: Joi.string()
    .pattern(/^\+?[1-9]\d{1,14}$/)
    .messages({
      'string.pattern.base': 'Please provide a valid phone number'
    }),
  
  timezone: Joi.string()
    .default('UTC'),
  
  language: Joi.string()
    .length(2)
    .default('en')
    .messages({
      'string.length': 'Language must be a 2-character code'
    }),
  
  jobTitle: Joi.string()
    .max(100)
    .messages({
      'string.max': 'Job title must not exceed 100 characters'
    }),
  
  department: Joi.string()
    .max(100)
    .messages({
      'string.max': 'Department must not exceed 100 characters'
    }),
  
  location: Joi.string()
    .max(100)
    .messages({
      'string.max': 'Location must not exceed 100 characters'
    }),
  
  bio: Joi.string()
    .max(500)
    .messages({
      'string.max': 'Bio must not exceed 500 characters'
    }),
  
  skills: Joi.array()
    .items(Joi.string().max(50))
    .max(20)
    .messages({
      'array.max': 'Maximum 20 skills allowed',
      'string.max': 'Each skill must not exceed 50 characters'
    }),
  
  socialLinks: Joi.object()
    .pattern(Joi.string(), Joi.string().uri())
    .messages({
      'string.uri': 'Social links must be valid URLs'
    }),
  
  preferences: Joi.object(),
  
  permissions: Joi.array()
    .items(Joi.object({
      resource: Joi.string().required(),
      actions: Joi.array().items(Joi.string()).required()
    }))
});

export const updateUserSchema = Joi.object({
  email: Joi.string()
    .email()
    .messages({
      'string.email': 'Please provide a valid email address'
    }),
  
  firstName: Joi.string()
    .min(1)
    .max(100)
    .trim()
    .messages({
      'string.min': 'First name cannot be empty',
      'string.max': 'First name must not exceed 100 characters'
    }),
  
  lastName: Joi.string()
    .min(1)
    .max(100)
    .trim()
    .messages({
      'string.min': 'Last name cannot be empty',
      'string.max': 'Last name must not exceed 100 characters'
    }),
  
  role: Joi.string()
    .valid(...Object.values(UserRole))
    .messages({
      'any.only': 'Role must be one of: ' + Object.values(UserRole).join(', ')
    }),
  
  isActive: Joi.boolean()
}).min(1).messages({
  'object.min': 'At least one field must be provided for update'
});

export const loginSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required'
    }),
  
  password: Joi.string()
    .required()
    .messages({
      'any.required': 'Password is required'
    })
});

export const changePasswordSchema = Joi.object({
  currentPassword: Joi.string()
    .required()
    .messages({
      'any.required': 'Current password is required'
    }),
  
  newPassword: Joi.string()
    .min(8)
    .max(128)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .required()
    .messages({
      'string.min': 'New password must be at least 8 characters long',
      'string.max': 'New password must not exceed 128 characters',
      'string.pattern.base': 'New password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
      'any.required': 'New password is required'
    })
});

export const resetPasswordRequestSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required'
    })
});

export const resetPasswordConfirmSchema = Joi.object({
  token: Joi.string()
    .required()
    .messages({
      'any.required': 'Reset token is required'
    }),
  
  newPassword: Joi.string()
    .min(8)
    .max(128)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .required()
    .messages({
      'string.min': 'Password must be at least 8 characters long',
      'string.max': 'Password must not exceed 128 characters',
      'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
      'any.required': 'Password is required'
    })
});

export const refreshTokenSchema = Joi.object({
  refreshToken: Joi.string()
    .required()
    .messages({
      'any.required': 'Refresh token is required'
    })
});

export const assignPermissionsSchema = Joi.object({
  userId: Joi.string()
    .required()
    .messages({
      'any.required': 'User ID is required'
    }),
  
  permissions: Joi.array()
    .items(
      Joi.object({
        resource: Joi.string()
          .required()
          .messages({
            'any.required': 'Permission resource is required'
          }),
        
        actions: Joi.array()
          .items(Joi.string())
          .min(1)
          .required()
          .messages({
            'array.min': 'At least one action must be specified',
            'any.required': 'Permission actions are required'
          })
      })
    )
    .min(1)
    .required()
    .messages({
      'array.min': 'At least one permission must be specified',
      'any.required': 'Permissions are required'
    })
});

export const userListQuerySchema = Joi.object({
  page: Joi.number()
    .integer()
    .min(1)
    .default(1)
    .messages({
      'number.integer': 'Page must be an integer',
      'number.min': 'Page must be at least 1'
    }),
  
  limit: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .default(20)
    .messages({
      'number.integer': 'Limit must be an integer',
      'number.min': 'Limit must be at least 1',
      'number.max': 'Limit must not exceed 100'
    }),
  
  sortBy: Joi.string()
    .valid('firstName', 'lastName', 'email', 'createdAt')
    .default('createdAt')
    .messages({
      'any.only': 'Sort by must be one of: firstName, lastName, email, createdAt'
    }),
  
  sortOrder: Joi.string()
    .valid('asc', 'desc')
    .default('desc')
    .messages({
      'any.only': 'Sort order must be either asc or desc'
    }),
  
  role: Joi.string()
    .valid(...Object.values(UserRole))
    .messages({
      'any.only': 'Role must be one of: ' + Object.values(UserRole).join(', ')
    }),
  
  isActive: Joi.boolean(),
  
  search: Joi.string()
    .min(1)
    .max(100)
    .trim()
    .messages({
      'string.min': 'Search term cannot be empty',
      'string.max': 'Search term must not exceed 100 characters'
    })
});

export const userIdParamSchema = Joi.object({
  id: Joi.string()
    .required()
    .messages({
      'any.required': 'User ID is required'
    })
});

// Update user profile schema (self-service)
export const updateUserProfileSchema = Joi.object({
  firstName: Joi.string()
    .min(1)
    .max(100)
    .trim()
    .messages({
      'string.min': 'First name cannot be empty',
      'string.max': 'First name must not exceed 100 characters'
    }),
  
  lastName: Joi.string()
    .min(1)
    .max(100)
    .trim()
    .messages({
      'string.min': 'Last name cannot be empty',
      'string.max': 'Last name must not exceed 100 characters'
    }),
  
  profilePicture: Joi.string()
    .uri()
    .allow('')
    .messages({
      'string.uri': 'Profile picture must be a valid URL'
    }),
  
  phoneNumber: Joi.string()
    .pattern(/^\+?[1-9]\d{1,14}$/)
    .allow('')
    .messages({
      'string.pattern.base': 'Please provide a valid phone number'
    }),
  
  timezone: Joi.string()
    .max(50),
  
  language: Joi.string()
    .length(2)
    .messages({
      'string.length': 'Language must be a 2-character code'
    }),
  
  bio: Joi.string()
    .max(500)
    .allow('')
    .messages({
      'string.max': 'Bio must not exceed 500 characters'
    }),
  
  skills: Joi.array()
    .items(Joi.string().max(50))
    .max(20)
    .messages({
      'array.max': 'Maximum 20 skills allowed',
      'string.max': 'Each skill must not exceed 50 characters'
    }),
  
  socialLinks: Joi.object()
    .pattern(Joi.string(), Joi.string().uri())
    .messages({
      'string.uri': 'Social links must be valid URLs'
    }),
  
  preferences: Joi.object()
}).min(1).messages({
  'object.min': 'At least one field must be provided for update'
});

// User search schema
export const userSearchSchema = Joi.object({
  page: Joi.number()
    .integer()
    .min(1)
    .default(1)
    .messages({
      'number.integer': 'Page must be an integer',
      'number.min': 'Page must be at least 1'
    }),
  
  limit: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .default(20)
    .messages({
      'number.integer': 'Limit must be an integer',
      'number.min': 'Limit must be at least 1',
      'number.max': 'Limit must not exceed 100'
    }),
  
  search: Joi.string()
    .max(100)
    .messages({
      'string.max': 'Search term must not exceed 100 characters'
    }),
  
  role: Joi.string()
    .valid(...Object.values(UserRole))
    .messages({
      'any.only': 'Role must be one of: ' + Object.values(UserRole).join(', ')
    }),
  
  isActive: Joi.string()
    .valid('true', 'false')
    .messages({
      'any.only': 'isActive must be "true" or "false"'
    }),
  
  department: Joi.string()
    .max(100)
    .messages({
      'string.max': 'Department must not exceed 100 characters'
    }),
  
  location: Joi.string()
    .max(100)
    .messages({
      'string.max': 'Location must not exceed 100 characters'
    }),
  
  skills: Joi.string(),
  
  createdAfter: Joi.date()
    .iso()
    .messages({
      'date.format': 'createdAfter must be a valid ISO date'
    }),
  
  createdBefore: Joi.date()
    .iso()
    .messages({
      'date.format': 'createdBefore must be a valid ISO date'
    }),
  
  sortBy: Joi.string()
    .valid('firstName', 'lastName', 'email', 'role', 'createdAt', 'updatedAt')
    .messages({
      'any.only': 'sortBy must be one of: firstName, lastName, email, role, createdAt, updatedAt'
    }),
  
  sortOrder: Joi.string()
    .valid('asc', 'desc')
    .default('asc')
    .messages({
      'any.only': 'sortOrder must be "asc" or "desc"'
    })
});

// Bulk user action schema
export const bulkUserActionSchema = Joi.object({
  userIds: Joi.array()
    .items(Joi.string().uuid())
    .min(1)
    .max(100)
    .required()
    .messages({
      'array.min': 'At least one user ID is required',
      'array.max': 'Maximum 100 user IDs allowed',
      'string.uuid': 'Each user ID must be a valid UUID',
      'any.required': 'User IDs are required'
    })
});
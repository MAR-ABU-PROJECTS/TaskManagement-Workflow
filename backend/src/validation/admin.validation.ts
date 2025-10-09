import Joi from 'joi';
import { UserRole } from '@prisma/client';

// User invite schema
export const userInviteSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required',
    }),
  
  role: Joi.string()
    .valid(...Object.values(UserRole))
    .optional()
    .default(UserRole.DEVELOPER)
    .messages({
      'any.only': `Role must be one of: ${Object.values(UserRole).join(', ')}`,
    }),
  
  message: Joi.string()
    .max(500)
    .optional()
    .messages({
      'string.max': 'Message must not exceed 500 characters',
    }),
  
  metadata: Joi.object()
    .optional(),
});

// Accept invitation schema
export const acceptInvitationSchema = Joi.object({
  token: Joi.string()
    .required()
    .messages({
      'any.required': 'Invitation token is required',
    }),
  
  firstName: Joi.string()
    .min(1)
    .max(100)
    .trim()
    .required()
    .messages({
      'string.min': 'First name cannot be empty',
      'string.max': 'First name must not exceed 100 characters',
      'any.required': 'First name is required',
    }),
  
  lastName: Joi.string()
    .min(1)
    .max(100)
    .trim()
    .required()
    .messages({
      'string.min': 'Last name cannot be empty',
      'string.max': 'Last name must not exceed 100 characters',
      'any.required': 'Last name is required',
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
      'any.required': 'Password is required',
    }),
});

// Bulk update users schema
export const bulkUpdateUsersSchema = Joi.object({
  updates: Joi.array()
    .items(
      Joi.object({
        userId: Joi.string()
          .uuid()
          .required()
          .messages({
            'string.uuid': 'User ID must be a valid UUID',
            'any.required': 'User ID is required',
          }),
        
        data: Joi.object({
          firstName: Joi.string().min(1).max(100).trim().optional(),
          lastName: Joi.string().min(1).max(100).trim().optional(),
          role: Joi.string().valid(...Object.values(UserRole)).optional(),
          isActive: Joi.boolean().optional(),
          jobTitle: Joi.string().max(100).optional(),
          department: Joi.string().max(100).optional(),
          location: Joi.string().max(100).optional(),
        })
          .min(1)
          .required()
          .messages({
            'object.min': 'At least one field must be provided for update',
            'any.required': 'Update data is required',
          }),
      })
    )
    .min(1)
    .max(100)
    .required()
    .messages({
      'array.min': 'At least one user update is required',
      'array.max': 'Maximum 100 user updates allowed',
      'any.required': 'Updates array is required',
    }),
});

// User export schema
export const userExportSchema = Joi.object({
  filters: Joi.object({
    roles: Joi.array()
      .items(Joi.string().valid(...Object.values(UserRole)))
      .optional(),
    
    isActive: Joi.boolean()
      .optional(),
    
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
    
    department: Joi.string()
      .max(100)
      .optional(),
    
    location: Joi.string()
      .max(100)
      .optional(),
  })
    .optional()
    .default({}),
  
  format: Joi.string()
    .valid('csv', 'json', 'xlsx')
    .optional()
    .default('csv')
    .messages({
      'any.only': 'Format must be one of: csv, json, xlsx',
    }),
  
  fields: Joi.array()
    .items(
      Joi.string().valid(
        'id', 'email', 'firstName', 'lastName', 'role', 'isActive',
        'createdAt', 'updatedAt', 'jobTitle', 'department', 'location'
      )
    )
    .optional()
    .messages({
      'any.only': 'Invalid field specified',
    }),
});

// User import schema
export const userImportSchema = Joi.object({
  data: Joi.array()
    .items(
      Joi.object({
        email: Joi.string().email().required(),
        firstName: Joi.string().min(1).max(100).required(),
        lastName: Joi.string().min(1).max(100).required(),
        password: Joi.string().min(8).max(128).optional(),
        role: Joi.string().valid(...Object.values(UserRole)).optional(),
        isActive: Joi.boolean().optional(),
        jobTitle: Joi.string().max(100).optional(),
        department: Joi.string().max(100).optional(),
        location: Joi.string().max(100).optional(),
      })
    )
    .min(1)
    .max(1000)
    .required()
    .messages({
      'array.min': 'At least one user is required',
      'array.max': 'Maximum 1000 users allowed per import',
      'any.required': 'User data is required',
    }),
  
  options: Joi.object({
    skipDuplicates: Joi.boolean()
      .optional()
      .default(false),
    
    updateExisting: Joi.boolean()
      .optional()
      .default(false),
    
    sendInvitations: Joi.boolean()
      .optional()
      .default(false),
  })
    .optional()
    .default({}),
});

// Audit log query schema
export const auditLogQuerySchema = Joi.object({
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
    .default(50)
    .messages({
      'number.integer': 'Limit must be an integer',
      'number.min': 'Limit must be at least 1',
      'number.max': 'Limit must not exceed 100',
    }),
  
  action: Joi.string()
    .max(100)
    .optional()
    .messages({
      'string.max': 'Action must not exceed 100 characters',
    }),
  
  userId: Joi.string()
    .uuid()
    .optional()
    .messages({
      'string.uuid': 'User ID must be a valid UUID',
    }),
  
  adminId: Joi.string()
    .uuid()
    .optional()
    .messages({
      'string.uuid': 'Admin ID must be a valid UUID',
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
});

// User analytics query schema
export const userAnalyticsQuerySchema = Joi.object({
  period: Joi.string()
    .valid('7d', '30d', '90d', '1y')
    .optional()
    .default('30d')
    .messages({
      'any.only': 'Period must be one of: 7d, 30d, 90d, 1y',
    }),
  
  groupBy: Joi.string()
    .valid('hour', 'day', 'week', 'month')
    .optional()
    .default('day')
    .messages({
      'any.only': 'Group by must be one of: hour, day, week, month',
    }),
  
  metrics: Joi.string()
    .pattern(/^[a-zA-Z,]+$/)
    .optional()
    .default('registrations,logins,activity')
    .messages({
      'string.pattern.base': 'Metrics must be comma-separated metric names',
    }),
  
  roles: Joi.array()
    .items(Joi.string().valid(...Object.values(UserRole)))
    .optional(),
  
  departments: Joi.array()
    .items(Joi.string().max(100))
    .optional(),
});

// Compliance report schema
export const complianceReportSchema = Joi.object({
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
  
  includeInactive: Joi.boolean()
    .optional()
    .default(false),
  
  roles: Joi.array()
    .items(Joi.string().valid(...Object.values(UserRole)))
    .optional(),
  
  format: Joi.string()
    .valid('json', 'pdf', 'csv')
    .optional()
    .default('json')
    .messages({
      'any.only': 'Format must be one of: json, pdf, csv',
    }),
  
  includeDetails: Joi.boolean()
    .optional()
    .default(true),
});

// Session management schema
export const sessionQuerySchema = Joi.object({
  userId: Joi.string()
    .uuid()
    .optional()
    .messages({
      'string.uuid': 'User ID must be a valid UUID',
    }),
  
  isActive: Joi.boolean()
    .optional(),
  
  ipAddress: Joi.string()
    .ip()
    .optional()
    .messages({
      'string.ip': 'IP address must be valid',
    }),
  
  startDate: Joi.date()
    .iso()
    .optional(),
  
  endDate: Joi.date()
    .iso()
    .optional(),
  
  page: Joi.number()
    .integer()
    .min(1)
    .optional()
    .default(1),
  
  limit: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .optional()
    .default(20),
});

// User activity query schema
export const userActivityQuerySchema = Joi.object({
  days: Joi.number()
    .integer()
    .min(1)
    .max(365)
    .optional()
    .default(30)
    .messages({
      'number.integer': 'Days must be an integer',
      'number.min': 'Days must be at least 1',
      'number.max': 'Days must not exceed 365',
    }),
  
  includeDetails: Joi.boolean()
    .optional()
    .default(true),
});

// Common admin action validation
export const adminActionSchema = Joi.object({
  reason: Joi.string()
    .max(500)
    .optional()
    .messages({
      'string.max': 'Reason must not exceed 500 characters',
    }),
  
  notifyUser: Joi.boolean()
    .optional()
    .default(false),
  
  metadata: Joi.object()
    .optional(),
});

// Validation helper functions
export const validateUserRole = (role: string): role is UserRole => {
  return Object.values(UserRole).includes(role as UserRole);
};

export const validateDateRange = (startDate?: Date, endDate?: Date): boolean => {
  if (!startDate || !endDate) return true;
  return startDate <= endDate;
};

export const validateExportFormat = (format: string): format is 'csv' | 'json' | 'xlsx' => {
  return ['csv', 'json', 'xlsx'].includes(format);
};

// Common validation patterns
export const VALIDATION_PATTERNS = {
  UUID: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE: /^\+?[1-9]\d{1,14}$/,
  PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
} as const;

// Admin permission constants
export const ADMIN_PERMISSIONS = {
  USER_MANAGEMENT: 'users:manage',
  USER_INVITE: 'users:invite',
  USER_EXPORT: 'users:export',
  USER_IMPORT: 'users:import',
  AUDIT_VIEW: 'audit:read',
  ANALYTICS_VIEW: 'analytics:read',
  COMPLIANCE_REPORT: 'compliance:generate',
  SESSION_MANAGEMENT: 'sessions:manage',
} as const;

export type AdminPermission = typeof ADMIN_PERMISSIONS[keyof typeof ADMIN_PERMISSIONS];
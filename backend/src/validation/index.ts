// Export all validation schemas
export * from './user.validation';
export * from './project.validation';

// Common validation utilities
import Joi from 'joi';

// Common parameter validation
export const idParamSchema = Joi.object({
  id: Joi.string()
    .required()
    .messages({
      'any.required': 'ID is required'
    })
});

// Common query validation
export const paginationQuerySchema = Joi.object({
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
  
  sortOrder: Joi.string()
    .valid('asc', 'desc')
    .default('desc')
    .messages({
      'any.only': 'Sort order must be either asc or desc'
    })
});

// Validation middleware factory
export const validate = (schema: Joi.ObjectSchema, property: 'body' | 'query' | 'params' = 'body') => {
  return (req: any, res: any, next: any) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false,
      allowUnknown: false,
      stripUnknown: true
    });

    if (error) {
      const validationErrors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        code: detail.type,
        value: detail.context?.value
      }));

      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationErrors
      });
    }

    // Replace the original property with the validated and sanitized value
    req[property] = value;
    next();
  };
};

// Custom validation rules
export const customValidators = {
  // Validate CUID format
  cuid: Joi.string().pattern(/^c[a-z0-9]{24}$/).messages({
    'string.pattern.base': 'Invalid ID format'
  }),
  
  // Validate hex color
  hexColor: Joi.string().pattern(/^#[0-9A-Fa-f]{6}$/).messages({
    'string.pattern.base': 'Color must be a valid hex color code (e.g., #FF0000)'
  }),
  
  // Validate project key format
  projectKey: Joi.string().pattern(/^[A-Z][A-Z0-9]*$/).messages({
    'string.pattern.base': 'Project key must start with a letter and contain only uppercase letters and numbers'
  }),
  
  // Validate strong password
  strongPassword: Joi.string()
    .min(8)
    .max(128)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .messages({
      'string.min': 'Password must be at least 8 characters long',
      'string.max': 'Password must not exceed 128 characters',
      'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
    }),
  
  // Validate email
  email: Joi.string().email().messages({
    'string.email': 'Please provide a valid email address'
  }),
  
  // Validate positive decimal
  positiveDecimal: Joi.number().positive().precision(2).messages({
    'number.positive': 'Value must be a positive number',
    'number.precision': 'Value must have at most 2 decimal places'
  }),
  
  // Validate date range
  dateRange: (startField: string, endField: string) => 
    Joi.object().keys({
      [startField]: Joi.date().iso(),
      [endField]: Joi.date().iso().greater(Joi.ref(startField))
    }).messages({
      'date.greater': `${endField} must be after ${startField}`
    })
};
import { Request, Response, NextFunction } from 'express';
import { logger } from '@/utils/logger';
import { PrismaClientKnownRequestError, PrismaClientValidationError } from '@prisma/client/runtime/library';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
  code?: string;
}

export class CustomError extends Error implements AppError {
  public statusCode: number;
  public isOperational: boolean;
  public code?: string;

  constructor(message: string, statusCode: number = 500, isOperational: boolean = true, code?: string) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.code = code;
    
    Error.captureStackTrace(this, this.constructor);
  }
}

// Specific error classes
export class ValidationError extends CustomError {
  constructor(message: string, details?: any) {
    super(message, 400, true, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends CustomError {
  constructor(message: string = 'Authentication failed') {
    super(message, 401, true, 'AUTHENTICATION_ERROR');
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends CustomError {
  constructor(message: string = 'Access denied') {
    super(message, 403, true, 'AUTHORIZATION_ERROR');
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends CustomError {
  constructor(message: string = 'Resource not found') {
    super(message, 404, true, 'NOT_FOUND_ERROR');
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends CustomError {
  constructor(message: string = 'Resource conflict') {
    super(message, 409, true, 'CONFLICT_ERROR');
    this.name = 'ConflictError';
  }
}

export class RateLimitError extends CustomError {
  constructor(message: string = 'Too many requests') {
    super(message, 429, true, 'RATE_LIMIT_ERROR');
    this.name = 'RateLimitError';
  }
}

// Error response interface
interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: any;
    timestamp: string;
    requestId: string;
  };
}

// Generate unique request ID
function generateRequestId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

// Handle Prisma errors
function handlePrismaError(error: any): CustomError {
  if (error instanceof PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002':
        return new ConflictError('A record with this information already exists');
      case 'P2025':
        return new NotFoundError('Record not found');
      case 'P2003':
        return new ValidationError('Foreign key constraint failed');
      case 'P2014':
        return new ValidationError('Invalid ID provided');
      default:
        return new CustomError('Database operation failed', 500, true, error.code);
    }
  }
  
  if (error instanceof PrismaClientValidationError) {
    return new ValidationError('Invalid data provided');
  }
  
  return new CustomError('Database error occurred', 500, false);
}

// Handle JWT errors
function handleJWTError(error: any): CustomError {
  if (error.name === 'JsonWebTokenError') {
    return new AuthenticationError('Invalid token');
  }
  
  if (error.name === 'TokenExpiredError') {
    return new AuthenticationError('Token expired');
  }
  
  if (error.name === 'NotBeforeError') {
    return new AuthenticationError('Token not active');
  }
  
  return new AuthenticationError('Token validation failed');
}

// Main error handler middleware
export const errorHandler = (
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const requestId = generateRequestId();
  let customError: CustomError;

  // Handle different types of errors
  if (error instanceof CustomError) {
    customError = error;
  } else if (error.name?.includes('Prisma')) {
    customError = handlePrismaError(error);
  } else if (error.name?.includes('JsonWebToken') || error.name?.includes('Token')) {
    customError = handleJWTError(error);
  } else if (error.name === 'ValidationError') {
    customError = new ValidationError(error.message, error.details);
  } else if (error.name === 'CastError') {
    customError = new ValidationError('Invalid ID format');
  } else if (error.code === 11000) {
    customError = new ConflictError('Duplicate field value');
  } else {
    customError = new CustomError(
      process.env.NODE_ENV === 'production' ? 'Something went wrong' : error.message,
      error.statusCode || 500,
      false
    );
  }

  // Log error
  const logData = {
    requestId,
    method: req.method,
    url: req.url,
    userAgent: req.get('User-Agent'),
    ip: req.ip || req.connection.remoteAddress,
    userId: (req as any).user?.id || 'anonymous',
    statusCode: customError.statusCode,
    isOperational: customError.isOperational,
  };

  if (customError.statusCode >= 500) {
    logger.error(`${customError.name}: ${customError.message}`, {
      ...logData,
      stack: customError.stack,
    });
  } else {
    logger.warn(`${customError.name}: ${customError.message}`, logData);
  }

  // Prepare error response
  const errorResponse: ErrorResponse = {
    error: {
      code: customError.code || 'INTERNAL_SERVER_ERROR',
      message: customError.message,
      timestamp: new Date().toISOString(),
      requestId,
    },
  };

  // Add stack trace in development
  if (process.env.NODE_ENV === 'development' && customError.stack) {
    (errorResponse.error as any).stack = customError.stack;
  }

  // Send error response
  res.status(customError.statusCode).json(errorResponse);
};

// Async error wrapper
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export default errorHandler;
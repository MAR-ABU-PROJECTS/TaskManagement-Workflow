import { Request, Response, NextFunction } from 'express';
import { AuthService } from '@/services/AuthService';
import { UserModel } from '@/models/UserModel';
import { prisma } from '@/config/database';
import { AuthenticationError, AuthorizationError } from '@/middleware/errorHandler';
import { UserRole } from '@prisma/client';
import { IUser } from '@/types/user.types';

// Extend Express Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: IUser;
    }
  }
}

// Initialize auth service
const userModel = new UserModel(prisma);
const authService = new AuthService(userModel);

/**
 * Middleware to authenticate JWT tokens
 */
export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AuthenticationError('Access token is required');
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    if (!token) {
      throw new AuthenticationError('Access token is required');
    }

    // Validate token and get user
    const user = await authService.validateAccessToken(token);
    
    // Attach user to request
    req.user = user;
    
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware to check if user has required role
 */
export const requireRole = (roles: UserRole | UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AuthenticationError('Authentication required');
      }

      const userRole = req.user.role;
      const requiredRoles = Array.isArray(roles) ? roles : [roles];

      if (!requiredRoles.includes(userRole)) {
        throw new AuthorizationError(`Access denied. Required role: ${requiredRoles.join(' or ')}`);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Middleware to check if user has admin role
 */
export const requireAdmin = requireRole(UserRole.ADMIN);

/**
 * Middleware to check if user has manager role or higher
 */
export const requireManager = requireRole([UserRole.ADMIN, UserRole.PROJECT_MANAGER]);

/**
 * Middleware to check if user has team lead role or higher
 */
export const requireTeamLead = requireRole([UserRole.ADMIN, UserRole.PROJECT_MANAGER, UserRole.TEAM_LEAD]);

/**
 * Middleware to check if user has permission for a specific resource and action
 */
export const requirePermission = (
  resource: string, 
  action: string,
  contextExtractor?: (req: Request) => { [key: string]: string }
) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new AuthenticationError('Authentication required');
      }

      // Import PermissionService dynamically to avoid circular dependency
      const { PermissionService } = await import('@/services/PermissionService');
      const permissionService = new PermissionService(prisma);

      // Extract context if provided
      const context = contextExtractor ? contextExtractor(req) : {};

      // Check permission
      const hasPermission = await permissionService.hasPermission(req.user.id, {
        resource,
        action,
        context,
      });

      if (!hasPermission) {
        throw new AuthorizationError(
          `Access denied. Required permission: ${resource}:${action}`
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Middleware to check if user owns the resource or has admin role
 */
export const requireOwnershipOrAdmin = (getResourceOwnerId: (req: Request) => string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AuthenticationError('Authentication required');
      }

      // Admin users can access any resource
      if (req.user.role === UserRole.ADMIN) {
        return next();
      }

      const resourceOwnerId = getResourceOwnerId(req);
      
      if (req.user.id !== resourceOwnerId) {
        throw new AuthorizationError('Access denied. You can only access your own resources');
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Middleware to check if user is active
 */
export const requireActiveUser = (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new AuthenticationError('Authentication required');
    }

    if (!req.user.isActive) {
      throw new AuthorizationError('Account is deactivated');
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Optional authentication middleware - doesn't throw error if no token
 */
export const optionalAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      
      if (token) {
        try {
          const user = await authService.validateAccessToken(token);
          req.user = user;
        } catch (error) {
          // Ignore token validation errors for optional auth
        }
      }
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware to validate API key for external integrations
 */
export const validateApiKey = (req: Request, res: Response, next: NextFunction) => {
  try {
    const apiKey = req.headers['x-api-key'] as string;
    
    if (!apiKey) {
      throw new AuthenticationError('API key is required');
    }

    // TODO: Implement API key validation logic
    // For now, we'll just check if it matches a configured value
    const validApiKey = process.env.API_KEY;
    
    if (!validApiKey || apiKey !== validApiKey) {
      throw new AuthenticationError('Invalid API key');
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Rate limiting middleware for authentication endpoints
 */
export const authRateLimit = (req: Request, res: Response, next: NextFunction) => {
  // This would typically use express-rate-limit or similar
  // For now, we'll just pass through
  next();
};

/**
 * Middleware to check project membership
 */
export const requireProjectMembership = (projectIdParam: string = 'projectId') => {
  return requirePermission('projects', 'read', (req) => ({
    projectId: req.params[projectIdParam],
  }));
};

/**
 * Middleware to check team membership
 */
export const requireTeamMembership = (teamIdParam: string = 'teamId') => {
  return requirePermission('teams', 'read', (req) => ({
    teamId: req.params[teamIdParam],
  }));
};

/**
 * Middleware to check task access (ownership or project membership)
 */
export const requireTaskAccess = (taskIdParam: string = 'taskId') => {
  return requirePermission('tasks', 'read', (req) => ({
    taskId: req.params[taskIdParam],
  }));
};

/**
 * Middleware to check resource ownership
 */
export const requireResourceOwnership = (resourceOwnerIdExtractor: (req: Request) => string) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new AuthenticationError('Authentication required');
      }

      // Admin users can access any resource
      if (req.user.role === UserRole.ADMIN) {
        return next();
      }

      const resourceOwnerId = resourceOwnerIdExtractor(req);
      
      if (req.user.id !== resourceOwnerId) {
        throw new AuthorizationError('Access denied. You can only access your own resources');
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

export { authService };
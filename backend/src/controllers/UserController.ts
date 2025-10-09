import { Request, Response } from 'express';
import { UserService } from '@/services/UserService';
import { prisma } from '@/config/database';
import { asyncHandler } from '@/middleware/errorHandler';
import { validate } from '@/validation';
import {
  createUserSchema,
  updateUserSchema,
  updateUserProfileSchema,
  changePasswordSchema,
  userSearchSchema,
  bulkUserActionSchema,
} from '@/validation/user.validation';
import { logger } from '@/utils/logger';
import { ApiResponse } from '@/types/common.types';
import { UserRole } from '@prisma/client';

export class UserController {
  private userService: UserService;

  constructor() {
    this.userService = new UserService(prisma);
  }

  /**
   * Create a new user
   * POST /api/users
   */
  createUser = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const user = await this.userService.createUser(req.body, req.user?.id);
    
    const response: ApiResponse = {
      success: true,
      data: user,
      message: 'User created successfully',
      meta: {
        timestamp: new Date().toISOString(),
        requestId: res.locals.requestId || 'unknown',
        version: process.env.API_VERSION || 'v1',
      },
    };

    res.status(201).json(response);
  });

  /**
   * Get user by ID
   * GET /api/users/:id
   */
  getUserById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const { includePermissions, includeProjects, includeTeams } = req.query;

    const options = {
      includePermissions: includePermissions === 'true',
      includeProjects: includeProjects === 'true',
      includeTeams: includeTeams === 'true',
    };

    const user = await this.userService.getUserById(id, options);
    
    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found',
      });
      return;
    }

    const response: ApiResponse = {
      success: true,
      data: user,
      message: 'User retrieved successfully',
      meta: {
        timestamp: new Date().toISOString(),
        requestId: res.locals.requestId || 'unknown',
        version: process.env.API_VERSION || 'v1',
      },
    };

    res.status(200).json(response);
  });

  /**
   * Get current user profile
   * GET /api/users/me
   */
  getCurrentUser = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!req.user?.id) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
      return;
    }

    const user = await this.userService.getUserById(req.user.id, {
      includePermissions: true,
      includeProjects: true,
      includeTeams: true,
    });

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found',
      });
      return;
    }

    const response: ApiResponse = {
      success: true,
      data: user,
      message: 'Current user retrieved successfully',
      meta: {
        timestamp: new Date().toISOString(),
        requestId: res.locals.requestId || 'unknown',
        version: process.env.API_VERSION || 'v1',
      },
    };

    res.status(200).json(response);
  });

  /**
   * Update user
   * PUT /api/users/:id
   */
  updateUser = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    
    const user = await this.userService.updateUser(id, req.body, req.user?.id);
    
    const response: ApiResponse = {
      success: true,
      data: user,
      message: 'User updated successfully',
      meta: {
        timestamp: new Date().toISOString(),
        requestId: res.locals.requestId || 'unknown',
        version: process.env.API_VERSION || 'v1',
      },
    };

    res.status(200).json(response);
  });

  /**
   * Update user profile (self-service)
   * PUT /api/users/me/profile
   */
  updateUserProfile = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!req.user?.id) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
      return;
    }

    const user = await this.userService.updateUserProfile(req.user.id, req.body);
    
    const response: ApiResponse = {
      success: true,
      data: user,
      message: 'Profile updated successfully',
      meta: {
        timestamp: new Date().toISOString(),
        requestId: res.locals.requestId || 'unknown',
        version: process.env.API_VERSION || 'v1',
      },
    };

    res.status(200).json(response);
  });

  /**
   * Deactivate user
   * POST /api/users/:id/deactivate
   */
  deactivateUser = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    
    await this.userService.deactivateUser(id, req.user?.id);
    
    const response: ApiResponse = {
      success: true,
      message: 'User deactivated successfully',
      meta: {
        timestamp: new Date().toISOString(),
        requestId: res.locals.requestId || 'unknown',
        version: process.env.API_VERSION || 'v1',
      },
    };

    res.status(200).json(response);
  });

  /**
   * Reactivate user
   * POST /api/users/:id/reactivate
   */
  reactivateUser = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    
    await this.userService.reactivateUser(id, req.user?.id);
    
    const response: ApiResponse = {
      success: true,
      message: 'User reactivated successfully',
      meta: {
        timestamp: new Date().toISOString(),
        requestId: res.locals.requestId || 'unknown',
        version: process.env.API_VERSION || 'v1',
      },
    };

    res.status(200).json(response);
  });

  /**
   * Delete user (hard delete)
   * DELETE /api/users/:id
   */
  deleteUser = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    
    await this.userService.deleteUser(id, req.user?.id);
    
    const response: ApiResponse = {
      success: true,
      message: 'User deleted successfully',
      meta: {
        timestamp: new Date().toISOString(),
        requestId: res.locals.requestId || 'unknown',
        version: process.env.API_VERSION || 'v1',
      },
    };

    res.status(200).json(response);
  });

  /**
   * Search users with filters and pagination
   * GET /api/users
   */
  searchUsers = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const {
      page = '1',
      limit = '20',
      search,
      role,
      isActive,
      department,
      location,
      skills,
      createdAfter,
      createdBefore,
      sortBy,
      sortOrder,
    } = req.query;

    const filters = {
      search: search as string,
      role: role as UserRole,
      isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
      department: department as string,
      location: location as string,
      skills: skills ? (skills as string).split(',') : undefined,
      createdAfter: createdAfter ? new Date(createdAfter as string) : undefined,
      createdBefore: createdBefore ? new Date(createdBefore as string) : undefined,
      sortBy: sortBy as string,
      sortOrder: sortOrder as 'asc' | 'desc',
    };

    const result = await this.userService.searchUsers(
      filters,
      parseInt(page as string),
      parseInt(limit as string)
    );
    
    const response: ApiResponse = {
      success: true,
      data: result,
      message: 'Users retrieved successfully',
      meta: {
        timestamp: new Date().toISOString(),
        requestId: res.locals.requestId || 'unknown',
        version: process.env.API_VERSION || 'v1',
      },
    };

    res.status(200).json(response);
  });

  /**
   * Get user statistics
   * GET /api/users/stats
   */
  getUserStats = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const stats = await this.userService.getUserStats();
    
    const response: ApiResponse = {
      success: true,
      data: stats,
      message: 'User statistics retrieved successfully',
      meta: {
        timestamp: new Date().toISOString(),
        requestId: res.locals.requestId || 'unknown',
        version: process.env.API_VERSION || 'v1',
      },
    };

    res.status(200).json(response);
  });

  /**
   * Change user password
   * POST /api/users/:id/change-password
   */
  changeUserPassword = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    
    await this.userService.changeUserPassword(id, req.body, req.user?.id);
    
    const response: ApiResponse = {
      success: true,
      message: 'Password changed successfully',
      meta: {
        timestamp: new Date().toISOString(),
        requestId: res.locals.requestId || 'unknown',
        version: process.env.API_VERSION || 'v1',
      },
    };

    res.status(200).json(response);
  });

  /**
   * Change own password
   * POST /api/users/me/change-password
   */
  changeOwnPassword = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!req.user?.id) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
      return;
    }

    await this.userService.changeUserPassword(req.user.id, req.body, req.user.id);
    
    const response: ApiResponse = {
      success: true,
      message: 'Password changed successfully',
      meta: {
        timestamp: new Date().toISOString(),
        requestId: res.locals.requestId || 'unknown',
        version: process.env.API_VERSION || 'v1',
      },
    };

    res.status(200).json(response);
  });

  /**
   * Bulk deactivate users
   * POST /api/users/bulk/deactivate
   */
  bulkDeactivateUsers = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { userIds } = req.body;
    
    await this.userService.bulkDeactivateUsers(userIds, req.user?.id);
    
    const response: ApiResponse = {
      success: true,
      message: `${userIds.length} users deactivated successfully`,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: res.locals.requestId || 'unknown',
        version: process.env.API_VERSION || 'v1',
      },
    };

    res.status(200).json(response);
  });

  /**
   * Bulk reactivate users
   * POST /api/users/bulk/reactivate
   */
  bulkReactivateUsers = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { userIds } = req.body;
    
    await this.userService.bulkReactivateUsers(userIds, req.user?.id);
    
    const response: ApiResponse = {
      success: true,
      message: `${userIds.length} users reactivated successfully`,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: res.locals.requestId || 'unknown',
        version: process.env.API_VERSION || 'v1',
      },
    };

    res.status(200).json(response);
  });

  /**
   * Get user by email (admin only)
   * GET /api/users/email/:email
   */
  getUserByEmail = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { email } = req.params;
    
    const user = await this.userService.getUserByEmail(email);
    
    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found',
      });
      return;
    }

    const response: ApiResponse = {
      success: true,
      data: user,
      message: 'User retrieved successfully',
      meta: {
        timestamp: new Date().toISOString(),
        requestId: res.locals.requestId || 'unknown',
        version: process.env.API_VERSION || 'v1',
      },
    };

    res.status(200).json(response);
  });
}

// Create controller instance
const userController = new UserController();

export { userController };

// Export route handlers with validation
export const userRoutes = {
  createUser: [
    validate(createUserSchema, 'body'),
    userController.createUser,
  ],
  getUserById: [
    userController.getUserById,
  ],
  getCurrentUser: [
    userController.getCurrentUser,
  ],
  updateUser: [
    validate(updateUserSchema, 'body'),
    userController.updateUser,
  ],
  updateUserProfile: [
    validate(updateUserProfileSchema, 'body'),
    userController.updateUserProfile,
  ],
  deactivateUser: [
    userController.deactivateUser,
  ],
  reactivateUser: [
    userController.reactivateUser,
  ],
  deleteUser: [
    userController.deleteUser,
  ],
  searchUsers: [
    validate(userSearchSchema, 'query'),
    userController.searchUsers,
  ],
  getUserStats: [
    userController.getUserStats,
  ],
  changeUserPassword: [
    validate(changePasswordSchema, 'body'),
    userController.changeUserPassword,
  ],
  changeOwnPassword: [
    validate(changePasswordSchema, 'body'),
    userController.changeOwnPassword,
  ],
  bulkDeactivateUsers: [
    validate(bulkUserActionSchema, 'body'),
    userController.bulkDeactivateUsers,
  ],
  bulkReactivateUsers: [
    validate(bulkUserActionSchema, 'body'),
    userController.bulkReactivateUsers,
  ],
  getUserByEmail: [
    userController.getUserByEmail,
  ],
};
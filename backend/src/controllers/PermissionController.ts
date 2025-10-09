import { Request, Response } from 'express';
import { PermissionService } from '@/services/PermissionService';
import { UserModel } from '@/models/UserModel';
import { prisma } from '@/config/database';
import { asyncHandler } from '@/middleware/errorHandler';
import { validate } from '@/validation';
import { 
  grantPermissionSchema,
  revokePermissionSchema,
  changeRoleSchema,
  bulkPermissionSchema,
} from '@/validation/permission.validation';
import { logger } from '@/utils/logger';
import { ApiResponse } from '@/types/common.types';
import { UserRole } from '@prisma/client';

export class PermissionController {
  private permissionService: PermissionService;

  constructor() {
    this.permissionService = new PermissionService(prisma);
  }

  /**
   * Get user permissions
   * GET /api/permissions/users/:userId
   */
  getUserPermissions = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { userId } = req.params;
    
    const permissions = await this.permissionService.getUserPermissions(userId);
    
    const response: ApiResponse = {
      success: true,
      data: permissions,
      message: 'User permissions retrieved successfully',
      meta: {
        timestamp: new Date().toISOString(),
        requestId: res.locals.requestId || 'unknown',
        version: process.env.API_VERSION || 'v1',
      },
    };

    res.status(200).json(response);
  });

  /**
   * Check if user has specific permission
   * POST /api/permissions/check
   */
  checkPermission = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { userId, resource, action, context } = req.body;
    
    const hasPermission = await this.permissionService.hasPermission(userId, {
      resource,
      action,
      context,
    });
    
    const response: ApiResponse = {
      success: true,
      data: { hasPermission },
      message: 'Permission check completed',
      meta: {
        timestamp: new Date().toISOString(),
        requestId: res.locals.requestId || 'unknown',
        version: process.env.API_VERSION || 'v1',
      },
    };

    res.status(200).json(response);
  });

  /**
   * Grant permission to user
   * POST /api/permissions/grant
   */
  grantPermission = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { userId, resource, actions } = req.body;
    
    await this.permissionService.grantPermission(userId, resource, actions);
    
    const response: ApiResponse = {
      success: true,
      message: 'Permission granted successfully',
      meta: {
        timestamp: new Date().toISOString(),
        requestId: res.locals.requestId || 'unknown',
        version: process.env.API_VERSION || 'v1',
      },
    };

    res.status(200).json(response);
  });

  /**
   * Revoke permission from user
   * POST /api/permissions/revoke
   */
  revokePermission = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { userId, resource, actions } = req.body;
    
    await this.permissionService.revokePermission(userId, resource, actions);
    
    const response: ApiResponse = {
      success: true,
      message: 'Permission revoked successfully',
      meta: {
        timestamp: new Date().toISOString(),
        requestId: res.locals.requestId || 'unknown',
        version: process.env.API_VERSION || 'v1',
      },
    };

    res.status(200).json(response);
  });

  /**
   * Change user role
   * PUT /api/permissions/users/:userId/role
   */
  changeUserRole = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { userId } = req.params;
    const { role } = req.body;
    
    await this.permissionService.changeUserRole(userId, role as UserRole);
    
    const response: ApiResponse = {
      success: true,
      message: 'User role changed successfully',
      meta: {
        timestamp: new Date().toISOString(),
        requestId: res.locals.requestId || 'unknown',
        version: process.env.API_VERSION || 'v1',
      },
    };

    res.status(200).json(response);
  });

  /**
   * Get role permissions
   * GET /api/permissions/roles/:role
   */
  getRolePermissions = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { role } = req.params;
    
    const permissions = this.permissionService.getRolePermissions(role as UserRole);
    
    const response: ApiResponse = {
      success: true,
      data: { role, permissions },
      message: 'Role permissions retrieved successfully',
      meta: {
        timestamp: new Date().toISOString(),
        requestId: res.locals.requestId || 'unknown',
        version: process.env.API_VERSION || 'v1',
      },
    };

    res.status(200).json(response);
  });

  /**
   * Get all available roles
   * GET /api/permissions/roles
   */
  getAllRoles = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const roles = Object.values(UserRole).map(role => ({
      role,
      permissions: this.permissionService.getRolePermissions(role),
    }));
    
    const response: ApiResponse = {
      success: true,
      data: roles,
      message: 'All roles retrieved successfully',
      meta: {
        timestamp: new Date().toISOString(),
        requestId: res.locals.requestId || 'unknown',
        version: process.env.API_VERSION || 'v1',
      },
    };

    res.status(200).json(response);
  });

  /**
   * Bulk grant permissions
   * POST /api/permissions/bulk-grant
   */
  bulkGrantPermissions = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { userIds, resource, actions } = req.body;
    
    await this.permissionService.bulkGrantPermissions(userIds, resource, actions);
    
    const response: ApiResponse = {
      success: true,
      message: `Permissions granted to ${userIds.length} users successfully`,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: res.locals.requestId || 'unknown',
        version: process.env.API_VERSION || 'v1',
      },
    };

    res.status(200).json(response);
  });

  /**
   * Get users with specific permission
   * GET /api/permissions/users-with-permission
   */
  getUsersWithPermission = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { resource, action } = req.query;
    
    if (!resource || !action) {
      res.status(400).json({
        success: false,
        message: 'Resource and action parameters are required',
      });
      return;
    }
    
    const userIds = await this.permissionService.getUsersWithPermission(
      resource as string, 
      action as string
    );
    
    const response: ApiResponse = {
      success: true,
      data: { userIds, count: userIds.length },
      message: 'Users with permission retrieved successfully',
      meta: {
        timestamp: new Date().toISOString(),
        requestId: res.locals.requestId || 'unknown',
        version: process.env.API_VERSION || 'v1',
      },
    };

    res.status(200).json(response);
  });

  /**
   * Get current user's permissions
   * GET /api/permissions/me
   */
  getMyPermissions = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!req.user?.id) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
      return;
    }
    
    const permissions = await this.permissionService.getUserPermissions(req.user.id);
    
    const response: ApiResponse = {
      success: true,
      data: permissions,
      message: 'Your permissions retrieved successfully',
      meta: {
        timestamp: new Date().toISOString(),
        requestId: res.locals.requestId || 'unknown',
        version: process.env.API_VERSION || 'v1',
      },
    };

    res.status(200).json(response);
  });

  /**
   * Get permission matrix for all roles
   * GET /api/permissions/matrix
   */
  getPermissionMatrix = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const matrix = Object.values(UserRole).reduce((acc, role) => {
      acc[role] = this.permissionService.getRolePermissions(role);
      return acc;
    }, {} as Record<UserRole, string[]>);
    
    const response: ApiResponse = {
      success: true,
      data: matrix,
      message: 'Permission matrix retrieved successfully',
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
const permissionController = new PermissionController();

export { permissionController };

// Export route handlers with validation
export const permissionRoutes = {
  getUserPermissions: [
    permissionController.getUserPermissions,
  ],
  checkPermission: [
    permissionController.checkPermission,
  ],
  grantPermission: [
    validate(grantPermissionSchema, 'body'),
    permissionController.grantPermission,
  ],
  revokePermission: [
    validate(revokePermissionSchema, 'body'),
    permissionController.revokePermission,
  ],
  changeUserRole: [
    validate(changeRoleSchema, 'body'),
    permissionController.changeUserRole,
  ],
  getRolePermissions: [
    permissionController.getRolePermissions,
  ],
  getAllRoles: [
    permissionController.getAllRoles,
  ],
  bulkGrantPermissions: [
    validate(bulkPermissionSchema, 'body'),
    permissionController.bulkGrantPermissions,
  ],
  getUsersWithPermission: [
    permissionController.getUsersWithPermission,
  ],
  getMyPermissions: [
    permissionController.getMyPermissions,
  ],
  getPermissionMatrix: [
    permissionController.getPermissionMatrix,
  ],
};
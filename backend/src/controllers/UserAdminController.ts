import { Request, Response } from 'express';
import { UserAdminService } from '@/services/UserAdminService';
import { prisma } from '@/config/database';
import { asyncHandler } from '@/middleware/errorHandler';
import { validate } from '@/validation';
import {
  userInviteSchema,
  bulkUpdateUsersSchema,
  userExportSchema,
  userImportSchema,
} from '@/validation/admin.validation';
import { logger } from '@/utils/logger';
import { ApiResponse } from '@/types/common.types';

export class UserAdminController {
  private userAdminService: UserAdminService;

  constructor() {
    this.userAdminService = new UserAdminService(prisma);
  }

  /**
   * Get admin dashboard statistics
   * GET /api/admin/dashboard/stats
   */
  getDashboardStats = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const stats = await this.userAdminService.getAdminDashboardStats();
    
    const response: ApiResponse = {
      success: true,
      data: stats,
      message: 'Dashboard statistics retrieved successfully',
      meta: {
        timestamp: new Date().toISOString(),
        requestId: res.locals.requestId || 'unknown',
        version: process.env.API_VERSION || 'v1',
      },
    };

    res.status(200).json(response);
  });

  /**
   * Invite user via email
   * POST /api/admin/users/invite
   */
  inviteUser = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!req.user?.id) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
      return;
    }

    const result = await this.userAdminService.inviteUser(req.body, req.user.id);
    
    const response: ApiResponse = {
      success: true,
      data: result,
      message: 'User invitation sent successfully',
      meta: {
        timestamp: new Date().toISOString(),
        requestId: res.locals.requestId || 'unknown',
        version: process.env.API_VERSION || 'v1',
      },
    };

    res.status(201).json(response);
  });

  /**
   * Accept user invitation
   * POST /api/admin/users/accept-invitation
   */
  acceptInvitation = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { token, firstName, lastName, password } = req.body;
    
    const result = await this.userAdminService.acceptInvitation(token, {
      firstName,
      lastName,
      password,
    });
    
    const response: ApiResponse = {
      success: true,
      data: result,
      message: 'Invitation accepted successfully',
      meta: {
        timestamp: new Date().toISOString(),
        requestId: res.locals.requestId || 'unknown',
        version: process.env.API_VERSION || 'v1',
      },
    };

    res.status(200).json(response);
  });

  /**
   * Bulk update users
   * POST /api/admin/users/bulk-update
   */
  bulkUpdateUsers = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!req.user?.id) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
      return;
    }

    const result = await this.userAdminService.bulkUpdateUsers(req.body, req.user.id);
    
    const response: ApiResponse = {
      success: true,
      data: result,
      message: `Bulk update completed: ${result.updated} users updated`,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: res.locals.requestId || 'unknown',
        version: process.env.API_VERSION || 'v1',
      },
    };

    res.status(200).json(response);
  });

  /**
   * Get user audit log
   * GET /api/admin/users/:userId/audit
   */
  getUserAuditLog = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { userId } = req.params;
    const { page = '1', limit = '50' } = req.query;

    const result = await this.userAdminService.getUserAuditLog(
      userId,
      parseInt(page as string),
      parseInt(limit as string)
    );
    
    const response: ApiResponse = {
      success: true,
      data: result,
      message: 'User audit log retrieved successfully',
      meta: {
        timestamp: new Date().toISOString(),
        requestId: res.locals.requestId || 'unknown',
        version: process.env.API_VERSION || 'v1',
      },
    };

    res.status(200).json(response);
  });

  /**
   * Get user activity summary
   * GET /api/admin/users/:userId/activity
   */
  getUserActivity = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { userId } = req.params;
    const { days = '30' } = req.query;

    const result = await this.userAdminService.getUserActivitySummary(
      userId,
      parseInt(days as string)
    );
    
    const response: ApiResponse = {
      success: true,
      data: result,
      message: 'User activity summary retrieved successfully',
      meta: {
        timestamp: new Date().toISOString(),
        requestId: res.locals.requestId || 'unknown',
        version: process.env.API_VERSION || 'v1',
      },
    };

    res.status(200).json(response);
  });

  /**
   * Force user logout
   * POST /api/admin/users/:userId/force-logout
   */
  forceUserLogout = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { userId } = req.params;
    
    if (!req.user?.id) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
      return;
    }

    await this.userAdminService.forceUserLogout(userId, req.user.id);
    
    const response: ApiResponse = {
      success: true,
      message: 'User logged out successfully',
      meta: {
        timestamp: new Date().toISOString(),
        requestId: res.locals.requestId || 'unknown',
        version: process.env.API_VERSION || 'v1',
      },
    };

    res.status(200).json(response);
  });

  /**
   * Get active user sessions
   * GET /api/admin/users/:userId/sessions
   */
  getUserSessions = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { userId } = req.params;

    const sessions = await this.userAdminService.getActiveUserSessions(userId);
    
    const response: ApiResponse = {
      success: true,
      data: { sessions },
      message: 'User sessions retrieved successfully',
      meta: {
        timestamp: new Date().toISOString(),
        requestId: res.locals.requestId || 'unknown',
        version: process.env.API_VERSION || 'v1',
      },
    };

    res.status(200).json(response);
  });

  /**
   * Terminate specific user session
   * DELETE /api/admin/users/:userId/sessions/:sessionId
   */
  terminateUserSession = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { userId, sessionId } = req.params;
    
    if (!req.user?.id) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
      return;
    }

    await this.userAdminService.terminateUserSession(userId, sessionId, req.user.id);
    
    const response: ApiResponse = {
      success: true,
      message: 'User session terminated successfully',
      meta: {
        timestamp: new Date().toISOString(),
        requestId: res.locals.requestId || 'unknown',
        version: process.env.API_VERSION || 'v1',
      },
    };

    res.status(200).json(response);
  });

  /**
   * Export users data
   * POST /api/admin/users/export
   */
  exportUsers = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!req.user?.id) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
      return;
    }

    const { filters = {}, format = 'csv' } = req.body;

    const result = await this.userAdminService.exportUsers(filters, format, req.user.id);
    
    const response: ApiResponse = {
      success: true,
      data: result,
      message: 'User export initiated successfully',
      meta: {
        timestamp: new Date().toISOString(),
        requestId: res.locals.requestId || 'unknown',
        version: process.env.API_VERSION || 'v1',
      },
    };

    res.status(200).json(response);
  });

  /**
   * Import users data
   * POST /api/admin/users/import
   */
  importUsers = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!req.user?.id) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
      return;
    }

    const { data, options = {} } = req.body;

    const result = await this.userAdminService.importUsers(data, options, req.user.id);
    
    const response: ApiResponse = {
      success: true,
      data: result,
      message: `User import completed: ${result.imported} imported, ${result.errors.length} errors`,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: res.locals.requestId || 'unknown',
        version: process.env.API_VERSION || 'v1',
      },
    };

    res.status(200).json(response);
  });

  /**
   * Get system audit log
   * GET /api/admin/audit
   */
  getSystemAuditLog = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { 
      page = '1', 
      limit = '50', 
      action, 
      userId, 
      adminId,
      startDate,
      endDate 
    } = req.query;

    // Mock implementation for now
    const mockAuditLog = {
      entries: [
        {
          id: 'audit-1',
          userId: 'user-123',
          adminId: 'admin-123',
          action: 'USER_CREATED',
          details: { role: 'DEVELOPER' },
          timestamp: new Date(),
        },
      ],
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total: 1,
        totalPages: 1,
      },
    };
    
    const response: ApiResponse = {
      success: true,
      data: mockAuditLog,
      message: 'System audit log retrieved successfully',
      meta: {
        timestamp: new Date().toISOString(),
        requestId: res.locals.requestId || 'unknown',
        version: process.env.API_VERSION || 'v1',
      },
    };

    res.status(200).json(response);
  });

  /**
   * Get user management analytics
   * GET /api/admin/analytics/users
   */
  getUserAnalytics = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { 
      period = '30d',
      groupBy = 'day',
      metrics = 'registrations,logins,activity'
    } = req.query;

    // Mock analytics data
    const mockAnalytics = {
      period,
      groupBy,
      metrics: (metrics as string).split(','),
      data: [
        {
          date: '2024-01-01',
          registrations: 5,
          logins: 25,
          activity: 150,
        },
        {
          date: '2024-01-02',
          registrations: 3,
          logins: 30,
          activity: 180,
        },
      ],
      summary: {
        totalRegistrations: 8,
        totalLogins: 55,
        totalActivity: 330,
        averageDaily: {
          registrations: 4,
          logins: 27.5,
          activity: 165,
        },
      },
    };
    
    const response: ApiResponse = {
      success: true,
      data: mockAnalytics,
      message: 'User analytics retrieved successfully',
      meta: {
        timestamp: new Date().toISOString(),
        requestId: res.locals.requestId || 'unknown',
        version: process.env.API_VERSION || 'v1',
      },
    };

    res.status(200).json(response);
  });

  /**
   * Generate compliance report
   * POST /api/admin/reports/compliance
   */
  generateComplianceReport = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { 
      startDate,
      endDate,
      includeInactive = false,
      roles,
      format = 'json'
    } = req.body;

    // Mock compliance report
    const mockReport = {
      period: {
        startDate: startDate || new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
        endDate: endDate || new Date(),
      },
      users: 150,
      auditLogs: 1250,
      sessions: 850,
      compliance: {
        dataRetention: 'compliant',
        accessControls: 'compliant',
        auditTrail: 'compliant',
        passwordPolicy: 'compliant',
      },
      generatedAt: new Date(),
    };
    
    const response: ApiResponse = {
      success: true,
      data: mockReport,
      message: 'Compliance report generated successfully',
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
const userAdminController = new UserAdminController();

export { userAdminController };

// Export route handlers with validation
export const userAdminRoutes = {
  getDashboardStats: [
    userAdminController.getDashboardStats,
  ],
  inviteUser: [
    validate(userInviteSchema, 'body'),
    userAdminController.inviteUser,
  ],
  acceptInvitation: [
    userAdminController.acceptInvitation,
  ],
  bulkUpdateUsers: [
    validate(bulkUpdateUsersSchema, 'body'),
    userAdminController.bulkUpdateUsers,
  ],
  getUserAuditLog: [
    userAdminController.getUserAuditLog,
  ],
  getUserActivity: [
    userAdminController.getUserActivity,
  ],
  forceUserLogout: [
    userAdminController.forceUserLogout,
  ],
  getUserSessions: [
    userAdminController.getUserSessions,
  ],
  terminateUserSession: [
    userAdminController.terminateUserSession,
  ],
  exportUsers: [
    validate(userExportSchema, 'body'),
    userAdminController.exportUsers,
  ],
  importUsers: [
    validate(userImportSchema, 'body'),
    userAdminController.importUsers,
  ],
  getSystemAuditLog: [
    userAdminController.getSystemAuditLog,
  ],
  getUserAnalytics: [
    userAdminController.getUserAnalytics,
  ],
  generateComplianceReport: [
    userAdminController.generateComplianceReport,
  ],
};
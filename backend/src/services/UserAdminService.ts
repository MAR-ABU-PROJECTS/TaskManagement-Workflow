import { PrismaClient, UserRole } from '@prisma/client';
import { UserService } from '@/services/UserService';
import { PermissionService } from '@/services/PermissionService';
import { CacheService } from '@/config/redis';
import { logger } from '@/utils/logger';
import {
  ValidationError,
  NotFoundError,
  ConflictError,
} from '@/middleware/errorHandler';

export interface UserInviteRequest {
  email: string;
  role?: UserRole;
  message?: string;
  metadata?: Record<string, any>;
}

export interface UserBulkUpdateRequest {
  updates: Array<{
    userId: string;
    data: Record<string, any>;
  }>;
}

export interface AdminDashboardStats {
  users: {
    total: number;
    active: number;
    inactive: number;
    newToday: number;
    newThisWeek: number;
    newThisMonth: number;
    roleDistribution: Record<UserRole, number>;
  };
  activity: {
    recentLogins: number;
    pendingInvites: number;
    auditLogEntries: number;
  };
  timestamp: Date;
}

export interface UserActivitySummary {
  user: any;
  sessions: any[];
  auditEntries: number;
  projectCount: number;
  taskActivity: number;
  period: {
    days: number;
    startDate: Date;
    endDate: Date;
  };
}

export interface UserAuditEntry {
  id: string;
  userId: string;
  adminId: string;
  action: string;
  details: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
}

export class UserAdminService {
  private prisma: PrismaClient;
  private userService: UserService;
  private permissionService: PermissionService;
  private cache: CacheService;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.userService = new UserService(prisma);
    this.permissionService = new PermissionService(prisma);
    this.cache = CacheService.getInstance();
  }

  /**
   * Invite user via email
   */
  async inviteUser(
    inviteData: UserInviteRequest,
    invitedBy: string
  ): Promise<{ inviteId: string; inviteToken: string }> {
    try {
      // Check if user already exists
      const existingUser = await this.userService.getUserByEmail(inviteData.email);
      if (existingUser) {
        throw new ConflictError('User with this email already exists');
      }

      // Generate invite token
      const inviteToken = this.generateInviteToken();
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

      // Create invite record (mock implementation)
      const inviteId = `invite-${Date.now()}`;

      // Store invite in cache temporarily
      await this.cache.set(`invite:${inviteToken}`, {
        id: inviteId,
        email: inviteData.email,
        role: inviteData.role || UserRole.DEVELOPER,
        invitedBy,
        expiresAt,
        message: inviteData.message,
      }, 7 * 24 * 60 * 60); // 7 days

      // Log audit entry
      await this.logAuditEntry({
        userId: 'system',
        adminId: invitedBy,
        action: 'USER_INVITED',
        details: {
          email: inviteData.email,
          role: inviteData.role,
          inviteId,
        },
      });

      logger.info(`User invited: ${inviteData.email} by ${invitedBy}`);

      return { inviteId, inviteToken };
    } catch (error) {
      logger.error('Failed to invite user:', error);
      throw error;
    }
  }

  /**
   * Accept user invitation
   */
  async acceptInvitation(
    token: string,
    userData: {
      firstName: string;
      lastName: string;
      password: string;
    }
  ): Promise<{ user: any; message: string }> {
    try {
      // Get invite from cache
      const invite = await this.cache.get(`invite:${token}`);
      if (!invite) {
        throw new ValidationError('Invalid or expired invitation token');
      }

      if (new Date(invite.expiresAt) < new Date()) {
        throw new ValidationError('Invitation has expired');
      }

      // Create user account
      const user = await this.userService.createUser({
        email: invite.email,
        password: userData.password,
        firstName: userData.firstName,
        lastName: userData.lastName,
        role: invite.role,
        isActive: true,
      });

      // Remove invite from cache
      await this.cache.del(`invite:${token}`);

      // Log audit entry
      await this.logAuditEntry({
        userId: user.id,
        adminId: invite.invitedBy,
        action: 'INVITATION_ACCEPTED',
        details: {
          inviteId: invite.id,
          email: invite.email,
        },
      });

      logger.info(`Invitation accepted: ${invite.email} -> ${user.id}`);

      return { 
        user, 
        message: 'Account created successfully. Please login with your credentials.' 
      };
    } catch (error) {
      logger.error('Failed to accept invitation:', error);
      throw error;
    }
  }

  /**
   * Bulk update users
   */
  async bulkUpdateUsers(
    updateRequest: UserBulkUpdateRequest,
    adminId: string
  ): Promise<{ updated: number; errors: Array<{ userId: string; error: string }> }> {
    try {
      const results = { updated: 0, errors: [] as Array<{ userId: string; error: string }> };

      for (const userUpdate of updateRequest.updates) {
        try {
          await this.userService.updateUser(userUpdate.userId, userUpdate.data, adminId);
          results.updated++;
        } catch (error) {
          results.errors.push({
            userId: userUpdate.userId,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }

      // Log audit entry
      await this.logAuditEntry({
        userId: 'system',
        adminId,
        action: 'BULK_USER_UPDATE',
        details: {
          totalUsers: updateRequest.updates.length,
          updated: results.updated,
          errors: results.errors.length,
        },
      });

      logger.info(`Bulk user update completed: ${results.updated} updated, ${results.errors.length} errors by ${adminId}`);

      return results;
    } catch (error) {
      logger.error('Failed to bulk update users:', error);
      throw error;
    }
  }

  /**
   * Get user audit log
   */
  async getUserAuditLog(
    userId: string,
    page: number = 1,
    limit: number = 50
  ): Promise<{
    entries: UserAuditEntry[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    try {
      // Mock implementation - in real app would query audit log table
      const mockEntries: UserAuditEntry[] = [
        {
          id: 'audit-1',
          userId,
          adminId: 'admin-123',
          action: 'USER_CREATED',
          details: { role: 'DEVELOPER' },
          timestamp: new Date(),
        },
      ];

      return {
        entries: mockEntries,
        pagination: {
          page,
          limit,
          total: mockEntries.length,
          totalPages: 1,
        },
      };
    } catch (error) {
      logger.error('Failed to get user audit log:', error);
      throw error;
    }
  }

  /**
   * Get admin dashboard statistics
   */
  async getAdminDashboardStats(): Promise<AdminDashboardStats> {
    try {
      const cacheKey = 'admin_dashboard_stats';
      const cached = await this.cache.get<AdminDashboardStats>(cacheKey);
      if (cached) {
        return cached;
      }

      const userStats = await this.userService.getUserStats();
      
      const stats: AdminDashboardStats = {
        users: {
          total: userStats.total,
          active: userStats.active,
          inactive: userStats.inactive,
          newToday: userStats.recentlyCreated,
          newThisWeek: userStats.recentlyCreated,
          newThisMonth: userStats.recentlyCreated,
          roleDistribution: userStats.byRole,
        },
        activity: {
          recentLogins: 25, // Mock data
          pendingInvites: 3, // Mock data
          auditLogEntries: 150, // Mock data
        },
        timestamp: new Date(),
      };

      // Cache for 5 minutes
      await this.cache.set(cacheKey, stats, 300);

      return stats;
    } catch (error) {
      logger.error('Failed to get admin dashboard stats:', error);
      throw error;
    }
  }

  /**
   * Get user activity summary
   */
  async getUserActivitySummary(
    userId: string,
    days: number = 30
  ): Promise<UserActivitySummary> {
    try {
      const user = await this.userService.getUserById(userId);
      if (!user) {
        throw new NotFoundError('User not found');
      }

      // Mock implementation
      return {
        user,
        sessions: [], // Mock sessions
        auditEntries: 5, // Mock count
        projectCount: 3, // Mock count
        taskActivity: 15, // Mock count
        period: { 
          days, 
          startDate: new Date(Date.now() - days * 24 * 60 * 60 * 1000), 
          endDate: new Date() 
        },
      };
    } catch (error) {
      logger.error('Failed to get user activity summary:', error);
      throw error;
    }
  }

  /**
   * Force user logout (terminate all sessions)
   */
  async forceUserLogout(userId: string, adminId: string): Promise<void> {
    try {
      // Invalidate all user sessions
      await Promise.all([
        this.cache.del(`refresh_token:${userId}`),
        this.cache.del(`user_sessions:${userId}`),
        this.cache.del(`user_permissions:${userId}`),
      ]);

      // Log audit entry
      await this.logAuditEntry({
        userId,
        adminId,
        action: 'FORCE_LOGOUT',
        details: { reason: 'Admin forced logout' },
      });

      logger.info(`User force logged out: ${userId} by admin ${adminId}`);
    } catch (error) {
      logger.error('Failed to force user logout:', error);
      throw error;
    }
  }

  /**
   * Get active user sessions (mock implementation)
   */
  async getActiveUserSessions(userId: string): Promise<any[]> {
    try {
      // Mock implementation
      return [
        {
          id: 'session-1',
          userId,
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0...',
          loginTime: new Date(),
          lastActivity: new Date(),
          isActive: true,
        },
      ];
    } catch (error) {
      logger.error('Failed to get active user sessions:', error);
      throw error;
    }
  }

  /**
   * Terminate specific user session
   */
  async terminateUserSession(
    userId: string,
    sessionId: string,
    adminId: string
  ): Promise<void> {
    try {
      // Mock implementation - would update session in database
      
      // Log audit entry
      await this.logAuditEntry({
        userId,
        adminId,
        action: 'SESSION_TERMINATED',
        details: { sessionId, reason: 'Admin terminated session' },
      });

      logger.info(`User session terminated: ${sessionId} for user ${userId} by admin ${adminId}`);
    } catch (error) {
      logger.error('Failed to terminate user session:', error);
      throw error;
    }
  }

  /**
   * Log audit entry
   */
  private async logAuditEntry(entry: {
    userId: string;
    adminId: string;
    action: string;
    details: Record<string, any>;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<void> {
    try {
      // Store in cache for now (in real app would store in database)
      const auditKey = `audit:${entry.userId}:${Date.now()}`;
      await this.cache.set(auditKey, {
        ...entry,
        timestamp: new Date(),
      }, 30 * 24 * 60 * 60); // 30 days

      logger.info(`Audit logged: ${entry.action} for user ${entry.userId} by ${entry.adminId}`);
    } catch (error) {
      logger.error('Failed to log audit entry:', error);
      // Don't throw error to avoid breaking the main operation
    }
  }

  /**
   * Generate invite token
   */
  private generateInviteToken(): string {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15) +
           Date.now().toString(36);
  }

  /**
   * Export users data (mock implementation)
   */
  async exportUsers(
    filters: {
      roles?: UserRole[];
      isActive?: boolean;
      createdAfter?: Date;
      createdBefore?: Date;
    } = {},
    format: 'csv' | 'json' | 'xlsx' = 'csv',
    adminId: string
  ): Promise<{ downloadUrl: string; filename: string }> {
    try {
      // Get users based on filters
      const users = await this.userService.searchUsers(filters, 1, 1000);

      // Generate filename
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `users_export_${timestamp}.${format}`;

      // Mock download URL
      const downloadUrl = `/api/admin/exports/${filename}`;

      // Log audit entry
      await this.logAuditEntry({
        userId: 'system',
        adminId,
        action: 'USERS_EXPORTED',
        details: {
          format,
          userCount: users.users.length,
          filename,
          filters,
        },
      });

      logger.info(`Users exported: ${users.users.length} users in ${format} format by ${adminId}`);

      return { downloadUrl, filename };
    } catch (error) {
      logger.error('Failed to export users:', error);
      throw error;
    }
  }

  /**
   * Import users from data (mock implementation)
   */
  async importUsers(
    userData: any[],
    options: {
      skipDuplicates?: boolean;
      updateExisting?: boolean;
    } = {},
    adminId: string
  ): Promise<{
    imported: number;
    errors: Array<{ row: number; error: string; data?: any }>;
    duplicates: number;
  }> {
    try {
      const results = {
        imported: 0,
        errors: [] as Array<{ row: number; error: string; data?: any }>,
        duplicates: 0,
      };

      for (let i = 0; i < userData.length; i++) {
        const row = i + 1;
        const user = userData[i];

        try {
          // Check for existing user
          const existingUser = await this.userService.getUserByEmail(user.email);
          if (existingUser) {
            if (options.skipDuplicates) {
              results.duplicates++;
              continue;
            } else if (options.updateExisting) {
              await this.userService.updateUser(existingUser.id, user, adminId);
              results.imported++;
              continue;
            } else {
              results.errors.push({
                row,
                error: 'User with this email already exists',
                data: user,
              });
              continue;
            }
          }

          // Create user
          await this.userService.createUser(user, adminId);
          results.imported++;
        } catch (error) {
          results.errors.push({
            row,
            error: error instanceof Error ? error.message : 'Unknown error',
            data: user,
          });
        }
      }

      // Log audit entry
      await this.logAuditEntry({
        userId: 'system',
        adminId,
        action: 'USERS_IMPORTED',
        details: {
          totalRows: userData.length,
          imported: results.imported,
          errors: results.errors.length,
          duplicates: results.duplicates,
        },
      });

      logger.info(`Users imported: ${results.imported} imported, ${results.errors.length} errors, ${results.duplicates} duplicates by ${adminId}`);

      return results;
    } catch (error) {
      logger.error('Failed to import users:', error);
      throw error;
    }
  }
}
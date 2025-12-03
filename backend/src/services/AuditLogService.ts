import prisma from "../db/prisma";
import { AuditAction } from "@prisma/client";

interface AuditLogData {
  userId?: string;
  action: AuditAction;
  entityType: string;
  entityId?: string;
  changes?: Record<string, any>;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  success?: boolean;
  errorMessage?: string;
}

export class AuditLogService {
  /**
   * Create audit log entry
   * Note: Super Admin actions are NOT logged as they are outside the organization
   */
  static async createLog(data: AuditLogData): Promise<void> {
    try {
      // Skip logging for Super Admin users (they're outside the organization)
      if (data.userId) {
        const user = await prisma.user.findUnique({
          where: { id: data.userId },
          select: { isSuperAdmin: true },
        });

        if (user?.isSuperAdmin) {
          return; // Do not log Super Admin actions
        }
      }

      await prisma.auditLog.create({
        data: {
          userId: data.userId,
          action: data.action,
          entityType: data.entityType,
          entityId: data.entityId,
          changes: data.changes,
          metadata: data.metadata,
          ipAddress: data.ipAddress,
          userAgent: data.userAgent,
          success: data.success ?? true,
          errorMessage: data.errorMessage,
        },
      });
    } catch (error) {
      console.error("Failed to create audit log:", error);
      // Don't throw - audit logging should not break the main flow
    }
  }

  /**
   * Log authentication events
   */
  static async logAuth(data: {
    userId?: string;
    action:
      | "LOGIN"
      | "LOGOUT"
      | "REGISTER"
      | "PASSWORD_CHANGE"
      | "TOKEN_REFRESH";
    success: boolean;
    ipAddress?: string;
    userAgent?: string;
    errorMessage?: string;
    metadata?: Record<string, any>;
  }): Promise<void> {
    await this.createLog({
      userId: data.userId,
      action: data.action as AuditAction,
      entityType: "User",
      entityId: data.userId,
      success: data.success,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      errorMessage: data.errorMessage,
      metadata: data.metadata,
    });
  }

  /**
   * Log user management events
   */
  static async logUserManagement(data: {
    userId: string;
    action:
      | "USER_CREATE"
      | "USER_UPDATE"
      | "USER_DELETE"
      | "USER_PROMOTE"
      | "USER_DEMOTE"
      | "USER_ACTIVATE"
      | "USER_DEACTIVATE";
    targetUserId: string;
    changes?: Record<string, any>;
    metadata?: Record<string, any>;
  }): Promise<void> {
    await this.createLog({
      userId: data.userId,
      action: data.action as AuditAction,
      entityType: "User",
      entityId: data.targetUserId,
      changes: data.changes,
      metadata: data.metadata,
    });
  }

  /**
   * Log task events
   */
  static async logTask(data: {
    userId: string;
    action:
      | "TASK_CREATE"
      | "TASK_UPDATE"
      | "TASK_DELETE"
      | "TASK_ASSIGN"
      | "TASK_STATUS_CHANGE"
      | "TASK_COMMENT";
    taskId: string;
    changes?: Record<string, any>;
    metadata?: Record<string, any>;
  }): Promise<void> {
    await this.createLog({
      userId: data.userId,
      action: data.action as AuditAction,
      entityType: "Task",
      entityId: data.taskId,
      changes: data.changes,
      metadata: data.metadata,
    });
  }

  /**
   * Log project events
   */
  static async logProject(data: {
    userId: string;
    action:
      | "PROJECT_CREATE"
      | "PROJECT_UPDATE"
      | "PROJECT_DELETE"
      | "PROJECT_MEMBER_ADD"
      | "PROJECT_MEMBER_REMOVE";
    projectId: string;
    changes?: Record<string, any>;
    metadata?: Record<string, any>;
  }): Promise<void> {
    await this.createLog({
      userId: data.userId,
      action: data.action as AuditAction,
      entityType: "Project",
      entityId: data.projectId,
      changes: data.changes,
      metadata: data.metadata,
    });
  }

  /**
   * Log sprint events
   */
  static async logSprint(data: {
    userId: string;
    action:
      | "SPRINT_CREATE"
      | "SPRINT_UPDATE"
      | "SPRINT_DELETE"
      | "SPRINT_START"
      | "SPRINT_COMPLETE";
    sprintId: string;
    changes?: Record<string, any>;
    metadata?: Record<string, any>;
  }): Promise<void> {
    await this.createLog({
      userId: data.userId,
      action: data.action as AuditAction,
      entityType: "Sprint",
      entityId: data.sprintId,
      changes: data.changes,
      metadata: data.metadata,
    });
  }

  /**
   * Get audit logs with filters
   */
  static async getLogs(filters: {
    userId?: string;
    action?: AuditAction;
    entityType?: string;
    entityId?: string;
    startDate?: Date;
    endDate?: Date;
    page?: number;
    limit?: number;
  }) {
    const page = filters.page || 1;
    const limit = filters.limit || 50;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (filters.userId) where.userId = filters.userId;
    if (filters.action) where.action = filters.action;
    if (filters.entityType) where.entityType = filters.entityType;
    if (filters.entityId) where.entityId = filters.entityId;

    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = filters.startDate;
      if (filters.endDate) where.createdAt.lte = filters.endDate;
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
              role: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.auditLog.count({ where }),
    ]);

    return {
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get user activity history
   */
  static async getUserActivity(userId: string, limit = 100) {
    return await prisma.auditLog.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  }

  /**
   * Get entity history (e.g., all changes to a specific task)
   */
  static async getEntityHistory(entityType: string, entityId: string) {
    return await prisma.auditLog.findMany({
      where: {
        entityType,
        entityId,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });
  }

  /**
   * Get recent system activity
   */
  static async getRecentActivity(limit = 50) {
    return await prisma.auditLog.findMany({
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  }

  /**
   * Delete old audit logs (for cleanup/maintenance)
   */
  static async deleteOldLogs(daysToKeep: number = 365) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const result = await prisma.auditLog.deleteMany({
      where: {
        createdAt: {
          lt: cutoffDate,
        },
      },
    });

    return result.count;
  }
}

export default AuditLogService;

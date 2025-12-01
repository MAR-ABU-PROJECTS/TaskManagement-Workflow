"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditLogService = void 0;
const prisma_1 = __importDefault(require("../db/prisma"));
class AuditLogService {
    static async createLog(data) {
        try {
            if (data.userId) {
                const user = await prisma_1.default.user.findUnique({
                    where: { id: data.userId },
                    select: { isSuperAdmin: true },
                });
                if (user?.isSuperAdmin) {
                    return;
                }
            }
            await prisma_1.default.auditLog.create({
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
        }
        catch (error) {
            console.error("Failed to create audit log:", error);
        }
    }
    static async logAuth(data) {
        await this.createLog({
            userId: data.userId,
            action: data.action,
            entityType: "User",
            entityId: data.userId,
            success: data.success,
            ipAddress: data.ipAddress,
            userAgent: data.userAgent,
            errorMessage: data.errorMessage,
            metadata: data.metadata,
        });
    }
    static async logUserManagement(data) {
        await this.createLog({
            userId: data.userId,
            action: data.action,
            entityType: "User",
            entityId: data.targetUserId,
            changes: data.changes,
            metadata: data.metadata,
        });
    }
    static async logTask(data) {
        await this.createLog({
            userId: data.userId,
            action: data.action,
            entityType: "Task",
            entityId: data.taskId,
            changes: data.changes,
            metadata: data.metadata,
        });
    }
    static async logProject(data) {
        await this.createLog({
            userId: data.userId,
            action: data.action,
            entityType: "Project",
            entityId: data.projectId,
            changes: data.changes,
            metadata: data.metadata,
        });
    }
    static async logSprint(data) {
        await this.createLog({
            userId: data.userId,
            action: data.action,
            entityType: "Sprint",
            entityId: data.sprintId,
            changes: data.changes,
            metadata: data.metadata,
        });
    }
    static async getLogs(filters) {
        const page = filters.page || 1;
        const limit = filters.limit || 50;
        const skip = (page - 1) * limit;
        const where = {};
        if (filters.userId)
            where.userId = filters.userId;
        if (filters.action)
            where.action = filters.action;
        if (filters.entityType)
            where.entityType = filters.entityType;
        if (filters.entityId)
            where.entityId = filters.entityId;
        if (filters.startDate || filters.endDate) {
            where.createdAt = {};
            if (filters.startDate)
                where.createdAt.gte = filters.startDate;
            if (filters.endDate)
                where.createdAt.lte = filters.endDate;
        }
        const [logs, total] = await Promise.all([
            prisma_1.default.auditLog.findMany({
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
            prisma_1.default.auditLog.count({ where }),
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
    static async getUserActivity(userId, limit = 100) {
        return await prisma_1.default.auditLog.findMany({
            where: { userId },
            orderBy: { createdAt: "desc" },
            take: limit,
        });
    }
    static async getEntityHistory(entityType, entityId) {
        return await prisma_1.default.auditLog.findMany({
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
    static async getRecentActivity(limit = 50) {
        return await prisma_1.default.auditLog.findMany({
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
    static async deleteOldLogs(daysToKeep = 365) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
        const result = await prisma_1.default.auditLog.deleteMany({
            where: {
                createdAt: {
                    lt: cutoffDate,
                },
            },
        });
        return result.count;
    }
}
exports.AuditLogService = AuditLogService;
exports.default = AuditLogService;

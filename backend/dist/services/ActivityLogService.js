"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ActivityLogService = void 0;
const prisma_1 = __importDefault(require("../db/prisma"));
class ActivityLogService {
    async logActivity(data) {
        await prisma_1.default.taskActivityLog.create({
            data: {
                taskId: data.taskId,
                userId: data.userId,
                action: data.action,
                previousStatus: data.previousStatus || null,
                newStatus: data.newStatus || null,
                metadata: data.metadata || undefined,
            },
        });
    }
    async getTaskLogs(taskId) {
        const logs = await prisma_1.default.taskActivityLog.findMany({
            where: { taskId },
            orderBy: { timestamp: "desc" },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        role: true,
                    },
                },
            },
        });
        return logs;
    }
    async getUserActivities(userId, limit = 20) {
        const logs = await prisma_1.default.taskActivityLog.findMany({
            where: {
                OR: [
                    { userId },
                    { task: { creatorId: userId } },
                    { task: { assigneeId: userId } },
                ],
            },
            orderBy: { timestamp: "desc" },
            take: limit,
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                task: {
                    select: {
                        id: true,
                        title: true,
                        status: true,
                    },
                },
            },
        });
        return logs;
    }
}
exports.ActivityLogService = ActivityLogService;
exports.default = new ActivityLogService();

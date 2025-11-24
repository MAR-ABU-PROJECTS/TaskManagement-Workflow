"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationService = void 0;
const prisma_1 = __importDefault(require("../db/prisma"));
const enums_1 = require("../types/enums");
class NotificationService {
    async createNotification(userId, type, payload) {
        await prisma_1.default.notification.create({
            data: {
                userId,
                type,
                payload,
                read: false,
            },
        });
    }
    async notifyTaskAssigned(taskId, assigneeId, assignerId) {
        const task = await prisma_1.default.task.findUnique({
            where: { id: taskId },
            include: {
                creator: { select: { name: true } },
                project: { select: { name: true } },
            },
        });
        if (!task)
            return;
        const assigner = await prisma_1.default.user.findUnique({
            where: { id: assignerId },
            select: { name: true },
        });
        await this.createNotification(assigneeId, enums_1.NotificationType.TASK_ASSIGNED, {
            taskId: task.id,
            taskTitle: task.title,
            projectName: task.project?.name || "Personal",
            assignedBy: assigner?.name || "System",
            message: `You have been assigned to task: ${task.title}`,
        });
    }
    async notifyStatusChanged(taskId, oldStatus, newStatus) {
        const task = await prisma_1.default.task.findUnique({
            where: { id: taskId },
            include: {
                creator: true,
                assignee: true,
                project: { select: { name: true } },
            },
        });
        if (!task)
            return;
        const usersToNotify = new Set();
        if (task.creatorId)
            usersToNotify.add(task.creatorId);
        if (task.assigneeId)
            usersToNotify.add(task.assigneeId);
        const payload = {
            taskId: task.id,
            taskTitle: task.title,
            projectName: task.project?.name || "Personal",
            oldStatus,
            newStatus,
            message: `Task status changed from ${oldStatus} to ${newStatus}`,
        };
        for (const userId of usersToNotify) {
            await this.createNotification(userId, enums_1.NotificationType.STATUS_CHANGED, payload);
        }
    }
    async notifyComment(taskId, commenterId, message) {
        const task = await prisma_1.default.task.findUnique({
            where: { id: taskId },
            include: {
                creator: true,
                assignee: true,
                watchers: true,
            },
        });
        if (!task)
            return;
        const commenter = await prisma_1.default.user.findUnique({
            where: { id: commenterId },
            select: { name: true },
        });
        const usersToNotify = new Set();
        if (task.creatorId && task.creatorId !== commenterId) {
            usersToNotify.add(task.creatorId);
        }
        if (task.assigneeId && task.assigneeId !== commenterId) {
            usersToNotify.add(task.assigneeId);
        }
        const mentions = this.extractMentions(message);
        for (const mention of mentions) {
            const user = await prisma_1.default.user.findFirst({
                where: { name: { contains: mention, mode: "insensitive" } },
            });
            if (user) {
                usersToNotify.add(user.id);
                await this.createNotification(user.id, enums_1.NotificationType.MENTION, {
                    taskId: task.id,
                    taskTitle: task.title,
                    mentionedBy: commenter?.name || "Someone",
                    message: `You were mentioned in a comment`,
                });
            }
        }
        const payload = {
            taskId: task.id,
            taskTitle: task.title,
            commenter: commenter?.name || "Someone",
            message: `${commenter?.name || "Someone"} commented on the task`,
        };
        for (const userId of usersToNotify) {
            await this.createNotification(userId, enums_1.NotificationType.COMMENT, payload);
        }
    }
    async notifyApprovalRequired(taskId) {
        const task = await prisma_1.default.task.findUnique({
            where: { id: taskId },
            include: {
                creator: { select: { name: true } },
            },
        });
        if (!task)
            return;
        const approvers = await prisma_1.default.user.findMany({
            where: {
                role: { in: [enums_1.UserRole.CEO, enums_1.UserRole.HOO, enums_1.UserRole.HR] },
                isActive: true,
            },
        });
        const payload = {
            taskId: task.id,
            taskTitle: task.title,
            createdBy: task.creator.name,
            message: `Task requires your approval`,
        };
        for (const approver of approvers) {
            await this.createNotification(approver.id, enums_1.NotificationType.APPROVAL_REQUIRED, payload);
        }
    }
    async notifyTaskApproved(taskId) {
        const task = await prisma_1.default.task.findUnique({
            where: { id: taskId },
            include: {
                creator: true,
                assignee: true,
                approvedBy: { select: { name: true } },
            },
        });
        if (!task)
            return;
        const usersToNotify = new Set();
        if (task.creatorId)
            usersToNotify.add(task.creatorId);
        if (task.assigneeId)
            usersToNotify.add(task.assigneeId);
        const payload = {
            taskId: task.id,
            taskTitle: task.title,
            approvedBy: task.approvedBy?.name || "Management",
            message: `Task has been approved`,
        };
        for (const userId of usersToNotify) {
            await this.createNotification(userId, enums_1.NotificationType.APPROVED, payload);
        }
    }
    async notifyTaskRejected(taskId, reason) {
        const task = await prisma_1.default.task.findUnique({
            where: { id: taskId },
            include: {
                creator: true,
                assignee: true,
            },
        });
        if (!task)
            return;
        const usersToNotify = new Set();
        if (task.creatorId)
            usersToNotify.add(task.creatorId);
        if (task.assigneeId)
            usersToNotify.add(task.assigneeId);
        const payload = {
            taskId: task.id,
            taskTitle: task.title,
            reason,
            message: `Task has been rejected: ${reason}`,
        };
        for (const userId of usersToNotify) {
            await this.createNotification(userId, enums_1.NotificationType.REJECTED, payload);
        }
    }
    async getUserNotifications(userId, unreadOnly = false) {
        const notifications = await prisma_1.default.notification.findMany({
            where: {
                userId,
                ...(unreadOnly && { read: false }),
            },
            orderBy: { createdAt: "desc" },
            take: 50,
        });
        return notifications;
    }
    async markAsRead(notificationId, userId) {
        const notification = await prisma_1.default.notification.findFirst({
            where: { id: notificationId, userId },
        });
        if (!notification) {
            return false;
        }
        await prisma_1.default.notification.update({
            where: { id: notificationId },
            data: { read: true },
        });
        return true;
    }
    async markAllAsRead(userId) {
        const result = await prisma_1.default.notification.updateMany({
            where: { userId, read: false },
            data: { read: true },
        });
        return result.count;
    }
    extractMentions(text) {
        const mentionRegex = /@(\w+)/g;
        const mentions = [];
        let match;
        while ((match = mentionRegex.exec(text)) !== null) {
            if (match[1]) {
                mentions.push(match[1]);
            }
        }
        return mentions;
    }
}
exports.NotificationService = NotificationService;
exports.default = new NotificationService();

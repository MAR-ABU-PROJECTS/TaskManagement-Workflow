"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommentService = void 0;
const prisma_1 = __importDefault(require("../db/prisma"));
const NotificationService_1 = __importDefault(require("./NotificationService"));
const ActivityLogService_1 = __importDefault(require("./ActivityLogService"));
const enums_1 = require("../types/enums");
const EmailService_1 = __importDefault(require("./EmailService"));
class CommentService {
    async createComment(taskId, userId, data) {
        const task = await prisma_1.default.task.findUnique({
            where: { id: taskId },
            include: {
                creator: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                assignee: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                project: {
                    select: {
                        name: true,
                    },
                },
            },
        });
        if (!task) {
            throw new Error("Task not found");
        }
        const comment = await prisma_1.default.taskComment.create({
            data: {
                taskId,
                userId,
                message: data.message,
            },
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
        await ActivityLogService_1.default.logActivity({
            taskId,
            userId,
            action: enums_1.ActivityAction.COMMENT,
            metadata: { commentId: comment.id },
        });
        if (task.creator && task.creator.id !== userId) {
            EmailService_1.default
                .sendCommentNotificationEmail(task.creator.email, {
                recipientName: task.creator.name,
                commenterName: comment.user.name,
                taskTitle: task.title,
                taskId: task.id,
                commentText: data.message,
                projectName: task.project?.name,
            })
                .catch((err) => console.error("Failed to send comment email to creator:", err));
        }
        if (task.assignee &&
            task.assignee.id !== userId &&
            task.assignee.id !== task.creator?.id) {
            EmailService_1.default
                .sendCommentNotificationEmail(task.assignee.email, {
                recipientName: task.assignee.name,
                commenterName: comment.user.name,
                taskTitle: task.title,
                taskId: task.id,
                commentText: data.message,
                projectName: task.project?.name,
            })
                .catch((err) => console.error("Failed to send comment email to assignee:", err));
        }
        const mentionRegex = /@(\w+)/g;
        const mentions = data.message.match(mentionRegex);
        if (mentions) {
            const usernames = mentions.map((m) => m.substring(1));
            const mentionedUsers = await prisma_1.default.user.findMany({
                where: {
                    OR: [
                        { name: { in: usernames } },
                        { email: { in: usernames.map((u) => `${u}@example.com`) } },
                    ],
                },
            });
            for (const user of mentionedUsers) {
                await NotificationService_1.default.notifyComment(taskId, user.id, data.message);
            }
        }
        await NotificationService_1.default.notifyComment(taskId, userId, data.message);
        return comment;
    }
    async getTaskComments(taskId) {
        const comments = await prisma_1.default.taskComment.findMany({
            where: { taskId },
            orderBy: { createdAt: "desc" },
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
        return comments;
    }
    async deleteComment(commentId, userId, userRole) {
        const comment = await prisma_1.default.taskComment.findUnique({
            where: { id: commentId },
        });
        if (!comment) {
            return false;
        }
        const canDelete = comment.userId === userId || ["CEO", "HOO", "HR"].includes(userRole);
        if (!canDelete) {
            throw new Error("Forbidden: You cannot delete this comment");
        }
        await prisma_1.default.taskComment.delete({
            where: { id: commentId },
        });
        return true;
    }
}
exports.CommentService = CommentService;
exports.default = new CommentService();

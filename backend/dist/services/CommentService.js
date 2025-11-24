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
class CommentService {
    async createComment(taskId, userId, data) {
        const task = await prisma_1.default.task.findUnique({
            where: { id: taskId },
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

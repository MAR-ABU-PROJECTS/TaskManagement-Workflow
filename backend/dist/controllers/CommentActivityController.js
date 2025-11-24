"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationController = exports.activityLogController = exports.commentController = exports.NotificationController = exports.ActivityLogController = exports.CommentController = void 0;
const CommentService_1 = __importDefault(require("../services/CommentService"));
const ActivityLogService_1 = __importDefault(require("../services/ActivityLogService"));
const NotificationService_1 = __importDefault(require("../services/NotificationService"));
class CommentController {
    async createComment(req, res) {
        try {
            if (!req.user) {
                return res.status(401).json({ message: "Unauthorized" });
            }
            const { id: taskId } = req.params;
            if (!taskId) {
                return res.status(400).json({ message: "Task ID is required" });
            }
            const data = req.body;
            if (!data.message || data.message.trim() === "") {
                return res.status(400).json({ message: "Comment message is required" });
            }
            const comment = await CommentService_1.default.createComment(taskId, req.user.id, data);
            return res.status(201).json({
                message: "Comment created successfully",
                data: comment,
            });
        }
        catch (error) {
            if (error.message === "Task not found") {
                return res.status(404).json({ message: error.message });
            }
            return res.status(500).json({
                message: "Failed to create comment",
                error: error.message,
            });
        }
    }
    async getTaskComments(req, res) {
        try {
            if (!req.user) {
                return res.status(401).json({ message: "Unauthorized" });
            }
            const { id: taskId } = req.params;
            if (!taskId) {
                return res.status(400).json({ message: "Task ID is required" });
            }
            const comments = await CommentService_1.default.getTaskComments(taskId);
            return res.status(200).json({
                message: "Comments retrieved successfully",
                data: comments,
                count: comments.length,
            });
        }
        catch (error) {
            return res.status(500).json({
                message: "Failed to retrieve comments",
                error: error.message,
            });
        }
    }
    async deleteComment(req, res) {
        try {
            if (!req.user) {
                return res.status(401).json({ message: "Unauthorized" });
            }
            const { commentId } = req.params;
            if (!commentId) {
                return res.status(400).json({ message: "Comment ID is required" });
            }
            const success = await CommentService_1.default.deleteComment(commentId, req.user.id, req.user.role);
            if (!success) {
                return res.status(404).json({ message: "Comment not found" });
            }
            return res.status(200).json({
                message: "Comment deleted successfully",
            });
        }
        catch (error) {
            if (error.message.includes("Forbidden")) {
                return res.status(403).json({ message: error.message });
            }
            return res.status(500).json({
                message: "Failed to delete comment",
                error: error.message,
            });
        }
    }
}
exports.CommentController = CommentController;
class ActivityLogController {
    async getTaskLogs(req, res) {
        try {
            if (!req.user) {
                return res.status(401).json({ message: "Unauthorized" });
            }
            const { id: taskId } = req.params;
            if (!taskId) {
                return res.status(400).json({ message: "Task ID is required" });
            }
            const logs = await ActivityLogService_1.default.getTaskLogs(taskId);
            return res.status(200).json({
                message: "Activity logs retrieved successfully",
                data: logs,
                count: logs.length,
            });
        }
        catch (error) {
            return res.status(500).json({
                message: "Failed to retrieve activity logs",
                error: error.message,
            });
        }
    }
}
exports.ActivityLogController = ActivityLogController;
class NotificationController {
    async getUserNotifications(req, res) {
        try {
            if (!req.user) {
                return res.status(401).json({ message: "Unauthorized" });
            }
            const unreadOnly = req.query.unread === "true";
            const notifications = await NotificationService_1.default.getUserNotifications(req.user.id, unreadOnly);
            return res.status(200).json({
                message: "Notifications retrieved successfully",
                data: notifications,
                count: notifications.length,
            });
        }
        catch (error) {
            return res.status(500).json({
                message: "Failed to retrieve notifications",
                error: error.message,
            });
        }
    }
    async markAsRead(req, res) {
        try {
            if (!req.user) {
                return res.status(401).json({ message: "Unauthorized" });
            }
            const { id } = req.params;
            if (!id) {
                return res.status(400).json({ message: "Notification ID is required" });
            }
            const success = await NotificationService_1.default.markAsRead(id, req.user.id);
            if (!success) {
                return res.status(404).json({ message: "Notification not found" });
            }
            return res.status(200).json({
                message: "Notification marked as read",
            });
        }
        catch (error) {
            return res.status(500).json({
                message: "Failed to mark notification as read",
                error: error.message,
            });
        }
    }
    async markAllAsRead(req, res) {
        try {
            if (!req.user) {
                return res.status(401).json({ message: "Unauthorized" });
            }
            const count = await NotificationService_1.default.markAllAsRead(req.user.id);
            return res.status(200).json({
                message: `${count} notifications marked as read`,
                count,
            });
        }
        catch (error) {
            return res.status(500).json({
                message: "Failed to mark notifications as read",
                error: error.message,
            });
        }
    }
}
exports.NotificationController = NotificationController;
exports.commentController = new CommentController();
exports.activityLogController = new ActivityLogController();
exports.notificationController = new NotificationController();

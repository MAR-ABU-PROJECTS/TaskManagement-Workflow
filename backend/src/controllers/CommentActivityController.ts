import { Request, Response } from "express";
import CommentService from "../services/CommentService";
import ActivityLogService from "../services/ActivityLogService";
import NotificationService from "../services/NotificationService";
import { CreateCommentDTO } from "../types/interfaces";

export class CommentController {
  /**
   * POST /tasks/:id/comments - Create a comment
   */
  async createComment(req: Request, res: Response): Promise<Response> {
    try {
      if (!req.user) {
        return res
          .status(403)
          .json({ message: "Forbidden: Authentication required" });
      }

      const { id: taskId } = req.params;
      if (!taskId) {
        return res.status(400).json({ message: "Task ID is required" });
      }

      const data: CreateCommentDTO = req.body;

      // Accept both 'content' and 'message' fields
      const commentText = data.content || data.message;

      if (!commentText || commentText.trim() === "") {
        return res.status(400).json({ message: "Comment message is required" });
      }

      // Normalize to use 'message' field
      const normalizedData = { ...data, message: commentText };

      const comment = await CommentService.createComment(
        taskId,
        req.user.id,
        normalizedData
      );

      return res.status(201).json({
        message: "Comment created successfully",
        data: comment,
      });
    } catch (error: any) {
      if (error.message === "Task not found") {
        return res.status(404).json({ message: error.message });
      }
      return res.status(500).json({
        message: "Failed to create comment",
        error: error.message,
      });
    }
  }

  /**
   * GET /tasks/:id/comments - Get task comments
   */
  async getTaskComments(req: Request, res: Response): Promise<Response> {
    try {
      if (!req.user) {
        return res
          .status(403)
          .json({ message: "Forbidden: Authentication required" });
      }

      const { id: taskId } = req.params;
      if (!taskId) {
        return res.status(400).json({ message: "Task ID is required" });
      }

      const comments = await CommentService.getTaskComments(taskId);

      return res.status(200).json({
        message: "Comments retrieved successfully",
        data: comments,
        count: comments.length,
      });
    } catch (error: any) {
      return res.status(500).json({
        message: "Failed to retrieve comments",
        error: error.message,
      });
    }
  }

  /**
   * DELETE /tasks/:taskId/comments/:commentId - Delete a comment
   */
  async deleteComment(req: Request, res: Response): Promise<Response> {
    try {
      if (!req.user) {
        return res
          .status(403)
          .json({ message: "Forbidden: Authentication required" });
      }

      const { commentId } = req.params;
      if (!commentId) {
        return res.status(400).json({ message: "Comment ID is required" });
      }

      const success = await CommentService.deleteComment(
        commentId,
        req.user.id,
        req.user.role
      );

      if (!success) {
        return res.status(404).json({ message: "Comment not found" });
      }

      return res.status(200).json({
        message: "Comment deleted successfully",
      });
    } catch (error: any) {
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

export class ActivityLogController {
  /**
   * GET /tasks/:id/logs - Get activity logs for a task
   */
  async getTaskLogs(req: Request, res: Response): Promise<Response> {
    try {
      if (!req.user) {
        return res
          .status(403)
          .json({ message: "Forbidden: Authentication required" });
      }

      const { id: taskId } = req.params;
      if (!taskId) {
        return res.status(400).json({ message: "Task ID is required" });
      }

      const logs = await ActivityLogService.getTaskLogs(taskId);

      return res.status(200).json({
        message: "Activity logs retrieved successfully",
        data: logs,
        count: logs.length,
      });
    } catch (error: any) {
      return res.status(500).json({
        message: "Failed to retrieve activity logs",
        error: error.message,
      });
    }
  }
}

export class NotificationController {
  /**
   * GET /notifications - Get user notifications
   */
  async getUserNotifications(req: Request, res: Response): Promise<Response> {
    try {
      if (!req.user) {
        return res
          .status(403)
          .json({ message: "Forbidden: Authentication required" });
      }

      const unreadOnly = req.query.unread === "true";
      const notifications = await NotificationService.getUserNotifications(
        req.user.id,
        unreadOnly
      );

      return res.status(200).json({
        message: "Notifications retrieved successfully",
        data: notifications,
        count: notifications.length,
      });
    } catch (error: any) {
      return res.status(500).json({
        message: "Failed to retrieve notifications",
        error: error.message,
      });
    }
  }

  /**
   * PATCH /notifications/:id/read - Mark notification as read
   */
  async markAsRead(req: Request, res: Response): Promise<Response> {
    try {
      if (!req.user) {
        return res
          .status(403)
          .json({ message: "Forbidden: Authentication required" });
      }

      const { id } = req.params;
      if (!id) {
        return res.status(400).json({ message: "Notification ID is required" });
      }

      const success = await NotificationService.markAsRead(id, req.user.id);

      if (!success) {
        return res.status(404).json({ message: "Notification not found" });
      }

      return res.status(200).json({
        message: "Notification marked as read",
      });
    } catch (error: any) {
      return res.status(500).json({
        message: "Failed to mark notification as read",
        error: error.message,
      });
    }
  }

  /**
   * PATCH /notifications/read-all - Mark all notifications as read
   */
  async markAllAsRead(req: Request, res: Response): Promise<Response> {
    try {
      if (!req.user) {
        return res
          .status(403)
          .json({ message: "Forbidden: Authentication required" });
      }

      const count = await NotificationService.markAllAsRead(req.user.id);

      return res.status(200).json({
        message: `${count} notifications marked as read`,
        count,
      });
    } catch (error: any) {
      return res.status(500).json({
        message: "Failed to mark notifications as read",
        error: error.message,
      });
    }
  }
}

export const commentController = new CommentController();
export const activityLogController = new ActivityLogController();
export const notificationController = new NotificationController();

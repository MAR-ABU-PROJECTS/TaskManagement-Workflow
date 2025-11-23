import express from "express";
import { authenticate } from "../middleware/auth";
import {
  commentController,
  activityLogController,
} from "../controllers/CommentActivityController";

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   POST /api/tasks/:id/comments
 * @desc    Create a comment on a task
 * @access  Authenticated users
 */
router.post("/:id/comments", (req, res) =>
  commentController.createComment(req, res)
);

/**
 * @route   GET /api/tasks/:id/comments
 * @desc    Get all comments for a task
 * @access  Authenticated users
 */
router.get("/:id/comments", (req, res) =>
  commentController.getTaskComments(req, res)
);

/**
 * @route   DELETE /api/tasks/:taskId/comments/:commentId
 * @desc    Delete a comment
 * @access  Comment creator or Management
 */
router.delete("/:taskId/comments/:commentId", (req, res) =>
  commentController.deleteComment(req, res)
);

/**
 * @route   GET /api/tasks/:id/logs
 * @desc    Get activity logs for a task
 * @access  Authenticated users
 */
router.get("/:id/logs", (req, res) =>
  activityLogController.getTaskLogs(req, res)
);

export default router;

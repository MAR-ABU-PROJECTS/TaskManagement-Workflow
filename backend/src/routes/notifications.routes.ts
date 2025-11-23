import express from "express";
import { authenticate } from "../middleware/auth";
import { notificationController } from "../controllers/CommentActivityController";

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/notifications
 * @desc    Get user notifications
 * @query   unread=true (optional) - Get only unread notifications
 * @access  Authenticated users
 */
router.get("/", (req, res) =>
  notificationController.getUserNotifications(req, res)
);

/**
 * @route   PATCH /api/notifications/:id/read
 * @desc    Mark notification as read
 * @access  Authenticated users
 */
router.patch("/:id/read", (req, res) =>
  notificationController.markAsRead(req, res)
);

/**
 * @route   PATCH /api/notifications/read-all
 * @desc    Mark all notifications as read
 * @access  Authenticated users
 */
router.patch("/read-all", (req, res) =>
  notificationController.markAllAsRead(req, res)
);

export default router;

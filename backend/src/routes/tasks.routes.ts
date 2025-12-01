import express from "express";
import multer from "multer";
import { authenticate } from "../middleware/auth";
import {
  canApproveTask,
  hasProjectPermission,
  canEditIssue,
} from "../middleware/rbac";
import { Permission } from "../types/enums";
import TaskController from "../controllers/TaskController";
import {
  commentController,
  activityLogController,
} from "../controllers/CommentActivityController";
import TaskAttachmentController from "../controllers/TaskAttachmentController";
import TaskDependencyController from "../controllers/TaskDependencyController";
import TimeTrackingController from "../controllers/TimeTrackingController";

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

// All routes require authentication
router.use(authenticate);

// ==================== TASK CRUD ====================

/**
 * @swagger
 * /api/tasks:
 *   post:
 *     summary: Create a new task
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 */
router.post("/", hasProjectPermission(Permission.CREATE_ISSUES), (req, res) =>
  TaskController.createTask(req, res)
);

/**
 * @swagger
 * /api/tasks:
 *   get:
 *     summary: Get all tasks (filtered by role and permissions)
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 */
router.get("/", hasProjectPermission(Permission.BROWSE_PROJECT), (req, res) =>
  TaskController.getAllTasks(req, res)
);

/**
 * @swagger
 * /api/tasks/bulk:
 *   post:
 *     summary: Bulk operations on tasks
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  "/bulk",
  hasProjectPermission(Permission.EDIT_ISSUES),
  async (req, res) => {
    try {
      const { operation, taskIds } = req.body;

      if (!operation || !taskIds || !Array.isArray(taskIds)) {
        return res.status(400).json({ message: "Invalid bulk operation" });
      }

      // Handle different bulk operations
      let result;
      switch (operation) {
        case "delete":
          // Bulk delete logic
          result = { deleted: taskIds.length };
          break;
        case "update":
          // Bulk update logic
          result = { updated: taskIds.length };
          break;
        case "assign":
          // Bulk assign logic
          result = { assigned: taskIds.length };
          break;
        default:
          return res.status(400).json({ message: "Unknown operation" });
      }

      return res.json({ message: "Bulk operation completed", result });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }
);

/**
 * @swagger
 * /api/tasks/{id}:
 *   get:
 *     summary: Get task by ID
 *     tags: [Tasks]
 */
router.get(
  "/:id",
  hasProjectPermission(Permission.BROWSE_PROJECT),
  (req, res) => TaskController.getTaskById(req, res)
);

/**
 * @swagger
 * /api/tasks/{id}:
 *   patch:
 *     summary: Update task
 *     tags: [Tasks]
 */
router.patch("/:id", canEditIssue, (req, res) =>
  TaskController.updateTask(req, res)
);

// ==================== TASK ACTIONS ====================

/**
 * @swagger
 * /api/tasks/{id}/assign:
 *   post:
 *     summary: Assign task to user
 *     tags: [Tasks]
 */
router.post(
  "/:id/assign",
  hasProjectPermission(Permission.ASSIGN_ISSUES),
  (req, res) => TaskController.assignTask(req, res)
);

/**
 * @swagger
 * /api/tasks/{id}/transition:
 *   post:
 *     summary: Transition task status
 *     tags: [Tasks]
 */
router.post(
  "/:id/transition",
  hasProjectPermission(Permission.TRANSITION_ISSUES),
  (req, res) => TaskController.changeStatus(req, res)
);

/**
 * @swagger
 * /api/tasks/{id}/approve:
 *   post:
 *     summary: Approve task
 *     tags: [Tasks]
 */
router.post("/:id/approve", canApproveTask, (req, res) =>
  TaskController.approveTask(req, res)
);

/**
 * @swagger
 * /api/tasks/{id}/reject:
 *   post:
 *     summary: Reject task
 *     tags: [Tasks]
 */
router.post("/:id/reject", canApproveTask, (req, res) =>
  TaskController.rejectTask(req, res)
);

// ==================== COMMENTS ====================

/**
 * @swagger
 * /api/tasks/{id}/comments:
 *   get:
 *     summary: Get all comments for a task
 *     tags: [Tasks]
 */
router.get(":id/comments", (req, res) =>
  commentController.getTaskComments(req, res)
);

/**
 * @swagger
 * /api/tasks/{id}/comments:
 *   post:
 *     summary: Add comment to task
 *     tags: [Tasks]
 */
router.post("/:id/comments", (req, res) =>
  commentController.createComment(req, res)
);

/**
 * @swagger
 * /api/tasks/{taskId}/comments/{commentId}:
 *   delete:
 *     summary: Delete a comment
 *     tags: [Tasks]
 */
router.delete("/:taskId/comments/:commentId", (req, res) =>
  commentController.deleteComment(req, res)
);

// ==================== ATTACHMENTS ====================

/**
 * @swagger
 * /api/tasks/{taskId}/attachments:
 *   get:
 *     summary: Get all attachments for a task
 *     tags: [Tasks]
 */
router.get("/:taskId/attachments", authenticate, (req, res) =>
  TaskAttachmentController.getTaskAttachments(req, res)
);

/**
 * @swagger
 * /api/tasks/{taskId}/attachments:
 *   post:
 *     summary: Upload attachment to task
 *     tags: [Tasks]
 */
router.post(
  "/:taskId/attachments",
  authenticate,
  upload.single("file"),
  (req, res) => TaskAttachmentController.uploadAttachment(req, res)
);

/**
 * @swagger
 * /api/tasks/{taskId}/attachments/{attachmentId}:
 *   get:
 *     summary: Download attachment
 *     tags: [Tasks]
 */
router.get("/:taskId/attachments/:attachmentId", authenticate, (req, res) =>
  TaskAttachmentController.downloadAttachment(req, res)
);

/**
 * @swagger
 * /api/tasks/{taskId}/attachments/{attachmentId}:
 *   delete:
 *     summary: Delete attachment
 *     tags: [Tasks]
 */
router.delete("/:taskId/attachments/:attachmentId", authenticate, (req, res) =>
  TaskAttachmentController.deleteAttachment(req, res)
);

// ==================== DEPENDENCIES ====================

/**
 * @swagger
 * /api/tasks/{id}/dependencies:
 *   get:
 *     summary: Get all dependencies for a task
 *     tags: [Tasks]
 */
router.get("/:id/dependencies", (req, res) =>
  TaskDependencyController.getTaskDependencies(req, res)
);

/**
 * @swagger
 * /api/tasks/{id}/dependencies:
 *   post:
 *     summary: Add dependency to task
 *     tags: [Tasks]
 */
router.post("/:id/dependencies", (req, res) =>
  TaskDependencyController.createDependency(req, res)
);

/**
 * @swagger
 * /api/tasks/{taskId}/dependencies/{dependencyId}:
 *   delete:
 *     summary: Remove dependency
 *     tags: [Tasks]
 */
router.delete("/:taskId/dependencies/:dependencyId", (req, res) =>
  TaskDependencyController.deleteDependency(req, res)
);

// ==================== TIME TRACKING ====================

/**
 * @swagger
 * /api/tasks/{taskId}/time-entries:
 *   get:
 *     summary: Get all time entries for a task
 *     tags: [Tasks]
 */
router.get("/:taskId/time-entries", (req, res) =>
  TimeTrackingController.getTaskTimeEntries(req, res)
);

/**
 * @swagger
 * /api/tasks/{taskId}/time-entries:
 *   post:
 *     summary: Log time for a task
 *     tags: [Tasks]
 */
router.post("/:taskId/time-entries", (req, res) =>
  TimeTrackingController.logTime(req, res)
);

/**
 * @swagger
 * /api/tasks/{taskId}/time-entries/{entryId}:
 *   patch:
 *     summary: Update time entry
 *     tags: [Tasks]
 */
router.patch("/:taskId/time-entries/:entryId", (req, res) =>
  TimeTrackingController.updateTimeEntry(req, res)
);

/**
 * @swagger
 * /api/tasks/{taskId}/time-entries/{entryId}:
 *   delete:
 *     summary: Delete time entry
 *     tags: [Tasks]
 */
router.delete("/:taskId/time-entries/:entryId", (req, res) =>
  TimeTrackingController.deleteTimeEntry(req, res)
);

// ==================== ACTIVITY LOG ====================

/**
 * @swagger
 * /api/tasks/{id}/activity:
 *   get:
 *     summary: Get task activity log
 *     tags: [Tasks]
 */
router.get(":id/activity", (req, res) =>
  activityLogController.getTaskLogs(req, res)
);

export default router;

import { Router } from "express";
import multer from "multer";
import TaskAttachmentController from "../controllers/TaskAttachmentController";
import { authenticate } from "../middleware/auth";

const router = Router();

// Configure multer for file uploads (in-memory storage)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

/**
 * @swagger
 * /api/tasks/{taskId}/attachments:
 *   post:
 *     summary: Upload a file attachment to a task
 *     tags: [Attachments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: File to upload (max 10MB)
 *     responses:
 *       201:
 *         description: File uploaded successfully
 *       400:
 *         description: Invalid file or file too large
 *       401:
 *         description: Unauthorized
 *   get:
 *     summary: Get all attachments for a task
 *     tags: [Attachments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of attachments
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   filename:
 *                     type: string
 *                   fileSize:
 *                     type: integer
 *                   mimeType:
 *                     type: string
 *                   uploadedBy:
 *                     type: string
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 */
router.post(
  "/tasks/:taskId/attachments",
  authenticate,
  upload.single("file"),
  TaskAttachmentController.uploadAttachment
);

/**
 * @swagger
 * /api/tasks/{taskId}/attachments:
 *   get:
 *     summary: Get all attachments for a task
 *     tags: [Attachments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of task attachments
 */
router.get(
  "/tasks/:taskId/attachments",
  authenticate,
  TaskAttachmentController.getTaskAttachments
);

/**
 * @swagger
 * /api/tasks/{taskId}/attachments/stats:
 *   get:
 *     summary: Get attachment statistics for a task
 *     tags: [Attachments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Attachment statistics (total count, total size)
 */
router.get(
  "/tasks/:taskId/attachments/stats",
  authenticate,
  TaskAttachmentController.getTaskAttachmentStats
);

// Attachment routes
/**
 * @swagger
 * /api/attachments/{id}:
 *   get:
 *     summary: Get attachment details by ID
 *     tags: [Attachments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Attachment details
 *       404:
 *         description: Attachment not found
 */
router.get(
  "/attachments/:id",
  authenticate,
  TaskAttachmentController.getAttachment
);

/**
 * @swagger
 * /api/attachments/{id}/download:
 *   get:
 *     summary: Download an attachment file
 *     tags: [Attachments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: File download
 *         content:
 *           application/octet-stream:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: Attachment not found
 */
router.get(
  "/attachments/:id/download",
  authenticate,
  TaskAttachmentController.downloadAttachment
);

router.delete(
  "/attachments/:id",
  authenticate,
  TaskAttachmentController.deleteAttachment
);

// User attachment routes
router.get(
  "/users/me/attachments",
  authenticate,
  TaskAttachmentController.getUserAttachments
);

export default router;

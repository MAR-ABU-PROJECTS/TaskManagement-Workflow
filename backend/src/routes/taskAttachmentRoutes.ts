import { Router } from 'express';
import { TaskAttachmentController } from '../controllers/TaskAttachmentController';
import { authenticateToken } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { param, query } from 'express-validator';

const router = Router();
const attachmentController = new TaskAttachmentController();

// Validation schemas
const taskIdValidation = [
  param('taskId').isUUID().withMessage('Invalid task ID')
];

const attachmentIdValidation = [
  param('attachmentId').isUUID().withMessage('Invalid attachment ID')
];

const searchAttachmentsValidation = [
  query('taskId').optional().isUUID().withMessage('Invalid task ID'),
  query('uploadedBy').optional().isUUID().withMessage('Invalid uploader ID'),
  query('mimeType').optional().isString().withMessage('Invalid mime type'),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('sortBy').optional().isIn(['createdAt', 'originalName', 'size', 'mimeType']).withMessage('Invalid sort field'),
  query('sortOrder').optional().isIn(['asc', 'desc']).withMessage('Sort order must be asc or desc')
];

// Task attachment routes
router.post(
  '/tasks/:taskId/attachments',
  authenticateToken,
  taskIdValidation,
  validateRequest,
  attachmentController.getUploadMiddleware(),
  attachmentController.uploadAttachment.bind(attachmentController)
);

router.get(
  '/tasks/:taskId/attachments',
  authenticateToken,
  taskIdValidation,
  validateRequest,
  attachmentController.getTaskAttachments.bind(attachmentController)
);

// Attachment management routes
router.get(
  '/attachments/:attachmentId',
  authenticateToken,
  attachmentIdValidation,
  validateRequest,
  attachmentController.getAttachment.bind(attachmentController)
);

router.get(
  '/attachments/:attachmentId/download',
  authenticateToken,
  attachmentIdValidation,
  validateRequest,
  attachmentController.downloadAttachment.bind(attachmentController)
);

router.delete(
  '/attachments/:attachmentId',
  authenticateToken,
  attachmentIdValidation,
  validateRequest,
  attachmentController.deleteAttachment.bind(attachmentController)
);

// Search and statistics
router.get(
  '/attachments/search',
  authenticateToken,
  searchAttachmentsValidation,
  validateRequest,
  attachmentController.searchAttachments.bind(attachmentController)
);

router.get(
  '/attachments/statistics',
  authenticateToken,
  attachmentController.getAttachmentStatistics.bind(attachmentController)
);

export { router as taskAttachmentRoutes };
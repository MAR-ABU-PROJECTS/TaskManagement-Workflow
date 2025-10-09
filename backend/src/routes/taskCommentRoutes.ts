import { Router } from 'express';
import { TaskCommentController } from '../controllers/TaskCommentController';
import { authenticateToken } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { body, param, query } from 'express-validator';

const router = Router();
const commentController = new TaskCommentController();

// Validation schemas
const createCommentValidation = [
  param('taskId').isUUID().withMessage('Invalid task ID'),
  body('content')
    .notEmpty()
    .withMessage('Comment content is required')
    .isLength({ max: 10000 })
    .withMessage('Comment content cannot exceed 10000 characters'),
  body('parentId')
    .optional()
    .isUUID()
    .withMessage('Invalid parent comment ID')
];

const updateCommentValidation = [
  param('commentId').isUUID().withMessage('Invalid comment ID'),
  body('content')
    .notEmpty()
    .withMessage('Comment content is required')
    .isLength({ max: 10000 })
    .withMessage('Comment content cannot exceed 10000 characters')
];

const commentIdValidation = [
  param('commentId').isUUID().withMessage('Invalid comment ID')
];

const taskIdValidation = [
  param('taskId').isUUID().withMessage('Invalid task ID')
];

const searchCommentsValidation = [
  query('taskId').optional().isUUID().withMessage('Invalid task ID'),
  query('authorId').optional().isUUID().withMessage('Invalid author ID'),
  query('parentId').optional().custom((value) => {
    if (value === 'null') return true;
    if (!value) return true;
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
  }).withMessage('Invalid parent ID'),
  query('includeReplies').optional().isBoolean().withMessage('includeReplies must be a boolean'),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('sortBy').optional().isIn(['createdAt', 'updatedAt', 'content']).withMessage('Invalid sort field'),
  query('sortOrder').optional().isIn(['asc', 'desc']).withMessage('Sort order must be asc or desc')
];

// Task comment routes
router.post(
  '/tasks/:taskId/comments',
  authenticateToken,
  createCommentValidation,
  validateRequest,
  commentController.createComment.bind(commentController)
);

router.get(
  '/tasks/:taskId/comments',
  authenticateToken,
  taskIdValidation,
  validateRequest,
  commentController.getTaskComments.bind(commentController)
);

// Comment management routes
router.get(
  '/comments/:commentId',
  authenticateToken,
  commentIdValidation,
  validateRequest,
  commentController.getComment.bind(commentController)
);

router.put(
  '/comments/:commentId',
  authenticateToken,
  updateCommentValidation,
  validateRequest,
  commentController.updateComment.bind(commentController)
);

router.delete(
  '/comments/:commentId',
  authenticateToken,
  commentIdValidation,
  validateRequest,
  commentController.deleteComment.bind(commentController)
);

router.get(
  '/comments/:commentId/thread',
  authenticateToken,
  commentIdValidation,
  validateRequest,
  commentController.getCommentThread.bind(commentController)
);

// Search comments
router.get(
  '/comments/search',
  authenticateToken,
  searchCommentsValidation,
  validateRequest,
  commentController.searchComments.bind(commentController)
);

export { router as taskCommentRoutes };
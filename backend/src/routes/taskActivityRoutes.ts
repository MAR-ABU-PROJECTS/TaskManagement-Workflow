import { Router } from 'express';
import { TaskActivityController } from '../controllers/TaskActivityController';
import { authenticateToken } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { param, query } from 'express-validator';

const router = Router();
const activityController = new TaskActivityController();

// Validation schemas
const taskIdValidation = [
  param('taskId').isUUID().withMessage('Invalid task ID')
];

const activityFeedValidation = [
  query('taskId').optional().isUUID().withMessage('Invalid task ID'),
  query('userId').optional().isUUID().withMessage('Invalid user ID'),
  query('action').optional().isString().withMessage('Invalid action'),
  query('field').optional().isString().withMessage('Invalid field'),
  query('dateFrom').optional().isISO8601().withMessage('Invalid date format for dateFrom'),
  query('dateTo').optional().isISO8601().withMessage('Invalid date format for dateTo'),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('sortOrder').optional().isIn(['asc', 'desc']).withMessage('Sort order must be asc or desc')
];

const activityStatisticsValidation = [
  query('taskId').optional().isUUID().withMessage('Invalid task ID'),
  query('userId').optional().isUUID().withMessage('Invalid user ID'),
  query('dateFrom').optional().isISO8601().withMessage('Invalid date format for dateFrom'),
  query('dateTo').optional().isISO8601().withMessage('Invalid date format for dateTo')
];

const recentActivityValidation = [
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('taskIds').optional().isString().withMessage('Task IDs must be a comma-separated string')
];

const cleanupValidation = [
  query('olderThanDays').optional().isInt({ min: 1 }).withMessage('olderThanDays must be a positive integer')
];

// Task activity routes
router.get(
  '/tasks/:taskId/activity',
  authenticateToken,
  taskIdValidation,
  activityFeedValidation,
  validateRequest,
  activityController.getTaskActivity.bind(activityController)
);

// Activity feed and statistics
router.get(
  '/activity/feed',
  authenticateToken,
  activityFeedValidation,
  validateRequest,
  activityController.getActivityFeed.bind(activityController)
);

router.get(
  '/activity/statistics',
  authenticateToken,
  activityStatisticsValidation,
  validateRequest,
  activityController.getActivityStatistics.bind(activityController)
);

router.get(
  '/activity/recent',
  authenticateToken,
  recentActivityValidation,
  validateRequest,
  activityController.getUserRecentActivity.bind(activityController)
);

// Admin routes
router.delete(
  '/activity/cleanup',
  authenticateToken,
  cleanupValidation,
  validateRequest,
  activityController.cleanupOldActivity.bind(activityController)
);

export { router as taskActivityRoutes };
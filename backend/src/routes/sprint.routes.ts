import { Router } from 'express';
import { SprintController } from '../controllers/SprintController';
import { authenticateToken } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { body, param, query } from 'express-validator';

const router = Router();
const sprintController = new SprintController();

// Validation schemas
const createSprintValidation = [
  body('name')
    .notEmpty()
    .withMessage('Sprint name is required')
    .isLength({ max: 255 })
    .withMessage('Sprint name must be less than 255 characters'),
  body('goal')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Sprint goal must be less than 1000 characters'),
  body('projectId')
    .isUUID()
    .withMessage('Invalid project ID'),
  body('startDate')
    .isISO8601()
    .withMessage('Invalid start date format'),
  body('endDate')
    .isISO8601()
    .withMessage('Invalid end date format'),
  body('capacity')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Capacity must be a non-negative integer')
];

const updateSprintValidation = [
  param('sprintId').isUUID().withMessage('Invalid sprint ID'),
  body('name')
    .optional()
    .notEmpty()
    .withMessage('Sprint name cannot be empty')
    .isLength({ max: 255 })
    .withMessage('Sprint name must be less than 255 characters'),
  body('goal')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Sprint goal must be less than 1000 characters'),
  body('startDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid start date format'),
  body('endDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid end date format'),
  body('status')
    .optional()
    .isIn(['PLANNING', 'ACTIVE', 'COMPLETED', 'CANCELLED'])
    .withMessage('Invalid sprint status'),
  body('capacity')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Capacity must be a non-negative integer'),
  body('velocity')
    .optional()
    .isNumeric()
    .withMessage('Velocity must be a number')
];

const sprintIdValidation = [
  param('sprintId').isUUID().withMessage('Invalid sprint ID')
];

const projectIdValidation = [
  param('projectId').isUUID().withMessage('Invalid project ID')
];

const addTaskToSprintValidation = [
  param('sprintId').isUUID().withMessage('Invalid sprint ID'),
  body('taskId').isUUID().withMessage('Invalid task ID')
];

const removeTaskFromSprintValidation = [
  param('sprintId').isUUID().withMessage('Invalid sprint ID'),
  param('taskId').isUUID().withMessage('Invalid task ID')
];

const searchSprintsValidation = [
  query('projectId').optional().isUUID().withMessage('Invalid project ID'),
  query('status').optional().isIn(['PLANNING', 'ACTIVE', 'COMPLETED', 'CANCELLED']).withMessage('Invalid status'),
  query('startDateFrom').optional().isISO8601().withMessage('Invalid start date from format'),
  query('startDateTo').optional().isISO8601().withMessage('Invalid start date to format'),
  query('endDateFrom').optional().isISO8601().withMessage('Invalid end date from format'),
  query('endDateTo').optional().isISO8601().withMessage('Invalid end date to format'),
  query('search').optional().isString().withMessage('Search must be a string'),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('sortBy').optional().isIn(['name', 'startDate', 'endDate', 'status', 'createdAt']).withMessage('Invalid sort field'),
  query('sortOrder').optional().isIn(['asc', 'desc']).withMessage('Sort order must be asc or desc'),
  query('includeTasks').optional().isBoolean().withMessage('includeTasks must be a boolean'),
  query('includeMetrics').optional().isBoolean().withMessage('includeMetrics must be a boolean')
];

const statisticsValidation = [
  query('projectId').optional().isUUID().withMessage('Invalid project ID')
];

// Sprint CRUD routes
router.post(
  '/',
  authenticateToken,
  createSprintValidation,
  validateRequest,
  sprintController.createSprint.bind(sprintController)
);

router.get(
  '/',
  authenticateToken,
  searchSprintsValidation,
  validateRequest,
  sprintController.searchSprints.bind(sprintController)
);

router.get(
  '/statistics',
  authenticateToken,
  statisticsValidation,
  validateRequest,
  sprintController.getSprintStatistics.bind(sprintController)
);

router.get(
  '/:sprintId',
  authenticateToken,
  sprintIdValidation,
  validateRequest,
  sprintController.getSprint.bind(sprintController)
);

router.put(
  '/:sprintId',
  authenticateToken,
  updateSprintValidation,
  validateRequest,
  sprintController.updateSprint.bind(sprintController)
);

router.delete(
  '/:sprintId',
  authenticateToken,
  sprintIdValidation,
  validateRequest,
  sprintController.deleteSprint.bind(sprintController)
);

// Sprint task management
router.post(
  '/:sprintId/tasks',
  authenticateToken,
  addTaskToSprintValidation,
  validateRequest,
  sprintController.addTaskToSprint.bind(sprintController)
);

router.delete(
  '/:sprintId/tasks/:taskId',
  authenticateToken,
  removeTaskFromSprintValidation,
  validateRequest,
  sprintController.removeTaskFromSprint.bind(sprintController)
);

// Sprint lifecycle management
router.post(
  '/:sprintId/start',
  authenticateToken,
  sprintIdValidation,
  validateRequest,
  sprintController.startSprint.bind(sprintController)
);

router.post(
  '/:sprintId/complete',
  authenticateToken,
  sprintIdValidation,
  validateRequest,
  sprintController.completeSprint.bind(sprintController)
);

// Sprint metrics and analytics
router.get(
  '/:sprintId/metrics',
  authenticateToken,
  sprintIdValidation,
  validateRequest,
  sprintController.getSprintMetrics.bind(sprintController)
);

router.get(
  '/:sprintId/capacity',
  authenticateToken,
  sprintIdValidation,
  validateRequest,
  sprintController.getSprintCapacityPlanning.bind(sprintController)
);

// Project velocity data
router.get(
  '/projects/:projectId/velocity',
  authenticateToken,
  projectIdValidation,
  validateRequest,
  sprintController.getVelocityData.bind(sprintController)
);

export default router;
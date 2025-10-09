import { Router } from 'express';
import { BacklogController } from '../controllers/BacklogController';
import { authenticateToken } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { body, param, query } from 'express-validator';

const router = Router();
const backlogController = new BacklogController();

// Validation schemas
const projectIdValidation = [
  param('projectId').isUUID().withMessage('Invalid project ID')
];

const itemIdValidation = [
  param('itemId').isUUID().withMessage('Invalid item ID')
];

const epicIdValidation = [
  param('epicId').isUUID().withMessage('Invalid epic ID')
];

const addItemValidation = [
  param('projectId').isUUID().withMessage('Invalid project ID'),
  body('taskId').isUUID().withMessage('Invalid task ID'),
  body('priority').optional().isInt({ min: 0 }).withMessage('Priority must be a non-negative integer'),
  body('storyPoints').optional().isInt({ min: 0, max: 100 }).withMessage('Story points must be between 0 and 100'),
  body('epicId').optional().isUUID().withMessage('Invalid epic ID'),
  body('businessValue').optional().isInt({ min: 0 }).withMessage('Business value must be non-negative'),
  body('riskLevel').optional().isIn(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).withMessage('Invalid risk level'),
  body('acceptanceCriteria').optional().isArray().withMessage('Acceptance criteria must be an array'),
  body('dependencies').optional().isArray().withMessage('Dependencies must be an array')
];

const updateItemValidation = [
  param('itemId').isUUID().withMessage('Invalid item ID'),
  body('priority').optional().isInt({ min: 0 }).withMessage('Priority must be a non-negative integer'),
  body('storyPoints').optional().isInt({ min: 0, max: 100 }).withMessage('Story points must be between 0 and 100'),
  body('epicId').optional().isUUID().withMessage('Invalid epic ID'),
  body('businessValue').optional().isInt({ min: 0 }).withMessage('Business value must be non-negative'),
  body('riskLevel').optional().isIn(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).withMessage('Invalid risk level'),
  body('readyForSprint').optional().isBoolean().withMessage('Ready for sprint must be a boolean'),
  body('acceptanceCriteria').optional().isArray().withMessage('Acceptance criteria must be an array'),
  body('dependencies').optional().isArray().withMessage('Dependencies must be an array')
];

const prioritizeItemValidation = [
  param('itemId').isUUID().withMessage('Invalid item ID'),
  body('newPriority').isInt({ min: 0 }).withMessage('New priority must be a non-negative integer'),
  body('reason').optional().isString().withMessage('Reason must be a string')
];

const bulkPrioritizeValidation = [
  body('items').isArray({ min: 1 }).withMessage('Items array is required and must not be empty'),
  body('items.*.itemId').isUUID().withMessage('Invalid item ID'),
  body('items.*.priority').isInt({ min: 0 }).withMessage('Priority must be a non-negative integer'),
  body('reason').optional().isString().withMessage('Reason must be a string')
];

const createEpicValidation = [
  body('title').notEmpty().withMessage('Epic title is required').isLength({ max: 255 }).withMessage('Title must be less than 255 characters'),
  body('description').optional().isLength({ max: 10000 }).withMessage('Description must be less than 10000 characters'),
  body('projectId').isUUID().withMessage('Invalid project ID'),
  body('priority').optional().isIn(['LOWEST', 'LOW', 'MEDIUM', 'HIGH', 'HIGHEST']).withMessage('Invalid priority'),
  body('ownerId').optional().isUUID().withMessage('Invalid owner ID'),
  body('startDate').optional().isISO8601().withMessage('Invalid start date format'),
  body('targetDate').optional().isISO8601().withMessage('Invalid target date format'),
  body('businessValue').optional().isInt({ min: 0 }).withMessage('Business value must be non-negative'),
  body('color').optional().isString().withMessage('Color must be a string'),
  body('labels').optional().isArray().withMessage('Labels must be an array')
];

const updateEpicValidation = [
  param('epicId').isUUID().withMessage('Invalid epic ID'),
  body('title').optional().notEmpty().withMessage('Epic title cannot be empty').isLength({ max: 255 }).withMessage('Title must be less than 255 characters'),
  body('description').optional().isLength({ max: 10000 }).withMessage('Description must be less than 10000 characters'),
  body('status').optional().isIn(['DRAFT', 'PLANNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).withMessage('Invalid status'),
  body('priority').optional().isIn(['LOWEST', 'LOW', 'MEDIUM', 'HIGH', 'HIGHEST']).withMessage('Invalid priority'),
  body('ownerId').optional().isUUID().withMessage('Invalid owner ID'),
  body('startDate').optional().isISO8601().withMessage('Invalid start date format'),
  body('targetDate').optional().isISO8601().withMessage('Invalid target date format'),
  body('businessValue').optional().isInt({ min: 0 }).withMessage('Business value must be non-negative'),
  body('color').optional().isString().withMessage('Color must be a string'),
  body('labels').optional().isArray().withMessage('Labels must be an array')
];

const searchItemsValidation = [
  query('projectId').optional().isUUID().withMessage('Invalid project ID'),
  query('epicId').optional().isUUID().withMessage('Invalid epic ID'),
  query('assigneeId').optional().isUUID().withMessage('Invalid assignee ID'),
  query('status').optional().isString().withMessage('Status must be a string'),
  query('priority').optional().isIn(['LOWEST', 'LOW', 'MEDIUM', 'HIGH', 'HIGHEST']).withMessage('Invalid priority'),
  query('riskLevel').optional().isIn(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).withMessage('Invalid risk level'),
  query('readyForSprint').optional().isBoolean().withMessage('Ready for sprint must be a boolean'),
  query('hasStoryPoints').optional().isBoolean().withMessage('Has story points must be a boolean'),
  query('labels').optional().isString().withMessage('Labels must be a comma-separated string'),
  query('search').optional().isString().withMessage('Search must be a string'),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('sortBy').optional().isIn(['priority', 'storyPoints', 'businessValue', 'createdAt', 'task.title', 'task.status']).withMessage('Invalid sort field'),
  query('sortOrder').optional().isIn(['asc', 'desc']).withMessage('Sort order must be asc or desc'),
  query('includeTask').optional().isBoolean().withMessage('Include task must be a boolean'),
  query('includeEpic').optional().isBoolean().withMessage('Include epic must be a boolean')
];

const searchEpicsValidation = [
  query('projectId').optional().isUUID().withMessage('Invalid project ID'),
  query('status').optional().isIn(['DRAFT', 'PLANNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).withMessage('Invalid status'),
  query('ownerId').optional().isUUID().withMessage('Invalid owner ID'),
  query('priority').optional().isIn(['LOWEST', 'LOW', 'MEDIUM', 'HIGH', 'HIGHEST']).withMessage('Invalid priority'),
  query('startDateFrom').optional().isISO8601().withMessage('Invalid start date from format'),
  query('startDateTo').optional().isISO8601().withMessage('Invalid start date to format'),
  query('targetDateFrom').optional().isISO8601().withMessage('Invalid target date from format'),
  query('targetDateTo').optional().isISO8601().withMessage('Invalid target date to format'),
  query('search').optional().isString().withMessage('Search must be a string'),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('sortBy').optional().isIn(['title', 'status', 'priority', 'startDate', 'targetDate', 'createdAt']).withMessage('Invalid sort field'),
  query('sortOrder').optional().isIn(['asc', 'desc']).withMessage('Sort order must be asc or desc'),
  query('includeStories').optional().isBoolean().withMessage('Include stories must be a boolean'),
  query('includeProgress').optional().isBoolean().withMessage('Include progress must be a boolean')
];

// Project backlog routes
router.get(
  '/projects/:projectId/backlog',
  authenticateToken,
  projectIdValidation,
  validateRequest,
  backlogController.getProjectBacklog.bind(backlogController)
);

router.post(
  '/projects/:projectId/backlog/items',
  authenticateToken,
  addItemValidation,
  validateRequest,
  backlogController.addItemToBacklog.bind(backlogController)
);

router.get(
  '/projects/:projectId/backlog/metrics',
  authenticateToken,
  projectIdValidation,
  validateRequest,
  backlogController.getBacklogMetrics.bind(backlogController)
);

router.get(
  '/projects/:projectId/backlog/health',
  authenticateToken,
  projectIdValidation,
  validateRequest,
  backlogController.getBacklogHealth.bind(backlogController)
);

// Backlog item management
router.put(
  '/backlog/items/:itemId',
  authenticateToken,
  updateItemValidation,
  validateRequest,
  backlogController.updateBacklogItem.bind(backlogController)
);

router.delete(
  '/backlog/items/:itemId',
  authenticateToken,
  itemIdValidation,
  validateRequest,
  backlogController.removeItemFromBacklog.bind(backlogController)
);

router.put(
  '/backlog/items/:itemId/priority',
  authenticateToken,
  prioritizeItemValidation,
  validateRequest,
  backlogController.prioritizeItem.bind(backlogController)
);

router.put(
  '/backlog/items/bulk-priority',
  authenticateToken,
  bulkPrioritizeValidation,
  validateRequest,
  backlogController.bulkPrioritize.bind(backlogController)
);

router.get(
  '/backlog/items',
  authenticateToken,
  searchItemsValidation,
  validateRequest,
  backlogController.searchBacklogItems.bind(backlogController)
);

// Epic management
router.post(
  '/epics',
  authenticateToken,
  createEpicValidation,
  validateRequest,
  backlogController.createEpic.bind(backlogController)
);

router.put(
  '/epics/:epicId',
  authenticateToken,
  updateEpicValidation,
  validateRequest,
  backlogController.updateEpic.bind(backlogController)
);

router.get(
  '/epics',
  authenticateToken,
  searchEpicsValidation,
  validateRequest,
  backlogController.searchEpics.bind(backlogController)
);

export default router;

// Validation schemas
const projectIdValidation = [
  param('projectId').isUUID().withMessage('Invalid project ID')
];

const itemIdValidation = [
  param('itemId').isUUID().withMessage('Invalid item ID')
];

const epicIdValidation = [
  param('epicId').isUUID().withMessage('Invalid epic ID')
];

const addItemValidation = [
  param('projectId').isUUID().withMessage('Invalid project ID'),
  body('taskId').isUUID().withMessage('Invalid task ID'),
  body('priority').optional().isInt({ min: 0 }).withMessage('Priority must be a non-negative integer'),
  body('storyPoints').optional().isInt({ min: 0, max: 100 }).withMessage('Story points must be between 0 and 100'),
  body('epicId').optional().isUUID().withMessage('Invalid epic ID'),
  body('businessValue').optional().isInt({ min: 0 }).withMessage('Business value must be non-negative'),
  body('riskLevel').optional().isIn(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).withMessage('Invalid risk level'),
  body('acceptanceCriteria').optional().isArray().withMessage('Acceptance criteria must be an array'),
  body('dependencies').optional().isArray().withMessage('Dependencies must be an array')
];

const updateItemValidation = [
  param('itemId').isUUID().withMessage('Invalid item ID'),
  body('priority').optional().isInt({ min: 0 }).withMessage('Priority must be a non-negative integer'),
  body('storyPoints').optional().isInt({ min: 0, max: 100 }).withMessage('Story points must be between 0 and 100'),
  body('epicId').optional().isUUID().withMessage('Invalid epic ID'),
  body('businessValue').optional().isInt({ min: 0 }).withMessage('Business value must be non-negative'),
  body('riskLevel').optional().isIn(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).withMessage('Invalid risk level'),
  body('readyForSprint').optional().isBoolean().withMessage('Ready for sprint must be a boolean'),
  body('acceptanceCriteria').optional().isArray().withMessage('Acceptance criteria must be an array'),
  body('dependencies').optional().isArray().withMessage('Dependencies must be an array')
];

const prioritizeItemValidation = [
  param('itemId').isUUID().withMessage('Invalid item ID'),
  body('newPriority').isInt({ min: 0 }).withMessage('New priority must be a non-negative integer'),
  body('reason').optional().isString().withMessage('Reason must be a string')
];

const bulkPrioritizeValidation = [
  param('projectId').isUUID().withMessage('Invalid project ID'),
  body('items').isArray({ min: 1 }).withMessage('Items array is required and cannot be empty'),
  body('items.*.itemId').isUUID().withMessage('Invalid item ID in items array'),
  body('items.*.priority').isInt({ min: 0 }).withMessage('Priority must be a non-negative integer'),
  body('reason').optional().isString().withMessage('Reason must be a string')
];

const searchItemsValidation = [
  query('projectId').optional().isUUID().withMessage('Invalid project ID'),
  query('epicId').optional().isUUID().withMessage('Invalid epic ID'),
  query('assigneeId').optional().isUUID().withMessage('Invalid assignee ID'),
  query('status').optional().isString().withMessage('Status must be a string'),
  query('priority').optional().isIn(['LOWEST', 'LOW', 'MEDIUM', 'HIGH', 'HIGHEST']).withMessage('Invalid priority'),
  query('riskLevel').optional().isIn(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).withMessage('Invalid risk level'),
  query('readyForSprint').optional().isBoolean().withMessage('Ready for sprint must be a boolean'),
  query('hasStoryPoints').optional().isBoolean().withMessage('Has story points must be a boolean'),
  query('labels').optional().isString().withMessage('Labels must be a comma-separated string'),
  query('search').optional().isString().withMessage('Search must be a string'),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('sortBy').optional().isIn(['priority', 'storyPoints', 'businessValue', 'createdAt', 'task.title']).withMessage('Invalid sort field'),
  query('sortOrder').optional().isIn(['asc', 'desc']).withMessage('Sort order must be asc or desc'),
  query('includeTask').optional().isBoolean().withMessage('Include task must be a boolean'),
  query('includeEpic').optional().isBoolean().withMessage('Include epic must be a boolean')
];

const createEpicValidation = [
  body('title').notEmpty().withMessage('Epic title is required').isLength({ max: 255 }).withMessage('Title must be less than 255 characters'),
  body('description').optional().isLength({ max: 10000 }).withMessage('Description must be less than 10000 characters'),
  body('projectId').isUUID().withMessage('Invalid project ID'),
  body('priority').optional().isIn(['LOWEST', 'LOW', 'MEDIUM', 'HIGH', 'HIGHEST']).withMessage('Invalid priority'),
  body('ownerId').isUUID().withMessage('Invalid owner ID'),
  body('startDate').optional().isISO8601().withMessage('Invalid start date format'),
  body('targetDate').optional().isISO8601().withMessage('Invalid target date format'),
  body('businessValue').optional().isInt({ min: 0 }).withMessage('Business value must be non-negative'),
  body('color').optional().isString().withMessage('Color must be a string'),
  body('labels').optional().isArray().withMessage('Labels must be an array')
];

const epicQueryValidation = [
  param('epicId').isUUID().withMessage('Invalid epic ID'),
  query('includeStories').optional().isBoolean().withMessage('Include stories must be a boolean'),
  query('includeProgress').optional().isBoolean().withMessage('Include progress must be a boolean')
];

// Project backlog routes
router.get(
  '/projects/:projectId/backlog',
  authenticateToken,
  projectIdValidation,
  validateRequest,
  backlogController.getProjectBacklog.bind(backlogController)
);

router.post(
  '/projects/:projectId/backlog/items',
  authenticateToken,
  addItemValidation,
  validateRequest,
  backlogController.addItemToBacklog.bind(backlogController)
);

router.put(
  '/projects/:projectId/backlog/prioritize',
  authenticateToken,
  bulkPrioritizeValidation,
  validateRequest,
  backlogController.bulkPrioritizeItems.bind(backlogController)
);

router.get(
  '/projects/:projectId/backlog/metrics',
  authenticateToken,
  projectIdValidation,
  validateRequest,
  backlogController.getBacklogMetrics.bind(backlogController)
);

// Backlog item management
router.put(
  '/backlog/items/:itemId',
  authenticateToken,
  updateItemValidation,
  validateRequest,
  backlogController.updateBacklogItem.bind(backlogController)
);

router.delete(
  '/backlog/items/:itemId',
  authenticateToken,
  itemIdValidation,
  validateRequest,
  backlogController.removeItemFromBacklog.bind(backlogController)
);

router.put(
  '/backlog/items/:itemId/priority',
  authenticateToken,
  prioritizeItemValidation,
  validateRequest,
  backlogController.prioritizeItem.bind(backlogController)
);

// Search backlog items
router.get(
  '/backlog/items/search',
  authenticateToken,
  searchItemsValidation,
  validateRequest,
  backlogController.searchBacklogItems.bind(backlogController)
);

// Epic management
router.post(
  '/epics',
  authenticateToken,
  createEpicValidation,
  validateRequest,
  backlogController.createEpic.bind(backlogController)
);

router.get(
  '/epics/:epicId',
  authenticateToken,
  epicQueryValidation,
  validateRequest,
  backlogController.getEpic.bind(backlogController)
);

export default router;
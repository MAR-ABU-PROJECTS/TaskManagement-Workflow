import { Router } from 'express';
import { TaskController } from '../controllers/TaskController';
import { authenticateToken } from '../middleware/auth';
import { authorize } from '../middleware/rbac';
import { validateRequest } from '../middleware/validation';
import { body, param, query } from 'express-validator';

const router = Router();
const taskController = new TaskController();

// Apply authentication middleware to all routes
router.use(authenticateToken);

/**
 * @route   POST /api/tasks
 * @desc    Create a new task
 * @access  Private (Project Members with CREATE_TASKS permission)
 */
router.post(
  '/',
  [
    body('title').notEmpty().withMessage('Title is required'),
    body('type').isIn(['EPIC', 'STORY', 'TASK', 'SUBTASK']).withMessage('Invalid task type'),
    body('projectId').isUUID().withMessage('Valid project ID is required'),
    body('assigneeId').optional().isUUID().withMessage('Invalid assignee ID'),
    body('parentId').optional().isUUID().withMessage('Invalid parent task ID'),
    body('priority').optional().isIn(['LOWEST', 'LOW', 'MEDIUM', 'HIGH', 'HIGHEST']),
    body('estimatedHours').optional().isFloat({ min: 0 }).withMessage('Estimated hours must be positive'),
    body('storyPoints').optional().isInt({ min: 0, max: 100 }).withMessage('Story points must be between 0 and 100'),
    validateRequest
  ],
  authorize(['ADMIN', 'PROJECT_MANAGER', 'DEVELOPER']),
  taskController.createTask
);

/**
 * @route   GET /api/tasks
 * @desc    Search and filter tasks
 * @access  Private (Project Members)
 */
router.get(
  '/',
  [
    query('projectId').optional().isUUID(),
    query('assigneeId').optional().isUUID(),
    query('reporterId').optional().isUUID(),
    query('type').optional().isIn(['EPIC', 'STORY', 'TASK', 'SUBTASK']),
    query('priority').optional().isIn(['LOWEST', 'LOW', 'MEDIUM', 'HIGH', 'HIGHEST']),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    validateRequest
  ],
  taskController.searchTasks
);

/**
 * @route   GET /api/tasks/key/:taskKey
 * @desc    Get task by key (e.g., MAR-123)
 * @access  Private (Project Members)
 */
router.get(
  '/key/:taskKey',
  [
    param('taskKey').notEmpty().withMessage('Task key is required'),
    validateRequest
  ],
  taskController.getTaskByKey
);

/**
 * @route   GET /api/tasks/statistics
 * @desc    Get task statistics
 * @access  Private
 */
router.get(
  '/statistics',
  [
    query('projectId').optional().isUUID(),
    query('assigneeId').optional().isUUID(),
    validateRequest
  ],
  taskController.getTaskStatistics
);

/**
 * @route   POST /api/tasks/bulk
 * @desc    Bulk operations on tasks
 * @access  Private (Various permissions based on operation)
 */
router.post(
  '/bulk',
  [
    body('taskIds').isArray({ min: 1 }).withMessage('Task IDs array is required'),
    body('taskIds.*').isUUID().withMessage('Invalid task ID'),
    body('operation').isIn(['UPDATE', 'DELETE', 'ASSIGN', 'STATUS_CHANGE']).withMessage('Invalid operation'),
    body('data').isObject().withMessage('Operation data is required'),
    validateRequest
  ],
  authorize(['ADMIN', 'PROJECT_MANAGER']),
  taskController.bulkOperation
);

/**
 * @route   GET /api/tasks/:taskId
 * @desc    Get task by ID
 * @access  Private (Project Members)
 */
router.get(
  '/:taskId',
  [
    param('taskId').isUUID().withMessage('Invalid task ID'),
    validateRequest
  ],
  taskController.getTask
);

/**
 * @route   PUT /api/tasks/:taskId
 * @desc    Update task
 * @access  Private (Task Reporter, Assignee with permission, or EDIT_TASKS permission)
 */
router.put(
  '/:taskId',
  [
    param('taskId').isUUID().withMessage('Invalid task ID'),
    body('title').optional().notEmpty().withMessage('Title cannot be empty'),
    body('type').optional().isIn(['EPIC', 'STORY', 'TASK', 'SUBTASK']),
    body('priority').optional().isIn(['LOWEST', 'LOW', 'MEDIUM', 'HIGH', 'HIGHEST']),
    body('assigneeId').optional().isUUID().withMessage('Invalid assignee ID'),
    body('estimatedHours').optional().isFloat({ min: 0 }),
    body('remainingHours').optional().isFloat({ min: 0 }),
    body('storyPoints').optional().isInt({ min: 0, max: 100 }),
    validateRequest
  ],
  authorize(['ADMIN', 'PROJECT_MANAGER', 'DEVELOPER']),
  taskController.updateTask
);

/**
 * @route   DELETE /api/tasks/:taskId
 * @desc    Delete task
 * @access  Private (DELETE_TASKS permission)
 */
router.delete(
  '/:taskId',
  [
    param('taskId').isUUID().withMessage('Invalid task ID'),
    validateRequest
  ],
  authorize(['ADMIN', 'PROJECT_MANAGER']),
  taskController.deleteTask
);

/**
 * @route   PUT /api/tasks/:taskId/assign
 * @desc    Assign task to user
 * @access  Private (ASSIGN_TASKS permission)
 */
router.put(
  '/:taskId/assign',
  [
    param('taskId').isUUID().withMessage('Invalid task ID'),
    body('assigneeId').isUUID().withMessage('Assignee ID is required'),
    body('comment').optional().isString(),
    validateRequest
  ],
  authorize(['ADMIN', 'PROJECT_MANAGER', 'DEVELOPER']),
  taskController.assignTask
);

/**
 * @route   PUT /api/tasks/:taskId/status
 * @desc    Update task status
 * @access  Private (Task Reporter, Assignee, or EDIT_TASKS permission)
 */
router.put(
  '/:taskId/status',
  [
    param('taskId').isUUID().withMessage('Invalid task ID'),
    body('toStatus').notEmpty().withMessage('Target status is required'),
    body('comment').optional().isString(),
    body('transitionId').optional().isUUID(),
    validateRequest
  ],
  authorize(['ADMIN', 'PROJECT_MANAGER', 'DEVELOPER']),
  taskController.transitionTaskStatus
);

export default router;
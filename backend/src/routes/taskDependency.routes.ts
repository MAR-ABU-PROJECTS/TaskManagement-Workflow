import { Router } from 'express';
import { TaskDependencyController } from '../controllers/TaskDependencyController';
import { authenticateToken } from '../middleware/auth';
import { authorize } from '../middleware/rbac';
import { validateRequest } from '../middleware/validation';
import { body, param, query } from 'express-validator';

const router = Router();
const dependencyController = new TaskDependencyController();

// Apply authentication middleware to all routes
router.use(authenticateToken);

/**
 * @route   POST /api/task-dependencies
 * @desc    Create a task dependency
 * @access  Private (Project Members with EDIT_TASKS permission)
 */
router.post(
  '/',
  [
    body('dependentTaskId').isUUID().withMessage('Valid dependent task ID is required'),
    body('blockingTaskId').isUUID().withMessage('Valid blocking task ID is required'),
    body('type').isIn(['BLOCKS', 'IS_BLOCKED_BY', 'RELATES_TO']).withMessage('Invalid dependency type'),
    validateRequest
  ],
  authorize(['ADMIN', 'PROJECT_MANAGER', 'DEVELOPER']),
  dependencyController.createDependency
);

/**
 * @route   GET /api/task-dependencies
 * @desc    Get task dependencies with filters
 * @access  Private (Project Members)
 */
router.get(
  '/',
  [
    query('taskId').optional().isUUID().withMessage('Invalid task ID'),
    query('projectId').optional().isUUID().withMessage('Invalid project ID'),
    query('type').optional().isIn(['BLOCKS', 'IS_BLOCKED_BY', 'RELATES_TO']),
    query('status').optional().isIn(['ACTIVE', 'RESOLVED', 'ALL']),
    validateRequest
  ],
  dependencyController.getDependencies
);

/**
 * @route   DELETE /api/task-dependencies/:dependencyId
 * @desc    Delete a task dependency
 * @access  Private (Project Members with EDIT_TASKS permission)
 */
router.delete(
  '/:dependencyId',
  [
    param('dependencyId').isUUID().withMessage('Invalid dependency ID'),
    validateRequest
  ],
  authorize(['ADMIN', 'PROJECT_MANAGER', 'DEVELOPER']),
  dependencyController.deleteDependency
);

/**
 * @route   POST /api/task-dependencies/bulk
 * @desc    Bulk dependency operations
 * @access  Private (Project Members with EDIT_TASKS permission)
 */
router.post(
  '/bulk',
  [
    body('operation').isIn(['CREATE', 'DELETE', 'UPDATE']).withMessage('Invalid operation'),
    body('dependencies').isArray({ min: 1 }).withMessage('Dependencies array is required'),
    body('dependencies.*.dependentTaskId').isUUID().withMessage('Invalid dependent task ID'),
    body('dependencies.*.blockingTaskId').isUUID().withMessage('Invalid blocking task ID'),
    body('dependencies.*.type').isIn(['BLOCKS', 'IS_BLOCKED_BY', 'RELATES_TO']).withMessage('Invalid dependency type'),
    body('validateCircular').optional().isBoolean(),
    validateRequest
  ],
  authorize(['ADMIN', 'PROJECT_MANAGER']),
  dependencyController.bulkDependencyOperation
);

/**
 * @route   GET /api/tasks/:taskId/blocking-info
 * @desc    Get task blocking information
 * @access  Private (Project Members)
 */
router.get(
  '/tasks/:taskId/blocking-info',
  [
    param('taskId').isUUID().withMessage('Invalid task ID'),
    validateRequest
  ],
  dependencyController.getTaskBlockingInfo
);

/**
 * @route   GET /api/tasks/:taskId/subtask-summary
 * @desc    Get subtask summary for a parent task
 * @access  Private (Project Members)
 */
router.get(
  '/tasks/:taskId/subtask-summary',
  [
    param('taskId').isUUID().withMessage('Invalid task ID'),
    validateRequest
  ],
  dependencyController.getSubtaskSummary
);

/**
 * @route   GET /api/tasks/:taskId/tree
 * @desc    Get task tree (hierarchical view)
 * @access  Private (Project Members)
 */
router.get(
  '/tasks/:taskId/tree',
  [
    param('taskId').isUUID().withMessage('Invalid task ID'),
    query('maxDepth').optional().isInt({ min: 1, max: 10 }).withMessage('Max depth must be between 1 and 10'),
    validateRequest
  ],
  dependencyController.getTaskTree
);

/**
 * @route   PUT /api/tasks/:taskId/move
 * @desc    Move task in hierarchy
 * @access  Private (Project Members with EDIT_TASKS permission)
 */
router.put(
  '/tasks/:taskId/move',
  [
    param('taskId').isUUID().withMessage('Invalid task ID'),
    body('newParentId').optional().isUUID().withMessage('Invalid parent task ID'),
    body('position').optional().isInt({ min: 0 }).withMessage('Position must be a non-negative integer'),
    validateRequest
  ],
  authorize(['ADMIN', 'PROJECT_MANAGER', 'DEVELOPER']),
  dependencyController.moveTask
);

/**
 * @route   GET /api/projects/:projectId/dependency-graph
 * @desc    Generate dependency graph for a project
 * @access  Private (Project Members)
 */
router.get(
  '/projects/:projectId/dependency-graph',
  [
    param('projectId').isUUID().withMessage('Invalid project ID'),
    validateRequest
  ],
  authorize(['ADMIN', 'PROJECT_MANAGER', 'DEVELOPER']),
  dependencyController.getDependencyGraph
);

export default router;
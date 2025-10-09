import { Router } from 'express';
import { WorkflowController } from '../controllers/WorkflowController';
import { ProjectConfigurationController } from '../controllers/ProjectConfigurationController';
import { authenticateToken } from '../middleware/auth';
import { authorize } from '../middleware/rbac';
import { validateRequest } from '../middleware/validation';
import { body, param, query } from 'express-validator';

const router = Router();
const workflowController = new WorkflowController();
const configController = new ProjectConfigurationController();

// Apply authentication to all routes
router.use(authenticateToken);

// Workflow Routes
router.post(
  '/workflows',
  [
    body('name').notEmpty().withMessage('Name is required'),
    body('type').isIn(['TASK', 'ISSUE', 'EPIC', 'STORY', 'BUG']).withMessage('Invalid workflow type'),
    body('states').isArray({ min: 1 }).withMessage('At least one state is required'),
    body('transitions').isArray().withMessage('Transitions must be an array'),
    validateRequest
  ],
  authorize(['ADMIN', 'PROJECT_MANAGER']),
  workflowController.createWorkflow
);

router.get(
  '/workflows',
  [
    query('type').optional().isIn(['TASK', 'ISSUE', 'EPIC', 'STORY', 'BUG']),
    query('status').optional().isIn(['ACTIVE', 'INACTIVE', 'DRAFT']),
    query('projectId').optional().isUUID(),
    query('isDefault').optional().isBoolean(),
    query('search').optional().isString(),
    validateRequest
  ],
  workflowController.getWorkflows
);

router.get(
  '/workflows/:workflowId',
  [
    param('workflowId').isUUID().withMessage('Invalid workflow ID'),
    validateRequest
  ],
  workflowController.getWorkflow
);

router.put(
  '/workflows/:workflowId',
  [
    param('workflowId').isUUID().withMessage('Invalid workflow ID'),
    body('name').optional().notEmpty().withMessage('Name cannot be empty'),
    body('status').optional().isIn(['ACTIVE', 'INACTIVE', 'DRAFT']),
    validateRequest
  ],
  authorize(['ADMIN', 'PROJECT_MANAGER']),
  workflowController.updateWorkflow
);

router.delete(
  '/workflows/:workflowId',
  [
    param('workflowId').isUUID().withMessage('Invalid workflow ID'),
    validateRequest
  ],
  authorize(['ADMIN', 'PROJECT_MANAGER']),
  workflowController.deleteWorkflow
);

router.post(
  '/workflows/:workflowId/activate',
  [
    param('workflowId').isUUID().withMessage('Invalid workflow ID'),
    validateRequest
  ],
  authorize(['ADMIN', 'PROJECT_MANAGER']),
  workflowController.activateWorkflow
);

router.post(
  '/workflows/:workflowId/deactivate',
  [
    param('workflowId').isUUID().withMessage('Invalid workflow ID'),
    validateRequest
  ],
  authorize(['ADMIN', 'PROJECT_MANAGER']),
  workflowController.deactivateWorkflow
);

router.post(
  '/workflows/:workflowId/clone',
  [
    param('workflowId').isUUID().withMessage('Invalid workflow ID'),
    body('name').notEmpty().withMessage('Name is required'),
    body('projectId').optional().isUUID().withMessage('Invalid project ID'),
    validateRequest
  ],
  authorize(['ADMIN', 'PROJECT_MANAGER']),
  workflowController.cloneWorkflow
);

router.get(
  '/workflows/:workflowId/states/:stateId/transitions',
  [
    param('workflowId').isUUID().withMessage('Invalid workflow ID'),
    param('stateId').isUUID().withMessage('Invalid state ID'),
    validateRequest
  ],
  workflowController.getAvailableTransitions
);

router.post(
  '/workflows/:workflowId/transitions/:transitionId/execute',
  [
    param('workflowId').isUUID().withMessage('Invalid workflow ID'),
    param('transitionId').isUUID().withMessage('Invalid transition ID'),
    body('entityId').isUUID().withMessage('Entity ID is required'),
    body('context').optional().isObject(),
    validateRequest
  ],
  workflowController.executeTransition
);

router.get(
  '/workflows/:workflowId/stats',
  [
    param('workflowId').isUUID().withMessage('Invalid workflow ID'),
    validateRequest
  ],
  authorize(['ADMIN', 'PROJECT_MANAGER']),
  workflowController.getWorkflowStats
);

// Project Configuration Routes
router.get(
  '/projects/:projectId/configuration',
  [
    param('projectId').isUUID().withMessage('Invalid project ID'),
    validateRequest
  ],
  authorize(['ADMIN', 'PROJECT_MANAGER', 'DEVELOPER']),
  configController.getProjectConfiguration
);

router.put(
  '/projects/:projectId/configuration',
  [
    param('projectId').isUUID().withMessage('Invalid project ID'),
    body('general').optional().isObject(),
    body('notifications').optional().isObject(),
    body('workflow').optional().isObject(),
    body('security').optional().isObject(),
    body('integrations').optional().isObject(),
    validateRequest
  ],
  authorize(['ADMIN', 'PROJECT_MANAGER']),
  configController.updateProjectConfiguration
);

// Custom Fields Routes
router.post(
  '/projects/:projectId/custom-fields',
  [
    param('projectId').isUUID().withMessage('Invalid project ID'),
    body('name').notEmpty().withMessage('Name is required'),
    body('type').isIn([
      'TEXT', 'NUMBER', 'DATE', 'DATETIME', 'BOOLEAN', 'SELECT', 'MULTI_SELECT',
      'USER', 'MULTI_USER', 'URL', 'EMAIL', 'TEXTAREA', 'RICH_TEXT', 'FILE'
    ]).withMessage('Invalid field type'),
    body('required').isBoolean().withMessage('Required must be boolean'),
    body('appliesTo').isArray().withMessage('AppliesTo must be an array'),
    validateRequest
  ],
  authorize(['ADMIN', 'PROJECT_MANAGER']),
  configController.createCustomField
);

router.get(
  '/projects/:projectId/custom-fields',
  [
    param('projectId').isUUID().withMessage('Invalid project ID'),
    validateRequest
  ],
  configController.getProjectCustomFields
);

router.put(
  '/custom-fields/:fieldId',
  [
    param('fieldId').isUUID().withMessage('Invalid field ID'),
    body('name').optional().notEmpty().withMessage('Name cannot be empty'),
    body('type').optional().isIn([
      'TEXT', 'NUMBER', 'DATE', 'DATETIME', 'BOOLEAN', 'SELECT', 'MULTI_SELECT',
      'USER', 'MULTI_USER', 'URL', 'EMAIL', 'TEXTAREA', 'RICH_TEXT', 'FILE'
    ]),
    validateRequest
  ],
  authorize(['ADMIN', 'PROJECT_MANAGER']),
  configController.updateCustomField
);

router.delete(
  '/custom-fields/:fieldId',
  [
    param('fieldId').isUUID().withMessage('Invalid field ID'),
    validateRequest
  ],
  authorize(['ADMIN', 'PROJECT_MANAGER']),
  configController.deleteCustomField
);

// Project Template Routes
router.post(
  '/project-templates',
  [
    body('name').notEmpty().withMessage('Name is required'),
    body('category').notEmpty().withMessage('Category is required'),
    body('methodology').notEmpty().withMessage('Methodology is required'),
    body('configuration').isObject().withMessage('Configuration must be an object'),
    body('workflows').isArray().withMessage('Workflows must be an array'),
    body('customFields').isArray().withMessage('Custom fields must be an array'),
    body('defaultRoles').isArray().withMessage('Default roles must be an array'),
    validateRequest
  ],
  authorize(['ADMIN', 'PROJECT_MANAGER']),
  configController.createProjectTemplate
);

router.get(
  '/project-templates',
  [
    query('category').optional().isString(),
    query('methodology').optional().isString(),
    query('isPublic').optional().isBoolean(),
    query('search').optional().isString(),
    validateRequest
  ],
  configController.getProjectTemplates
);

// Project Cloning Routes
router.post(
  '/projects/clone',
  [
    body('name').notEmpty().withMessage('Name is required'),
    body('key').notEmpty().withMessage('Key is required'),
    body('templateId').optional().isUUID().withMessage('Invalid template ID'),
    body('sourceProjectId').optional().isUUID().withMessage('Invalid source project ID'),
    body('includeTeam').isBoolean().withMessage('Include team must be boolean'),
    body('includeTasks').isBoolean().withMessage('Include tasks must be boolean'),
    body('includeWorkflows').isBoolean().withMessage('Include workflows must be boolean'),
    body('includeCustomFields').isBoolean().withMessage('Include custom fields must be boolean'),
    validateRequest
  ],
  authorize(['ADMIN', 'PROJECT_MANAGER']),
  configController.cloneProject
);

export default router;
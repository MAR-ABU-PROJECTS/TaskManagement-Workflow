import { Router } from 'express';
import { projectRoutes } from '@/controllers/ProjectController';
import { 
  authenticate, 
  requirePermission,
  requireProjectMembership,
} from '@/middleware/auth';

const router = Router();

// All project routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/projects/templates
 * @desc    Get project templates
 * @access  Private
 */
router.get('/templates', ...projectRoutes.getProjectTemplates);

/**
 * @route   GET /api/projects/my
 * @desc    Get current user's projects
 * @access  Private
 */
router.get('/my', ...projectRoutes.getMyProjects);

/**
 * @route   GET /api/projects
 * @desc    Search projects with filters and pagination
 * @access  Private
 */
router.get('/', ...projectRoutes.searchProjects);

/**
 * @route   POST /api/projects
 * @desc    Create a new project
 * @access  Private
 */
router.post('/', requirePermission('projects', 'create'), ...projectRoutes.createProject);

/**
 * @route   GET /api/projects/:id
 * @desc    Get project by ID
 * @access  Private (Project members only)
 */
router.get('/:id', requireProjectMembership(), ...projectRoutes.getProjectById);

/**
 * @route   PUT /api/projects/:id
 * @desc    Update project
 * @access  Private (Project managers and above)
 */
router.put(
  '/:id',
  requireProjectMembership(),
  requirePermission('projects', 'update', (req) => ({ projectId: req.params.id })),
  ...projectRoutes.updateProject
);

/**
 * @route   DELETE /api/projects/:id
 * @desc    Delete project (soft delete)
 * @access  Private (Project owners and admins only)
 */
router.delete(
  '/:id',
  requireProjectMembership(),
  requirePermission('projects', 'delete', (req) => ({ projectId: req.params.id })),
  ...projectRoutes.deleteProject
);

/**
 * @route   GET /api/projects/:id/stats
 * @desc    Get project statistics
 * @access  Private (Project members only)
 */
router.get(
  '/:id/stats',
  requireProjectMembership(),
  ...projectRoutes.getProjectStats
);

/**
 * @route   GET /api/projects/:id/activity
 * @desc    Get project activity feed
 * @access  Private (Project members only)
 */
router.get(
  '/:id/activity',
  requireProjectMembership(),
  ...projectRoutes.getProjectActivity
);

/**
 * Project Members Management
 */

/**
 * @route   POST /api/projects/:id/members
 * @desc    Add member to project
 * @access  Private (Project managers and above)
 */
router.post(
  '/:id/members',
  requireProjectMembership(),
  requirePermission('projects', 'manage_members', (req) => ({ projectId: req.params.id })),
  ...projectRoutes.addProjectMember
);

/**
 * @route   PUT /api/projects/:id/members/:userId
 * @desc    Update project member
 * @access  Private (Project managers and above)
 */
router.put(
  '/:id/members/:userId',
  requireProjectMembership(),
  requirePermission('projects', 'manage_members', (req) => ({ projectId: req.params.id })),
  ...projectRoutes.updateProjectMember
);

/**
 * @route   DELETE /api/projects/:id/members/:userId
 * @desc    Remove member from project
 * @access  Private (Project managers and above)
 */
router.delete(
  '/:id/members/:userId',
  requireProjectMembership(),
  requirePermission('projects', 'manage_members', (req) => ({ projectId: req.params.id })),
  ...projectRoutes.removeProjectMember
);

export default router;
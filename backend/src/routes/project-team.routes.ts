import { Router } from 'express';
import { ProjectTeamController } from '../controllers/ProjectTeamController';
import { authenticateToken } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { projectTeamValidation } from '../validation/project-team.validation';

const router = Router();
const projectTeamController = new ProjectTeamController();

// Apply authentication middleware to all routes
router.use(authenticateToken);

/**
 * @route   POST /api/projects/:projectId/team/members
 * @desc    Add member to project team
 * @access  Private (Project Manager, Team Lead)
 */
router.post(
  '/:projectId/team/members',
  validateRequest(projectTeamValidation.addMember),
  projectTeamController.addProjectMember
);

/**
 * @route   DELETE /api/projects/:projectId/team/members/:userId
 * @desc    Remove member from project team
 * @access  Private (Project Manager, Team Lead)
 */
router.delete(
  '/:projectId/team/members/:userId',
  projectTeamController.removeProjectMember
);

/**
 * @route   PUT /api/projects/:projectId/team/members/:userId/role
 * @desc    Update project member role and permissions
 * @access  Private (Project Manager)
 */
router.put(
  '/:projectId/team/members/:userId/role',
  validateRequest(projectTeamValidation.updateMemberRole),
  projectTeamController.updateProjectMemberRole
);

/**
 * @route   GET /api/projects/:projectId/team/members
 * @desc    Get all project members
 * @access  Private (Project Members)
 */
router.get(
  '/:projectId/team/members',
  projectTeamController.getProjectMembers
);

/**
 * @route   GET /api/projects/:projectId/team/members/:userId
 * @desc    Get specific project member details
 * @access  Private (Project Members)
 */
router.get(
  '/:projectId/team/members/:userId',
  projectTeamController.getProjectMember
);

/**
 * @route   GET /api/projects/:projectId/team/members/:userId/check
 * @desc    Check if user is project member
 * @access  Private
 */
router.get(
  '/:projectId/team/members/:userId/check',
  projectTeamController.checkProjectMembership
);

/**
 * @route   GET /api/users/:userId/project-memberships
 * @desc    Get user's project memberships
 * @access  Private (Self or Admin)
 */
router.get(
  '/users/:userId/project-memberships',
  projectTeamController.getUserProjectMemberships
);

/**
 * @route   POST /api/projects/:projectId/team/members/bulk
 * @desc    Bulk add members to project
 * @access  Private (Project Manager)
 */
router.post(
  '/:projectId/team/members/bulk',
  validateRequest(projectTeamValidation.bulkAddMembers),
  projectTeamController.bulkAddProjectMembers
);

/**
 * @route   GET /api/projects/team/roles
 * @desc    Get available project roles and permissions
 * @access  Private
 */
router.get(
  '/team/roles',
  projectTeamController.getProjectRoles
);

/**
 * @route   GET /api/projects/:projectId/team/stats
 * @desc    Get project team statistics
 * @access  Private (Project Members)
 */
router.get(
  '/:projectId/team/stats',
  projectTeamController.getProjectTeamStats
);

/**
 * @route   PUT /api/projects/:projectId/team/transfer-ownership
 * @desc    Transfer project ownership
 * @access  Private (Project Owner, Admin)
 */
router.put(
  '/:projectId/team/transfer-ownership',
  validateRequest(projectTeamValidation.transferOwnership),
  projectTeamController.transferProjectOwnership
);

export default router;
import { Request, Response } from 'express';
import { TeamService } from '../services/TeamService';
import { logger } from '../utils/logger';
import { 
  TeamRole,
  ProjectMembershipRequest,
  TeamFilters,
  BulkMemberOperation 
} from '../types/team.types';
import { 
  ValidationError, 
  NotFoundError, 
  AuthorizationError 
} from '../middleware/errorHandler';

export class ProjectTeamController {
  private teamService: TeamService;

  constructor() {
    this.teamService = new TeamService();
  }

  /**
   * Add member to project team
   */
  addProjectMember = async (req: Request, res: Response): Promise<void> => {
    try {
      const { projectId } = req.params;
      const membershipRequest: ProjectMembershipRequest = req.body;
      const requesterId = req.user?.id;

      if (!requesterId) {
        throw new AuthorizationError('Authentication required');
      }

      // Validate request data
      if (!membershipRequest.userId || !membershipRequest.role) {
        throw new ValidationError('User ID and role are required');
      }

      if (!Object.values(TeamRole).includes(membershipRequest.role)) {
        throw new ValidationError('Invalid role specified');
      }

      const result = await this.teamService.addProjectMember(
        projectId,
        membershipRequest,
        requesterId
      );

      res.status(201).json({
        success: true,
        data: result,
        message: 'Team member added successfully'
      });
    } catch (error) {
      logger.error('Error adding project member:', error);
      throw error;
    }
  };

  /**
   * Remove member from project team
   */
  removeProjectMember = async (req: Request, res: Response): Promise<void> => {
    try {
      const { projectId, userId } = req.params;
      const requesterId = req.user?.id;

      if (!requesterId) {
        throw new AuthorizationError('Authentication required');
      }

      await this.teamService.removeProjectMember(projectId, userId, requesterId);

      res.json({
        success: true,
        message: 'Team member removed successfully'
      });
    } catch (error) {
      logger.error('Error removing project member:', error);
      throw error;
    }
  };

  /**
   * Update project member role and permissions
   */
  updateProjectMemberRole = async (req: Request, res: Response): Promise<void> => {
    try {
      const { projectId, userId } = req.params;
      const { role, permissions } = req.body;
      const requesterId = req.user?.id;

      if (!requesterId) {
        throw new AuthorizationError('Authentication required');
      }

      if (!role || !Object.values(TeamRole).includes(role)) {
        throw new ValidationError('Valid role is required');
      }

      const result = await this.teamService.updateProjectMemberRole(
        projectId,
        userId,
        { role, permissions },
        requesterId
      );

      res.json({
        success: true,
        data: result,
        message: 'Member role updated successfully'
      });
    } catch (error) {
      logger.error('Error updating project member role:', error);
      throw error;
    }
  };

  /**
   * Get all project members
   */
  getProjectMembers = async (req: Request, res: Response): Promise<void> => {
    try {
      const { projectId } = req.params;
      const requesterId = req.user?.id;
      
      if (!requesterId) {
        throw new AuthorizationError('Authentication required');
      }

      // Parse query filters
      const filters: TeamFilters = {};
      if (req.query.role) {
        filters.role = req.query.role as TeamRole;
      }
      if (req.query.search) {
        filters.search = req.query.search as string;
      }

      const members = await this.teamService.getProjectMembers(
        projectId,
        requesterId,
        filters
      );

      res.json({
        success: true,
        data: members,
        count: members.length
      });
    } catch (error) {
      logger.error('Error getting project members:', error);
      throw error;
    }
  };

  /**
   * Get specific project member details
   */
  getProjectMember = async (req: Request, res: Response): Promise<void> => {
    try {
      const { projectId, userId } = req.params;

      const member = await this.teamService.getProjectMember(projectId, userId);

      if (!member) {
        throw new NotFoundError('Project member not found');
      }

      res.json({
        success: true,
        data: member
      });
    } catch (error) {
      logger.error('Error getting project member:', error);
      throw error;
    }
  };

  /**
   * Check if user is project member
   */
  checkProjectMembership = async (req: Request, res: Response): Promise<void> => {
    try {
      const { projectId, userId } = req.params;

      const isMember = await this.teamService.isProjectMember(projectId, userId);

      res.json({
        success: true,
        data: { isMember }
      });
    } catch (error) {
      logger.error('Error checking project membership:', error);
      throw error;
    }
  };

  /**
   * Get user's project memberships
   */
  getUserProjectMemberships = async (req: Request, res: Response): Promise<void> => {
    try {
      const { userId } = req.params;
      const requesterId = req.user?.id;

      // Users can only view their own memberships unless they're admin
      if (userId !== requesterId && req.user?.role !== 'ADMIN') {
        throw new AuthorizationError('Cannot view other user\'s memberships');
      }

      const memberships = await this.teamService.getUserProjectMemberships(userId);

      res.json({
        success: true,
        data: memberships,
        count: memberships.length
      });
    } catch (error) {
      logger.error('Error getting user project memberships:', error);
      throw error;
    }
  };

  /**
   * Bulk add members to project
   */
  bulkAddProjectMembers = async (req: Request, res: Response): Promise<void> => {
    try {
      const { projectId } = req.params;
      const { members }: { members: ProjectMembershipRequest[] } = req.body;
      const requesterId = req.user?.id;

      if (!requesterId) {
        throw new AuthorizationError('Authentication required');
      }

      if (!Array.isArray(members) || members.length === 0) {
        throw new ValidationError('Members array is required and cannot be empty');
      }

      // Validate each member request
      for (const member of members) {
        if (!member.userId || !member.role) {
          throw new ValidationError('Each member must have userId and role');
        }
        if (!Object.values(TeamRole).includes(member.role)) {
          throw new ValidationError(`Invalid role: ${member.role}`);
        }
      }

      const results = await this.teamService.bulkAddProjectMembers(
        projectId,
        members,
        requesterId
      );

      res.status(201).json({
        success: true,
        data: results,
        message: `Successfully added ${results.length} members to project`,
        summary: {
          requested: members.length,
          successful: results.length,
          failed: members.length - results.length
        }
      });
    } catch (error) {
      logger.error('Error bulk adding project members:', error);
      throw error;
    }
  };

  /**
   * Get available project roles and permissions
   */
  getProjectRoles = async (req: Request, res: Response): Promise<void> => {
    try {
      const roles = await this.teamService.getProjectRoles();

      res.json({
        success: true,
        data: roles
      });
    } catch (error) {
      logger.error('Error getting project roles:', error);
      throw error;
    }
  };

  /**
   * Get project team statistics
   */
  getProjectTeamStats = async (req: Request, res: Response): Promise<void> => {
    try {
      const { projectId } = req.params;
      const requesterId = req.user?.id;

      if (!requesterId) {
        throw new AuthorizationError('Authentication required');
      }

      // Get all members to calculate stats
      const members = await this.teamService.getProjectMembers(
        projectId,
        requesterId
      );

      // Calculate statistics
      const stats = {
        totalMembers: members.length,
        membersByRole: members.reduce((acc, member) => {
          acc[member.role] = (acc[member.role] || 0) + 1;
          return acc;
        }, {} as Record<TeamRole, number>),
        recentJoins: members.filter(
          member => new Date(member.joinedAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        ).length,
        activeMembers: members.length // All returned members are active
      };

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      logger.error('Error getting project team stats:', error);
      throw error;
    }
  };

  /**
   * Transfer project ownership
   */
  transferProjectOwnership = async (req: Request, res: Response): Promise<void> => {
    try {
      const { projectId } = req.params;
      const { newOwnerId } = req.body;
      const requesterId = req.user?.id;

      if (!requesterId) {
        throw new AuthorizationError('Authentication required');
      }

      if (!newOwnerId) {
        throw new ValidationError('New owner ID is required');
      }

      // Check if new owner is a project member
      const isMember = await this.teamService.isProjectMember(projectId, newOwnerId);
      if (!isMember) {
        throw new ValidationError('New owner must be a project member');
      }

      // Update the new owner's role to PROJECT_MANAGER
      await this.teamService.updateProjectMemberRole(
        projectId,
        newOwnerId,
        { 
          role: TeamRole.PROJECT_MANAGER,
          permissions: [
            'MANAGE_PROJECT',
            'MANAGE_TEAM',
            'CREATE_TASKS',
            'EDIT_TASKS',
            'DELETE_TASKS',
            'MANAGE_SPRINTS',
            'VIEW_REPORTS',
            'MANAGE_WORKFLOWS'
          ]
        },
        requesterId
      );

      res.json({
        success: true,
        message: 'Project ownership transferred successfully'
      });
    } catch (error) {
      logger.error('Error transferring project ownership:', error);
      throw error;
    }
  };
}
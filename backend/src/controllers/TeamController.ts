import { Request, Response } from 'express';
import { TeamService } from '@/services/TeamService';
import { prisma } from '@/config/database';
import { asyncHandler } from '@/middleware/errorHandler';
import { validate } from '@/validation';
import {
  createTeamSchema,
  updateTeamSchema,
  addTeamMemberSchema,
  updateTeamMemberSchema,
  teamSearchSchema,
} from '@/validation/team.validation';
import { logger } from '@/utils/logger';
import { ApiResponse } from '@/types/common.types';

export class TeamController {
  private teamService: TeamService;

  constructor() {
    this.teamService = new TeamService(prisma);
  }

  /**
   * Create a new team
   * POST /api/teams
   */
  createTeam = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!req.user?.id) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
      return;
    }

    const team = await this.teamService.createTeam(req.body, req.user.id);
    
    const response: ApiResponse = {
      success: true,
      data: team,
      message: 'Team created successfully',
      meta: {
        timestamp: new Date().toISOString(),
        requestId: res.locals.requestId || 'unknown',
        version: process.env.API_VERSION || 'v1',
      },
    };

    res.status(201).json(response);
  });

  /**
   * Get team by ID
   * GET /api/teams/:id
   */
  getTeamById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const { includeMembers, includeProjects } = req.query;

    const options = {
      includeMembers: includeMembers === 'true',
      includeProjects: includeProjects === 'true',
    };

    const team = await this.teamService.getTeamById(id, options);
    
    if (!team) {
      res.status(404).json({
        success: false,
        message: 'Team not found',
      });
      return;
    }

    const response: ApiResponse = {
      success: true,
      data: team,
      message: 'Team retrieved successfully',
      meta: {
        timestamp: new Date().toISOString(),
        requestId: res.locals.requestId || 'unknown',
        version: process.env.API_VERSION || 'v1',
      },
    };

    res.status(200).json(response);
  });

  /**
   * Update team
   * PUT /api/teams/:id
   */
  updateTeam = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    
    if (!req.user?.id) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
      return;
    }

    const team = await this.teamService.updateTeam(id, req.body, req.user.id);
    
    const response: ApiResponse = {
      success: true,
      data: team,
      message: 'Team updated successfully',
      meta: {
        timestamp: new Date().toISOString(),
        requestId: res.locals.requestId || 'unknown',
        version: process.env.API_VERSION || 'v1',
      },
    };

    res.status(200).json(response);
  });

  /**
   * Delete team
   * DELETE /api/teams/:id
   */
  deleteTeam = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    
    if (!req.user?.id) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
      return;
    }

    await this.teamService.deleteTeam(id, req.user.id);
    
    const response: ApiResponse = {
      success: true,
      message: 'Team deleted successfully',
      meta: {
        timestamp: new Date().toISOString(),
        requestId: res.locals.requestId || 'unknown',
        version: process.env.API_VERSION || 'v1',
      },
    };

    res.status(200).json(response);
  });

  /**
   * Search teams with filters and pagination
   * GET /api/teams
   */
  searchTeams = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const {
      page = '1',
      limit = '20',
      search,
      leaderId,
      isActive,
      memberUserId,
      createdAfter,
      createdBefore,
    } = req.query;

    const filters = {
      search: search as string,
      leaderId: leaderId as string,
      isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
      memberUserId: memberUserId as string,
      createdAfter: createdAfter ? new Date(createdAfter as string) : undefined,
      createdBefore: createdBefore ? new Date(createdBefore as string) : undefined,
    };

    const result = await this.teamService.searchTeams(
      filters,
      parseInt(page as string),
      parseInt(limit as string),
      req.user?.id
    );
    
    const response: ApiResponse = {
      success: true,
      data: result,
      message: 'Teams retrieved successfully',
      meta: {
        timestamp: new Date().toISOString(),
        requestId: res.locals.requestId || 'unknown',
        version: process.env.API_VERSION || 'v1',
      },
    };

    res.status(200).json(response);
  });

  /**
   * Add member to team
   * POST /api/teams/:id/members
   */
  addTeamMember = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    
    if (!req.user?.id) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
      return;
    }

    const member = await this.teamService.addTeamMember(id, req.body, req.user.id);
    
    const response: ApiResponse = {
      success: true,
      data: member,
      message: 'Member added to team successfully',
      meta: {
        timestamp: new Date().toISOString(),
        requestId: res.locals.requestId || 'unknown',
        version: process.env.API_VERSION || 'v1',
      },
    };

    res.status(201).json(response);
  });

  /**
   * Update team member
   * PUT /api/teams/:id/members/:userId
   */
  updateTeamMember = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id, userId } = req.params;
    
    if (!req.user?.id) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
      return;
    }

    const member = await this.teamService.updateTeamMember(id, userId, req.body, req.user.id);
    
    const response: ApiResponse = {
      success: true,
      data: member,
      message: 'Team member updated successfully',
      meta: {
        timestamp: new Date().toISOString(),
        requestId: res.locals.requestId || 'unknown',
        version: process.env.API_VERSION || 'v1',
      },
    };

    res.status(200).json(response);
  });

  /**
   * Remove member from team
   * DELETE /api/teams/:id/members/:userId
   */
  removeTeamMember = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id, userId } = req.params;
    
    if (!req.user?.id) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
      return;
    }

    await this.teamService.removeTeamMember(id, userId, req.user.id);
    
    const response: ApiResponse = {
      success: true,
      message: 'Member removed from team successfully',
      meta: {
        timestamp: new Date().toISOString(),
        requestId: res.locals.requestId || 'unknown',
        version: process.env.API_VERSION || 'v1',
      },
    };

    res.status(200).json(response);
  });

  /**
   * Get team statistics
   * GET /api/teams/:id/stats
   */
  getTeamStats = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;

    const stats = await this.teamService.getTeamStats(id);
    
    const response: ApiResponse = {
      success: true,
      data: stats,
      message: 'Team statistics retrieved successfully',
      meta: {
        timestamp: new Date().toISOString(),
        requestId: res.locals.requestId || 'unknown',
        version: process.env.API_VERSION || 'v1',
      },
    };

    res.status(200).json(response);
  });

  /**
   * Get my teams
   * GET /api/teams/my
   */
  getMyTeams = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!req.user?.id) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
      return;
    }

    const {
      page = '1',
      limit = '20',
      isActive = 'true',
    } = req.query;

    const filters = {
      memberUserId: req.user.id,
      isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
    };

    const result = await this.teamService.searchTeams(
      filters,
      parseInt(page as string),
      parseInt(limit as string),
      req.user.id
    );
    
    const response: ApiResponse = {
      success: true,
      data: result,
      message: 'My teams retrieved successfully',
      meta: {
        timestamp: new Date().toISOString(),
        requestId: res.locals.requestId || 'unknown',
        version: process.env.API_VERSION || 'v1',
      },
    };

    res.status(200).json(response);
  });
}

// Create controller instance
const teamController = new TeamController();

export { teamController };

// Export route handlers with validation
export const teamRoutes = {
  createTeam: [
    validate(createTeamSchema, 'body'),
    teamController.createTeam,
  ],
  getTeamById: [
    teamController.getTeamById,
  ],
  updateTeam: [
    validate(updateTeamSchema, 'body'),
    teamController.updateTeam,
  ],
  deleteTeam: [
    teamController.deleteTeam,
  ],
  searchTeams: [
    validate(teamSearchSchema, 'query'),
    teamController.searchTeams,
  ],
  addTeamMember: [
    validate(addTeamMemberSchema, 'body'),
    teamController.addTeamMember,
  ],
  updateTeamMember: [
    validate(updateTeamMemberSchema, 'body'),
    teamController.updateTeamMember,
  ],
  removeTeamMember: [
    teamController.removeTeamMember,
  ],
  getTeamStats: [
    teamController.getTeamStats,
  ],
  getMyTeams: [
    teamController.getMyTeams,
  ],
};
import { Request, Response } from 'express';
import { ProjectService } from '@/services/ProjectService';
import { prisma } from '@/config/database';
import { asyncHandler } from '@/middleware/errorHandler';
import { validate } from '@/validation';
import {
  createProjectSchema,
  updateProjectSchema,
  addProjectMemberSchema,
  updateProjectMemberSchema,
  projectSearchSchema,
} from '@/validation/project.validation';
import { logger } from '@/utils/logger';
import { ApiResponse } from '@/types/common.types';
import { ProjectMethodology, ProjectStatus, ProjectPriority } from '@/types/project.types';

export class ProjectController {
  private projectService: ProjectService;

  constructor() {
    this.projectService = new ProjectService(prisma);
  }

  /**
   * Create a new project
   * POST /api/projects
   */
  createProject = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!req.user?.id) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
      return;
    }

    const project = await this.projectService.createProject(req.body, req.user.id);
    
    const response: ApiResponse = {
      success: true,
      data: project,
      message: 'Project created successfully',
      meta: {
        timestamp: new Date().toISOString(),
        requestId: res.locals.requestId || 'unknown',
        version: process.env.API_VERSION || 'v1',
      },
    };

    res.status(201).json(response);
  });

  /**
   * Get project by ID
   * GET /api/projects/:id
   */
  getProjectById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const { includeMembers, includeTeam, includeStats } = req.query;

    const options = {
      includeMembers: includeMembers === 'true',
      includeTeam: includeTeam === 'true',
      includeStats: includeStats === 'true',
    };

    const project = await this.projectService.getProjectById(id, options);
    
    if (!project) {
      res.status(404).json({
        success: false,
        message: 'Project not found',
      });
      return;
    }

    const response: ApiResponse = {
      success: true,
      data: project,
      message: 'Project retrieved successfully',
      meta: {
        timestamp: new Date().toISOString(),
        requestId: res.locals.requestId || 'unknown',
        version: process.env.API_VERSION || 'v1',
      },
    };

    res.status(200).json(response);
  });

  /**
   * Update project
   * PUT /api/projects/:id
   */
  updateProject = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    
    if (!req.user?.id) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
      return;
    }

    const project = await this.projectService.updateProject(id, req.body, req.user.id);
    
    const response: ApiResponse = {
      success: true,
      data: project,
      message: 'Project updated successfully',
      meta: {
        timestamp: new Date().toISOString(),
        requestId: res.locals.requestId || 'unknown',
        version: process.env.API_VERSION || 'v1',
      },
    };

    res.status(200).json(response);
  });

  /**
   * Delete project
   * DELETE /api/projects/:id
   */
  deleteProject = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    
    if (!req.user?.id) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
      return;
    }

    await this.projectService.deleteProject(id, req.user.id);
    
    const response: ApiResponse = {
      success: true,
      message: 'Project deleted successfully',
      meta: {
        timestamp: new Date().toISOString(),
        requestId: res.locals.requestId || 'unknown',
        version: process.env.API_VERSION || 'v1',
      },
    };

    res.status(200).json(response);
  });

  /**
   * Search projects with filters and pagination
   * GET /api/projects
   */
  searchProjects = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const {
      page = '1',
      limit = '20',
      search,
      status,
      priority,
      methodology,
      ownerId,
      teamId,
      memberUserId,
      isArchived,
      isTemplate,
      createdAfter,
      createdBefore,
    } = req.query;

    const filters = {
      search: search as string,
      status: status ? (status as string).split(',') as ProjectStatus[] : undefined,
      priority: priority ? (priority as string).split(',') as ProjectPriority[] : undefined,
      methodology: methodology ? (methodology as string).split(',') as ProjectMethodology[] : undefined,
      ownerId: ownerId as string,
      teamId: teamId as string,
      memberUserId: memberUserId as string,
      isArchived: isArchived === 'true' ? true : isArchived === 'false' ? false : undefined,
      isTemplate: isTemplate === 'true' ? true : isTemplate === 'false' ? false : undefined,
      createdAfter: createdAfter ? new Date(createdAfter as string) : undefined,
      createdBefore: createdBefore ? new Date(createdBefore as string) : undefined,
    };

    const result = await this.projectService.searchProjects(
      filters,
      parseInt(page as string),
      parseInt(limit as string),
      req.user?.id
    );
    
    const response: ApiResponse = {
      success: true,
      data: result,
      message: 'Projects retrieved successfully',
      meta: {
        timestamp: new Date().toISOString(),
        requestId: res.locals.requestId || 'unknown',
        version: process.env.API_VERSION || 'v1',
      },
    };

    res.status(200).json(response);
  });

  /**
   * Add member to project
   * POST /api/projects/:id/members
   */
  addProjectMember = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    
    if (!req.user?.id) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
      return;
    }

    const member = await this.projectService.addProjectMember(id, req.body, req.user.id);
    
    const response: ApiResponse = {
      success: true,
      data: member,
      message: 'Member added to project successfully',
      meta: {
        timestamp: new Date().toISOString(),
        requestId: res.locals.requestId || 'unknown',
        version: process.env.API_VERSION || 'v1',
      },
    };

    res.status(201).json(response);
  });

  /**
   * Update project member
   * PUT /api/projects/:id/members/:userId
   */
  updateProjectMember = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id, userId } = req.params;
    
    if (!req.user?.id) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
      return;
    }

    const member = await this.projectService.updateProjectMember(id, userId, req.body, req.user.id);
    
    const response: ApiResponse = {
      success: true,
      data: member,
      message: 'Project member updated successfully',
      meta: {
        timestamp: new Date().toISOString(),
        requestId: res.locals.requestId || 'unknown',
        version: process.env.API_VERSION || 'v1',
      },
    };

    res.status(200).json(response);
  });

  /**
   * Remove member from project
   * DELETE /api/projects/:id/members/:userId
   */
  removeProjectMember = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id, userId } = req.params;
    
    if (!req.user?.id) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
      return;
    }

    await this.projectService.removeProjectMember(id, userId, req.user.id);
    
    const response: ApiResponse = {
      success: true,
      message: 'Member removed from project successfully',
      meta: {
        timestamp: new Date().toISOString(),
        requestId: res.locals.requestId || 'unknown',
        version: process.env.API_VERSION || 'v1',
      },
    };

    res.status(200).json(response);
  });

  /**
   * Get project statistics
   * GET /api/projects/:id/stats
   */
  getProjectStats = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;

    const stats = await this.projectService.getProjectStats(id);
    
    const response: ApiResponse = {
      success: true,
      data: stats,
      message: 'Project statistics retrieved successfully',
      meta: {
        timestamp: new Date().toISOString(),
        requestId: res.locals.requestId || 'unknown',
        version: process.env.API_VERSION || 'v1',
      },
    };

    res.status(200).json(response);
  });

  /**
   * Get my projects
   * GET /api/projects/my
   */
  getMyProjects = asyncHandler(async (req: Request, res: Response): Promise<void> => {
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
      status,
      priority,
      methodology,
    } = req.query;

    const filters = {
      memberUserId: req.user.id,
      status: status ? (status as string).split(',') as ProjectStatus[] : undefined,
      priority: priority ? (priority as string).split(',') as ProjectPriority[] : undefined,
      methodology: methodology ? (methodology as string).split(',') as ProjectMethodology[] : undefined,
      isArchived: false,
    };

    const result = await this.projectService.searchProjects(
      filters,
      parseInt(page as string),
      parseInt(limit as string),
      req.user.id
    );
    
    const response: ApiResponse = {
      success: true,
      data: result,
      message: 'My projects retrieved successfully',
      meta: {
        timestamp: new Date().toISOString(),
        requestId: res.locals.requestId || 'unknown',
        version: process.env.API_VERSION || 'v1',
      },
    };

    res.status(200).json(response);
  });

  /**
   * Get project activity feed
   * GET /api/projects/:id/activity
   */
  getProjectActivity = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const { page = '1', limit = '50' } = req.query;

    // Mock implementation for now
    const mockActivity = {
      activities: [
        {
          id: 'activity-1',
          projectId: id,
          userId: 'user-123',
          action: 'TASK_CREATED',
          entityType: 'task',
          entityId: 'task-123',
          details: { taskTitle: 'New task created' },
          timestamp: new Date(),
          user: {
            id: 'user-123',
            firstName: 'John',
            lastName: 'Doe',
            profilePicture: null,
          },
        },
      ],
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total: 1,
        totalPages: 1,
        hasNext: false,
        hasPrev: false,
      },
    };
    
    const response: ApiResponse = {
      success: true,
      data: mockActivity,
      message: 'Project activity retrieved successfully',
      meta: {
        timestamp: new Date().toISOString(),
        requestId: res.locals.requestId || 'unknown',
        version: process.env.API_VERSION || 'v1',
      },
    };

    res.status(200).json(response);
  });

  /**
   * Get project templates
   * GET /api/projects/templates
   */
  getProjectTemplates = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    // Mock implementation for now
    const mockTemplates = [
      {
        id: 'template-1',
        name: 'Agile Software Development',
        description: 'Standard agile project template with sprints and user stories',
        methodology: ProjectMethodology.AGILE,
        category: 'Software Development',
        tags: ['agile', 'scrum', 'software'],
        isPublic: true,
        usageCount: 150,
      },
      {
        id: 'template-2',
        name: 'Kanban Board',
        description: 'Simple kanban board for continuous flow',
        methodology: ProjectMethodology.KANBAN,
        category: 'General',
        tags: ['kanban', 'continuous', 'flow'],
        isPublic: true,
        usageCount: 89,
      },
    ];
    
    const response: ApiResponse = {
      success: true,
      data: { templates: mockTemplates },
      message: 'Project templates retrieved successfully',
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
const projectController = new ProjectController();

export { projectController };

// Export route handlers with validation
export const projectRoutes = {
  createProject: [
    validate(createProjectSchema, 'body'),
    projectController.createProject,
  ],
  getProjectById: [
    projectController.getProjectById,
  ],
  updateProject: [
    validate(updateProjectSchema, 'body'),
    projectController.updateProject,
  ],
  deleteProject: [
    projectController.deleteProject,
  ],
  searchProjects: [
    validate(projectSearchSchema, 'query'),
    projectController.searchProjects,
  ],
  addProjectMember: [
    validate(addProjectMemberSchema, 'body'),
    projectController.addProjectMember,
  ],
  updateProjectMember: [
    validate(updateProjectMemberSchema, 'body'),
    projectController.updateProjectMember,
  ],
  removeProjectMember: [
    projectController.removeProjectMember,
  ],
  getProjectStats: [
    projectController.getProjectStats,
  ],
  getMyProjects: [
    projectController.getMyProjects,
  ],
  getProjectActivity: [
    projectController.getProjectActivity,
  ],
  getProjectTemplates: [
    projectController.getProjectTemplates,
  ],
};
import { PrismaClient } from '@prisma/client';
import { CacheService } from '@/config/redis';
import { logger } from '@/utils/logger';
import {
  IProject,
  IProjectMember,
  ITeam,
  ProjectStatus,
  ProjectPriority,
  ProjectMethodology,
  ProjectMemberRole,
  CreateProjectRequest,
  UpdateProjectRequest,
  ProjectSearchFilters,
  ProjectListResponse,
  AddProjectMemberRequest,
  UpdateProjectMemberRequest,
  CreateTeamRequest,
  UpdateTeamRequest,
  ProjectWithMembers,
  ProjectSummary,
  ProjectTemplate,
  CreateProjectFromTemplateRequest,
  ProjectActivity,
  ProjectAnalytics,
  WorkflowStatusConfig,
  ProjectNotFoundError,
  ProjectKeyConflictError,
  ProjectMemberNotFoundError,
  InsufficientProjectPermissionsError,
} from '@/types/project.types';
import {
  ValidationError,
  NotFoundError,
  ConflictError,
  AuthorizationError,
} from '@/middleware/errorHandler';

export class ProjectService {
  private prisma: PrismaClient;
  private cache: CacheService;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.cache = CacheService.getInstance();
  }

  /**
   * Create a new project
   */
  async createProject(
    projectData: CreateProjectRequest,
    createdBy: string
  ): Promise<IProject> {
    try {
      // Generate unique project key if not provided
      const projectKey = projectData.key || await this.generateProjectKey(projectData.name);
      
      // Validate project key uniqueness
      const existingProject = await this.prisma.project.findUnique({
        where: { key: projectKey },
      });
      
      if (existingProject) {
        throw new ProjectKeyConflictError(projectKey);
      }

      // Create default workflow statuses if not provided
      const defaultStatuses = this.getDefaultWorkflowStatuses(projectData.methodology);
      
      // Prepare project settings
      const settings = {
        workflowStatuses: defaultStatuses,
        defaultAssignee: null,
        autoAssignOwner: true,
        allowGuestAccess: false,
        requireApprovalForChanges: false,
        notifyOnTaskCreation: true,
        notifyOnStatusChange: true,
        notifyOnAssignment: true,
        enableTimeTracking: true,
        requireTimeEstimates: false,
        customSettings: {},
        ...projectData.settings,
      };

      // Create project in transaction
      const project = await this.prisma.$transaction(async (tx) => {
        // Create the project
        const newProject = await tx.project.create({
          data: {
            name: projectData.name,
            description: projectData.description,
            key: projectKey,
            status: projectData.status || ProjectStatus.PLANNING,
            priority: projectData.priority || ProjectPriority.MEDIUM,
            methodology: projectData.methodology,
            startDate: projectData.startDate,
            endDate: projectData.endDate,
            ownerId: createdBy,
            teamId: projectData.teamId,
            settings: settings as any,
            customFields: projectData.customFields || {},
            isArchived: false,
            isTemplate: false,
            templateId: projectData.templateId,
          },
        });

        // Add project owner as a member with OWNER role
        await tx.projectMember.create({
          data: {
            projectId: newProject.id,
            userId: createdBy,
            role: ProjectMemberRole.OWNER,
            permissions: ['*'], // Owner has all permissions
            isActive: true,
          },
        });

        // Add additional members if provided
        if (projectData.members && projectData.members.length > 0) {
          await tx.projectMember.createMany({
            data: projectData.members.map(member => ({
              projectId: newProject.id,
              userId: member.userId,
              role: member.role,
              permissions: this.getDefaultPermissionsForRole(member.role),
              isActive: true,
            })),
          });
        }

        return newProject;
      });

      // Log activity
      await this.logProjectActivity(project.id, createdBy, 'PROJECT_CREATED', 'project', project.id, {
        projectName: project.name,
        methodology: project.methodology,
      });

      logger.info(`Project created: ${project.name} (${project.id}) by ${createdBy}`);

      return project as IProject;
    } catch (error) {
      logger.error('Failed to create project:', error);
      throw error;
    }
  }

  /**
   * Get project by ID
   */
  async getProjectById(
    projectId: string,
    options: {
      includeMembers?: boolean;
      includeTeam?: boolean;
      includeStats?: boolean;
    } = {}
  ): Promise<ProjectWithMembers | null> {
    try {
      const cacheKey = `project:${projectId}:${JSON.stringify(options)}`;
      
      // Try cache first
      const cached = await this.cache.get<ProjectWithMembers>(cacheKey);
      if (cached) {
        return cached;
      }

      const project = await this.prisma.project.findUnique({
        where: { id: projectId },
        include: {
          owner: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          team: options.includeTeam ? {
            include: {
              members: {
                include: {
                  user: {
                    select: {
                      id: true,
                      firstName: true,
                      lastName: true,
                      email: true,
                      profilePicture: true,
                    },
                  },
                },
              },
            },
          } : false,
          members: options.includeMembers ? {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                  profilePicture: true,
                },
              },
            },
          } : false,
        },
      });

      if (!project) {
        return null;
      }

      let result = project as ProjectWithMembers;

      // Add statistics if requested
      if (options.includeStats) {
        result.stats = await this.getProjectStats(projectId);
      }

      // Cache for 5 minutes
      await this.cache.set(cacheKey, result, 300);

      return result;
    } catch (error) {
      logger.error('Failed to get project by ID:', error);
      throw error;
    }
  }

  /**
   * Update project
   */
  async updateProject(
    projectId: string,
    updateData: UpdateProjectRequest,
    updatedBy: string
  ): Promise<IProject> {
    try {
      const existingProject = await this.prisma.project.findUnique({
        where: { id: projectId },
      });

      if (!existingProject) {
        throw new ProjectNotFoundError(projectId);
      }

      // Check permissions
      await this.checkProjectPermission(projectId, updatedBy, 'project:update');

      const updatedProject = await this.prisma.project.update({
        where: { id: projectId },
        data: {
          name: updateData.name,
          description: updateData.description,
          status: updateData.status,
          priority: updateData.priority,
          methodology: updateData.methodology,
          startDate: updateData.startDate,
          endDate: updateData.endDate,
          teamId: updateData.teamId,
          settings: updateData.settings ? {
            ...existingProject.settings as any,
            ...updateData.settings,
          } : undefined,
          customFields: updateData.customFields ? {
            ...existingProject.customFields as any,
            ...updateData.customFields,
          } : undefined,
          isArchived: updateData.isArchived,
          updatedAt: new Date(),
        },
      });

      // Invalidate cache
      await this.invalidateProjectCache(projectId);

      // Log activity
      await this.logProjectActivity(projectId, updatedBy, 'PROJECT_UPDATED', 'project', projectId, {
        changes: updateData,
      });

      logger.info(`Project updated: ${updatedProject.name} (${projectId}) by ${updatedBy}`);

      return updatedProject as IProject;
    } catch (error) {
      logger.error('Failed to update project:', error);
      throw error;
    }
  }

  /**
   * Delete project (soft delete by archiving)
   */
  async deleteProject(projectId: string, deletedBy: string): Promise<void> {
    try {
      const project = await this.prisma.project.findUnique({
        where: { id: projectId },
      });

      if (!project) {
        throw new ProjectNotFoundError(projectId);
      }

      // Check permissions (only owner or admin can delete)
      await this.checkProjectPermission(projectId, deletedBy, 'project:delete');

      await this.prisma.project.update({
        where: { id: projectId },
        data: {
          isArchived: true,
          updatedAt: new Date(),
        },
      });

      // Invalidate cache
      await this.invalidateProjectCache(projectId);

      // Log activity
      await this.logProjectActivity(projectId, deletedBy, 'PROJECT_DELETED', 'project', projectId, {
        projectName: project.name,
      });

      logger.info(`Project deleted: ${project.name} (${projectId}) by ${deletedBy}`);
    } catch (error) {
      logger.error('Failed to delete project:', error);
      throw error;
    }
  }

  /**
   * Search projects with filters and pagination
   */
  async searchProjects(
    filters: ProjectSearchFilters,
    page: number = 1,
    limit: number = 20,
    userId?: string
  ): Promise<ProjectListResponse> {
    try {
      const offset = (page - 1) * limit;

      // Build where clause
      const where: any = {};

      if (filters.search) {
        where.OR = [
          { name: { contains: filters.search, mode: 'insensitive' } },
          { description: { contains: filters.search, mode: 'insensitive' } },
          { key: { contains: filters.search, mode: 'insensitive' } },
        ];
      }

      if (filters.status && filters.status.length > 0) {
        where.status = { in: filters.status };
      }

      if (filters.priority && filters.priority.length > 0) {
        where.priority = { in: filters.priority };
      }

      if (filters.methodology && filters.methodology.length > 0) {
        where.methodology = { in: filters.methodology };
      }

      if (filters.ownerId) {
        where.ownerId = filters.ownerId;
      }

      if (filters.teamId) {
        where.teamId = filters.teamId;
      }

      if (filters.memberUserId) {
        where.members = {
          some: {
            userId: filters.memberUserId,
            isActive: true,
          },
        };
      }

      if (filters.isArchived !== undefined) {
        where.isArchived = filters.isArchived;
      }

      if (filters.isTemplate !== undefined) {
        where.isTemplate = filters.isTemplate;
      }

      if (filters.createdAfter) {
        where.createdAt = { gte: filters.createdAfter };
      }

      if (filters.createdBefore) {
        where.createdAt = { ...where.createdAt, lte: filters.createdBefore };
      }

      // If userId is provided and no specific filters, show only projects user has access to
      if (userId && !filters.ownerId && !filters.memberUserId) {
        where.OR = [
          { ownerId: userId },
          { members: { some: { userId, isActive: true } } },
        ];
      }

      const [projects, total] = await Promise.all([
        this.prisma.project.findMany({
          where,
          include: {
            owner: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
            _count: {
              select: {
                members: true,
                tasks: true,
              },
            },
          },
          orderBy: { updatedAt: 'desc' },
          skip: offset,
          take: limit,
        }),
        this.prisma.project.count({ where }),
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
        projects: projects as IProject[],
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
        filters,
      };
    } catch (error) {
      logger.error('Failed to search projects:', error);
      throw error;
    }
  }

  /**
   * Add member to project
   */
  async addProjectMember(
    projectId: string,
    memberData: AddProjectMemberRequest,
    addedBy: string
  ): Promise<IProjectMember> {
    try {
      // Check if project exists
      const project = await this.prisma.project.findUnique({
        where: { id: projectId },
      });

      if (!project) {
        throw new ProjectNotFoundError(projectId);
      }

      // Check permissions
      await this.checkProjectPermission(projectId, addedBy, 'project:manage_members');

      // Check if user is already a member
      const existingMember = await this.prisma.projectMember.findUnique({
        where: {
          projectId_userId: {
            projectId,
            userId: memberData.userId,
          },
        },
      });

      if (existingMember) {
        throw new ConflictError('User is already a member of this project');
      }

      const member = await this.prisma.projectMember.create({
        data: {
          projectId,
          userId: memberData.userId,
          role: memberData.role,
          permissions: memberData.permissions || this.getDefaultPermissionsForRole(memberData.role),
          isActive: true,
        },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              profilePicture: true,
            },
          },
        },
      });

      // Invalidate cache
      await this.invalidateProjectCache(projectId);

      // Log activity
      await this.logProjectActivity(projectId, addedBy, 'MEMBER_ADDED', 'user', memberData.userId, {
        role: memberData.role,
        userName: `${member.user?.firstName} ${member.user?.lastName}`,
      });

      logger.info(`Member added to project: ${memberData.userId} to ${projectId} by ${addedBy}`);

      return member as IProjectMember;
    } catch (error) {
      logger.error('Failed to add project member:', error);
      throw error;
    }
  }

  /**
   * Update project member
   */
  async updateProjectMember(
    projectId: string,
    userId: string,
    updateData: UpdateProjectMemberRequest,
    updatedBy: string
  ): Promise<IProjectMember> {
    try {
      // Check permissions
      await this.checkProjectPermission(projectId, updatedBy, 'project:manage_members');

      const existingMember = await this.prisma.projectMember.findUnique({
        where: {
          projectId_userId: {
            projectId,
            userId,
          },
        },
      });

      if (!existingMember) {
        throw new ProjectMemberNotFoundError(projectId, userId);
      }

      const updatedMember = await this.prisma.projectMember.update({
        where: {
          projectId_userId: {
            projectId,
            userId,
          },
        },
        data: {
          role: updateData.role,
          permissions: updateData.permissions,
          isActive: updateData.isActive,
        },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              profilePicture: true,
            },
          },
        },
      });

      // Invalidate cache
      await this.invalidateProjectCache(projectId);

      // Log activity
      await this.logProjectActivity(projectId, updatedBy, 'MEMBER_UPDATED', 'user', userId, {
        changes: updateData,
        userName: `${updatedMember.user?.firstName} ${updatedMember.user?.lastName}`,
      });

      logger.info(`Project member updated: ${userId} in ${projectId} by ${updatedBy}`);

      return updatedMember as IProjectMember;
    } catch (error) {
      logger.error('Failed to update project member:', error);
      throw error;
    }
  }

  /**
   * Remove member from project
   */
  async removeProjectMember(
    projectId: string,
    userId: string,
    removedBy: string
  ): Promise<void> {
    try {
      // Check permissions
      await this.checkProjectPermission(projectId, removedBy, 'project:manage_members');

      // Cannot remove project owner
      const project = await this.prisma.project.findUnique({
        where: { id: projectId },
      });

      if (project?.ownerId === userId) {
        throw new ValidationError('Cannot remove project owner from project');
      }

      const member = await this.prisma.projectMember.findUnique({
        where: {
          projectId_userId: {
            projectId,
            userId,
          },
        },
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
      });

      if (!member) {
        throw new ProjectMemberNotFoundError(projectId, userId);
      }

      await this.prisma.projectMember.delete({
        where: {
          projectId_userId: {
            projectId,
            userId,
          },
        },
      });

      // Invalidate cache
      await this.invalidateProjectCache(projectId);

      // Log activity
      await this.logProjectActivity(projectId, removedBy, 'MEMBER_REMOVED', 'user', userId, {
        userName: `${member.user?.firstName} ${member.user?.lastName}`,
      });

      logger.info(`Member removed from project: ${userId} from ${projectId} by ${removedBy}`);
    } catch (error) {
      logger.error('Failed to remove project member:', error);
      throw error;
    }
  }

  /**
   * Get project statistics
   */
  async getProjectStats(projectId: string): Promise<any> {
    try {
      const [taskStats, memberStats, timeStats] = await Promise.all([
        this.prisma.task.groupBy({
          by: ['status'],
          where: { projectId },
          _count: { status: true },
        }),
        this.prisma.projectMember.count({
          where: { projectId, isActive: true },
        }),
        this.prisma.timeEntry.aggregate({
          where: { task: { projectId } },
          _sum: { hours: true },
        }),
      ]);

      const totalTasks = taskStats.reduce((sum, stat) => sum + stat._count.status, 0);
      const completedTasks = taskStats.find(stat => stat.status === 'DONE')?._count.status || 0;
      const inProgressTasks = taskStats.find(stat => stat.status === 'IN_PROGRESS')?._count.status || 0;

      return {
        totalTasks,
        completedTasks,
        inProgressTasks,
        overdueTasks: 0, // TODO: Calculate based on due dates
        totalMembers: memberStats,
        activeMembers: memberStats,
        completionPercentage: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
        totalHoursLogged: timeStats._sum.hours || 0,
        lastActivity: new Date(),
      };
    } catch (error) {
      logger.error('Failed to get project stats:', error);
      return {};
    }
  }

  /**
   * Generate unique project key
   */
  private async generateProjectKey(projectName: string): Promise<string> {
    // Generate key from project name
    const baseKey = projectName
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '')
      .substring(0, 4);

    let key = baseKey;
    let counter = 1;

    // Ensure uniqueness
    while (await this.prisma.project.findUnique({ where: { key } })) {
      key = `${baseKey}${counter}`;
      counter++;
    }

    return key;
  }

  /**
   * Get default workflow statuses for methodology
   */
  private getDefaultWorkflowStatuses(methodology: ProjectMethodology): WorkflowStatusConfig[] {
    const baseStatuses = [
      {
        id: 'todo',
        name: 'To Do',
        color: '#gray',
        order: 1,
        isDefault: true,
        isResolved: false,
        allowedTransitions: ['in-progress'],
        permissions: {
          canTransitionTo: ['ADMIN', 'PROJECT_MANAGER', 'TEAM_LEAD', 'DEVELOPER'],
          canEdit: ['ADMIN', 'PROJECT_MANAGER', 'TEAM_LEAD'],
        },
      },
      {
        id: 'in-progress',
        name: 'In Progress',
        color: '#blue',
        order: 2,
        isDefault: false,
        isResolved: false,
        allowedTransitions: ['in-review', 'done', 'blocked'],
        permissions: {
          canTransitionTo: ['ADMIN', 'PROJECT_MANAGER', 'TEAM_LEAD', 'DEVELOPER'],
          canEdit: ['ADMIN', 'PROJECT_MANAGER', 'TEAM_LEAD'],
        },
      },
      {
        id: 'done',
        name: 'Done',
        color: '#green',
        order: 5,
        isDefault: false,
        isResolved: true,
        allowedTransitions: [],
        permissions: {
          canTransitionTo: ['ADMIN', 'PROJECT_MANAGER', 'TEAM_LEAD', 'DEVELOPER'],
          canEdit: ['ADMIN', 'PROJECT_MANAGER', 'TEAM_LEAD'],
        },
      },
    ];

    // Add methodology-specific statuses
    if (methodology === ProjectMethodology.SCRUM || methodology === ProjectMethodology.AGILE) {
      baseStatuses.splice(2, 0, {
        id: 'in-review',
        name: 'In Review',
        color: '#orange',
        order: 3,
        isDefault: false,
        isResolved: false,
        allowedTransitions: ['done', 'in-progress'],
        permissions: {
          canTransitionTo: ['ADMIN', 'PROJECT_MANAGER', 'TEAM_LEAD', 'DEVELOPER'],
          canEdit: ['ADMIN', 'PROJECT_MANAGER', 'TEAM_LEAD'],
        },
      });
    }

    return baseStatuses as WorkflowStatusConfig[];
  }

  /**
   * Get default permissions for role
   */
  private getDefaultPermissionsForRole(role: ProjectMemberRole): string[] {
    const permissions: Record<ProjectMemberRole, string[]> = {
      [ProjectMemberRole.OWNER]: ['*'],
      [ProjectMemberRole.MANAGER]: [
        'project:read', 'project:update', 'project:manage_members',
        'task:create', 'task:read', 'task:update', 'task:delete', 'task:assign',
        'sprint:create', 'sprint:read', 'sprint:update', 'sprint:delete',
        'report:read', 'report:create',
      ],
      [ProjectMemberRole.LEAD]: [
        'project:read', 'task:create', 'task:read', 'task:update', 'task:assign',
        'sprint:read', 'sprint:update', 'report:read',
      ],
      [ProjectMemberRole.MEMBER]: [
        'project:read', 'task:read', 'task:update', 'task:comment',
        'sprint:read', 'report:read',
      ],
      [ProjectMemberRole.VIEWER]: [
        'project:read', 'task:read', 'sprint:read', 'report:read',
      ],
    };

    return permissions[role] || [];
  }

  /**
   * Check project permission
   */
  private async checkProjectPermission(
    projectId: string,
    userId: string,
    permission: string
  ): Promise<void> {
    const member = await this.prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId,
        },
      },
    });

    if (!member || !member.isActive) {
      throw new InsufficientProjectPermissionsError(permission);
    }

    // Owner has all permissions
    if (member.role === ProjectMemberRole.OWNER || member.permissions.includes('*')) {
      return;
    }

    // Check specific permission
    if (!member.permissions.includes(permission)) {
      throw new InsufficientProjectPermissionsError(permission);
    }
  }

  /**
   * Log project activity
   */
  private async logProjectActivity(
    projectId: string,
    userId: string,
    action: string,
    entityType: string,
    entityId: string,
    details: Record<string, any>
  ): Promise<void> {
    try {
      await this.prisma.projectActivity.create({
        data: {
          projectId,
          userId,
          action,
          entityType,
          entityId,
          details,
          timestamp: new Date(),
        },
      });
    } catch (error) {
      logger.error('Failed to log project activity:', error);
      // Don't throw error to avoid breaking main operation
    }
  }

  /**
   * Invalidate project cache
   */
  private async invalidateProjectCache(projectId: string): Promise<void> {
    const patterns = [
      `project:${projectId}:*`,
      'project_stats',
    ];

    await Promise.all(patterns.map(pattern => this.cache.del(pattern)));
  }
}
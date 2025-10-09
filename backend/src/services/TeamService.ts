import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';
import { PermissionService } from './PermissionService';
import {
  ITeam,
  ITeamMember,
  CreateTeamRequest,
  UpdateTeamRequest,
} from '@/types/project.types';
import {
  ValidationError,
  NotFoundError,
  ConflictError,
  AuthorizationError,
} from '@/middleware/errorHandler';

export interface TeamSearchFilters {
  search?: string;
  leaderId?: string;
  isActive?: boolean;
  memberUserId?: string;
  createdAfter?: Date;
  createdBefore?: Date;
}

export interface TeamListResponse {
  teams: ITeam[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  filters: TeamSearchFilters;
}

export interface AddTeamMemberRequest {
  userId: string;
  role: string;
}

export interface UpdateTeamMemberRequest {
  role?: string;
  isActive?: boolean;
}

export class TeamService {
  private prisma: PrismaClient;
  private cache: CacheService;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.cache = CacheService.getInstance();
  }

  /**
   * Create a new team
   */
  async createTeam(
    teamData: CreateTeamRequest,
    createdBy: string
  ): Promise<ITeam> {
    try {
      // Validate team name uniqueness
      const existingTeam = await this.prisma.team.findFirst({
        where: { 
          name: teamData.name,
          isActive: true,
        },
      });
      
      if (existingTeam) {
        throw new ConflictError('Team with this name already exists');
      }

      // Create team in transaction
      const team = await this.prisma.$transaction(async (tx) => {
        // Create the team
        const newTeam = await tx.team.create({
          data: {
            name: teamData.name,
            description: teamData.description,
            leaderId: teamData.leaderId,
            isActive: true,
          },
        });

        // Add team leader as a member
        await tx.teamMember.create({
          data: {
            teamId: newTeam.id,
            userId: teamData.leaderId,
            role: 'LEADER',
            isActive: true,
          },
        });

        // Add additional members if provided
        if (teamData.members && teamData.members.length > 0) {
          await tx.teamMember.createMany({
            data: teamData.members.map(member => ({
              teamId: newTeam.id,
              userId: member.userId,
              role: member.role,
              isActive: true,
            })),
          });
        }

        return newTeam;
      });

      logger.info(`Team created: ${team.name} (${team.id}) by ${createdBy}`);

      return team as ITeam;
    } catch (error) {
      logger.error('Failed to create team:', error);
      throw error;
    }
  }

  /**
   * Get team by ID
   */
  async getTeamById(
    teamId: string,
    options: {
      includeMembers?: boolean;
      includeProjects?: boolean;
    } = {}
  ): Promise<ITeam | null> {
    try {
      const cacheKey = `team:${teamId}:${JSON.stringify(options)}`;
      
      // Try cache first
      const cached = await this.cache.get<ITeam>(cacheKey);
      if (cached) {
        return cached;
      }

      const team = await this.prisma.team.findUnique({
        where: { id: teamId },
        include: {
          leader: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              profilePicture: true,
            },
          },
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
          projects: options.includeProjects ? {
            select: {
              id: true,
              name: true,
              key: true,
              status: true,
              priority: true,
            },
          } : false,
        },
      });

      if (!team) {
        return null;
      }

      // Cache for 5 minutes
      await this.cache.set(cacheKey, team, 300);

      return team as ITeam;
    } catch (error) {
      logger.error('Failed to get team by ID:', error);
      throw error;
    }
  }

  /**
   * Update team
   */
  async updateTeam(
    teamId: string,
    updateData: UpdateTeamRequest,
    updatedBy: string
  ): Promise<ITeam> {
    try {
      const existingTeam = await this.prisma.team.findUnique({
        where: { id: teamId },
      });

      if (!existingTeam) {
        throw new NotFoundError('Team not found');
      }

      // Check permissions (only team leader or admin can update)
      await this.checkTeamPermission(teamId, updatedBy, 'team:update');

      // Check name uniqueness if name is being updated
      if (updateData.name && updateData.name !== existingTeam.name) {
        const nameExists = await this.prisma.team.findFirst({
          where: { 
            name: updateData.name,
            isActive: true,
            id: { not: teamId },
          },
        });
        
        if (nameExists) {
          throw new ConflictError('Team name already in use');
        }
      }

      const updatedTeam = await this.prisma.team.update({
        where: { id: teamId },
        data: {
          name: updateData.name,
          description: updateData.description,
          leaderId: updateData.leaderId,
          isActive: updateData.isActive,
          updatedAt: new Date(),
        },
      });

      // If leader changed, update team member role
      if (updateData.leaderId && updateData.leaderId !== existingTeam.leaderId) {
        await this.prisma.$transaction(async (tx) => {
          // Remove leader role from old leader
          await tx.teamMember.updateMany({
            where: {
              teamId,
              userId: existingTeam.leaderId,
              role: 'LEADER',
            },
            data: { role: 'MEMBER' },
          });

          // Add or update new leader
          await tx.teamMember.upsert({
            where: {
              teamId_userId: {
                teamId,
                userId: updateData.leaderId,
              },
            },
            create: {
              teamId,
              userId: updateData.leaderId,
              role: 'LEADER',
              isActive: true,
            },
            update: {
              role: 'LEADER',
              isActive: true,
            },
          });
        });
      }

      // Invalidate cache
      await this.invalidateTeamCache(teamId);

      logger.info(`Team updated: ${updatedTeam.name} (${teamId}) by ${updatedBy}`);

      return updatedTeam as ITeam;
    } catch (error) {
      logger.error('Failed to update team:', error);
      throw error;
    }
  }

  /**
   * Delete team (soft delete)
   */
  async deleteTeam(teamId: string, deletedBy: string): Promise<void> {
    try {
      const team = await this.prisma.team.findUnique({
        where: { id: teamId },
      });

      if (!team) {
        throw new NotFoundError('Team not found');
      }

      // Check permissions (only team leader or admin can delete)
      await this.checkTeamPermission(teamId, deletedBy, 'team:delete');

      // Check if team has active projects
      const activeProjects = await this.prisma.project.count({
        where: {
          teamId,
          isArchived: false,
        },
      });

      if (activeProjects > 0) {
        throw new ValidationError('Cannot delete team with active projects');
      }

      await this.prisma.team.update({
        where: { id: teamId },
        data: {
          isActive: false,
          updatedAt: new Date(),
        },
      });

      // Deactivate all team members
      await this.prisma.teamMember.updateMany({
        where: { teamId },
        data: { isActive: false },
      });

      // Invalidate cache
      await this.invalidateTeamCache(teamId);

      logger.info(`Team deleted: ${team.name} (${teamId}) by ${deletedBy}`);
    } catch (error) {
      logger.error('Failed to delete team:', error);
      throw error;
    }
  }

  /**
   * Search teams with filters and pagination
   */
  async searchTeams(
    filters: TeamSearchFilters,
    page: number = 1,
    limit: number = 20,
    userId?: string
  ): Promise<TeamListResponse> {
    try {
      const offset = (page - 1) * limit;

      // Build where clause
      const where: any = {};

      if (filters.search) {
        where.OR = [
          { name: { contains: filters.search, mode: 'insensitive' } },
          { description: { contains: filters.search, mode: 'insensitive' } },
        ];
      }

      if (filters.leaderId) {
        where.leaderId = filters.leaderId;
      }

      if (filters.isActive !== undefined) {
        where.isActive = filters.isActive;
      }

      if (filters.memberUserId) {
        where.members = {
          some: {
            userId: filters.memberUserId,
            isActive: true,
          },
        };
      }

      if (filters.createdAfter) {
        where.createdAt = { gte: filters.createdAfter };
      }

      if (filters.createdBefore) {
        where.createdAt = { ...where.createdAt, lte: filters.createdBefore };
      }

      // If userId is provided and no specific filters, show only teams user has access to
      if (userId && !filters.leaderId && !filters.memberUserId) {
        where.OR = [
          { leaderId: userId },
          { members: { some: { userId, isActive: true } } },
        ];
      }

      const [teams, total] = await Promise.all([
        this.prisma.team.findMany({
          where,
          include: {
            leader: {
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
                projects: true,
              },
            },
          },
          orderBy: { updatedAt: 'desc' },
          skip: offset,
          take: limit,
        }),
        this.prisma.team.count({ where }),
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
        teams: teams as ITeam[],
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
      logger.error('Failed to search teams:', error);
      throw error;
    }
  }

  /**
   * Add member to team
   */
  async addTeamMember(
    teamId: string,
    memberData: AddTeamMemberRequest,
    addedBy: string
  ): Promise<ITeamMember> {
    try {
      // Check if team exists
      const team = await this.prisma.team.findUnique({
        where: { id: teamId },
      });

      if (!team) {
        throw new NotFoundError('Team not found');
      }

      // Check permissions
      await this.checkTeamPermission(teamId, addedBy, 'team:manage_members');

      // Check if user is already a member
      const existingMember = await this.prisma.teamMember.findUnique({
        where: {
          teamId_userId: {
            teamId,
            userId: memberData.userId,
          },
        },
      });

      if (existingMember && existingMember.isActive) {
        throw new ConflictError('User is already a member of this team');
      }

      let member;
      if (existingMember) {
        // Reactivate existing member
        member = await this.prisma.teamMember.update({
          where: {
            teamId_userId: {
              teamId,
              userId: memberData.userId,
            },
          },
          data: {
            role: memberData.role,
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
      } else {
        // Create new member
        member = await this.prisma.teamMember.create({
          data: {
            teamId,
            userId: memberData.userId,
            role: memberData.role,
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
      }

      // Invalidate cache
      await this.invalidateTeamCache(teamId);

      logger.info(`Member added to team: ${memberData.userId} to ${teamId} by ${addedBy}`);

      return member as ITeamMember;
    } catch (error) {
      logger.error('Failed to add team member:', error);
      throw error;
    }
  }

  /**
   * Update team member
   */
  async updateTeamMember(
    teamId: string,
    userId: string,
    updateData: UpdateTeamMemberRequest,
    updatedBy: string
  ): Promise<ITeamMember> {
    try {
      // Check permissions
      await this.checkTeamPermission(teamId, updatedBy, 'team:manage_members');

      const existingMember = await this.prisma.teamMember.findUnique({
        where: {
          teamId_userId: {
            teamId,
            userId,
          },
        },
      });

      if (!existingMember) {
        throw new NotFoundError('Team member not found');
      }

      const updatedMember = await this.prisma.teamMember.update({
        where: {
          teamId_userId: {
            teamId,
            userId,
          },
        },
        data: {
          role: updateData.role,
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
      await this.invalidateTeamCache(teamId);

      logger.info(`Team member updated: ${userId} in ${teamId} by ${updatedBy}`);

      return updatedMember as ITeamMember;
    } catch (error) {
      logger.error('Failed to update team member:', error);
      throw error;
    }
  }

  /**
   * Remove member from team
   */
  async removeTeamMember(
    teamId: string,
    userId: string,
    removedBy: string
  ): Promise<void> {
    try {
      // Check permissions
      await this.checkTeamPermission(teamId, removedBy, 'team:manage_members');

      // Cannot remove team leader
      const team = await this.prisma.team.findUnique({
        where: { id: teamId },
      });

      if (team?.leaderId === userId) {
        throw new ValidationError('Cannot remove team leader from team');
      }

      const member = await this.prisma.teamMember.findUnique({
        where: {
          teamId_userId: {
            teamId,
            userId,
          },
        },
      });

      if (!member) {
        throw new NotFoundError('Team member not found');
      }

      await this.prisma.teamMember.update({
        where: {
          teamId_userId: {
            teamId,
            userId,
          },
        },
        data: { isActive: false },
      });

      // Invalidate cache
      await this.invalidateTeamCache(teamId);

      logger.info(`Member removed from team: ${userId} from ${teamId} by ${removedBy}`);
    } catch (error) {
      logger.error('Failed to remove team member:', error);
      throw error;
    }
  }

  /**
   * Get team statistics
   */
  async getTeamStats(teamId: string): Promise<any> {
    try {
      const [memberStats, projectStats] = await Promise.all([
        this.prisma.teamMember.count({
          where: { teamId, isActive: true },
        }),
        this.prisma.project.count({
          where: { teamId, isArchived: false },
        }),
      ]);

      return {
        totalMembers: memberStats,
        activeProjects: projectStats,
        lastActivity: new Date(),
      };
    } catch (error) {
      logger.error('Failed to get team stats:', error);
      return {};
    }
  }

  /**
   * Check team permission
   */
  private async checkTeamPermission(
    teamId: string,
    userId: string,
    permission: string
  ): Promise<void> {
    // Check if user is team leader
    const team = await this.prisma.team.findUnique({
      where: { id: teamId },
    });

    if (team?.leaderId === userId) {
      return; // Team leader has all permissions
    }

    // Check if user is admin (would need to check user role)
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (user?.role === 'ADMIN') {
      return; // Admin has all permissions
    }

    // For now, only team leaders and admins can manage teams
    throw new AuthorizationError(`Insufficient permissions for ${permission}`);
  }

  /**
   * Invalidate team cache
   */
  private async invalidateTeamCache(teamId: string): Promise<void> {
    const patterns = [
      `team:${teamId}:*`,
      'team_stats',
    ];

    await Promise.all(patterns.map(pattern => this.cache.del(pattern)));
  }
}
  // P
roject Team Management Methods

  /**
   * Add a team member to a project
   */
  async addProjectMember(
    projectId: string, 
    membershipRequest: { userId: string; role: string; permissions?: string[] },
    requesterId: string
  ): Promise<any> {
    try {
      // Check if project exists
      const project = await this.prisma.project.findUnique({
        where: { id: projectId }
      });

      if (!project) {
        throw new Error('Project not found');
      }

      // Check if user exists
      const user = await this.prisma.user.findUnique({
        where: { id: membershipRequest.userId }
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Check if user is already a member
      const existingMember = await this.prisma.projectMember.findUnique({
        where: {
          projectId_userId: {
            projectId,
            userId: membershipRequest.userId
          }
        }
      });

      if (existingMember) {
        throw new Error('User is already a member of this project');
      }

      // Create project membership
      const projectMember = await this.prisma.projectMember.create({
        data: {
          projectId,
          userId: membershipRequest.userId,
          role: membershipRequest.role,
          permissions: membershipRequest.permissions || [],
          joinedAt: new Date(),
          addedBy: requesterId
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              role: true
            }
          }
        }
      });

      logger.info(`User ${membershipRequest.userId} added to project ${projectId} with role ${membershipRequest.role}`);

      return {
        id: projectMember.id,
        projectId: projectMember.projectId,
        userId: projectMember.userId,
        role: projectMember.role,
        permissions: projectMember.permissions,
        joinedAt: projectMember.joinedAt,
        user: {
          id: projectMember.user.id,
          email: projectMember.user.email,
          firstName: projectMember.user.firstName,
          lastName: projectMember.user.lastName,
          role: projectMember.user.role
        }
      };
    } catch (error) {
      logger.error('Error adding project member:', error);
      throw error;
    }
  }

  /**
   * Remove a team member from a project
   */
  async removeProjectMember(
    projectId: string, 
    userId: string, 
    requesterId: string
  ): Promise<void> {
    try {
      // Check if member exists
      const member = await this.prisma.projectMember.findUnique({
        where: {
          projectId_userId: {
            projectId,
            userId
          }
        },
        include: {
          user: true
        }
      });

      if (!member) {
        throw new Error('User is not a member of this project');
      }

      // Prevent removing project owner
      const project = await this.prisma.project.findUnique({
        where: { id: projectId }
      });

      if (project?.ownerId === userId) {
        throw new Error('Cannot remove project owner from team');
      }

      // Remove project membership
      await this.prisma.projectMember.delete({
        where: {
          projectId_userId: {
            projectId,
            userId
          }
        }
      });

      // Unassign user from all tasks in the project
      await this.prisma.task.updateMany({
        where: {
          projectId,
          assigneeId: userId
        },
        data: {
          assigneeId: null
        }
      });

      logger.info(`User ${userId} removed from project ${projectId}`);
    } catch (error) {
      logger.error('Error removing project member:', error);
      throw error;
    }
  }

  /**
   * Update project member role and permissions
   */
  async updateProjectMemberRole(
    projectId: string,
    userId: string,
    roleUpdate: { role: string; permissions?: string[] },
    requesterId: string
  ): Promise<any> {
    try {
      // Check if member exists
      const existingMember = await this.prisma.projectMember.findUnique({
        where: {
          projectId_userId: {
            projectId,
            userId
          }
        }
      });

      if (!existingMember) {
        throw new Error('User is not a member of this project');
      }

      // Update member role and permissions
      const updatedMember = await this.prisma.projectMember.update({
        where: {
          projectId_userId: {
            projectId,
            userId
          }
        },
        data: {
          role: roleUpdate.role,
          permissions: roleUpdate.permissions || existingMember.permissions,
          updatedAt: new Date()
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              role: true
            }
          }
        }
      });

      logger.info(`Updated role for user ${userId} in project ${projectId} to ${roleUpdate.role}`);

      return {
        id: updatedMember.id,
        projectId: updatedMember.projectId,
        userId: updatedMember.userId,
        role: updatedMember.role,
        permissions: updatedMember.permissions,
        joinedAt: updatedMember.joinedAt,
        user: {
          id: updatedMember.user.id,
          email: updatedMember.user.email,
          firstName: updatedMember.user.firstName,
          lastName: updatedMember.user.lastName,
          role: updatedMember.user.role
        }
      };
    } catch (error) {
      logger.error('Error updating project member role:', error);
      throw error;
    }
  }

  /**
   * Get all project members
   */
  async getProjectMembers(
    projectId: string, 
    requesterId: string,
    filters?: any
  ): Promise<any[]> {
    try {
      const whereClause: any = { projectId };

      if (filters?.role) {
        whereClause.role = filters.role;
      }

      if (filters?.search) {
        whereClause.user = {
          OR: [
            { firstName: { contains: filters.search, mode: 'insensitive' } },
            { lastName: { contains: filters.search, mode: 'insensitive' } },
            { email: { contains: filters.search, mode: 'insensitive' } }
          ]
        };
      }

      const members = await this.prisma.projectMember.findMany({
        where: whereClause,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              role: true
            }
          }
        },
        orderBy: [
          { role: 'asc' },
          { joinedAt: 'asc' }
        ]
      });

      return members.map(member => ({
        id: member.id,
        projectId: member.projectId,
        userId: member.userId,
        role: member.role,
        permissions: member.permissions,
        joinedAt: member.joinedAt,
        user: {
          id: member.user.id,
          email: member.user.email,
          firstName: member.user.firstName,
          lastName: member.user.lastName,
          role: member.user.role
        }
      }));
    } catch (error) {
      logger.error('Error getting project members:', error);
      throw error;
    }
  }

  /**
   * Get user's project memberships
   */
  async getUserProjectMemberships(userId: string): Promise<any[]> {
    try {
      const memberships = await this.prisma.projectMember.findMany({
        where: { userId },
        include: {
          project: {
            select: {
              id: true,
              name: true,
              key: true,
              status: true,
              methodology: true
            }
          },
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              role: true
            }
          }
        },
        orderBy: { joinedAt: 'desc' }
      });

      return memberships.map(membership => ({
        id: membership.id,
        projectId: membership.projectId,
        userId: membership.userId,
        role: membership.role,
        permissions: membership.permissions,
        joinedAt: membership.joinedAt,
        user: {
          id: membership.user.id,
          email: membership.user.email,
          firstName: membership.user.firstName,
          lastName: membership.user.lastName,
          role: membership.user.role
        },
        project: membership.project
      }));
    } catch (error) {
      logger.error('Error getting user project memberships:', error);
      throw error;
    }
  }

  /**
   * Check if user is member of project
   */
  async isProjectMember(projectId: string, userId: string): Promise<boolean> {
    try {
      const member = await this.prisma.projectMember.findUnique({
        where: {
          projectId_userId: {
            projectId,
            userId
          }
        }
      });

      return !!member;
    } catch (error) {
      logger.error('Error checking project membership:', error);
      return false;
    }
  }

  /**
   * Get project member details
   */
  async getProjectMember(
    projectId: string, 
    userId: string
  ): Promise<any | null> {
    try {
      const member = await this.prisma.projectMember.findUnique({
        where: {
          projectId_userId: {
            projectId,
            userId
          }
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              role: true
            }
          }
        }
      });

      if (!member) {
        return null;
      }

      return {
        id: member.id,
        projectId: member.projectId,
        userId: member.userId,
        role: member.role,
        permissions: member.permissions,
        joinedAt: member.joinedAt,
        user: {
          id: member.user.id,
          email: member.user.email,
          firstName: member.user.firstName,
          lastName: member.user.lastName,
          role: member.user.role
        }
      };
    } catch (error) {
      logger.error('Error getting project member:', error);
      throw error;
    }
  }

  /**
   * Bulk add members to project
   */
  async bulkAddProjectMembers(
    projectId: string,
    members: any[],
    requesterId: string
  ): Promise<any[]> {
    try {
      const results: any[] = [];

      for (const memberRequest of members) {
        try {
          const result = await this.addProjectMember(projectId, memberRequest, requesterId);
          results.push(result);
        } catch (error) {
          logger.warn(`Failed to add member ${memberRequest.userId}: ${error.message}`);
          // Continue with other members
        }
      }

      return results;
    } catch (error) {
      logger.error('Error bulk adding project members:', error);
      throw error;
    }
  }

  /**
   * Get available project roles and their permissions
   */
  async getProjectRoles(): Promise<any[]> {
    return [
      {
        role: 'PROJECT_MANAGER',
        permissions: [
          'MANAGE_PROJECT',
          'MANAGE_TEAM',
          'CREATE_TASKS',
          'EDIT_TASKS',
          'DELETE_TASKS',
          'MANAGE_SPRINTS',
          'VIEW_REPORTS',
          'MANAGE_WORKFLOWS'
        ],
        description: 'Full project management access including team and task management'
      },
      {
        role: 'TEAM_LEAD',
        permissions: [
          'CREATE_TASKS',
          'EDIT_TASKS',
          'ASSIGN_TASKS',
          'MANAGE_SPRINTS',
          'VIEW_REPORTS'
        ],
        description: 'Team leadership with task and sprint management capabilities'
      },
      {
        role: 'DEVELOPER',
        permissions: [
          'CREATE_TASKS',
          'EDIT_ASSIGNED_TASKS',
          'LOG_TIME',
          'COMMENT_TASKS'
        ],
        description: 'Standard development access with task creation and time logging'
      },
      {
        role: 'TESTER',
        permissions: [
          'CREATE_BUGS',
          'EDIT_ASSIGNED_TASKS',
          'LOG_TIME',
          'COMMENT_TASKS'
        ],
        description: 'Testing focused access with bug creation and task commenting'
      },
      {
        role: 'VIEWER',
        permissions: [
          'VIEW_TASKS',
          'COMMENT_TASKS'
        ],
        description: 'Read-only access with commenting capabilities'
      }
    ];
  }
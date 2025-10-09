import { PrismaClient, Team, TeamRole, Prisma } from '@prisma/client';
import { BaseModel } from './BaseModel';
import { 
  CreateTeamRequest, 
  UpdateTeamRequest, 
  AddTeamMemberRequest,
  UpdateTeamMemberRequest,
  TeamFilters, 
  TeamListQuery,
  ITeam,
  ITeamMember
} from '@/types/team.types';
import { logger } from '@/utils/logger';

export class TeamModel extends BaseModel {
  constructor(prisma: PrismaClient) {
    super(prisma, 'team');
  }

  async create(data: CreateTeamRequest, ownerId: string): Promise<ITeam> {
    try {
      const team = await this.prisma.team.create({
        data: {
          ...data,
          ownerId,
        },
        include: {
          owner: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              role: true,
            },
          },
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                  firstName: true,
                  lastName: true,
                  role: true,
                },
              },
            },
          },
          _count: {
            select: {
              members: true,
              projects: true,
            },
          },
        },
      });

      // Invalidate team list cache
      await this.invalidateCache('team:list:*');
      
      logger.info(`Team created: ${team.name}`);
      return team as ITeam;
    } catch (error) {
      logger.error('Error creating team:', error);
      throw error;
    }
  }

  async findById(id: string): Promise<ITeam | null> {
    const cacheKey = this.getCacheKey('findById', { id });
    
    return this.getCachedOrFetch(
      cacheKey,
      async () => {
        const team = await this.prisma.team.findUnique({
          where: { id },
          include: {
            owner: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
              },
            },
            members: {
              include: {
                user: {
                  select: {
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                    role: true,
                  },
                },
              },
            },
            projects: {
              select: {
                id: true,
                name: true,
                key: true,
                status: true,
                methodology: true,
              },
            },
            _count: {
              select: {
                members: true,
                projects: true,
              },
            },
          },
        });

        return team as ITeam;
      },
      600 // 10 minutes cache
    );
  }

  async update(id: string, data: UpdateTeamRequest): Promise<ITeam> {
    try {
      const team = await this.prisma.team.update({
        where: { id },
        data,
        include: {
          owner: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              role: true,
            },
          },
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                  firstName: true,
                  lastName: true,
                  role: true,
                },
              },
            },
          },
          _count: {
            select: {
              members: true,
              projects: true,
            },
          },
        },
      });

      // Invalidate caches
      await this.invalidateCache(`team:findById:${id}`);
      await this.invalidateCache('team:list:*');
      
      logger.info(`Team updated: ${team.name}`);
      return team as ITeam;
    } catch (error) {
      logger.error('Error updating team:', error);
      throw error;
    }
  }
}  async 
findMany(query: TeamListQuery): Promise<{ teams: ITeam[]; total: number }> {
    const cacheKey = this.getCacheKey('findMany', query);
    
    return this.getCachedOrFetch(
      cacheKey,
      async () => {
        const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc', ...filters } = query;
        const { skip, take } = this.getPaginationParams(page, limit);
        const orderBy = this.getSortParams(sortBy, sortOrder);

        // Build where clause
        const where: Prisma.TeamWhereInput = {};
        
        if (filters.isActive !== undefined) {
          where.isActive = filters.isActive;
        }
        
        if (filters.ownerId) {
          where.ownerId = filters.ownerId;
        }
        
        if (filters.search) {
          where.OR = [
            { name: { contains: filters.search, mode: 'insensitive' } },
            { description: { contains: filters.search, mode: 'insensitive' } },
            { key: { contains: filters.search, mode: 'insensitive' } },
          ];
        }

        const [teams, total] = await Promise.all([
          this.prisma.team.findMany({
            where,
            skip,
            take,
            orderBy,
            include: {
              owner: {
                select: {
                  id: true,
                  email: true,
                  firstName: true,
                  lastName: true,
                  role: true,
                },
              },
              _count: query.includeCounts ? {
                select: {
                  members: true,
                  projects: true,
                },
              } : undefined,
            },
          }),
          this.prisma.team.count({ where }),
        ]);

        return { teams: teams as ITeam[], total };
      },
      180 // 3 minutes cache
    );
  }

  async addMember(teamId: string, data: AddTeamMemberRequest): Promise<ITeamMember> {
    try {
      const member = await this.prisma.teamMember.create({
        data: {
          teamId,
          userId: data.userId,
          role: data.role,
          permissions: data.permissions,
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              role: true,
            },
          },
          team: {
            select: {
              id: true,
              name: true,
              key: true,
            },
          },
        },
      });

      // Invalidate team cache
      await this.invalidateCache(`team:findById:${teamId}`);
      
      logger.info(`Member added to team ${teamId}: ${data.userId}`);
      return member as ITeamMember;
    } catch (error) {
      logger.error('Error adding team member:', error);
      throw error;
    }
  }

  async updateMember(teamId: string, userId: string, data: UpdateTeamMemberRequest): Promise<ITeamMember> {
    try {
      const member = await this.prisma.teamMember.update({
        where: {
          teamId_userId: {
            teamId,
            userId,
          },
        },
        data,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              role: true,
            },
          },
          team: {
            select: {
              id: true,
              name: true,
              key: true,
            },
          },
        },
      });

      // Invalidate team cache
      await this.invalidateCache(`team:findById:${teamId}`);
      
      logger.info(`Team member updated: ${userId} in team ${teamId}`);
      return member as ITeamMember;
    } catch (error) {
      logger.error('Error updating team member:', error);
      throw error;
    }
  }

  async removeMember(teamId: string, userId: string): Promise<void> {
    try {
      await this.prisma.teamMember.delete({
        where: {
          teamId_userId: {
            teamId,
            userId,
          },
        },
      });

      // Invalidate team cache
      await this.invalidateCache(`team:findById:${teamId}`);
      
      logger.info(`Member removed from team ${teamId}: ${userId}`);
    } catch (error) {
      logger.error('Error removing team member:', error);
      throw error;
    }
  }

  async getStats(): Promise<{
    totalTeams: number;
    activeTeams: number;
    teamsByRole: Record<TeamRole, number>;
    averageTeamSize: number;
    totalProjects: number;
  }> {
    const cacheKey = this.getCacheKey('getStats');
    
    return this.getCachedOrFetch(
      cacheKey,
      async () => {
        const [totalTeams, activeTeams, membersByRole, totalProjects] = await Promise.all([
          this.prisma.team.count(),
          this.prisma.team.count({ where: { isActive: true } }),
          this.prisma.teamMember.groupBy({
            by: ['role'],
            _count: { role: true },
          }),
          this.prisma.project.count(),
        ]);

        const roleStats = Object.values(TeamRole).reduce((acc, role) => {
          acc[role] = 0;
          return acc;
        }, {} as Record<TeamRole, number>);

        membersByRole.forEach(group => {
          roleStats[group.role] = group._count.role;
        });

        const totalMembers = await this.prisma.teamMember.count();
        const averageTeamSize = activeTeams > 0 ? totalMembers / activeTeams : 0;

        return {
          totalTeams,
          activeTeams,
          teamsByRole: roleStats,
          averageTeamSize: Math.round(averageTeamSize * 100) / 100,
          totalProjects,
        };
      },
      300 // 5 minutes cache
    );
  }
}
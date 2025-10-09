import { PrismaClient, Project, ProjectMethodology, ProjectStatus, Priority, Prisma } from '@prisma/client';
import { BaseModel } from './BaseModel';
import { 
  CreateProjectRequest, 
  UpdateProjectRequest, 
  AddProjectMemberRequest,
  UpdateProjectMemberRequest,
  ProjectFilters, 
  ProjectListQuery,
  IProject,
  IProjectMember
} from '@/types/project.types';
import { logger } from '@/utils/logger';

export class ProjectModel extends BaseModel {
  constructor(prisma: PrismaClient) {
    super(prisma, 'project');
  }

  async create(data: CreateProjectRequest & { teamId: string }, ownerId: string): Promise<IProject> {
    try {
      const project = await this.prisma.project.create({
        data: {
          ...data,
          ownerId,
        },
        include: {
          team: {
            select: {
              id: true,
              name: true,
              key: true,
            },
          },
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
          workflows: {
            include: {
              statuses: true,
            },
          },
          _count: {
            select: {
              tasks: true,
              members: true,
            },
          },
        },
      });

      // Create default workflow
      await this.createDefaultWorkflow(project.id);

      // Invalidate project list cache
      await this.invalidateCache('project:list:*');
      
      logger.info(`Project created: ${project.name}`);
      return project as IProject;
    } catch (error) {
      logger.error('Error creating project:', error);
      throw error;
    }
  }

  private async createDefaultWorkflow(projectId: string): Promise<void> {
    const workflow = await this.prisma.workflow.create({
      data: {
        name: 'Default Workflow',
        projectId,
        isDefault: true,
        statuses: {
          create: [
            {
              name: 'To Do',
              category: 'TODO',
              order: 1,
              color: '#DDD',
            },
            {
              name: 'In Progress',
              category: 'IN_PROGRESS',
              order: 2,
              color: '#FFA500',
            },
            {
              name: 'Done',
              category: 'DONE',
              order: 3,
              color: '#32CD32',
            },
          ],
        },
      },
      include: {
        statuses: true,
      },
    });

    // Create transitions
    const statuses = workflow.statuses;
    const transitions = [
      { from: 'To Do', to: 'In Progress', name: 'Start Work' },
      { from: 'In Progress', to: 'Done', name: 'Complete' },
      { from: 'In Progress', to: 'To Do', name: 'Stop Work' },
    ];

    for (const transition of transitions) {
      const fromStatus = statuses.find(s => s.name === transition.from);
      const toStatus = statuses.find(s => s.name === transition.to);
      
      if (fromStatus && toStatus) {
        await this.prisma.workflowTransition.create({
          data: {
            workflowId: workflow.id,
            fromStatusId: fromStatus.id,
            toStatusId: toStatus.id,
            name: transition.name,
          },
        });
      }
    }
  }

  async findById(id: string): Promise<IProject | null> {
    const cacheKey = this.getCacheKey('findById', { id });
    
    return this.getCachedOrFetch(
      cacheKey,
      async () => {
        const project = await this.prisma.project.findUnique({
          where: { id },
          include: {
            team: {
              select: {
                id: true,
                name: true,
                key: true,
              },
            },
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
            workflows: {
              include: {
                statuses: {
                  orderBy: { order: 'asc' },
                },
                transitions: true,
              },
            },
            customFields: {
              orderBy: { order: 'asc' },
            },
            _count: {
              select: {
                tasks: true,
                members: true,
                issues: true,
              },
            },
          },
        });

        return project as IProject;
      },
      600 // 10 minutes cache
    );
  }
}
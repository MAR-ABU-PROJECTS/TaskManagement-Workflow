import { PrismaClient, SprintStatus } from '@prisma/client';
import { logger } from '../utils/logger';
import {
  Sprint,
  SprintTask,
  CreateSprintRequest,
  UpdateSprintRequest,
  SprintFilters,
  SprintQueryOptions,
  SprintSearchResult,
  SprintMetrics,
  BurndownPoint,
  DailyProgress,
  SprintCapacityPlanning,
  TeamMemberCapacity,
  SprintPlanning,
  TaskForPlanning,
  VelocityData,
  SprintValidationResult,
  SprintStatistics
} from '../types/sprint.types';
import { NotificationService } from './NotificationService';

const prisma = new PrismaClient();

export class SprintService {
  private notificationService: NotificationService;

  constructor() {
    this.notificationService = new NotificationService();
  }

  /**
   * Create a new sprint
   */
  async createSprint(sprintData: CreateSprintRequest, createdBy: string): Promise<Sprint> {
    try {
      // Validate sprint data
      const validation = await this.validateSprintData(sprintData);
      if (!validation.isValid) {
        throw new Error(`Sprint validation failed: ${validation.errors.join(', ')}`);
      }

      // Check for overlapping sprints
      const overlappingSprint = await this.checkForOverlappingSprints(
        sprintData.projectId,
        sprintData.startDate,
        sprintData.endDate
      );

      if (overlappingSprint) {
        throw new Error(`Sprint dates overlap with existing sprint: ${overlappingSprint.name}`);
      }

      // Create sprint
      const sprint = await prisma.sprint.create({
        data: {
          name: sprintData.name,
          goal: sprintData.goal,
          projectId: sprintData.projectId,
          startDate: sprintData.startDate,
          endDate: sprintData.endDate,
          status: SprintStatus.PLANNING,
          capacity: sprintData.capacity,
          velocity: null,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        include: {
          project: {
            select: {
              id: true,
              name: true,
              key: true
            }
          },
          sprintTasks: {
            include: {
              task: {
                select: {
                  id: true,
                  key: true,
                  title: true,
                  type: true,
                  status: true,
                  priority: true,
                  assigneeId: true,
                  storyPoints: true,
                  estimatedHours: true,
                  loggedHours: true,
                  remainingHours: true
                }
              }
            }
          }
        }
      });

      // Log activity
      await this.logSprintActivity(sprint.id, createdBy, 'SPRINT_CREATED');

      logger.info(`Sprint created: ${sprint.name} for project ${sprint.project?.name} by user ${createdBy}`);
      return this.mapSprintFromDb(sprint);
    } catch (error) {
      logger.error('Error creating sprint:', error);
      throw error;
    }
  }

  /**
   * Get sprint by ID
   */
  async getSprint(sprintId: string, options: SprintQueryOptions = {}): Promise<Sprint | null> {
    try {
      const sprint = await prisma.sprint.findUnique({
        where: { id: sprintId },
        include: {
          project: {
            select: {
              id: true,
              name: true,
              key: true
            }
          },
          sprintTasks: options.includeTasks ? {
            include: {
              task: {
                select: {
                  id: true,
                  key: true,
                  title: true,
                  type: true,
                  status: true,
                  priority: true,
                  assigneeId: true,
                  storyPoints: true,
                  estimatedHours: true,
                  loggedHours: true,
                  remainingHours: true
                }
              }
            }
          } : false
        }
      });

      if (!sprint) {
        return null;
      }

      const mappedSprint = this.mapSprintFromDb(sprint);

      // Add metrics if requested
      if (options.includeMetrics) {
        mappedSprint.metrics = await this.getSprintMetrics(sprintId);
      }

      return mappedSprint;
    } catch (error) {
      logger.error('Error getting sprint:', error);
      throw error;
    }
  }

  /**
   * Search and filter sprints
   */
  async searchSprints(
    filters: SprintFilters,
    options: SprintQueryOptions = {}
  ): Promise<SprintSearchResult> {
    try {
      const page = options.page || 1;
      const limit = options.limit || 50;
      const skip = (page - 1) * limit;

      // Build where clause
      const whereClause: any = {};

      if (filters.projectId) {
        whereClause.projectId = filters.projectId;
      }

      if (filters.status) {
        whereClause.status = filters.status;
      }

      if (filters.startDateFrom || filters.startDateTo) {
        whereClause.startDate = {};
        if (filters.startDateFrom) {
          whereClause.startDate.gte = filters.startDateFrom;
        }
        if (filters.startDateTo) {
          whereClause.startDate.lte = filters.startDateTo;
        }
      }

      if (filters.endDateFrom || filters.endDateTo) {
        whereClause.endDate = {};
        if (filters.endDateFrom) {
          whereClause.endDate.gte = filters.endDateFrom;
        }
        if (filters.endDateTo) {
          whereClause.endDate.lte = filters.endDateTo;
        }
      }

      if (filters.search) {
        whereClause.OR = [
          { name: { contains: filters.search, mode: 'insensitive' } },
          { goal: { contains: filters.search, mode: 'insensitive' } }
        ];
      }

      // Build order by clause
      const orderBy: any = {};
      if (options.sortBy) {
        orderBy[options.sortBy] = options.sortOrder || 'asc';
      } else {
        orderBy.startDate = 'desc';
      }

      // Get sprints
      const [sprints, total] = await Promise.all([
        prisma.sprint.findMany({
          where: whereClause,
          include: {
            project: {
              select: {
                id: true,
                name: true,
                key: true
              }
            },
            sprintTasks: options.includeTasks ? {
              include: {
                task: {
                  select: {
                    id: true,
                    key: true,
                    title: true,
                    type: true,
                    status: true,
                    priority: true,
                    assigneeId: true,
                    storyPoints: true,
                    estimatedHours: true,
                    loggedHours: true,
                    remainingHours: true
                  }
                }
              }
            } : false
          },
          orderBy,
          skip,
          take: limit
        }),
        prisma.sprint.count({ where: whereClause })
      ]);

      return {
        sprints: sprints.map(sprint => this.mapSprintFromDb(sprint)),
        total,
        page,
        limit,
        hasMore: skip + sprints.length < total
      };
    } catch (error) {
      logger.error('Error searching sprints:', error);
      throw error;
    }
  }

  /**
   * Update sprint
   */
  async updateSprint(
    sprintId: string,
    updateData: UpdateSprintRequest,
    updatedBy: string
  ): Promise<Sprint> {
    try {
      // Get existing sprint
      const existingSprint = await this.getSprint(sprintId);
      if (!existingSprint) {
        throw new Error('Sprint not found');
      }

      // Validate update data
      const validation = await this.validateSprintUpdate(existingSprint, updateData);
      if (!validation.isValid) {
        throw new Error(`Sprint update validation failed: ${validation.errors.join(', ')}`);
      }

      // Check for overlapping sprints if dates are being changed
      if (updateData.startDate || updateData.endDate) {
        const startDate = updateData.startDate || existingSprint.startDate;
        const endDate = updateData.endDate || existingSprint.endDate;
        
        const overlappingSprint = await this.checkForOverlappingSprints(
          existingSprint.projectId,
          startDate,
          endDate,
          sprintId
        );

        if (overlappingSprint) {
          throw new Error(`Sprint dates overlap with existing sprint: ${overlappingSprint.name}`);
        }
      }

      // Handle status changes
      if (updateData.status && updateData.status !== existingSprint.status) {
        await this.handleStatusChange(existingSprint, updateData.status, updatedBy);
      }

      // Update sprint
      const updatedSprint = await prisma.sprint.update({
        where: { id: sprintId },
        data: {
          ...updateData,
          updatedAt: new Date()
        },
        include: {
          project: {
            select: {
              id: true,
              name: true,
              key: true
            }
          },
          sprintTasks: {
            include: {
              task: {
                select: {
                  id: true,
                  key: true,
                  title: true,
                  type: true,
                  status: true,
                  priority: true,
                  assigneeId: true,
                  storyPoints: true,
                  estimatedHours: true,
                  loggedHours: true,
                  remainingHours: true
                }
              }
            }
          }
        }
      });

      // Log activity
      await this.logSprintActivity(sprintId, updatedBy, 'SPRINT_UPDATED');

      logger.info(`Sprint updated: ${updatedSprint.name} by user ${updatedBy}`);
      return this.mapSprintFromDb(updatedSprint);
    } catch (error) {
      logger.error('Error updating sprint:', error);
      throw error;
    }
  }

  /**
   * Delete sprint
   */
  async deleteSprint(sprintId: string, deletedBy: string): Promise<void> {
    try {
      const sprint = await this.getSprint(sprintId);
      if (!sprint) {
        throw new Error('Sprint not found');
      }

      // Check if sprint can be deleted
      if (sprint.status === SprintStatus.ACTIVE) {
        throw new Error('Cannot delete an active sprint');
      }

      // Remove all tasks from sprint first
      await prisma.sprintTask.deleteMany({
        where: { sprintId }
      });

      // Delete sprint
      await prisma.sprint.delete({
        where: { id: sprintId }
      });

      // Log activity
      await this.logSprintActivity(sprintId, deletedBy, 'SPRINT_DELETED');

      logger.info(`Sprint deleted: ${sprint.name} by user ${deletedBy}`);
    } catch (error) {
      logger.error('Error deleting sprint:', error);
      throw error;
    }
  }

  /**
   * Add task to sprint
   */
  async addTaskToSprint(sprintId: string, taskId: string, addedBy: string): Promise<SprintTask> {
    try {
      // Validate sprint exists and is in planning or active status
      const sprint = await this.getSprint(sprintId);
      if (!sprint) {
        throw new Error('Sprint not found');
      }

      if (sprint.status === SprintStatus.COMPLETED || sprint.status === SprintStatus.CANCELLED) {
        throw new Error('Cannot add tasks to a completed or cancelled sprint');
      }

      // Validate task exists and is in the same project
      const task = await prisma.task.findUnique({
        where: { id: taskId },
        select: {
          id: true,
          key: true,
          title: true,
          projectId: true,
          type: true,
          status: true,
          priority: true,
          assigneeId: true,
          storyPoints: true,
          estimatedHours: true,
          loggedHours: true,
          remainingHours: true
        }
      });

      if (!task) {
        throw new Error('Task not found');
      }

      if (task.projectId !== sprint.projectId) {
        throw new Error('Task must be in the same project as the sprint');
      }

      // Check if task is already in the sprint
      const existingSprintTask = await prisma.sprintTask.findUnique({
        where: {
          sprintId_taskId: {
            sprintId,
            taskId
          }
        }
      });

      if (existingSprintTask) {
        throw new Error('Task is already in this sprint');
      }

      // Add task to sprint
      const sprintTask = await prisma.sprintTask.create({
        data: {
          sprintId,
          taskId,
          addedAt: new Date()
        }
      });

      // Log activity
      await this.logSprintActivity(sprintId, addedBy, 'TASK_ADDED_TO_SPRINT', { taskId, taskKey: task.key });

      logger.info(`Task ${task.key} added to sprint ${sprint.name} by user ${addedBy}`);
      
      return {
        id: sprintTask.id,
        sprintId: sprintTask.sprintId,
        taskId: sprintTask.taskId,
        addedAt: sprintTask.addedAt,
        task
      };
    } catch (error) {
      logger.error('Error adding task to sprint:', error);
      throw error;
    }
  }

  /**
   * Remove task from sprint
   */
  async removeTaskFromSprint(sprintId: string, taskId: string, removedBy: string): Promise<void> {
    try {
      // Validate sprint exists
      const sprint = await this.getSprint(sprintId);
      if (!sprint) {
        throw new Error('Sprint not found');
      }

      if (sprint.status === SprintStatus.COMPLETED) {
        throw new Error('Cannot remove tasks from a completed sprint');
      }

      // Get task info for logging
      const task = await prisma.task.findUnique({
        where: { id: taskId },
        select: { key: true }
      });

      // Remove task from sprint
      const deletedSprintTask = await prisma.sprintTask.deleteMany({
        where: {
          sprintId,
          taskId
        }
      });

      if (deletedSprintTask.count === 0) {
        throw new Error('Task is not in this sprint');
      }

      // Log activity
      await this.logSprintActivity(sprintId, removedBy, 'TASK_REMOVED_FROM_SPRINT', { 
        taskId, 
        taskKey: task?.key 
      });

      logger.info(`Task ${task?.key} removed from sprint ${sprint.name} by user ${removedBy}`);
    } catch (error) {
      logger.error('Error removing task from sprint:', error);
      throw error;
    }
  }

  /**
   * Start sprint
   */
  async startSprint(sprintId: string, startedBy: string): Promise<Sprint> {
    try {
      const sprint = await this.getSprint(sprintId);
      if (!sprint) {
        throw new Error('Sprint not found');
      }

      if (sprint.status !== SprintStatus.PLANNING) {
        throw new Error('Only sprints in planning status can be started');
      }

      // Check if there's already an active sprint in the project
      const activeSprint = await prisma.sprint.findFirst({
        where: {
          projectId: sprint.projectId,
          status: SprintStatus.ACTIVE
        }
      });

      if (activeSprint) {
        throw new Error('There is already an active sprint in this project');
      }

      // Start sprint
      const updatedSprint = await this.updateSprint(
        sprintId,
        { status: SprintStatus.ACTIVE },
        startedBy
      );

      // Send notifications
      await this.sendSprintNotifications(updatedSprint, 'SPRINT_STARTED', startedBy);

      return updatedSprint;
    } catch (error) {
      logger.error('Error starting sprint:', error);
      throw error;
    }
  }

  /**
   * Complete sprint
   */
  async completeSprint(sprintId: string, completedBy: string): Promise<Sprint> {
    try {
      const sprint = await this.getSprint(sprintId, { includeTasks: true });
      if (!sprint) {
        throw new Error('Sprint not found');
      }

      if (sprint.status !== SprintStatus.ACTIVE) {
        throw new Error('Only active sprints can be completed');
      }

      // Calculate final velocity
      const metrics = await this.getSprintMetrics(sprintId);
      const velocity = metrics.velocityPoints;

      // Complete sprint
      const updatedSprint = await this.updateSprint(
        sprintId,
        { 
          status: SprintStatus.COMPLETED,
          velocity
        },
        completedBy
      );

      // Send notifications
      await this.sendSprintNotifications(updatedSprint, 'SPRINT_COMPLETED', completedBy);

      return updatedSprint;
    } catch (error) {
      logger.error('Error completing sprint:', error);
      throw error;
    }
  }

  /**
   * Get sprint metrics and burndown data
   */
  async getSprintMetrics(sprintId: string): Promise<SprintMetrics> {
    try {
      const sprint = await this.getSprint(sprintId, { includeTasks: true });
      if (!sprint) {
        throw new Error('Sprint not found');
      }

      const tasks = sprint.tasks || [];
      
      // Calculate basic metrics
      const totalTasks = tasks.length;
      const completedTasks = tasks.filter(st => st.task?.status === 'DONE').length;
      const inProgressTasks = tasks.filter(st => 
        st.task?.status && ['IN_PROGRESS', 'IN_REVIEW', 'TESTING'].includes(st.task.status)
      ).length;
      const todoTasks = totalTasks - completedTasks - inProgressTasks;

      const totalStoryPoints = tasks.reduce((sum, st) => sum + (st.task?.storyPoints || 0), 0);
      const completedStoryPoints = tasks
        .filter(st => st.task?.status === 'DONE')
        .reduce((sum, st) => sum + (st.task?.storyPoints || 0), 0);

      const totalEstimatedHours = tasks.reduce((sum, st) => sum + (st.task?.estimatedHours || 0), 0);
      const totalLoggedHours = tasks.reduce((sum, st) => sum + (st.task?.loggedHours || 0), 0);
      const totalRemainingHours = tasks.reduce((sum, st) => sum + (st.task?.remainingHours || 0), 0);

      const completionPercentage = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

      // Generate burndown data
      const burndownData = await this.generateBurndownData(sprintId, sprint.startDate, sprint.endDate);
      
      // Generate daily progress data
      const dailyProgress = await this.generateDailyProgress(sprintId, sprint.startDate, sprint.endDate);

      return {
        sprintId,
        totalTasks,
        completedTasks,
        inProgressTasks,
        todoTasks,
        totalStoryPoints,
        completedStoryPoints,
        totalEstimatedHours,
        totalLoggedHours,
        totalRemainingHours,
        completionPercentage,
        velocityPoints: completedStoryPoints,
        velocityHours: totalLoggedHours,
        burndownData,
        dailyProgress
      };
    } catch (error) {
      logger.error('Error getting sprint metrics:', error);
      throw error;
    }
  }

  /**
   * Get sprint capacity planning
   */
  async getSprintCapacityPlanning(sprintId: string): Promise<SprintCapacityPlanning> {
    try {
      const sprint = await this.getSprint(sprintId, { includeTasks: true });
      if (!sprint) {
        throw new Error('Sprint not found');
      }

      // Get project team members
      const projectMembers = await prisma.projectMember.findMany({
        where: { projectId: sprint.projectId },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true
            }
          }
        }
      });

      // Calculate capacity for each team member
      const sprintDurationDays = Math.ceil(
        (sprint.endDate.getTime() - sprint.startDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      const workingDaysPerWeek = 5;
      const hoursPerDay = 8;
      const sprintWorkingDays = Math.ceil((sprintDurationDays / 7) * workingDaysPerWeek);

      const teamMembers: TeamMemberCapacity[] = [];
      let totalCapacity = 0;
      let allocatedCapacity = 0;

      for (const member of projectMembers) {
        const memberCapacity = sprintWorkingDays * hoursPerDay;
        
        // Get allocated hours for this member in the sprint
        const memberTasks = sprint.tasks?.filter(st => st.task?.assigneeId === member.userId) || [];
        const memberAllocatedHours = memberTasks.reduce((sum, st) => sum + (st.task?.estimatedHours || 0), 0);
        const memberAssignedTasks = memberTasks.length;
        const memberAssignedStoryPoints = memberTasks.reduce((sum, st) => sum + (st.task?.storyPoints || 0), 0);

        const utilizationPercentage = memberCapacity > 0 ? (memberAllocatedHours / memberCapacity) * 100 : 0;

        teamMembers.push({
          userId: member.userId,
          userName: `${member.user.firstName} ${member.user.lastName}`,
          totalCapacity: memberCapacity,
          allocatedHours: memberAllocatedHours,
          availableHours: memberCapacity - memberAllocatedHours,
          utilizationPercentage,
          assignedTasks: memberAssignedTasks,
          assignedStoryPoints: memberAssignedStoryPoints
        });

        totalCapacity += memberCapacity;
        allocatedCapacity += memberAllocatedHours;
      }

      // Generate recommendations
      const recommendations = this.generateCapacityRecommendations(teamMembers, totalCapacity, allocatedCapacity);

      return {
        sprintId,
        totalCapacity,
        allocatedCapacity,
        availableCapacity: totalCapacity - allocatedCapacity,
        teamMembers,
        recommendations
      };
    } catch (error) {
      logger.error('Error getting sprint capacity planning:', error);
      throw error;
    }
  }

  /**
   * Get velocity data for a project
   */
  async getVelocityData(projectId: string): Promise<VelocityData> {
    try {
      // Get completed sprints for the project
      const completedSprints = await prisma.sprint.findMany({
        where: {
          projectId,
          status: SprintStatus.COMPLETED
        },
        orderBy: { endDate: 'desc' },
        take: 10, // Last 10 sprints
        include: {
          sprintTasks: {
            include: {
              task: {
                select: {
                  storyPoints: true,
                  status: true
                }
              }
            }
          }
        }
      });

      const historicalVelocity = completedSprints.map(sprint => {
        const completedStoryPoints = sprint.sprintTasks
          .filter(st => st.task.status === 'DONE')
          .reduce((sum, st) => sum + (st.task.storyPoints || 0), 0);

        const sprintDuration = Math.ceil(
          (sprint.endDate.getTime() - sprint.startDate.getTime()) / (1000 * 60 * 60 * 24)
        );

        return {
          sprintId: sprint.id,
          sprintName: sprint.name,
          velocity: sprint.velocity || completedStoryPoints,
          completedStoryPoints,
          sprintDuration
        };
      });

      const averageVelocity = historicalVelocity.length > 0
        ? historicalVelocity.reduce((sum, sprint) => sum + sprint.velocity, 0) / historicalVelocity.length
        : 0;

      const lastSprintVelocity = historicalVelocity.length > 0 ? historicalVelocity[0].velocity : undefined;

      // Determine velocity trend
      let velocityTrend: 'INCREASING' | 'DECREASING' | 'STABLE' = 'STABLE';
      if (historicalVelocity.length >= 3) {
        const recent = historicalVelocity.slice(0, 3);
        const older = historicalVelocity.slice(3, 6);
        
        if (older.length > 0) {
          const recentAvg = recent.reduce((sum, s) => sum + s.velocity, 0) / recent.length;
          const olderAvg = older.reduce((sum, s) => sum + s.velocity, 0) / older.length;
          
          if (recentAvg > olderAvg * 1.1) {
            velocityTrend = 'INCREASING';
          } else if (recentAvg < olderAvg * 0.9) {
            velocityTrend = 'DECREASING';
          }
        }
      }

      return {
        projectId,
        averageVelocity,
        lastSprintVelocity,
        velocityTrend,
        historicalVelocity
      };
    } catch (error) {
      logger.error('Error getting velocity data:', error);
      throw error;
    }
  }

  /**
   * Get sprint statistics
   */
  async getSprintStatistics(filters: SprintFilters = {}): Promise<SprintStatistics> {
    try {
      const whereClause: any = {};
      
      if (filters.projectId) {
        whereClause.projectId = filters.projectId;
      }

      const [
        totalSprints,
        statusCounts,
        projectCounts,
        completedSprints
      ] = await Promise.all([
        prisma.sprint.count({ where: whereClause }),
        prisma.sprint.groupBy({
          by: ['status'],
          where: whereClause,
          _count: true
        }),
        prisma.sprint.groupBy({
          by: ['projectId'],
          where: whereClause,
          _count: true
        }),
        prisma.sprint.findMany({
          where: {
            ...whereClause,
            status: SprintStatus.COMPLETED,
            velocity: { not: null }
          },
          select: {
            velocity: true,
            startDate: true,
            endDate: true
          }
        })
      ]);

      const activeSprints = statusCounts.find(s => s.status === SprintStatus.ACTIVE)?._count || 0;
      const completedSprintsCount = statusCounts.find(s => s.status === SprintStatus.COMPLETED)?._count || 0;

      const averageVelocity = completedSprints.length > 0
        ? completedSprints.reduce((sum, s) => sum + (s.velocity || 0), 0) / completedSprints.length
        : 0;

      const averageSprintDuration = completedSprints.length > 0
        ? completedSprints.reduce((sum, s) => {
            const duration = (s.endDate.getTime() - s.startDate.getTime()) / (1000 * 60 * 60 * 24);
            return sum + duration;
          }, 0) / completedSprints.length
        : 0;

      const successRate = totalSprints > 0 ? (completedSprintsCount / totalSprints) * 100 : 0;

      // Generate velocity trend data (last 6 months)
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      const recentSprints = await prisma.sprint.findMany({
        where: {
          ...whereClause,
          status: SprintStatus.COMPLETED,
          endDate: { gte: sixMonthsAgo }
        },
        select: {
          velocity: true,
          endDate: true
        },
        orderBy: { endDate: 'asc' }
      });

      const velocityTrend = this.generateVelocityTrend(recentSprints);

      return {
        totalSprints,
        activeSprints,
        completedSprints: completedSprintsCount,
        averageVelocity,
        averageSprintDuration,
        successRate,
        byStatus: statusCounts.reduce((acc, item) => {
          acc[item.status] = item._count;
          return acc;
        }, {} as Record<string, number>),
        byProject: projectCounts.reduce((acc, item) => {
          acc[item.projectId] = item._count;
          return acc;
        }, {} as Record<string, number>),
        velocityTrend
      };
    } catch (error) {
      logger.error('Error getting sprint statistics:', error);
      throw error;
    }
  }

  // Private helper methods

  private async validateSprintData(sprintData: CreateSprintRequest): Promise<SprintValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate required fields
    if (!sprintData.name || sprintData.name.trim().length === 0) {
      errors.push('Sprint name is required');
    }

    if (sprintData.name && sprintData.name.length > 255) {
      errors.push('Sprint name must be less than 255 characters');
    }

    // Validate dates
    if (sprintData.startDate >= sprintData.endDate) {
      errors.push('Sprint start date must be before end date');
    }

    const now = new Date();
    if (sprintData.endDate <= now) {
      errors.push('Sprint end date must be in the future');
    }

    // Validate sprint duration
    const durationDays = (sprintData.endDate.getTime() - sprintData.startDate.getTime()) / (1000 * 60 * 60 * 24);
    if (durationDays < 1) {
      errors.push('Sprint must be at least 1 day long');
    }
    if (durationDays > 30) {
      warnings.push('Sprint duration is longer than 30 days, consider shorter sprints');
    }

    // Validate project exists
    const project = await prisma.project.findUnique({
      where: { id: sprintData.projectId }
    });

    if (!project) {
      errors.push('Project not found');
    }

    // Validate capacity
    if (sprintData.capacity && sprintData.capacity < 0) {
      errors.push('Sprint capacity cannot be negative');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  private async validateSprintUpdate(existingSprint: Sprint, updateData: UpdateSprintRequest): Promise<SprintValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate name
    if (updateData.name !== undefined) {
      if (!updateData.name || updateData.name.trim().length === 0) {
        errors.push('Sprint name is required');
      }
      if (updateData.name && updateData.name.length > 255) {
        errors.push('Sprint name must be less than 255 characters');
      }
    }

    // Validate dates
    if (updateData.startDate || updateData.endDate) {
      const startDate = updateData.startDate || existingSprint.startDate;
      const endDate = updateData.endDate || existingSprint.endDate;

      if (startDate >= endDate) {
        errors.push('Sprint start date must be before end date');
      }

      // Don't allow changing dates of completed sprints
      if (existingSprint.status === SprintStatus.COMPLETED) {
        if (updateData.startDate || updateData.endDate) {
          errors.push('Cannot change dates of completed sprints');
        }
      }
    }

    // Validate status transitions
    if (updateData.status && updateData.status !== existingSprint.status) {
      const validTransitions = this.getValidStatusTransitions(existingSprint.status);
      if (!validTransitions.includes(updateData.status)) {
        errors.push(`Invalid status transition from ${existingSprint.status} to ${updateData.status}`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  private getValidStatusTransitions(currentStatus: SprintStatus): SprintStatus[] {
    const transitions: Record<SprintStatus, SprintStatus[]> = {
      [SprintStatus.PLANNING]: [SprintStatus.ACTIVE, SprintStatus.CANCELLED],
      [SprintStatus.ACTIVE]: [SprintStatus.COMPLETED, SprintStatus.CANCELLED],
      [SprintStatus.COMPLETED]: [], // No transitions from completed
      [SprintStatus.CANCELLED]: [SprintStatus.PLANNING] // Can reopen cancelled sprints
    };

    return transitions[currentStatus] || [];
  }

  private async checkForOverlappingSprints(
    projectId: string,
    startDate: Date,
    endDate: Date,
    excludeSprintId?: string
  ): Promise<Sprint | null> {
    const whereClause: any = {
      projectId,
      status: { in: [SprintStatus.PLANNING, SprintStatus.ACTIVE] },
      OR: [
        {
          startDate: { lte: endDate },
          endDate: { gte: startDate }
        }
      ]
    };

    if (excludeSprintId) {
      whereClause.id = { not: excludeSprintId };
    }

    const overlappingSprint = await prisma.sprint.findFirst({
      where: whereClause,
      select: {
        id: true,
        name: true,
        startDate: true,
        endDate: true
      }
    });

    return overlappingSprint ? this.mapSprintFromDb(overlappingSprint) : null;
  }

  private async handleStatusChange(sprint: Sprint, newStatus: SprintStatus, changedBy: string): Promise<void> {
    // Log status change
    await this.logSprintActivity(sprint.id, changedBy, 'SPRINT_STATUS_CHANGED', {
      oldStatus: sprint.status,
      newStatus
    });

    // Handle specific status changes
    switch (newStatus) {
      case SprintStatus.ACTIVE:
        // Sprint started logic
        break;
      case SprintStatus.COMPLETED:
        // Sprint completed logic
        break;
      case SprintStatus.CANCELLED:
        // Sprint cancelled logic
        break;
    }
  }

  private async generateBurndownData(sprintId: string, startDate: Date, endDate: Date): Promise<BurndownPoint[]> {
    // This is a simplified implementation
    // In a real system, you'd track daily changes in task status
    const burndownData: BurndownPoint[] = [];
    
    const sprint = await this.getSprint(sprintId, { includeTasks: true });
    if (!sprint) return burndownData;

    const totalStoryPoints = sprint.tasks?.reduce((sum, st) => sum + (st.task?.storyPoints || 0), 0) || 0;
    const totalTasks = sprint.tasks?.length || 0;
    const totalHours = sprint.tasks?.reduce((sum, st) => sum + (st.task?.estimatedHours || 0), 0) || 0;

    const sprintDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    
    for (let day = 0; day <= sprintDays; day++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(currentDate.getDate() + day);

      // Simplified calculation - in reality, you'd query historical data
      const progress = day / sprintDays;
      const idealRemaining = totalStoryPoints * (1 - progress);
      
      burndownData.push({
        date: currentDate,
        remainingStoryPoints: Math.max(0, totalStoryPoints - (totalStoryPoints * progress * 0.8)), // Simulate some variance
        remainingTasks: Math.max(0, totalTasks - Math.floor(totalTasks * progress * 0.8)),
        remainingHours: Math.max(0, totalHours - (totalHours * progress * 0.8)),
        idealRemaining,
        completedStoryPoints: totalStoryPoints * progress * 0.8,
        completedTasks: Math.floor(totalTasks * progress * 0.8)
      });
    }

    return burndownData;
  }

  private async generateDailyProgress(sprintId: string, startDate: Date, endDate: Date): Promise<DailyProgress[]> {
    // Simplified implementation
    const dailyProgress: DailyProgress[] = [];
    const sprintDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    
    for (let day = 0; day < sprintDays; day++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(currentDate.getDate() + day);

      dailyProgress.push({
        date: currentDate,
        tasksCompleted: Math.floor(Math.random() * 3), // Simulate daily completions
        storyPointsCompleted: Math.floor(Math.random() * 8),
        hoursLogged: Math.floor(Math.random() * 16),
        tasksAdded: Math.floor(Math.random() * 2),
        tasksRemoved: Math.floor(Math.random() * 1)
      });
    }

    return dailyProgress;
  }

  private generateCapacityRecommendations(
    teamMembers: TeamMemberCapacity[],
    totalCapacity: number,
    allocatedCapacity: number
  ): any[] {
    const recommendations: any[] = [];

    // Check overall capacity utilization
    const overallUtilization = totalCapacity > 0 ? (allocatedCapacity / totalCapacity) * 100 : 0;

    if (overallUtilization > 100) {
      recommendations.push({
        type: 'OVERALLOCATED',
        message: 'Sprint is over-allocated. Consider reducing scope or extending timeline.',
        severity: 'HIGH',
        suggestedAction: 'Remove some tasks or add more team members'
      });
    } else if (overallUtilization < 70) {
      recommendations.push({
        type: 'UNDERALLOCATED',
        message: 'Sprint has available capacity. Consider adding more tasks.',
        severity: 'LOW',
        suggestedAction: 'Add more tasks from the backlog'
      });
    }

    // Check individual team member utilization
    teamMembers.forEach(member => {
      if (member.utilizationPercentage > 100) {
        recommendations.push({
          type: 'OVERALLOCATED',
          message: `${member.userName} is over-allocated (${member.utilizationPercentage.toFixed(1)}%)`,
          severity: 'HIGH',
          userId: member.userId,
          suggestedAction: 'Redistribute some tasks to other team members'
        });
      } else if (member.utilizationPercentage < 50 && member.assignedTasks > 0) {
        recommendations.push({
          type: 'UNDERALLOCATED',
          message: `${member.userName} has low utilization (${member.utilizationPercentage.toFixed(1)}%)`,
          severity: 'LOW',
          userId: member.userId,
          suggestedAction: 'Consider assigning more tasks'
        });
      }
    });

    return recommendations;
  }

  private generateVelocityTrend(sprints: Array<{ velocity: number | null; endDate: Date }>): Array<{ period: string; velocity: number }> {
    const trend: Array<{ period: string; velocity: number }> = [];
    
    // Group sprints by month
    const monthlyData: Record<string, number[]> = {};
    
    sprints.forEach(sprint => {
      if (sprint.velocity !== null) {
        const monthKey = sprint.endDate.toISOString().substring(0, 7); // YYYY-MM
        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = [];
        }
        monthlyData[monthKey].push(sprint.velocity);
      }
    });

    // Calculate average velocity per month
    Object.entries(monthlyData).forEach(([month, velocities]) => {
      const averageVelocity = velocities.reduce((sum, v) => sum + v, 0) / velocities.length;
      trend.push({
        period: month,
        velocity: averageVelocity
      });
    });

    return trend.sort((a, b) => a.period.localeCompare(b.period));
  }

  private async logSprintActivity(sprintId: string, userId: string, action: string, data?: any): Promise<void> {
    try {
      await prisma.auditLog.create({
        data: {
          userId,
          action,
          resource: 'SPRINT',
          resourceId: sprintId,
          newValues: data,
          createdAt: new Date()
        }
      });
    } catch (error) {
      logger.error('Error logging sprint activity:', error);
      // Don't throw error for logging failures
    }
  }

  private async sendSprintNotifications(sprint: Sprint, eventType: string, userId: string): Promise<void> {
    try {
      // Get project team members
      const projectMembers = await prisma.projectMember.findMany({
        where: { projectId: sprint.projectId },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true
            }
          }
        }
      });

      // Send notifications to team members
      for (const member of projectMembers) {
        if (member.userId !== userId) { // Don't notify the user who performed the action
          await this.notificationService.createNotification({
            userId: member.userId,
            type: eventType as any,
            title: `Sprint ${eventType.toLowerCase().replace('_', ' ')}: ${sprint.name}`,
            message: `Sprint "${sprint.name}" has been ${eventType.toLowerCase().replace('_', ' ')}`,
            data: {
              sprintId: sprint.id,
              sprintName: sprint.name,
              projectId: sprint.projectId
            }
          });
        }
      }
    } catch (error) {
      logger.error('Error sending sprint notifications:', error);
      // Don't throw error for notification failures
    }
  }

  private mapSprintFromDb(dbSprint: any): Sprint {
    return {
      id: dbSprint.id,
      name: dbSprint.name,
      goal: dbSprint.goal,
      projectId: dbSprint.projectId,
      startDate: dbSprint.startDate,
      endDate: dbSprint.endDate,
      status: dbSprint.status,
      capacity: dbSprint.capacity,
      velocity: dbSprint.velocity,
      createdAt: dbSprint.createdAt,
      updatedAt: dbSprint.updatedAt,
      project: dbSprint.project ? {
        id: dbSprint.project.id,
        name: dbSprint.project.name,
        key: dbSprint.project.key
      } : undefined,
      tasks: dbSprint.sprintTasks ? dbSprint.sprintTasks.map((st: any) => ({
        id: st.id,
        sprintId: st.sprintId,
        taskId: st.taskId,
        addedAt: st.addedAt,
        task: st.task
      })) : undefined
    };
  }
}
import { PrismaClient, EpicStatus, RiskLevel } from '@prisma/client';
import { logger } from '../utils/logger';
import {
  Backlog,
  BacklogItem,
  Epic,
  CreateBacklogItemRequest,
  UpdateBacklogItemRequest,
  CreateEpicRequest,
  UpdateEpicRequest,
  BacklogFilters,
  EpicFilters,
  BacklogQueryOptions,
  EpicQueryOptions,
  BacklogSearchResult,
  EpicSearchResult,
  PrioritizationRequest,
  BulkPrioritizationRequest,
  BacklogMetrics,
  BacklogHealth,
  BacklogValidationResult
} from '../types/backlog.types';
import { NotificationService } from './NotificationService';

const prisma = new PrismaClient();

export class BacklogService {
  private notificationService: NotificationService;

  constructor() {
    this.notificationService = new NotificationService();
  }

  /**
   * Get or create backlog for a project
   */
  async getOrCreateBacklog(projectId: string): Promise<Backlog> {
    try {
      // Check if backlog exists
      let backlog = await prisma.backlog.findUnique({
        where: { projectId },
        include: {
          project: {
            select: {
              id: true,
              name: true,
              key: true
            }
          },
          items: {
            include: {
              task: {
                select: {
                  id: true,
                  key: true,
                  title: true,
                  description: true,
                  type: true,
                  status: true,
                  priority: true,
                  assigneeId: true,
                  reporterId: true,
                  parentId: true,
                  dueDate: true,
                  labels: true,
                  components: true,
                  createdAt: true,
                  updatedAt: true
                }
              },
              epic: {
                select: {
                  id: true,
                  key: true,
                  title: true,
                  status: true,
                  color: true
                }
              }
            },
            orderBy: { priority: 'asc' }
          }
        }
      });

      // Create backlog if it doesn't exist
      if (!backlog) {
        backlog = await prisma.backlog.create({
          data: {
            projectId,
            priorityOrder: [],
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
            items: {
              include: {
                task: {
                  select: {
                    id: true,
                    key: true,
                    title: true,
                    description: true,
                    type: true,
                    status: true,
                    priority: true,
                    assigneeId: true,
                    reporterId: true,
                    parentId: true,
                    dueDate: true,
                    labels: true,
                    components: true,
                    createdAt: true,
                    updatedAt: true
                  }
                },
                epic: {
                  select: {
                    id: true,
                    key: true,
                    title: true,
                    status: true,
                    color: true
                  }
                }
              }
            }
          }
        });

        logger.info(`Backlog created for project ${projectId}`);
      }

      return this.mapBacklogFromDb(backlog);
    } catch (error) {
      logger.error('Error getting or creating backlog:', error);
      throw error;
    }
  }

  /**
   * Add item to backlog
   */
  async addItemToBacklog(
    projectId: string,
    itemData: CreateBacklogItemRequest,
    addedBy: string
  ): Promise<BacklogItem> {
    try {
      // Get or create backlog
      const backlog = await this.getOrCreateBacklog(projectId);

      // Validate task exists and is in the same project
      const task = await prisma.task.findUnique({
        where: { id: itemData.taskId },
        select: {
          id: true,
          key: true,
          title: true,
          projectId: true,
          type: true,
          status: true
        }
      });

      if (!task) {
        throw new Error('Task not found');
      }

      if (task.projectId !== projectId) {
        throw new Error('Task must be in the same project as the backlog');
      }

      // Check if task is already in backlog
      const existingItem = await prisma.backlogItem.findUnique({
        where: { taskId: itemData.taskId }
      });

      if (existingItem) {
        throw new Error('Task is already in the backlog');
      }

      // Determine priority
      const priority = itemData.priority !== undefined ? itemData.priority : await this.getNextPriority(backlog.id);

      // Validate epic if provided
      if (itemData.epicId) {
        const epic = await prisma.epic.findUnique({
          where: { id: itemData.epicId },
          select: { id: true, projectId: true }
        });

        if (!epic || epic.projectId !== projectId) {
          throw new Error('Epic not found or not in the same project');
        }
      }

      // Create backlog item
      const backlogItem = await prisma.backlogItem.create({
        data: {
          taskId: itemData.taskId,
          backlogId: backlog.id,
          priority,
          storyPoints: itemData.storyPoints,
          epicId: itemData.epicId,
          businessValue: itemData.businessValue,
          riskLevel: itemData.riskLevel || RiskLevel.MEDIUM,
          readyForSprint: false,
          acceptanceCriteria: itemData.acceptanceCriteria || [],
          dependencies: itemData.dependencies || [],
          labels: [],
          estimatedHours: null,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        include: {
          task: {
            select: {
              id: true,
              key: true,
              title: true,
              description: true,
              type: true,
              status: true,
              priority: true,
              assigneeId: true,
              reporterId: true,
              parentId: true,
              dueDate: true,
              labels: true,
              components: true,
              createdAt: true,
              updatedAt: true
            }
          },
          epic: {
            select: {
              id: true,
              key: true,
              title: true,
              status: true,
              color: true
            }
          }
        }
      });

      // Update backlog priority order
      await this.updatePriorityOrder(backlog.id);

      // Log activity
      await this.logBacklogActivity(backlog.id, addedBy, 'ITEM_ADDED', { 
        itemId: backlogItem.id,
        taskKey: task.key 
      });

      logger.info(`Task ${task.key} added to backlog for project ${projectId} by user ${addedBy}`);
      return this.mapBacklogItemFromDb(backlogItem);
    } catch (error) {
      logger.error('Error adding item to backlog:', error);
      throw error;
    }
  }

  /**
   * Create epic
   */
  async createEpic(epicData: CreateEpicRequest, createdBy: string): Promise<Epic> {
    try {
      // Validate epic data
      const validation = await this.validateEpicData(epicData);
      if (!validation.isValid) {
        throw new Error(`Epic validation failed: ${validation.errors.join(', ')}`);
      }

      // Generate epic key
      const epicKey = await this.generateEpicKey(epicData.projectId);

      // Create epic
      const epic = await prisma.epic.create({
        data: {
          key: epicKey,
          title: epicData.title,
          description: epicData.description,
          projectId: epicData.projectId,
          status: EpicStatus.DRAFT,
          priority: epicData.priority,
          ownerId: epicData.ownerId,
          startDate: epicData.startDate,
          targetDate: epicData.targetDate,
          businessValue: epicData.businessValue,
          storyPoints: null,
          progress: 0,
          color: epicData.color,
          labels: epicData.labels || [],
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
          owner: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          },
          backlogItems: {
            include: {
              task: {
                select: {
                  id: true,
                  key: true,
                  title: true,
                  status: true,
                  storyPoints: true
                }
              }
            }
          }
        }
      });

      // Log activity
      await this.logEpicActivity(epic.id, createdBy, 'EPIC_CREATED');

      logger.info(`Epic created: ${epic.key} for project ${epic.project?.name} by user ${createdBy}`);
      return this.mapEpicFromDb(epic);
    } catch (error) {
      logger.error('Error creating epic:', error);
      throw error;
    }
  }

  /**
   * Update backlog item
   */
  async updateBacklogItem(
    itemId: string,
    updateData: UpdateBacklogItemRequest,
    updatedBy: string
  ): Promise<BacklogItem> {
    try {
      // Get existing item
      const existingItem = await prisma.backlogItem.findUnique({
        where: { id: itemId },
        include: {
          task: { select: { key: true } },
          backlog: { select: { id: true, projectId: true } }
        }
      });

      if (!existingItem) {
        throw new Error('Backlog item not found');
      }

      // Validate epic if being updated
      if (updateData.epicId) {
        const epic = await prisma.epic.findUnique({
          where: { id: updateData.epicId },
          select: { id: true, projectId: true }
        });

        if (!epic || epic.projectId !== existingItem.backlog.projectId) {
          throw new Error('Epic not found or not in the same project');
        }
      }

      // Update item
      const updatedItem = await prisma.backlogItem.update({
        where: { id: itemId },
        data: {
          ...updateData,
          updatedAt: new Date()
        },
        include: {
          task: {
            select: {
              id: true,
              key: true,
              title: true,
              description: true,
              type: true,
              status: true,
              priority: true,
              assigneeId: true,
              reporterId: true,
              parentId: true,
              dueDate: true,
              labels: true,
              components: true,
              createdAt: true,
              updatedAt: true
            }
          },
          epic: {
            select: {
              id: true,
              key: true,
              title: true,
              status: true,
              color: true
            }
          }
        }
      });

      // Update priority order if priority changed
      if (updateData.priority !== undefined) {
        await this.updatePriorityOrder(existingItem.backlog.id);
      }

      // Log activity
      await this.logBacklogActivity(existingItem.backlog.id, updatedBy, 'ITEM_UPDATED', {
        itemId,
        taskKey: existingItem.task?.key,
        changes: updateData
      });

      logger.info(`Backlog item ${itemId} updated by user ${updatedBy}`);
      return this.mapBacklogItemFromDb(updatedItem);
    } catch (error) {
      logger.error('Error updating backlog item:', error);
      throw error;
    }
  }

  /**
   * Remove item from backlog
   */
  async removeItemFromBacklog(itemId: string, removedBy: string): Promise<void> {
    try {
      const item = await prisma.backlogItem.findUnique({
        where: { id: itemId },
        include: {
          task: { select: { key: true } },
          backlog: { select: { id: true } }
        }
      });

      if (!item) {
        throw new Error('Backlog item not found');
      }

      // Remove item
      await prisma.backlogItem.delete({
        where: { id: itemId }
      });

      // Update priority order
      await this.updatePriorityOrder(item.backlog.id);

      // Log activity
      await this.logBacklogActivity(item.backlog.id, removedBy, 'ITEM_REMOVED', {
        itemId,
        taskKey: item.task?.key
      });

      logger.info(`Backlog item ${itemId} removed by user ${removedBy}`);
    } catch (error) {
      logger.error('Error removing backlog item:', error);
      throw error;
    }
  }

  /**
   * Prioritize backlog item
   */
  async prioritizeItem(
    prioritization: PrioritizationRequest,
    prioritizedBy: string
  ): Promise<BacklogItem> {
    try {
      const item = await prisma.backlogItem.findUnique({
        where: { id: prioritization.itemId },
        include: {
          backlog: { select: { id: true } },
          task: { select: { key: true } }
        }
      });

      if (!item) {
        throw new Error('Backlog item not found');
      }

      const oldPriority = item.priority;

      // Update item priority
      const updatedItem = await this.updateBacklogItem(
        prioritization.itemId,
        { priority: prioritization.newPriority },
        prioritizedBy
      );

      // Log prioritization activity
      await this.logBacklogActivity(item.backlog.id, prioritizedBy, 'ITEM_PRIORITIZED', {
        itemId: prioritization.itemId,
        taskKey: item.task?.key,
        oldPriority,
        newPriority: prioritization.newPriority,
        reason: prioritization.reason
      });

      logger.info(`Backlog item ${prioritization.itemId} prioritized from ${oldPriority} to ${prioritization.newPriority} by user ${prioritizedBy}`);
      return updatedItem;
    } catch (error) {
      logger.error('Error prioritizing backlog item:', error);
      throw error;
    }
  }

  /**
   * Bulk prioritize backlog items
   */
  async bulkPrioritize(
    bulkPrioritization: BulkPrioritizationRequest,
    prioritizedBy: string
  ): Promise<BacklogItem[]> {
    try {
      const updatedItems: BacklogItem[] = [];

      for (const itemUpdate of bulkPrioritization.items) {
        const updatedItem = await this.prioritizeItem(
          {
            itemId: itemUpdate.itemId,
            newPriority: itemUpdate.priority,
            reason: bulkPrioritization.reason
          },
          prioritizedBy
        );
        updatedItems.push(updatedItem);
      }

      logger.info(`Bulk prioritization completed for ${bulkPrioritization.items.length} items by user ${prioritizedBy}`);
      return updatedItems;
    } catch (error) {
      logger.error('Error bulk prioritizing items:', error);
      throw error;
    }
  }

  /**
   * Search backlog items
   */
  async searchBacklogItems(
    filters: BacklogFilters,
    options: BacklogQueryOptions = {}
  ): Promise<BacklogSearchResult> {
    try {
      const page = options.page || 1;
      const limit = options.limit || 50;
      const skip = (page - 1) * limit;

      // Build where clause
      const whereClause: any = {};

      if (filters.projectId) {
        whereClause.backlog = {
          projectId: filters.projectId
        };
      }

      if (filters.epicId) {
        whereClause.epicId = filters.epicId;
      }

      if (filters.riskLevel) {
        whereClause.riskLevel = filters.riskLevel;
      }

      if (filters.readyForSprint !== undefined) {
        whereClause.readyForSprint = filters.readyForSprint;
      }

      if (filters.hasStoryPoints !== undefined) {
        whereClause.storyPoints = filters.hasStoryPoints ? { not: null } : null;
      }

      if (filters.assigneeId || filters.status || filters.priority || filters.search) {
        whereClause.task = {};
        
        if (filters.assigneeId) {
          whereClause.task.assigneeId = filters.assigneeId;
        }
        
        if (filters.status) {
          whereClause.task.status = filters.status;
        }
        
        if (filters.priority) {
          whereClause.task.priority = filters.priority;
        }
        
        if (filters.search) {
          whereClause.task.OR = [
            { title: { contains: filters.search, mode: 'insensitive' } },
            { description: { contains: filters.search, mode: 'insensitive' } },
            { key: { contains: filters.search, mode: 'insensitive' } }
          ];
        }
      }

      if (filters.labels && filters.labels.length > 0) {
        whereClause.labels = {
          hasSome: filters.labels
        };
      }

      // Build order by clause
      const orderBy: any = {};
      if (options.sortBy) {
        if (options.sortBy.startsWith('task.')) {
          const taskField = options.sortBy.replace('task.', '');
          orderBy.task = { [taskField]: options.sortOrder || 'asc' };
        } else {
          orderBy[options.sortBy] = options.sortOrder || 'asc';
        }
      } else {
        orderBy.priority = 'asc';
      }

      // Get items
      const [items, total] = await Promise.all([
        prisma.backlogItem.findMany({
          where: whereClause,
          include: {
            task: options.includeTask !== false ? {
              select: {
                id: true,
                key: true,
                title: true,
                description: true,
                type: true,
                status: true,
                priority: true,
                assigneeId: true,
                reporterId: true,
                parentId: true,
                dueDate: true,
                labels: true,
                components: true,
                createdAt: true,
                updatedAt: true
              }
            } : false,
            epic: options.includeEpic !== false ? {
              select: {
                id: true,
                key: true,
                title: true,
                status: true,
                color: true
              }
            } : false
          },
          orderBy,
          skip,
          take: limit
        }),
        prisma.backlogItem.count({ where: whereClause })
      ]);

      return {
        items: items.map(item => this.mapBacklogItemFromDb(item)),
        total,
        page,
        limit,
        hasMore: skip + items.length < total
      };
    } catch (error) {
      logger.error('Error searching backlog items:', error);
      throw error;
    }
  }

  /**
   * Update epic
   */
  async updateEpic(
    epicId: string,
    updateData: UpdateEpicRequest,
    updatedBy: string
  ): Promise<Epic> {
    try {
      // Get existing epic
      const existingEpic = await prisma.epic.findUnique({
        where: { id: epicId },
        select: { id: true, key: true, projectId: true }
      });

      if (!existingEpic) {
        throw new Error('Epic not found');
      }

      // Validate owner if being updated
      if (updateData.ownerId) {
        const owner = await prisma.user.findUnique({
          where: { id: updateData.ownerId }
        });

        if (!owner) {
          throw new Error('Epic owner not found');
        }
      }

      // Update epic
      const updatedEpic = await prisma.epic.update({
        where: { id: epicId },
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
          owner: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          },
          backlogItems: {
            include: {
              task: {
                select: {
                  id: true,
                  key: true,
                  title: true,
                  status: true,
                  storyPoints: true
                }
              }
            }
          }
        }
      });

      // Update epic progress if status changed
      if (updateData.status) {
        await this.updateEpicProgress(epicId);
      }

      // Log activity
      await this.logEpicActivity(epicId, updatedBy, 'EPIC_UPDATED', { changes: updateData });

      logger.info(`Epic ${existingEpic.key} updated by user ${updatedBy}`);
      return this.mapEpicFromDb(updatedEpic);
    } catch (error) {
      logger.error('Error updating epic:', error);
      throw error;
    }
  }

  /**
   * Search epics
   */
  async searchEpics(
    filters: EpicFilters,
    options: EpicQueryOptions = {}
  ): Promise<EpicSearchResult> {
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

      if (filters.ownerId) {
        whereClause.ownerId = filters.ownerId;
      }

      if (filters.priority) {
        whereClause.priority = filters.priority;
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

      if (filters.targetDateFrom || filters.targetDateTo) {
        whereClause.targetDate = {};
        if (filters.targetDateFrom) {
          whereClause.targetDate.gte = filters.targetDateFrom;
        }
        if (filters.targetDateTo) {
          whereClause.targetDate.lte = filters.targetDateTo;
        }
      }

      if (filters.search) {
        whereClause.OR = [
          { title: { contains: filters.search, mode: 'insensitive' } },
          { description: { contains: filters.search, mode: 'insensitive' } },
          { key: { contains: filters.search, mode: 'insensitive' } }
        ];
      }

      // Build order by clause
      const orderBy: any = {};
      if (options.sortBy) {
        orderBy[options.sortBy] = options.sortOrder || 'asc';
      } else {
        orderBy.createdAt = 'desc';
      }

      // Get epics
      const [epics, total] = await Promise.all([
        prisma.epic.findMany({
          where: whereClause,
          include: {
            project: {
              select: {
                id: true,
                name: true,
                key: true
              }
            },
            owner: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            },
            backlogItems: options.includeStories ? {
              include: {
                task: {
                  select: {
                    id: true,
                    key: true,
                    title: true,
                    status: true,
                    storyPoints: true
                  }
                }
              }
            } : false
          },
          orderBy,
          skip,
          take: limit
        }),
        prisma.epic.count({ where: whereClause })
      ]);

      return {
        epics: epics.map(epic => this.mapEpicFromDb(epic)),
        total,
        page,
        limit,
        hasMore: skip + epics.length < total
      };
    } catch (error) {
      logger.error('Error searching epics:', error);
      throw error;
    }
  }

  /**
   * Get backlog health
   */
  async getBacklogHealth(projectId: string): Promise<BacklogHealth> {
    try {
      const backlog = await this.getOrCreateBacklog(projectId);
      
      const items = await prisma.backlogItem.findMany({
        where: { backlogId: backlog.id },
        include: {
          task: {
            select: {
              status: true,
              storyPoints: true
            }
          }
        }
      });

      const totalItems = items.length;
      const readyItems = items.filter(item => item.readyForSprint).length;
      const estimatedItems = items.filter(item => item.storyPoints !== null).length;
      const itemsWithCriteria = items.filter(item => item.acceptanceCriteria.length > 0).length;

      // Calculate health scores
      const readinessScore = totalItems > 0 ? (readyItems / totalItems) * 100 : 100;
      const estimationCoverage = totalItems > 0 ? (estimatedItems / totalItems) * 100 : 100;
      const criteriaCoverage = totalItems > 0 ? (itemsWithCriteria / totalItems) * 100 : 100;
      
      // Calculate dependency risk (simplified)
      const itemsWithDependencies = items.filter(item => item.dependencies.length > 0).length;
      const dependencyRisk = totalItems > 0 ? (itemsWithDependencies / totalItems) * 100 : 0;

      // Overall health score
      const healthScore = (readinessScore + estimationCoverage + criteriaCoverage - dependencyRisk) / 3;

      // Generate recommendations
      const recommendations: any[] = [];

      if (estimationCoverage < 80) {
        recommendations.push({
          type: 'ESTIMATION',
          severity: 'HIGH',
          message: `${Math.round(100 - estimationCoverage)}% of backlog items lack story point estimates`,
          suggestedAction: 'Schedule estimation sessions for unestimated items',
          impact: 'Affects sprint planning accuracy'
        });
      }

      if (readinessScore < 60) {
        recommendations.push({
          type: 'REFINEMENT',
          severity: 'HIGH',
          message: `${Math.round(100 - readinessScore)}% of backlog items are not ready for sprint`,
          suggestedAction: 'Conduct backlog refinement sessions',
          impact: 'May cause sprint planning delays'
        });
      }

      if (criteriaCoverage < 70) {
        recommendations.push({
          type: 'ACCEPTANCE_CRITERIA',
          severity: 'MEDIUM',
          message: `${Math.round(100 - criteriaCoverage)}% of items lack acceptance criteria`,
          suggestedAction: 'Add detailed acceptance criteria to backlog items',
          impact: 'May lead to unclear requirements and rework'
        });
      }

      if (dependencyRisk > 30) {
        recommendations.push({
          type: 'DEPENDENCY',
          severity: 'MEDIUM',
          message: `${Math.round(dependencyRisk)}% of items have dependencies`,
          suggestedAction: 'Review and resolve dependencies where possible',
          impact: 'May cause delays and blocking issues'
        });
      }

      return {
        projectId,
        healthScore: Math.max(0, Math.min(100, healthScore)),
        readinessScore,
        estimationCoverage,
        dependencyRisk,
        recommendations
      };
    } catch (error) {
      logger.error('Error getting backlog health:', error);
      throw error;
    }
  }

  /**
   * Get backlog metrics
   */
  async getBacklogMetrics(projectId: string): Promise<BacklogMetrics> {
    try {
      const backlog = await this.getOrCreateBacklog(projectId);
      
      const items = await prisma.backlogItem.findMany({
        where: { backlogId: backlog.id },
        include: {
          task: {
            select: {
              status: true,
              storyPoints: true
            }
          },
          epic: {
            select: {
              id: true,
              title: true
            }
          }
        }
      });

      const totalItems = items.length;
      const readyItems = items.filter(item => item.readyForSprint).length;
      const estimatedItems = items.filter(item => item.storyPoints !== null).length;
      
      const totalStoryPoints = items.reduce((sum, item) => sum + (item.storyPoints || 0), 0);
      const averageStoryPoints = estimatedItems > 0 ? totalStoryPoints / estimatedItems : 0;
      
      const totalBusinessValue = items.reduce((sum, item) => sum + (item.businessValue || 0), 0);
      const averageBusinessValue = totalItems > 0 ? totalBusinessValue / totalItems : 0;

      // Group by epic
      const byEpic: Record<string, any> = {};
      items.forEach(item => {
        if (item.epic) {
          const epicId = item.epic.id;
          if (!byEpic[epicId]) {
            byEpic[epicId] = {
              epicName: item.epic.title,
              itemCount: 0,
              storyPoints: 0,
              progress: 0
            };
          }
          byEpic[epicId].itemCount++;
          byEpic[epicId].storyPoints += item.storyPoints || 0;
        }
      });

      // Group by risk level
      const byRiskLevel: Record<string, number> = {};
      items.forEach(item => {
        const risk = item.riskLevel;
        byRiskLevel[risk] = (byRiskLevel[risk] || 0) + 1;
      });

      // Group by status
      const byStatus: Record<string, number> = {};
      items.forEach(item => {
        const status = item.task?.status || 'UNKNOWN';
        byStatus[status] = (byStatus[status] || 0) + 1;
      });

      // Get velocity projection (simplified)
      const velocityProjection = await this.getVelocityProjection(projectId, totalStoryPoints);

      return {
        projectId,
        totalItems,
        readyItems,
        estimatedItems,
        totalStoryPoints,
        averageStoryPoints,
        totalBusinessValue,
        averageBusinessValue,
        byEpic,
        byRiskLevel,
        byStatus,
        velocityProjection
      };
    } catch (error) {
      logger.error('Error getting backlog metrics:', error);
      throw error;
    }
  }

  // Private helper methods

  private async getNextPriority(backlogId: string): Promise<number> {
    const lastItem = await prisma.backlogItem.findFirst({
      where: { backlogId },
      orderBy: { priority: 'desc' },
      select: { priority: true }
    });

    return (lastItem?.priority || 0) + 1;
  }

  private async updatePriorityOrder(backlogId: string): Promise<void> {
    const items = await prisma.backlogItem.findMany({
      where: { backlogId },
      orderBy: { priority: 'asc' },
      select: { id: true }
    });

    const priorityOrder = items.map(item => item.id);

    await prisma.backlog.update({
      where: { id: backlogId },
      data: { priorityOrder }
    });
  }

  private async updateEpicProgress(epicId: string): Promise<void> {
    try {
      const epic = await prisma.epic.findUnique({
        where: { id: epicId },
        include: {
          backlogItems: {
            include: {
              task: {
                select: {
                  status: true,
                  storyPoints: true
                }
              }
            }
          }
        }
      });

      if (!epic) return;

      const stories = epic.backlogItems;
      const totalStories = stories.length;
      const completedStories = stories.filter(story => story.task?.status === 'DONE').length;
      
      const totalStoryPoints = stories.reduce((sum, story) => sum + (story.storyPoints || 0), 0);
      const completedStoryPoints = stories
        .filter(story => story.task?.status === 'DONE')
        .reduce((sum, story) => sum + (story.storyPoints || 0), 0);

      // Calculate progress based on story points if available, otherwise use story count
      let progress = 0;
      if (totalStoryPoints > 0) {
        progress = (completedStoryPoints / totalStoryPoints) * 100;
      } else if (totalStories > 0) {
        progress = (completedStories / totalStories) * 100;
      }

      await prisma.epic.update({
        where: { id: epicId },
        data: {
          progress: Math.round(progress),
          storyPoints: totalStoryPoints > 0 ? totalStoryPoints : null
        }
      });
    } catch (error) {
      logger.error('Error updating epic progress:', error);
      // Don't throw error for progress update failures
    }
  }

  private async generateEpicKey(projectId: string): Promise<string> {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { key: true }
    });

    if (!project) {
      throw new Error('Project not found');
    }

    // Get next sequence number for epics in this project
    const lastEpic = await prisma.epic.findFirst({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
      select: { key: true }
    });

    let sequenceNumber = 1;
    if (lastEpic) {
      const match = lastEpic.key.match(/-EPIC-(\d+)$/);
      if (match) {
        sequenceNumber = parseInt(match[1]) + 1;
      }
    }

    return `${project.key}-EPIC-${sequenceNumber}`;
  }

  private async getVelocityProjection(projectId: string, totalStoryPoints: number): Promise<any> {
    // Simplified velocity projection - would use actual sprint data
    const averageVelocity = 20; // Placeholder
    const estimatedSprints = Math.ceil(totalStoryPoints / averageVelocity);
    const estimatedCompletionDate = new Date(Date.now() + estimatedSprints * 14 * 24 * 60 * 60 * 1000);

    return {
      averageVelocity,
      estimatedSprints,
      estimatedCompletionDate,
      confidenceLevel: 70,
      assumptions: [
        'Based on historical velocity data',
        'Assumes consistent team capacity',
        'Does not account for dependencies'
      ]
    };
  }

  private async validateEpicData(epicData: CreateEpicRequest): Promise<BacklogValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate required fields
    if (!epicData.title || epicData.title.trim().length === 0) {
      errors.push('Epic title is required');
    }

    if (epicData.title && epicData.title.length > 255) {
      errors.push('Epic title must be less than 255 characters');
    }

    // Validate dates
    if (epicData.startDate && epicData.targetDate && epicData.startDate >= epicData.targetDate) {
      errors.push('Epic start date must be before target date');
    }

    // Validate project exists
    const project = await prisma.project.findUnique({
      where: { id: epicData.projectId }
    });

    if (!project) {
      errors.push('Project not found');
    }

    // Validate owner exists
    const owner = await prisma.user.findUnique({
      where: { id: epicData.ownerId }
    });

    if (!owner) {
      errors.push('Epic owner not found');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  private async logBacklogActivity(backlogId: string, userId: string, action: string, data?: any): Promise<void> {
    try {
      await prisma.auditLog.create({
        data: {
          userId,
          action,
          resource: 'BACKLOG',
          resourceId: backlogId,
          newValues: data,
          createdAt: new Date()
        }
      });
    } catch (error) {
      logger.error('Error logging backlog activity:', error);
      // Don't throw error for logging failures
    }
  }

  private async logEpicActivity(epicId: string, userId: string, action: string, data?: any): Promise<void> {
    try {
      await prisma.auditLog.create({
        data: {
          userId,
          action,
          resource: 'EPIC',
          resourceId: epicId,
          newValues: data,
          createdAt: new Date()
        }
      });
    } catch (error) {
      logger.error('Error logging epic activity:', error);
      // Don't throw error for logging failures
    }
  }

  private mapBacklogFromDb(dbBacklog: any): Backlog {
    return {
      id: dbBacklog.id,
      projectId: dbBacklog.projectId,
      priorityOrder: dbBacklog.priorityOrder || [],
      createdAt: dbBacklog.createdAt,
      updatedAt: dbBacklog.updatedAt,
      project: dbBacklog.project ? {
        id: dbBacklog.project.id,
        name: dbBacklog.project.name,
        key: dbBacklog.project.key
      } : undefined,
      items: dbBacklog.items ? dbBacklog.items.map((item: any) => this.mapBacklogItemFromDb(item)) : undefined
    };
  }

  private mapBacklogItemFromDb(dbItem: any): BacklogItem {
    return {
      id: dbItem.id,
      taskId: dbItem.taskId,
      backlogId: dbItem.backlogId,
      priority: dbItem.priority,
      storyPoints: dbItem.storyPoints,
      epicId: dbItem.epicId,
      labels: dbItem.labels || [],
      estimatedHours: dbItem.estimatedHours ? parseFloat(dbItem.estimatedHours.toString()) : undefined,
      businessValue: dbItem.businessValue,
      riskLevel: dbItem.riskLevel,
      readyForSprint: dbItem.readyForSprint,
      acceptanceCriteria: dbItem.acceptanceCriteria || [],
      dependencies: dbItem.dependencies || [],
      createdAt: dbItem.createdAt,
      updatedAt: dbItem.updatedAt,
      task: dbItem.task,
      epic: dbItem.epic
    };
  }

  private mapEpicFromDb(dbEpic: any): Epic {
    return {
      id: dbEpic.id,
      key: dbEpic.key,
      title: dbEpic.title,
      description: dbEpic.description,
      projectId: dbEpic.projectId,
      status: dbEpic.status,
      priority: dbEpic.priority,
      ownerId: dbEpic.ownerId,
      startDate: dbEpic.startDate,
      targetDate: dbEpic.targetDate,
      businessValue: dbEpic.businessValue,
      storyPoints: dbEpic.storyPoints,
      progress: dbEpic.progress,
      color: dbEpic.color,
      labels: dbEpic.labels || [],
      createdAt: dbEpic.createdAt,
      updatedAt: dbEpic.updatedAt,
      project: dbEpic.project,
      owner: dbEpic.owner,
      stories: dbEpic.backlogItems ? dbEpic.backlogItems.map((item: any) => this.mapBacklogItemFromDb(item)) : undefined
    };
  }
}
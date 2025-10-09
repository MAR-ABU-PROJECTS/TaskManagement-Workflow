import { PrismaClient, DependencyType } from '@prisma/client';
import { logger } from '../utils/logger';
import {
  TaskDependency,
  CreateTaskDependencyRequest,
  TaskHierarchy,
  DependencyValidationResult,
  TaskDependencyFilters,
  DependencyGraph,
  DependencyNode,
  DependencyEdge,
  TaskBlockingInfo,
  SubtaskSummary,
  TaskTreeNode,
  DependencyImpactAnalysis,
  BulkDependencyOperation,
  BulkDependencyResult,
  MoveTaskRequest,
  HierarchyValidationResult
} from '../types/taskDependency.types';

const prisma = new PrismaClient();

export class TaskDependencyService {
  /**
   * Create a task dependency
   */
  async createDependency(
    dependencyData: CreateTaskDependencyRequest,
    createdBy: string
  ): Promise<TaskDependency> {
    try {
      // Validate the dependency
      const validation = await this.validateDependency(dependencyData);
      if (!validation.isValid) {
        throw new Error(`Dependency validation failed: ${validation.errors.join(', ')}`);
      }

      // Check for circular dependencies
      const circularCheck = await this.checkCircularDependency(
        dependencyData.dependentTaskId,
        dependencyData.blockingTaskId
      );
      if (!circularCheck.isValid) {
        throw new Error(`Circular dependency detected: ${circularCheck.circularPath?.join(' -> ')}`);
      }

      // Create the dependency
      const dependency = await prisma.taskDependency.create({
        data: {
          dependentTaskId: dependencyData.dependentTaskId,
          blockingTaskId: dependencyData.blockingTaskId,
          type: dependencyData.type,
          createdAt: new Date()
        },
        include: {
          dependentTask: {
            select: {
              id: true,
              key: true,
              title: true,
              status: true,
              projectId: true
            }
          },
          blockingTask: {
            select: {
              id: true,
              key: true,
              title: true,
              status: true,
              projectId: true
            }
          }
        }
      });

      // Log the dependency creation
      await this.logDependencyActivity(
        'DEPENDENCY_CREATED',
        dependencyData.dependentTaskId,
        createdBy,
        { dependency: dependencyData }
      );

      logger.info(`Task dependency created: ${dependencyData.dependentTaskId} -> ${dependencyData.blockingTaskId}`);
      return this.mapDependencyFromDb(dependency);
    } catch (error) {
      logger.error('Error creating task dependency:', error);
      throw error;
    }
  }  /**

   * Get task dependencies
   */
  async getDependencies(filters: TaskDependencyFilters = {}): Promise<TaskDependency[]> {
    try {
      const whereClause: any = {};

      if (filters.taskId) {
        whereClause.OR = [
          { dependentTaskId: filters.taskId },
          { blockingTaskId: filters.taskId }
        ];
      }

      if (filters.type) {
        whereClause.type = filters.type;
      }

      if (filters.projectId) {
        whereClause.OR = [
          { dependentTask: { projectId: filters.projectId } },
          { blockingTask: { projectId: filters.projectId } }
        ];
      }

      const dependencies = await prisma.taskDependency.findMany({
        where: whereClause,
        include: {
          dependentTask: {
            select: {
              id: true,
              key: true,
              title: true,
              status: true,
              projectId: true
            }
          },
          blockingTask: {
            select: {
              id: true,
              key: true,
              title: true,
              status: true,
              projectId: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      return dependencies.map(dep => this.mapDependencyFromDb(dep));
    } catch (error) {
      logger.error('Error getting task dependencies:', error);
      throw error;
    }
  }

  /**
   * Delete a task dependency
   */
  async deleteDependency(dependencyId: string, deletedBy: string): Promise<void> {
    try {
      const dependency = await prisma.taskDependency.findUnique({
        where: { id: dependencyId },
        include: {
          dependentTask: { select: { id: true, key: true } },
          blockingTask: { select: { id: true, key: true } }
        }
      });

      if (!dependency) {
        throw new Error('Dependency not found');
      }

      await prisma.taskDependency.delete({
        where: { id: dependencyId }
      });

      // Log the dependency deletion
      await this.logDependencyActivity(
        'DEPENDENCY_DELETED',
        dependency.dependentTaskId,
        deletedBy,
        { 
          dependentTask: dependency.dependentTask.key,
          blockingTask: dependency.blockingTask.key
        }
      );

      logger.info(`Task dependency deleted: ${dependencyId}`);
    } catch (error) {
      logger.error('Error deleting task dependency:', error);
      throw error;
    }
  }

  /**
   * Get task blocking information
   */
  async getTaskBlockingInfo(taskId: string): Promise<TaskBlockingInfo> {
    try {
      const [blockingDeps, blockedByDeps] = await Promise.all([
        // Tasks this task is blocking
        prisma.taskDependency.findMany({
          where: { blockingTaskId: taskId },
          include: {
            dependentTask: {
              select: { id: true, key: true, title: true, status: true }
            }
          }
        }),
        // Tasks blocking this task
        prisma.taskDependency.findMany({
          where: { dependentTaskId: taskId },
          include: {
            blockingTask: {
              select: { id: true, key: true, title: true, status: true }
            }
          }
        })
      ]);

      const blockedBy = blockedByDeps.map(dep => ({
        taskId: dep.blockingTask.id,
        taskKey: dep.blockingTask.key,
        title: dep.blockingTask.title,
        status: dep.blockingTask.status,
        type: dep.type
      }));

      const blocking = blockingDeps.map(dep => ({
        taskId: dep.dependentTask.id,
        taskKey: dep.dependentTask.key,
        title: dep.dependentTask.title,
        status: dep.dependentTask.status,
        type: dep.type
      }));

      // Check if task is blocked (has incomplete blocking tasks)
      const activeBlockers = blockedBy.filter(blocker => 
        !['DONE', 'COMPLETED', 'CLOSED'].includes(blocker.status.toUpperCase())
      );

      const isBlocked = activeBlockers.length > 0;
      const canStart = !isBlocked;
      const blockedReason = isBlocked 
        ? `Blocked by ${activeBlockers.length} incomplete task(s): ${activeBlockers.map(b => b.taskKey).join(', ')}`
        : undefined;

      return {
        taskId,
        isBlocked,
        blockedBy,
        blocking,
        canStart,
        blockedReason
      };
    } catch (error) {
      logger.error('Error getting task blocking info:', error);
      throw error;
    }
  }

  /**
   * Get subtask summary for a parent task
   */
  async getSubtaskSummary(parentTaskId: string): Promise<SubtaskSummary> {
    try {
      const subtasks = await prisma.task.findMany({
        where: { parentId: parentTaskId },
        select: {
          id: true,
          status: true,
          estimatedHours: true,
          loggedHours: true,
          remainingHours: true
        }
      });

      const totalSubtasks = subtasks.length;
      const completedSubtasks = subtasks.filter(task => 
        ['DONE', 'COMPLETED', 'CLOSED'].includes(task.status.toUpperCase())
      ).length;
      const inProgressSubtasks = subtasks.filter(task => 
        ['IN_PROGRESS', 'IN_REVIEW', 'TESTING'].includes(task.status.toUpperCase())
      ).length;
      const todoSubtasks = totalSubtasks - completedSubtasks - inProgressSubtasks;

      const completionPercentage = totalSubtasks > 0 
        ? Math.round((completedSubtasks / totalSubtasks) * 100)
        : 0;

      const estimatedHours = subtasks.reduce((sum, task) => 
        sum + (task.estimatedHours ? parseFloat(task.estimatedHours.toString()) : 0), 0
      );
      const loggedHours = subtasks.reduce((sum, task) => 
        sum + parseFloat(task.loggedHours.toString()), 0
      );
      const remainingHours = subtasks.reduce((sum, task) => 
        sum + (task.remainingHours ? parseFloat(task.remainingHours.toString()) : 0), 0
      );

      return {
        parentTaskId,
        totalSubtasks,
        completedSubtasks,
        inProgressSubtasks,
        todoSubtasks,
        completionPercentage,
        estimatedHours,
        loggedHours,
        remainingHours
      };
    } catch (error) {
      logger.error('Error getting subtask summary:', error);
      throw error;
    }
  }  /**
   *
 Get task tree (hierarchical view)
   */
  async getTaskTree(rootTaskId: string, maxDepth: number = 5): Promise<TaskTreeNode> {
    try {
      const tree = await this.buildTaskTree(rootTaskId, 0, maxDepth);
      return tree;
    } catch (error) {
      logger.error('Error getting task tree:', error);
      throw error;
    }
  }

  /**
   * Move task in hierarchy
   */
  async moveTask(moveRequest: MoveTaskRequest, movedBy: string): Promise<void> {
    try {
      // Validate the move
      const validation = await this.validateTaskMove(moveRequest);
      if (!validation.isValid) {
        throw new Error(`Task move validation failed: ${validation.errors.join(', ')}`);
      }

      // Update the task's parent
      await prisma.task.update({
        where: { id: moveRequest.taskId },
        data: {
          parentId: moveRequest.newParentId,
          updatedAt: new Date()
        }
      });

      // Log the move
      await this.logDependencyActivity(
        'TASK_MOVED',
        moveRequest.taskId,
        movedBy,
        { 
          newParentId: moveRequest.newParentId,
          position: moveRequest.position
        }
      );

      logger.info(`Task moved: ${moveRequest.taskId} to parent ${moveRequest.newParentId}`);
    } catch (error) {
      logger.error('Error moving task:', error);
      throw error;
    }
  }

  /**
   * Generate dependency graph
   */
  async generateDependencyGraph(projectId: string): Promise<DependencyGraph> {
    try {
      // Get all tasks in the project
      const tasks = await prisma.task.findMany({
        where: { projectId },
        select: {
          id: true,
          key: true,
          title: true,
          status: true,
          projectId: true
        }
      });

      // Get all dependencies for the project
      const dependencies = await prisma.taskDependency.findMany({
        where: {
          OR: [
            { dependentTask: { projectId } },
            { blockingTask: { projectId } }
          ]
        },
        include: {
          dependentTask: { select: { id: true } },
          blockingTask: { select: { id: true } }
        }
      });

      // Build nodes
      const nodes: DependencyNode[] = tasks.map(task => {
        const blockedBy = dependencies
          .filter(dep => dep.dependentTaskId === task.id)
          .map(dep => dep.blockingTaskId);
        
        const blocking = dependencies
          .filter(dep => dep.blockingTaskId === task.id)
          .map(dep => dep.dependentTaskId);

        return {
          taskId: task.id,
          taskKey: task.key,
          title: task.title,
          status: task.status,
          projectId: task.projectId,
          level: 0, // Will be calculated
          isBlocked: blockedBy.length > 0,
          blockedBy,
          blocking
        };
      });

      // Build edges
      const edges: DependencyEdge[] = dependencies.map(dep => ({
        from: dep.blockingTaskId,
        to: dep.dependentTaskId,
        type: dep.type,
        weight: 1
      }));

      // Detect cycles
      const cycles = this.detectCycles(nodes, edges);

      return {
        nodes,
        edges,
        cycles
      };
    } catch (error) {
      logger.error('Error generating dependency graph:', error);
      throw error;
    }
  }

  /**
   * Bulk dependency operations
   */
  async bulkDependencyOperation(
    operation: BulkDependencyOperation,
    operatedBy: string
  ): Promise<BulkDependencyResult> {
    try {
      const result: BulkDependencyResult = {
        successful: [],
        failed: [],
        warnings: []
      };

      for (const depData of operation.dependencies) {
        try {
          switch (operation.operation) {
            case 'CREATE':
              const dependency = await this.createDependency(depData, operatedBy);
              result.successful.push({
                dependentTaskId: depData.dependentTaskId,
                blockingTaskId: depData.blockingTaskId,
                dependencyId: dependency.id
              });
              break;

            case 'DELETE':
              // Find and delete the dependency
              const existingDep = await prisma.taskDependency.findFirst({
                where: {
                  dependentTaskId: depData.dependentTaskId,
                  blockingTaskId: depData.blockingTaskId,
                  type: depData.type
                }
              });

              if (existingDep) {
                await this.deleteDependency(existingDep.id, operatedBy);
                result.successful.push({
                  dependentTaskId: depData.dependentTaskId,
                  blockingTaskId: depData.blockingTaskId
                });
              } else {
                result.warnings.push(`Dependency not found: ${depData.dependentTaskId} -> ${depData.blockingTaskId}`);
              }
              break;
          }
        } catch (error) {
          result.failed.push({
            dependentTaskId: depData.dependentTaskId,
            blockingTaskId: depData.blockingTaskId,
            error: error.message
          });
        }
      }

      logger.info(`Bulk dependency operation completed: ${result.successful.length} successful, ${result.failed.length} failed`);
      return result;
    } catch (error) {
      logger.error('Error performing bulk dependency operation:', error);
      throw error;
    }
  }  // Privat
e helper methods

  private async validateDependency(dependencyData: CreateTaskDependencyRequest): Promise<DependencyValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check if tasks exist
    const [dependentTask, blockingTask] = await Promise.all([
      prisma.task.findUnique({
        where: { id: dependencyData.dependentTaskId },
        select: { id: true, projectId: true, parentId: true }
      }),
      prisma.task.findUnique({
        where: { id: dependencyData.blockingTaskId },
        select: { id: true, projectId: true, parentId: true }
      })
    ]);

    if (!dependentTask) {
      errors.push('Dependent task not found');
    }

    if (!blockingTask) {
      errors.push('Blocking task not found');
    }

    // Check if tasks are the same
    if (dependencyData.dependentTaskId === dependencyData.blockingTaskId) {
      errors.push('Task cannot depend on itself');
    }

    // Check if tasks are in the same project (optional warning)
    if (dependentTask && blockingTask && dependentTask.projectId !== blockingTask.projectId) {
      warnings.push('Tasks are in different projects');
    }

    // Check if dependency already exists
    if (dependentTask && blockingTask) {
      const existingDep = await prisma.taskDependency.findFirst({
        where: {
          dependentTaskId: dependencyData.dependentTaskId,
          blockingTaskId: dependencyData.blockingTaskId,
          type: dependencyData.type
        }
      });

      if (existingDep) {
        errors.push('Dependency already exists');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  private async checkCircularDependency(
    dependentTaskId: string,
    blockingTaskId: string
  ): Promise<DependencyValidationResult> {
    try {
      // Use DFS to detect circular dependency
      const visited = new Set<string>();
      const recursionStack = new Set<string>();
      const path: string[] = [];

      const hasCycle = await this.dfsCircularCheck(
        dependentTaskId,
        blockingTaskId,
        visited,
        recursionStack,
        path
      );

      if (hasCycle) {
        return {
          isValid: false,
          errors: ['Circular dependency detected'],
          warnings: [],
          circularPath: path
        };
      }

      return {
        isValid: true,
        errors: [],
        warnings: []
      };
    } catch (error) {
      logger.error('Error checking circular dependency:', error);
      return {
        isValid: false,
        errors: ['Error validating circular dependency'],
        warnings: []
      };
    }
  }

  private async dfsCircularCheck(
    currentTask: string,
    targetTask: string,
    visited: Set<string>,
    recursionStack: Set<string>,
    path: string[]
  ): Promise<boolean> {
    if (currentTask === targetTask) {
      path.push(currentTask);
      return true;
    }

    if (recursionStack.has(currentTask)) {
      return true;
    }

    if (visited.has(currentTask)) {
      return false;
    }

    visited.add(currentTask);
    recursionStack.add(currentTask);
    path.push(currentTask);

    // Get all tasks that this task depends on
    const dependencies = await prisma.taskDependency.findMany({
      where: { dependentTaskId: currentTask },
      select: { blockingTaskId: true }
    });

    for (const dep of dependencies) {
      if (await this.dfsCircularCheck(dep.blockingTaskId, targetTask, visited, recursionStack, path)) {
        return true;
      }
    }

    recursionStack.delete(currentTask);
    path.pop();
    return false;
  }

  private async buildTaskTree(
    taskId: string,
    depth: number,
    maxDepth: number
  ): Promise<TaskTreeNode> {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      select: {
        id: true,
        key: true,
        title: true,
        status: true,
        type: true,
        priority: true,
        assigneeId: true,
        estimatedHours: true
      }
    });

    if (!task) {
      throw new Error('Task not found');
    }

    let children: TaskTreeNode[] = [];
    let hasChildren = false;

    if (depth < maxDepth) {
      const childTasks = await prisma.task.findMany({
        where: { parentId: taskId },
        select: { id: true },
        orderBy: { createdAt: 'asc' }
      });

      hasChildren = childTasks.length > 0;

      for (const childTask of childTasks) {
        const childNode = await this.buildTaskTree(childTask.id, depth + 1, maxDepth);
        children.push(childNode);
      }
    }

    // Calculate completion percentage for parent tasks
    let completionPercentage = 0;
    if (hasChildren) {
      const subtaskSummary = await this.getSubtaskSummary(taskId);
      completionPercentage = subtaskSummary.completionPercentage;
    } else {
      // For leaf tasks, base on status
      completionPercentage = ['DONE', 'COMPLETED', 'CLOSED'].includes(task.status.toUpperCase()) ? 100 : 0;
    }

    return {
      task: {
        id: task.id,
        key: task.key,
        title: task.title,
        status: task.status,
        type: task.type,
        priority: task.priority,
        assigneeId: task.assigneeId,
        estimatedHours: task.estimatedHours ? parseFloat(task.estimatedHours.toString()) : undefined,
        completionPercentage
      },
      children,
      depth,
      hasChildren,
      isExpanded: depth < 2 // Auto-expand first 2 levels
    };
  }  private
 async validateTaskMove(moveRequest: MoveTaskRequest): Promise<HierarchyValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check if task exists
    const task = await prisma.task.findUnique({
      where: { id: moveRequest.taskId },
      select: { id: true, projectId: true }
    });

    if (!task) {
      errors.push('Task not found');
      return { isValid: false, errors, warnings };
    }

    // Check if new parent exists and is in the same project
    if (moveRequest.newParentId) {
      const newParent = await prisma.task.findUnique({
        where: { id: moveRequest.newParentId },
        select: { id: true, projectId: true }
      });

      if (!newParent) {
        errors.push('New parent task not found');
      } else if (newParent.projectId !== task.projectId) {
        errors.push('Parent task must be in the same project');
      }

      // Check for circular reference
      if (await this.wouldCreateCircularReference(moveRequest.taskId, moveRequest.newParentId)) {
        errors.push('Move would create circular reference');
      }

      // Check hierarchy depth
      const newDepth = await this.calculateHierarchyDepth(moveRequest.newParentId);
      if (newDepth >= 10) { // Max depth limit
        errors.push('Maximum hierarchy depth exceeded');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      circularReference: errors.some(e => e.includes('circular')),
      maxDepthExceeded: errors.some(e => e.includes('depth'))
    };
  }

  private async wouldCreateCircularReference(taskId: string, newParentId: string): Promise<boolean> {
    // Check if newParentId is a descendant of taskId
    const descendants = await this.getAllDescendants(taskId);
    return descendants.includes(newParentId);
  }

  private async getAllDescendants(taskId: string): Promise<string[]> {
    const descendants: string[] = [];
    const children = await prisma.task.findMany({
      where: { parentId: taskId },
      select: { id: true }
    });

    for (const child of children) {
      descendants.push(child.id);
      const childDescendants = await this.getAllDescendants(child.id);
      descendants.push(...childDescendants);
    }

    return descendants;
  }

  private async calculateHierarchyDepth(taskId: string): Promise<number> {
    let depth = 0;
    let currentTaskId: string | null = taskId;

    while (currentTaskId) {
      const task = await prisma.task.findUnique({
        where: { id: currentTaskId },
        select: { parentId: true }
      });

      if (!task || !task.parentId) {
        break;
      }

      depth++;
      currentTaskId = task.parentId;

      if (depth > 20) { // Safety check
        break;
      }
    }

    return depth;
  }

  private detectCycles(nodes: DependencyNode[], edges: DependencyEdge[]): string[][] {
    const cycles: string[][] = [];
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    for (const node of nodes) {
      if (!visited.has(node.taskId)) {
        const cycle = this.dfsDetectCycle(node.taskId, edges, visited, recursionStack, []);
        if (cycle.length > 0) {
          cycles.push(cycle);
        }
      }
    }

    return cycles;
  }

  private dfsDetectCycle(
    nodeId: string,
    edges: DependencyEdge[],
    visited: Set<string>,
    recursionStack: Set<string>,
    path: string[]
  ): string[] {
    visited.add(nodeId);
    recursionStack.add(nodeId);
    path.push(nodeId);

    const outgoingEdges = edges.filter(edge => edge.from === nodeId);

    for (const edge of outgoingEdges) {
      if (!visited.has(edge.to)) {
        const cycle = this.dfsDetectCycle(edge.to, edges, visited, recursionStack, [...path]);
        if (cycle.length > 0) {
          return cycle;
        }
      } else if (recursionStack.has(edge.to)) {
        // Found a cycle
        const cycleStart = path.indexOf(edge.to);
        return path.slice(cycleStart).concat([edge.to]);
      }
    }

    recursionStack.delete(nodeId);
    return [];
  }

  private async logDependencyActivity(
    action: string,
    taskId: string,
    userId: string,
    data: any
  ): Promise<void> {
    try {
      await prisma.auditLog.create({
        data: {
          userId,
          action,
          resource: 'TASK_DEPENDENCY',
          resourceId: taskId,
          newValues: data,
          createdAt: new Date()
        }
      });
    } catch (error) {
      logger.error('Error logging dependency activity:', error);
      // Don't throw error for logging failures
    }
  }

  private mapDependencyFromDb(dbDependency: any): TaskDependency {
    return {
      id: dbDependency.id,
      dependentTaskId: dbDependency.dependentTaskId,
      blockingTaskId: dbDependency.blockingTaskId,
      type: dbDependency.type,
      createdAt: dbDependency.createdAt,
      dependentTask: dbDependency.dependentTask,
      blockingTask: dbDependency.blockingTask
    };
  }
}
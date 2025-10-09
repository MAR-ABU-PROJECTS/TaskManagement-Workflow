import request from 'supertest';
import app from '../server';
import { PrismaClient } from '@prisma/client';
import { TaskDependencyService } from '../services/TaskDependencyService';
import { TaskService } from '../services/TaskService';
import { TaskType, Priority, DependencyType } from '../types/task.types';

const prisma = new PrismaClient();
const dependencyService = new TaskDependencyService();
const taskService = new TaskService();

describe('Task Dependency Management', () => {
  let authToken: string;
  let userId: string;
  let projectId: string;
  let task1Id: string;
  let task2Id: string;
  let task3Id: string;
  let dependencyId: string;

  beforeAll(async () => {
    // Create test user
    const user = await prisma.user.create({
      data: {
        email: 'dependency-test@example.com',
        passwordHash: 'hashedpassword',
        firstName: 'Dependency',
        lastName: 'Tester',
        role: 'ADMIN',
        isActive: true
      }
    });
    userId = user.id;

    // Create test team
    const team = await prisma.team.create({
      data: {
        name: 'Dependency Test Team',
        key: 'DTT',
        ownerId: userId,
        isActive: true
      }
    });

    // Create test project
    const project = await prisma.project.create({
      data: {
        name: 'Dependency Test Project',
        key: 'DTP',
        methodology: 'AGILE',
        status: 'ACTIVE',
        ownerId: userId,
        teamId: team.id
      }
    });
    projectId = project.id;

    // Create test tasks
    const task1 = await taskService.createTask({
      title: 'Task 1 - Blocking Task',
      type: TaskType.TASK,
      projectId,
      priority: Priority.HIGH
    }, { projectId, userId });
    task1Id = task1.id;

    const task2 = await taskService.createTask({
      title: 'Task 2 - Dependent Task',
      type: TaskType.TASK,
      projectId,
      priority: Priority.MEDIUM
    }, { projectId, userId });
    task2Id = task2.id;

    const task3 = await taskService.createTask({
      title: 'Task 3 - Independent Task',
      type: TaskType.TASK,
      projectId,
      priority: Priority.LOW
    }, { projectId, userId });
    task3Id = task3.id;

    // Mock authentication token
    authToken = 'mock-jwt-token';
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.taskDependency.deleteMany({
      where: {
        OR: [
          { dependentTask: { projectId } },
          { blockingTask: { projectId } }
        ]
      }
    });
    await prisma.task.deleteMany({
      where: { projectId }
    });
    await prisma.project.deleteMany({
      where: { ownerId: userId }
    });
    await prisma.team.deleteMany({
      where: { ownerId: userId }
    });
    await prisma.user.deleteMany({
      where: { email: 'dependency-test@example.com' }
    });
    await prisma.$disconnect();
  });

  describe('POST /api/task-dependencies', () => {
    it('should create a task dependency', async () => {
      const dependencyData = {
        dependentTaskId: task2Id,
        blockingTaskId: task1Id,
        type: DependencyType.BLOCKS
      };

      const response = await request(app)
        .post('/api/task-dependencies')
        .set('Authorization', `Bearer ${authToken}`)
        .send(dependencyData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.dependentTaskId).toBe(task2Id);
      expect(response.body.data.blockingTaskId).toBe(task1Id);
      expect(response.body.data.type).toBe(DependencyType.BLOCKS);

      dependencyId = response.body.data.id;
    });

    it('should validate required fields', async () => {
      const invalidDependencyData = {
        dependentTaskId: task2Id,
        // Missing blockingTaskId and type
      };

      const response = await request(app)
        .post('/api/task-dependencies')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidDependencyData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should prevent self-dependency', async () => {
      const selfDependencyData = {
        dependentTaskId: task1Id,
        blockingTaskId: task1Id,
        type: DependencyType.BLOCKS
      };

      const response = await request(app)
        .post('/api/task-dependencies')
        .set('Authorization', `Bearer ${authToken}`)
        .send(selfDependencyData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should prevent duplicate dependencies', async () => {
      const duplicateDependencyData = {
        dependentTaskId: task2Id,
        blockingTaskId: task1Id,
        type: DependencyType.BLOCKS
      };

      const response = await request(app)
        .post('/api/task-dependencies')
        .set('Authorization', `Bearer ${authToken}`)
        .send(duplicateDependencyData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should prevent circular dependencies', async () => {
      // Try to create a circular dependency: task1 -> task2 -> task1
      const circularDependencyData = {
        dependentTaskId: task1Id,
        blockingTaskId: task2Id,
        type: DependencyType.BLOCKS
      };

      const response = await request(app)
        .post('/api/task-dependencies')
        .set('Authorization', `Bearer ${authToken}`)
        .send(circularDependencyData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Circular dependency detected');
    });
  });

  describe('GET /api/task-dependencies', () => {
    it('should get all dependencies', async () => {
      const response = await request(app)
        .get('/api/task-dependencies')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.count).toBeGreaterThan(0);
    });

    it('should filter dependencies by task ID', async () => {
      const response = await request(app)
        .get('/api/task-dependencies')
        .query({ taskId: task1Id })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    it('should filter dependencies by project ID', async () => {
      const response = await request(app)
        .get('/api/task-dependencies')
        .query({ projectId })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
    });

    it('should filter dependencies by type', async () => {
      const response = await request(app)
        .get('/api/task-dependencies')
        .query({ type: DependencyType.BLOCKS })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
    });
  });

  describe('GET /api/task-dependencies/tasks/:taskId/blocking-info', () => {
    it('should get task blocking information', async () => {
      const response = await request(app)
        .get(`/api/task-dependencies/tasks/${task2Id}/blocking-info`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.taskId).toBe(task2Id);
      expect(response.body.data.isBlocked).toBe(true);
      expect(response.body.data.blockedBy).toBeInstanceOf(Array);
      expect(response.body.data.blockedBy.length).toBeGreaterThan(0);
      expect(response.body.data.canStart).toBe(false);
    });

    it('should show unblocked task info', async () => {
      const response = await request(app)
        .get(`/api/task-dependencies/tasks/${task3Id}/blocking-info`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.taskId).toBe(task3Id);
      expect(response.body.data.isBlocked).toBe(false);
      expect(response.body.data.canStart).toBe(true);
    });
  });

  describe('Task Hierarchy Management', () => {
    let parentTaskId: string;
    let childTask1Id: string;
    let childTask2Id: string;

    beforeAll(async () => {
      // Create parent task
      const parentTask = await taskService.createTask({
        title: 'Parent Task',
        type: TaskType.EPIC,
        projectId,
        priority: Priority.HIGH
      }, { projectId, userId });
      parentTaskId = parentTask.id;

      // Create child tasks
      const childTask1 = await taskService.createTask({
        title: 'Child Task 1',
        type: TaskType.STORY,
        projectId,
        parentId: parentTaskId,
        priority: Priority.MEDIUM
      }, { projectId, userId });
      childTask1Id = childTask1.id;

      const childTask2 = await taskService.createTask({
        title: 'Child Task 2',
        type: TaskType.TASK,
        projectId,
        parentId: parentTaskId,
        priority: Priority.LOW
      }, { projectId, userId });
      childTask2Id = childTask2.id;
    });

    describe('GET /api/task-dependencies/tasks/:taskId/subtask-summary', () => {
      it('should get subtask summary', async () => {
        const response = await request(app)
          .get(`/api/task-dependencies/tasks/${parentTaskId}/subtask-summary`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.parentTaskId).toBe(parentTaskId);
        expect(response.body.data.totalSubtasks).toBe(2);
        expect(response.body.data.completionPercentage).toBeDefined();
        expect(response.body.data.estimatedHours).toBeDefined();
      });
    });

    describe('GET /api/task-dependencies/tasks/:taskId/tree', () => {
      it('should get task tree', async () => {
        const response = await request(app)
          .get(`/api/task-dependencies/tasks/${parentTaskId}/tree`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.task.id).toBe(parentTaskId);
        expect(response.body.data.children).toBeInstanceOf(Array);
        expect(response.body.data.children.length).toBe(2);
        expect(response.body.data.hasChildren).toBe(true);
      });

      it('should respect max depth parameter', async () => {
        const response = await request(app)
          .get(`/api/task-dependencies/tasks/${parentTaskId}/tree`)
          .query({ maxDepth: 1 })
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.depth).toBe(0);
      });
    });

    describe('PUT /api/task-dependencies/tasks/:taskId/move', () => {
      it('should move task to new parent', async () => {
        // Create another parent task
        const newParent = await taskService.createTask({
          title: 'New Parent Task',
          type: TaskType.EPIC,
          projectId,
          priority: Priority.MEDIUM
        }, { projectId, userId });

        const response = await request(app)
          .put(`/api/task-dependencies/tasks/${childTask2Id}/move`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            newParentId: newParent.id,
            position: 0
          })
          .expect(200);

        expect(response.body.success).toBe(true);

        // Verify the move
        const movedTask = await taskService.getTask(childTask2Id);
        expect(movedTask?.parentId).toBe(newParent.id);
      });

      it('should move task to root level', async () => {
        const response = await request(app)
          .put(`/api/task-dependencies/tasks/${childTask1Id}/move`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            newParentId: null
          })
          .expect(200);

        expect(response.body.success).toBe(true);

        // Verify the move
        const movedTask = await taskService.getTask(childTask1Id);
        expect(movedTask?.parentId).toBeNull();
      });

      it('should prevent circular reference in hierarchy', async () => {
        // Try to move parent under its own child
        const response = await request(app)
          .put(`/api/task-dependencies/tasks/${parentTaskId}/move`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            newParentId: childTask1Id
          })
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('circular reference');
      });
    });
  });

  describe('GET /api/task-dependencies/projects/:projectId/dependency-graph', () => {
    it('should generate dependency graph', async () => {
      const response = await request(app)
        .get(`/api/task-dependencies/projects/${projectId}/dependency-graph`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.nodes).toBeInstanceOf(Array);
      expect(response.body.data.edges).toBeInstanceOf(Array);
      expect(response.body.data.cycles).toBeInstanceOf(Array);
      expect(response.body.data.nodes.length).toBeGreaterThan(0);
    });
  });

  describe('POST /api/task-dependencies/bulk', () => {
    let bulkTask1Id: string;
    let bulkTask2Id: string;
    let bulkTask3Id: string;

    beforeAll(async () => {
      // Create tasks for bulk operations
      const bulkTask1 = await taskService.createTask({
        title: 'Bulk Task 1',
        type: TaskType.TASK,
        projectId
      }, { projectId, userId });
      bulkTask1Id = bulkTask1.id;

      const bulkTask2 = await taskService.createTask({
        title: 'Bulk Task 2',
        type: TaskType.TASK,
        projectId
      }, { projectId, userId });
      bulkTask2Id = bulkTask2.id;

      const bulkTask3 = await taskService.createTask({
        title: 'Bulk Task 3',
        type: TaskType.TASK,
        projectId
      }, { projectId, userId });
      bulkTask3Id = bulkTask3.id;
    });

    it('should create multiple dependencies', async () => {
      const bulkOperation = {
        operation: 'CREATE',
        dependencies: [
          {
            dependentTaskId: bulkTask2Id,
            blockingTaskId: bulkTask1Id,
            type: DependencyType.BLOCKS
          },
          {
            dependentTaskId: bulkTask3Id,
            blockingTaskId: bulkTask2Id,
            type: DependencyType.BLOCKS
          }
        ],
        validateCircular: true
      };

      const response = await request(app)
        .post('/api/task-dependencies/bulk')
        .set('Authorization', `Bearer ${authToken}`)
        .send(bulkOperation)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.successful).toHaveLength(2);
      expect(response.body.data.failed).toHaveLength(0);
    });

    it('should delete multiple dependencies', async () => {
      const bulkOperation = {
        operation: 'DELETE',
        dependencies: [
          {
            dependentTaskId: bulkTask2Id,
            blockingTaskId: bulkTask1Id,
            type: DependencyType.BLOCKS
          },
          {
            dependentTaskId: bulkTask3Id,
            blockingTaskId: bulkTask2Id,
            type: DependencyType.BLOCKS
          }
        ]
      };

      const response = await request(app)
        .post('/api/task-dependencies/bulk')
        .set('Authorization', `Bearer ${authToken}`)
        .send(bulkOperation)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.successful).toHaveLength(2);
    });

    it('should validate bulk operation data', async () => {
      const invalidBulkOperation = {
        operation: 'CREATE',
        dependencies: [] // Empty array
      };

      const response = await request(app)
        .post('/api/task-dependencies/bulk')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidBulkOperation)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/task-dependencies/:dependencyId', () => {
    it('should delete a dependency', async () => {
      const response = await request(app)
        .delete(`/api/task-dependencies/${dependencyId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify dependency is deleted
      const dependencies = await dependencyService.getDependencies({ taskId: task1Id });
      expect(dependencies.find(dep => dep.id === dependencyId)).toBeUndefined();
    });

    it('should return 404 for non-existent dependency', async () => {
      const nonExistentId = 'non-existent-id';
      const response = await request(app)
        .delete(`/api/task-dependencies/${nonExistentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400); // Will be 400 due to UUID validation

      expect(response.body.success).toBe(false);
    });
  });
});

describe('TaskDependencyService Unit Tests', () => {
  let userId: string;
  let projectId: string;
  let task1Id: string;
  let task2Id: string;
  let task3Id: string;

  beforeAll(async () => {
    // Create test user and project for unit tests
    const user = await prisma.user.create({
      data: {
        email: 'dependency-service-test@example.com',
        passwordHash: 'hashedpassword',
        firstName: 'DependencyService',
        lastName: 'Tester',
        role: 'ADMIN',
        isActive: true
      }
    });
    userId = user.id;

    const team = await prisma.team.create({
      data: {
        name: 'DependencyService Test Team',
        key: 'DST',
        ownerId: userId,
        isActive: true
      }
    });

    const project = await prisma.project.create({
      data: {
        name: 'DependencyService Test Project',
        key: 'DSP',
        methodology: 'AGILE',
        status: 'ACTIVE',
        ownerId: userId,
        teamId: team.id
      }
    });
    projectId = project.id;

    // Create test tasks
    const task1 = await taskService.createTask({
      title: 'Service Test Task 1',
      type: TaskType.TASK,
      projectId
    }, { projectId, userId });
    task1Id = task1.id;

    const task2 = await taskService.createTask({
      title: 'Service Test Task 2',
      type: TaskType.TASK,
      projectId
    }, { projectId, userId });
    task2Id = task2.id;

    const task3 = await taskService.createTask({
      title: 'Service Test Task 3',
      type: TaskType.TASK,
      projectId
    }, { projectId, userId });
    task3Id = task3.id;
  });

  afterAll(async () => {
    // Clean up
    await prisma.taskDependency.deleteMany({
      where: {
        OR: [
          { dependentTask: { projectId } },
          { blockingTask: { projectId } }
        ]
      }
    });
    await prisma.task.deleteMany({
      where: { projectId }
    });
    await prisma.project.deleteMany({
      where: { ownerId: userId }
    });
    await prisma.team.deleteMany({
      where: { ownerId: userId }
    });
    await prisma.user.deleteMany({
      where: { email: 'dependency-service-test@example.com' }
    });
    await prisma.$disconnect();
  });

  describe('createDependency', () => {
    it('should create a valid dependency', async () => {
      const dependencyData = {
        dependentTaskId: task2Id,
        blockingTaskId: task1Id,
        type: DependencyType.BLOCKS
      };

      const dependency = await dependencyService.createDependency(dependencyData, userId);

      expect(dependency.dependentTaskId).toBe(task2Id);
      expect(dependency.blockingTaskId).toBe(task1Id);
      expect(dependency.type).toBe(DependencyType.BLOCKS);
      expect(dependency.id).toBeDefined();
    });

    it('should prevent circular dependencies', async () => {
      // Create task1 -> task2 dependency first
      await dependencyService.createDependency({
        dependentTaskId: task2Id,
        blockingTaskId: task1Id,
        type: DependencyType.BLOCKS
      }, userId);

      // Try to create task2 -> task1 dependency (circular)
      await expect(
        dependencyService.createDependency({
          dependentTaskId: task1Id,
          blockingTaskId: task2Id,
          type: DependencyType.BLOCKS
        }, userId)
      ).rejects.toThrow('Circular dependency detected');
    });

    it('should validate task existence', async () => {
      await expect(
        dependencyService.createDependency({
          dependentTaskId: 'non-existent-task',
          blockingTaskId: task1Id,
          type: DependencyType.BLOCKS
        }, userId)
      ).rejects.toThrow('Dependency validation failed');
    });
  });

  describe('getTaskBlockingInfo', () => {
    it('should return correct blocking information', async () => {
      const blockingInfo = await dependencyService.getTaskBlockingInfo(task2Id);

      expect(blockingInfo.taskId).toBe(task2Id);
      expect(blockingInfo.isBlocked).toBe(true);
      expect(blockingInfo.blockedBy.length).toBeGreaterThan(0);
      expect(blockingInfo.canStart).toBe(false);
      expect(blockingInfo.blockedReason).toBeDefined();
    });

    it('should show unblocked task correctly', async () => {
      const blockingInfo = await dependencyService.getTaskBlockingInfo(task3Id);

      expect(blockingInfo.taskId).toBe(task3Id);
      expect(blockingInfo.isBlocked).toBe(false);
      expect(blockingInfo.canStart).toBe(true);
      expect(blockingInfo.blockedReason).toBeUndefined();
    });
  });

  describe('generateDependencyGraph', () => {
    it('should generate a valid dependency graph', async () => {
      const graph = await dependencyService.generateDependencyGraph(projectId);

      expect(graph.nodes).toBeInstanceOf(Array);
      expect(graph.edges).toBeInstanceOf(Array);
      expect(graph.cycles).toBeInstanceOf(Array);
      expect(graph.nodes.length).toBeGreaterThan(0);
    });
  });

  describe('getSubtaskSummary', () => {
    let parentTaskId: string;

    beforeAll(async () => {
      // Create parent task with subtasks
      const parentTask = await taskService.createTask({
        title: 'Parent for Summary Test',
        type: TaskType.EPIC,
        projectId
      }, { projectId, userId });
      parentTaskId = parentTask.id;

      // Create subtasks
      await taskService.createTask({
        title: 'Subtask 1',
        type: TaskType.TASK,
        projectId,
        parentId: parentTaskId,
        estimatedHours: 8
      }, { projectId, userId });

      await taskService.createTask({
        title: 'Subtask 2',
        type: TaskType.TASK,
        projectId,
        parentId: parentTaskId,
        estimatedHours: 4
      }, { projectId, userId });
    });

    it('should calculate subtask summary correctly', async () => {
      const summary = await dependencyService.getSubtaskSummary(parentTaskId);

      expect(summary.parentTaskId).toBe(parentTaskId);
      expect(summary.totalSubtasks).toBe(2);
      expect(summary.estimatedHours).toBe(12);
      expect(summary.completionPercentage).toBeDefined();
    });
  });

  describe('bulkDependencyOperation', () => {
    it('should handle bulk create operations', async () => {
      const operation = {
        operation: 'CREATE' as const,
        dependencies: [
          {
            dependentTaskId: task3Id,
            blockingTaskId: task1Id,
            type: DependencyType.BLOCKS
          }
        ],
        validateCircular: true
      };

      const result = await dependencyService.bulkDependencyOperation(operation, userId);

      expect(result.successful.length).toBe(1);
      expect(result.failed.length).toBe(0);
    });

    it('should handle bulk delete operations', async () => {
      const operation = {
        operation: 'DELETE' as const,
        dependencies: [
          {
            dependentTaskId: task3Id,
            blockingTaskId: task1Id,
            type: DependencyType.BLOCKS
          }
        ]
      };

      const result = await dependencyService.bulkDependencyOperation(operation, userId);

      expect(result.successful.length).toBe(1);
      expect(result.failed.length).toBe(0);
    });
  });
});
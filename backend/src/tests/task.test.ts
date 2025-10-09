import request from 'supertest';
import app from '../server';
import { PrismaClient } from '@prisma/client';
import { TaskService } from '../services/TaskService';
import { TaskType, Priority } from '../types/task.types';

const prisma = new PrismaClient();
const taskService = new TaskService();

describe('Task Management', () => {
  let authToken: string;
  let userId: string;
  let projectId: string;
  let taskId: string;

  beforeAll(async () => {
    // Create test user
    const user = await prisma.user.create({
      data: {
        email: 'task-test@example.com',
        passwordHash: 'hashedpassword',
        firstName: 'Task',
        lastName: 'Tester',
        role: 'ADMIN',
        isActive: true
      }
    });
    userId = user.id;

    // Create test team
    const team = await prisma.team.create({
      data: {
        name: 'Test Team',
        key: 'TEST',
        ownerId: userId,
        isActive: true
      }
    });

    // Create test project
    const project = await prisma.project.create({
      data: {
        name: 'Test Task Project',
        key: 'TTP',
        methodology: 'AGILE',
        status: 'ACTIVE',
        ownerId: userId,
        teamId: team.id
      }
    });
    projectId = project.id;

    // Mock authentication token
    authToken = 'mock-jwt-token';
  });

  afterAll(async () => {
    // Clean up test data
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
      where: { email: 'task-test@example.com' }
    });
    await prisma.$disconnect();
  });

  describe('POST /api/tasks', () => {
    it('should create a new task', async () => {
      const taskData = {
        title: 'Test Task',
        description: 'This is a test task',
        type: TaskType.TASK,
        priority: Priority.MEDIUM,
        projectId,
        estimatedHours: 8,
        labels: ['backend', 'api'],
        components: ['authentication'],
        storyPoints: 5
      };

      const response = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send(taskData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe(taskData.title);
      expect(response.body.data.type).toBe(taskData.type);
      expect(response.body.data.priority).toBe(taskData.priority);
      expect(response.body.data.projectId).toBe(projectId);
      expect(response.body.data.key).toMatch(/^TTP-\d+$/);
      expect(response.body.data.status).toBe('TODO');

      taskId = response.body.data.id;
    });

    it('should validate required fields', async () => {
      const invalidTaskData = {
        description: 'Missing title and type'
      };

      const response = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidTaskData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should validate task type', async () => {
      const invalidTaskData = {
        title: 'Test Task',
        type: 'INVALID_TYPE',
        projectId
      };

      const response = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidTaskData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should create subtask with parent reference', async () => {
      const subtaskData = {
        title: 'Test Subtask',
        description: 'This is a test subtask',
        type: TaskType.SUBTASK,
        priority: Priority.LOW,
        projectId,
        parentId: taskId,
        estimatedHours: 2
      };

      const response = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send(subtaskData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.parentId).toBe(taskId);
      expect(response.body.data.type).toBe(TaskType.SUBTASK);
    });
  });

  describe('GET /api/tasks/:taskId', () => {
    it('should get task by ID', async () => {
      const response = await request(app)
        .get(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(taskId);
      expect(response.body.data.title).toBe('Test Task');
    });

    it('should return 404 for non-existent task', async () => {
      const nonExistentId = 'non-existent-id';
      const response = await request(app)
        .get(`/api/tasks/${nonExistentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('should include subtasks when requested', async () => {
      const response = await request(app)
        .get(`/api/tasks/${taskId}?includeSubtasks=true`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.subtasks).toBeDefined();
    });
  });

  describe('GET /api/tasks/key/:taskKey', () => {
    it('should get task by key', async () => {
      // First get the task to know its key
      const task = await taskService.getTask(taskId);
      const taskKey = task?.key;

      const response = await request(app)
        .get(`/api/tasks/key/${taskKey}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(taskId);
      expect(response.body.data.key).toBe(taskKey);
    });
  });

  describe('GET /api/tasks', () => {
    it('should search tasks with filters', async () => {
      const response = await request(app)
        .get('/api/tasks')
        .query({
          projectId,
          type: TaskType.TASK,
          priority: Priority.MEDIUM
        })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.pagination).toBeDefined();
      expect(response.body.pagination.total).toBeGreaterThan(0);
    });

    it('should search tasks by text', async () => {
      const response = await request(app)
        .get('/api/tasks')
        .query({
          projectId,
          search: 'Test Task'
        })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.data[0].title).toContain('Test');
    });

    it('should paginate results', async () => {
      const response = await request(app)
        .get('/api/tasks')
        .query({
          projectId,
          page: 1,
          limit: 10
        })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(10);
    });

    it('should include aggregations', async () => {
      const response = await request(app)
        .get('/api/tasks')
        .query({
          projectId,
          page: 1
        })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.aggregations).toBeDefined();
      expect(response.body.aggregations.byStatus).toBeDefined();
      expect(response.body.aggregations.byType).toBeDefined();
    });
  });

  describe('PUT /api/tasks/:taskId', () => {
    it('should update task', async () => {
      const updateData = {
        title: 'Updated Test Task',
        description: 'Updated description',
        priority: Priority.HIGH,
        estimatedHours: 12,
        storyPoints: 8
      };

      const response = await request(app)
        .put(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe(updateData.title);
      expect(response.body.data.priority).toBe(updateData.priority);
      expect(response.body.data.estimatedHours).toBe(updateData.estimatedHours);
    });

    it('should validate update data', async () => {
      const invalidUpdateData = {
        title: '', // Empty title
        estimatedHours: -5 // Negative hours
      };

      const response = await request(app)
        .put(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidUpdateData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/tasks/:taskId/assign', () => {
    it('should assign task to user', async () => {
      const assignmentData = {
        assigneeId: userId,
        comment: 'Assigning to test user'
      };

      const response = await request(app)
        .put(`/api/tasks/${taskId}/assign`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(assignmentData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.assigneeId).toBe(userId);
    });

    it('should validate assignee ID', async () => {
      const invalidAssignmentData = {
        assigneeId: 'invalid-id'
      };

      const response = await request(app)
        .put(`/api/tasks/${taskId}/assign`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidAssignmentData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/tasks/:taskId/status', () => {
    it('should transition task status', async () => {
      const statusData = {
        toStatus: 'IN_PROGRESS',
        comment: 'Starting work on this task'
      };

      const response = await request(app)
        .put(`/api/tasks/${taskId}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(statusData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('IN_PROGRESS');
    });

    it('should validate status transition', async () => {
      const invalidStatusData = {
        toStatus: '' // Empty status
      };

      const response = await request(app)
        .put(`/api/tasks/${taskId}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidStatusData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/tasks/statistics', () => {
    it('should get task statistics', async () => {
      const response = await request(app)
        .get('/api/tasks/statistics')
        .query({ projectId })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.total).toBeGreaterThan(0);
      expect(response.body.data.byStatus).toBeDefined();
      expect(response.body.data.byType).toBeDefined();
      expect(response.body.data.byPriority).toBeDefined();
    });

    it('should filter statistics by assignee', async () => {
      const response = await request(app)
        .get('/api/tasks/statistics')
        .query({ 
          projectId,
          assigneeId: userId
        })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.byAssignee[userId]).toBeGreaterThan(0);
    });
  });

  describe('POST /api/tasks/bulk', () => {
    let bulkTaskIds: string[] = [];

    beforeAll(async () => {
      // Create additional tasks for bulk operations
      for (let i = 0; i < 3; i++) {
        const task = await taskService.createTask({
          title: `Bulk Test Task ${i + 1}`,
          type: TaskType.TASK,
          projectId,
          priority: Priority.LOW
        }, {
          projectId,
          userId
        });
        bulkTaskIds.push(task.id);
      }
    });

    it('should perform bulk update', async () => {
      const bulkOperation = {
        taskIds: bulkTaskIds,
        operation: 'UPDATE',
        data: {
          priority: Priority.HIGH,
          labels: ['bulk-updated']
        }
      };

      const response = await request(app)
        .post('/api/tasks/bulk')
        .set('Authorization', `Bearer ${authToken}`)
        .send(bulkOperation)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.successful).toHaveLength(3);
      expect(response.body.data.failed).toHaveLength(0);
    });

    it('should perform bulk assignment', async () => {
      const bulkOperation = {
        taskIds: bulkTaskIds.slice(0, 2),
        operation: 'ASSIGN',
        data: {
          assigneeId: userId
        }
      };

      const response = await request(app)
        .post('/api/tasks/bulk')
        .set('Authorization', `Bearer ${authToken}`)
        .send(bulkOperation)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.successful).toHaveLength(2);
    });

    it('should validate bulk operation data', async () => {
      const invalidBulkOperation = {
        taskIds: [], // Empty array
        operation: 'UPDATE',
        data: {}
      };

      const response = await request(app)
        .post('/api/tasks/bulk')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidBulkOperation)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/tasks/:taskId', () => {
    let taskToDelete: string;

    beforeAll(async () => {
      // Create a task specifically for deletion
      const task = await taskService.createTask({
        title: 'Task to Delete',
        type: TaskType.TASK,
        projectId
      }, {
        projectId,
        userId
      });
      taskToDelete = task.id;
    });

    it('should delete task', async () => {
      const response = await request(app)
        .delete(`/api/tasks/${taskToDelete}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify task is deleted
      const deletedTask = await taskService.getTask(taskToDelete);
      expect(deletedTask).toBeNull();
    });

    it('should not delete task with subtasks', async () => {
      // This should fail because the main task has subtasks
      const response = await request(app)
        .delete(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });
});

describe('TaskService Unit Tests', () => {
  let userId: string;
  let projectId: string;

  beforeAll(async () => {
    // Create test user and project for unit tests
    const user = await prisma.user.create({
      data: {
        email: 'taskservice-test@example.com',
        passwordHash: 'hashedpassword',
        firstName: 'TaskService',
        lastName: 'Tester',
        role: 'ADMIN',
        isActive: true
      }
    });
    userId = user.id;

    const team = await prisma.team.create({
      data: {
        name: 'TaskService Test Team',
        key: 'TST',
        ownerId: userId,
        isActive: true
      }
    });

    const project = await prisma.project.create({
      data: {
        name: 'TaskService Test Project',
        key: 'TSP',
        methodology: 'AGILE',
        status: 'ACTIVE',
        ownerId: userId,
        teamId: team.id
      }
    });
    projectId = project.id;
  });

  afterAll(async () => {
    // Clean up
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
      where: { email: 'taskservice-test@example.com' }
    });
    await prisma.$disconnect();
  });

  describe('createTask', () => {
    it('should create task with valid data', async () => {
      const taskData = {
        title: 'Unit Test Task',
        description: 'This is a unit test task',
        type: TaskType.TASK,
        priority: Priority.MEDIUM,
        projectId,
        estimatedHours: 5
      };

      const task = await taskService.createTask(taskData, {
        projectId,
        userId
      });

      expect(task.title).toBe(taskData.title);
      expect(task.type).toBe(taskData.type);
      expect(task.projectId).toBe(projectId);
      expect(task.reporterId).toBe(userId);
      expect(task.key).toMatch(/^TSP-\d+$/);
    });

    it('should validate required fields', async () => {
      const invalidTaskData = {
        description: 'Missing title',
        type: TaskType.TASK,
        projectId
      };

      await expect(
        taskService.createTask(invalidTaskData as any, {
          projectId,
          userId
        })
      ).rejects.toThrow('Task validation failed');
    });

    it('should generate unique task keys', async () => {
      const taskData1 = {
        title: 'Task 1',
        type: TaskType.TASK,
        projectId
      };

      const taskData2 = {
        title: 'Task 2',
        type: TaskType.TASK,
        projectId
      };

      const [task1, task2] = await Promise.all([
        taskService.createTask(taskData1, { projectId, userId }),
        taskService.createTask(taskData2, { projectId, userId })
      ]);

      expect(task1.key).not.toBe(task2.key);
      expect(task1.key).toMatch(/^TSP-\d+$/);
      expect(task2.key).toMatch(/^TSP-\d+$/);
    });
  });

  describe('searchTasks', () => {
    let searchTaskId: string;

    beforeAll(async () => {
      const task = await taskService.createTask({
        title: 'Searchable Task',
        description: 'This task is for search testing',
        type: TaskType.STORY,
        priority: Priority.HIGH,
        projectId,
        labels: ['search', 'test'],
        components: ['frontend']
      }, {
        projectId,
        userId
      });
      searchTaskId = task.id;
    });

    it('should search tasks by title', async () => {
      const result = await taskService.searchTasks({
        projectId,
        search: 'Searchable'
      });

      expect(result.tasks.length).toBeGreaterThan(0);
      expect(result.tasks.some(task => task.id === searchTaskId)).toBe(true);
    });

    it('should filter tasks by type', async () => {
      const result = await taskService.searchTasks({
        projectId,
        type: TaskType.STORY
      });

      expect(result.tasks.length).toBeGreaterThan(0);
      expect(result.tasks.every(task => task.type === TaskType.STORY)).toBe(true);
    });

    it('should filter tasks by priority', async () => {
      const result = await taskService.searchTasks({
        projectId,
        priority: Priority.HIGH
      });

      expect(result.tasks.length).toBeGreaterThan(0);
      expect(result.tasks.every(task => task.priority === Priority.HIGH)).toBe(true);
    });

    it('should filter tasks by labels', async () => {
      const result = await taskService.searchTasks({
        projectId,
        labels: ['search']
      });

      expect(result.tasks.length).toBeGreaterThan(0);
      expect(result.tasks.some(task => task.labels.includes('search'))).toBe(true);
    });

    it('should paginate results', async () => {
      const result = await taskService.searchTasks({
        projectId
      }, {
        page: 1,
        limit: 2
      });

      expect(result.page).toBe(1);
      expect(result.limit).toBe(2);
      expect(result.tasks.length).toBeLessThanOrEqual(2);
    });
  });

  describe('updateTask', () => {
    let updateTaskId: string;

    beforeAll(async () => {
      const task = await taskService.createTask({
        title: 'Task to Update',
        type: TaskType.TASK,
        projectId,
        priority: Priority.LOW
      }, {
        projectId,
        userId
      });
      updateTaskId = task.id;
    });

    it('should update task fields', async () => {
      const updateData = {
        title: 'Updated Task Title',
        priority: Priority.HIGH,
        estimatedHours: 10
      };

      const updatedTask = await taskService.updateTask(
        updateTaskId,
        updateData,
        { taskId: updateTaskId, userId }
      );

      expect(updatedTask.title).toBe(updateData.title);
      expect(updatedTask.priority).toBe(updateData.priority);
      expect(updatedTask.estimatedHours).toBe(updateData.estimatedHours);
    });

    it('should validate update data', async () => {
      const invalidUpdateData = {
        title: '', // Empty title
        estimatedHours: -5 // Negative hours
      };

      await expect(
        taskService.updateTask(
          updateTaskId,
          invalidUpdateData,
          { taskId: updateTaskId, userId }
        )
      ).rejects.toThrow('Task update validation failed');
    });
  });

  describe('getTaskStatistics', () => {
    it('should return task statistics', async () => {
      const stats = await taskService.getTaskStatistics({
        projectId
      });

      expect(stats.total).toBeGreaterThan(0);
      expect(stats.byStatus).toBeDefined();
      expect(stats.byType).toBeDefined();
      expect(stats.byPriority).toBeDefined();
      expect(stats.byAssignee).toBeDefined();
    });

    it('should filter statistics by assignee', async () => {
      // First assign a task to the user
      const task = await taskService.createTask({
        title: 'Assigned Task',
        type: TaskType.TASK,
        projectId,
        assigneeId: userId
      }, {
        projectId,
        userId
      });

      const stats = await taskService.getTaskStatistics({
        projectId,
        assigneeId: userId
      });

      expect(stats.byAssignee[userId]).toBeGreaterThan(0);
    });
  });
});
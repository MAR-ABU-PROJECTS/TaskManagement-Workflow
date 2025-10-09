import request from 'supertest';
import { app } from '../server';
import { PrismaClient } from '@prisma/client';
import { TaskType, TaskStatus, TaskPriority } from '../types/task.types';

const prisma = new PrismaClient();

describe('Task Management', () => {
  let authToken: string;
  let projectId: string;
  let userId: string;
  let projectManagerId: string;
  let taskId: string;

  beforeAll(async () => {
    // Create test users
    const projectManager = await prisma.user.create({
      data: {
        email: 'pm@test.com',
        firstName: 'Project',
        lastName: 'Manager',
        passwordHash: 'hashedpassword',
        role: 'PROJECT_MANAGER',
        isActive: true
      }
    });
    projectManagerId = projectManager.id;

    const testUser = await prisma.user.create({
      data: {
        email: 'dev@test.com',
        firstName: 'Test',
        lastName: 'Developer',
        passwordHash: 'hashedpassword',
        role: 'DEVELOPER',
        isActive: true
      }
    });
    userId = testUser.id;

    // Create test project
    const project = await prisma.project.create({
      data: {
        name: 'Test Project',
        key: 'TEST',
        description: 'Test project for task management',
        methodology: 'AGILE',
        status: 'ACTIVE',
        ownerId: projectManagerId,
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      }
    });
    projectId = project.id;

    // Add users as project members
    await prisma.projectMember.createMany({
      data: [
        {
          projectId,
          userId: projectManagerId,
          role: 'PROJECT_MANAGER',
          permissions: ['MANAGE_PROJECT', 'CREATE_TASKS', 'EDIT_TASKS', 'DELETE_TASKS'],
          joinedAt: new Date(),
          addedBy: projectManagerId
        },
        {
          projectId,
          userId,
          role: 'DEVELOPER',
          permissions: ['CREATE_TASKS', 'EDIT_ASSIGNED_TASKS', 'LOG_TIME'],
          joinedAt: new Date(),
          addedBy: projectManagerId
        }
      ]
    });

    // Get auth token for project manager
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'pm@test.com',
        password: 'password123'
      });

    authToken = loginResponse.body.data.token;
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.taskComment.deleteMany({});
    await prisma.taskAttachment.deleteMany({});
    await prisma.taskDependency.deleteMany({});
    await prisma.taskStatusTransition.deleteMany({});
    await prisma.taskAssignmentHistory.deleteMany({});
    await prisma.taskTimeEntry.deleteMany({});
    await prisma.task.deleteMany({});
    await prisma.projectMember.deleteMany({});
    await prisma.project.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.$disconnect();
  });

  describe('POST /api/tasks', () => {
    it('should create a new task', async () => {
      const taskData = {
        title: 'Test Task',
        description: 'This is a test task',
        type: TaskType.STORY,
        priority: TaskPriority.MEDIUM,
        projectId,
        assigneeId: userId,
        estimatedHours: 8,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        labels: ['frontend', 'urgent'],
        components: ['ui', 'api']
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
      expect(response.body.data.status).toBe(TaskStatus.TODO);
      expect(response.body.data.key).toMatch(/^TEST-\d+$/);
      expect(response.body.data.assigneeId).toBe(userId);
      expect(response.body.data.reporterId).toBe(projectManagerId);

      taskId = response.body.data.id;
    });

    it('should validate required fields', async () => {
      const taskData = {
        description: 'Missing required fields'
        // Missing title, type, priority, projectId
      };

      await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send(taskData)
        .expect(400);
    });

    it('should validate task type enum', async () => {
      const taskData = {
        title: 'Test Task',
        type: 'INVALID_TYPE',
        priority: TaskPriority.MEDIUM,
        projectId
      };

      await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send(taskData)
        .expect(400);
    });

    it('should validate assignee is project member', async () => {
      // Create user not in project
      const outsideUser = await prisma.user.create({
        data: {
          email: 'outside@test.com',
          firstName: 'Outside',
          lastName: 'User',
          passwordHash: 'hashedpassword',
          role: 'DEVELOPER',
          isActive: true
        }
      });

      const taskData = {
        title: 'Test Task',
        type: TaskType.TASK,
        priority: TaskPriority.MEDIUM,
        projectId,
        assigneeId: outsideUser.id
      };

      await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send(taskData)
        .expect(400);
    });

    it('should create subtask', async () => {
      const subtaskData = {
        title: 'Subtask',
        type: TaskType.SUBTASK,
        priority: TaskPriority.LOW,
        projectId,
        parentId: taskId
      };

      const response = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send(subtaskData)
        .expect(201);

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

    it('should include related data when requested', async () => {
      const response = await request(app)
        .get(`/api/tasks/${taskId}?includeSubtasks=true&includeComments=true`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data.subtasks).toBeDefined();
      expect(Array.isArray(response.body.data.subtasks)).toBe(true);
    });

    it('should return 404 for non-existent task', async () => {
      const nonExistentId = '123e4567-e89b-12d3-a456-426614174000';
      
      await request(app)
        .get(`/api/tasks/${nonExistentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('PUT /api/tasks/:taskId', () => {
    it('should update task', async () => {
      const updateData = {
        title: 'Updated Task Title',
        description: 'Updated description',
        priority: TaskPriority.HIGH,
        status: TaskStatus.IN_PROGRESS,
        estimatedHours: 12,
        remainingHours: 10
      };

      const response = await request(app)
        .put(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe(updateData.title);
      expect(response.body.data.priority).toBe(updateData.priority);
      expect(response.body.data.status).toBe(updateData.status);
    });

    it('should validate status enum', async () => {
      const updateData = {
        status: 'INVALID_STATUS'
      };

      await request(app)
        .put(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(400);
    });

    it('should require at least one field for update', async () => {
      await request(app)
        .put(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({})
        .expect(400);
    });
  });

  describe('GET /api/tasks', () => {
    beforeAll(async () => {
      // Create additional test tasks
      await prisma.task.createMany({
        data: [
          {
            key: 'TEST-2',
            title: 'Bug Fix',
            type: TaskType.BUG,
            status: TaskStatus.TODO,
            priority: TaskPriority.HIGH,
            reporterId: projectManagerId,
            projectId,
            loggedHours: 0
          },
          {
            key: 'TEST-3',
            title: 'Epic Task',
            type: TaskType.EPIC,
            status: TaskStatus.IN_PROGRESS,
            priority: TaskPriority.MEDIUM,
            reporterId: projectManagerId,
            projectId,
            assigneeId: userId,
            loggedHours: 0
          }
        ]
      });
    });

    it('should search tasks with pagination', async () => {
      const response = await request(app)
        .get('/api/tasks?page=1&limit=10')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.pagination).toBeDefined();
      expect(response.body.pagination.page).toBe(1);
    });

    it('should filter tasks by project', async () => {
      const response = await request(app)
        .get(`/api/tasks?projectId=${projectId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data.length).toBeGreaterThan(0);
      response.body.data.forEach((task: any) => {
        expect(task.projectId).toBe(projectId);
      });
    });

    it('should filter tasks by status', async () => {
      const response = await request(app)
        .get(`/api/tasks?status=${TaskStatus.IN_PROGRESS}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      response.body.data.forEach((task: any) => {
        expect(task.status).toBe(TaskStatus.IN_PROGRESS);
      });
    });

    it('should filter tasks by type', async () => {
      const response = await request(app)
        .get(`/api/tasks?type=${TaskType.BUG}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      response.body.data.forEach((task: any) => {
        expect(task.type).toBe(TaskType.BUG);
      });
    });

    it('should filter tasks by assignee', async () => {
      const response = await request(app)
        .get(`/api/tasks?assigneeId=${userId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      response.body.data.forEach((task: any) => {
        expect(task.assigneeId).toBe(userId);
      });
    });

    it('should search tasks by text', async () => {
      const response = await request(app)
        .get('/api/tasks?search=Bug')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data.length).toBeGreaterThan(0);
    });

    it('should sort tasks', async () => {
      const response = await request(app)
        .get('/api/tasks?sortBy=priority&sortOrder=desc')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data.length).toBeGreaterThan(1);
      // Verify sorting (HIGH priority should come before MEDIUM)
      const priorities = response.body.data.map((task: any) => task.priority);
      expect(priorities[0]).toBe(TaskPriority.HIGH);
    });
  });

  describe('PUT /api/tasks/:taskId/assign', () => {
    it('should assign task to user', async () => {
      const response = await request(app)
        .put(`/api/tasks/${taskId}/assign`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ assigneeId: userId })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.assigneeId).toBe(userId);
    });

    it('should validate assignee is project member', async () => {
      const outsideUser = await prisma.user.create({
        data: {
          email: 'outside2@test.com',
          firstName: 'Outside2',
          lastName: 'User2',
          passwordHash: 'hashedpassword',
          role: 'DEVELOPER',
          isActive: true
        }
      });

      await request(app)
        .put(`/api/tasks/${taskId}/assign`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ assigneeId: outsideUser.id })
        .expect(400);
    });
  });

  describe('PUT /api/tasks/:taskId/status', () => {
    it('should update task status', async () => {
      const response = await request(app)
        .put(`/api/tasks/${taskId}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: TaskStatus.DONE })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe(TaskStatus.DONE);
    });

    it('should validate status enum', async () => {
      await request(app)
        .put(`/api/tasks/${taskId}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: 'INVALID_STATUS' })
        .expect(400);
    });
  });

  describe('GET /api/tasks/key/:taskKey', () => {
    it('should get task by key', async () => {
      const response = await request(app)
        .get('/api/tasks/key/TEST-1')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.key).toBe('TEST-1');
    });

    it('should validate task key format', async () => {
      await request(app)
        .get('/api/tasks/key/invalid-key')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);
    });

    it('should return 404 for non-existent key', async () => {
      await request(app)
        .get('/api/tasks/key/TEST-999')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('GET /api/tasks/:taskId/subtasks', () => {
    it('should get subtasks of a task', async () => {
      const response = await request(app)
        .get(`/api/tasks/${taskId}/subtasks`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('POST /api/tasks/bulk', () => {
    let bulkTaskIds: string[];

    beforeAll(async () => {
      // Create tasks for bulk operations
      const tasks = await prisma.task.createMany({
        data: [
          {
            key: 'TEST-10',
            title: 'Bulk Task 1',
            type: TaskType.TASK,
            status: TaskStatus.TODO,
            priority: TaskPriority.LOW,
            reporterId: projectManagerId,
            projectId,
            loggedHours: 0
          },
          {
            key: 'TEST-11',
            title: 'Bulk Task 2',
            type: TaskType.TASK,
            status: TaskStatus.TODO,
            priority: TaskPriority.LOW,
            reporterId: projectManagerId,
            projectId,
            loggedHours: 0
          }
        ]
      });

      const createdTasks = await prisma.task.findMany({
        where: { key: { in: ['TEST-10', 'TEST-11'] } },
        select: { id: true }
      });

      bulkTaskIds = createdTasks.map(task => task.id);
    });

    it('should bulk update task status', async () => {
      const bulkOperation = {
        taskIds: bulkTaskIds,
        operation: 'UPDATE_STATUS',
        data: {
          status: TaskStatus.IN_PROGRESS
        }
      };

      const response = await request(app)
        .post('/api/tasks/bulk')
        .set('Authorization', `Bearer ${authToken}`)
        .send(bulkOperation)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.updated).toBe(bulkTaskIds.length);
      expect(response.body.data.failed.length).toBe(0);
    });

    it('should bulk assign tasks', async () => {
      const bulkOperation = {
        taskIds: bulkTaskIds,
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
      expect(response.body.data.updated).toBe(bulkTaskIds.length);
    });

    it('should validate bulk operation', async () => {
      const bulkOperation = {
        taskIds: [],
        operation: 'UPDATE_STATUS'
      };

      await request(app)
        .post('/api/tasks/bulk')
        .set('Authorization', `Bearer ${authToken}`)
        .send(bulkOperation)
        .expect(400);
    });

    it('should limit bulk operation size', async () => {
      const tooManyIds = Array(101).fill('123e4567-e89b-12d3-a456-426614174000');
      
      const bulkOperation = {
        taskIds: tooManyIds,
        operation: 'UPDATE_STATUS',
        data: { status: TaskStatus.DONE }
      };

      await request(app)
        .post('/api/tasks/bulk')
        .set('Authorization', `Bearer ${authToken}`)
        .send(bulkOperation)
        .expect(400);
    });
  });

  describe('GET /api/tasks/projects/:projectId/stats', () => {
    it('should get task statistics for project', async () => {
      const response = await request(app)
        .get(`/api/tasks/projects/${projectId}/stats`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.totalTasks).toBeGreaterThan(0);
      expect(response.body.data.tasksByStatus).toBeDefined();
      expect(response.body.data.tasksByType).toBeDefined();
      expect(response.body.data.tasksByPriority).toBeDefined();
      expect(typeof response.body.data.overdueTasks).toBe('number');
      expect(typeof response.body.data.unassignedTasks).toBe('number');
    });
  });

  describe('DELETE /api/tasks/:taskId', () => {
    let deleteTaskId: string;

    beforeAll(async () => {
      // Create a task to delete
      const task = await prisma.task.create({
        data: {
          key: 'TEST-DELETE',
          title: 'Task to Delete',
          type: TaskType.TASK,
          status: TaskStatus.TODO,
          priority: TaskPriority.LOW,
          reporterId: projectManagerId,
          projectId,
          loggedHours: 0
        }
      });
      deleteTaskId = task.id;
    });

    it('should delete task', async () => {
      const response = await request(app)
        .delete(`/api/tasks/${deleteTaskId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify task is deleted
      await request(app)
        .get(`/api/tasks/${deleteTaskId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    it('should not delete task with subtasks', async () => {
      // Create parent task
      const parentTask = await prisma.task.create({
        data: {
          key: 'TEST-PARENT',
          title: 'Parent Task',
          type: TaskType.EPIC,
          status: TaskStatus.TODO,
          priority: TaskPriority.MEDIUM,
          reporterId: projectManagerId,
          projectId,
          loggedHours: 0
        }
      });

      // Create subtask
      await prisma.task.create({
        data: {
          key: 'TEST-CHILD',
          title: 'Child Task',
          type: TaskType.SUBTASK,
          status: TaskStatus.TODO,
          priority: TaskPriority.LOW,
          reporterId: projectManagerId,
          projectId,
          parentId: parentTask.id,
          loggedHours: 0
        }
      });

      await request(app)
        .delete(`/api/tasks/${parentTask.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);
    });
  });

  describe('Authorization Tests', () => {
    it('should require authentication', async () => {
      await request(app)
        .get('/api/tasks')
        .expect(401);
    });

    it('should check project permissions for task creation', async () => {
      // Create user without project access
      const unauthorizedUser = await prisma.user.create({
        data: {
          email: 'unauthorized@test.com',
          firstName: 'Unauthorized',
          lastName: 'User',
          passwordHash: 'hashedpassword',
          role: 'DEVELOPER',
          isActive: true
        }
      });

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'unauthorized@test.com',
          password: 'password123'
        });

      const unauthorizedToken = loginResponse.body.data.token;

      const taskData = {
        title: 'Unauthorized Task',
        type: TaskType.TASK,
        priority: TaskPriority.MEDIUM,
        projectId
      };

      await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${unauthorizedToken}`)
        .send(taskData)
        .expect(403);
    });
  });
});
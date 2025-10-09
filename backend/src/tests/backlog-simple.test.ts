import request from 'supertest';
import app from '../server';
import { PrismaClient } from '@prisma/client';
import { generateTestToken } from '../utils/testHelpers';

const prisma = new PrismaClient();

describe('Backlog Management Integration Tests', () => {
  let authToken: string;
  let testUserId: string;
  let testProjectId: string;
  let testTaskId: string;
  let testTeamId: string;

  beforeAll(async () => {
    // Clean up test data
    await prisma.backlogItem.deleteMany({});
    await prisma.epic.deleteMany({});
    await prisma.task.deleteMany({});
    await prisma.project.deleteMany({});
    await prisma.team.deleteMany({});
    await prisma.user.deleteMany({});

    // Create test user
    const testUser = await prisma.user.create({
      data: {
        email: 'backlog.test@example.com',
        passwordHash: 'hashedpassword',
        firstName: 'Backlog',
        lastName: 'Tester',
        role: 'DEVELOPER',
        isActive: true
      }
    });
    testUserId = testUser.id;
    authToken = generateTestToken(testUser);

    // Create test team
    const testTeam = await prisma.team.create({
      data: {
        name: 'Backlog Test Team',
        key: 'BTT',
        description: 'Test team for backlog management',
        ownerId: testUserId
      }
    });
    testTeamId = testTeam.id;

    // Create test project
    const testProject = await prisma.project.create({
      data: {
        name: 'Backlog Test Project',
        key: 'BTP',
        description: 'Test project for backlog management',
        methodology: 'AGILE',
        status: 'ACTIVE',
        teamId: testTeamId,
        ownerId: testUserId
      }
    });
    testProjectId = testProject.id;

    // Create test task
    const testTask = await prisma.task.create({
      data: {
        key: 'BTP-1',
        title: 'Test Task for Backlog',
        description: 'A test task to be added to backlog',
        type: 'STORY',
        status: 'TODO',
        priority: 'MEDIUM',
        reporterId: testUserId,
        projectId: testProjectId
      }
    });
    testTaskId = testTask.id;
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.backlogItem.deleteMany({});
    await prisma.epic.deleteMany({});
    await prisma.task.deleteMany({});
    await prisma.project.deleteMany({});
    await prisma.team.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.$disconnect();
  });

  describe('Basic Backlog Operations', () => {
    test('should get or create project backlog', async () => {
      const response = await request(app)
        .get(`/api/projects/${testProjectId}/backlog`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.projectId).toBe(testProjectId);
      expect(response.body.data.items).toEqual([]);
    });

    test('should add item to backlog', async () => {
      const itemData = {
        taskId: testTaskId,
        storyPoints: 5,
        businessValue: 100,
        riskLevel: 'MEDIUM',
        acceptanceCriteria: [
          'User can complete the task',
          'Task is properly validated'
        ]
      };

      const response = await request(app)
        .post(`/api/projects/${testProjectId}/backlog/items`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(itemData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.taskId).toBe(testTaskId);
      expect(response.body.data.storyPoints).toBe(5);
      expect(response.body.data.businessValue).toBe(100);
      expect(response.body.data.riskLevel).toBe('MEDIUM');
    });

    test('should get backlog metrics', async () => {
      const response = await request(app)
        .get(`/api/projects/${testProjectId}/backlog/metrics`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('projectId', testProjectId);
      expect(response.body.data).toHaveProperty('totalItems');
      expect(response.body.data).toHaveProperty('totalStoryPoints');
      expect(response.body.data.totalItems).toBeGreaterThan(0);
    });

    test('should get backlog health', async () => {
      const response = await request(app)
        .get(`/api/projects/${testProjectId}/backlog/health`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('projectId', testProjectId);
      expect(response.body.data).toHaveProperty('healthScore');
      expect(response.body.data).toHaveProperty('readinessScore');
      expect(response.body.data).toHaveProperty('estimationCoverage');
      expect(response.body.data).toHaveProperty('recommendations');

      // Verify health scores are within valid range
      expect(response.body.data.healthScore).toBeGreaterThanOrEqual(0);
      expect(response.body.data.healthScore).toBeLessThanOrEqual(100);
    });
  });

  describe('Epic Management', () => {
    test('should create epic', async () => {
      const epicData = {
        title: 'User Authentication Epic',
        description: 'Complete user authentication system',
        projectId: testProjectId,
        priority: 'HIGH',
        ownerId: testUserId,
        businessValue: 1000,
        color: '#FF5722',
        labels: ['authentication', 'security']
      };

      const response = await request(app)
        .post('/api/epics')
        .set('Authorization', `Bearer ${authToken}`)
        .send(epicData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data).toHaveProperty('key');
      expect(response.body.data.title).toBe(epicData.title);
      expect(response.body.data.projectId).toBe(testProjectId);
      expect(response.body.data.status).toBe('DRAFT');
    });

    test('should search epics', async () => {
      const response = await request(app)
        .get('/api/epics')
        .query({
          projectId: testProjectId,
          status: 'DRAFT'
        })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.pagination).toHaveProperty('total');
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid project ID', async () => {
      await request(app)
        .get('/api/projects/invalid-uuid/backlog')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);
    });

    test('should handle unauthorized access', async () => {
      await request(app)
        .get(`/api/projects/${testProjectId}/backlog`)
        .expect(401);
    });
  });
});
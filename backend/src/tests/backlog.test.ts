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
  let testEpicId: string;
  let testBacklogItemId: string;

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

    // Create test team first
    const testTeam = await prisma.team.create({
      data: {
        name: 'Backlog Test Team',
        key: 'BTT',
        description: 'Test team for backlog management',
        ownerId: testUserId
      }
    });

    // Create test project
    const testProject = await prisma.project.create({
      data: {
        name: 'Backlog Test Project',
        key: 'BTP',
        description: 'Test project for backlog management',
        methodology: 'AGILE',
        status: 'ACTIVE',
        teamId: testTeam.id,
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

  describe('Project Backlog Management', () => {
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
        ],
        dependencies: []
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
      expect(response.body.data.acceptanceCriteria).toEqual(itemData.acceptanceCriteria);

      testBacklogItemId = response.body.data.id;
    });

    test('should not add duplicate task to backlog', async () => {
      const itemData = {
        taskId: testTaskId,
        storyPoints: 3
      };

      await request(app)
        .post(`/api/projects/${testProjectId}/backlog/items`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(itemData)
        .expect(409);
    });

    test('should not add task from different project', async () => {
      // Create another team and project
      const otherTeam = await prisma.team.create({
        data: {
          name: 'Other Team',
          key: 'OTH',
          description: 'Another test team',
          ownerId: testUserId
        }
      });

      const otherProject = await prisma.project.create({
        data: {
          name: 'Other Project',
          key: 'OTHER',
          description: 'Another test project',
          methodology: 'AGILE',
          status: 'ACTIVE',
          teamId: otherTeam.id,
          ownerId: testUserId
        }
      });

      // Create task in other project
      const otherTask = await prisma.task.create({
        data: {
          key: 'OTHER-1',
          title: 'Task in Other Project',
          type: 'TASK',
          status: 'TODO',
          priority: 'LOW',
          reporterId: testUserId,
          projectId: otherProject.id
        }
      });

      const itemData = {
        taskId: otherTask.id,
        storyPoints: 2
      };

      await request(app)
        .post(`/api/projects/${testProjectId}/backlog/items`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(itemData)
        .expect(400);

      // Clean up
      await prisma.task.delete({ where: { id: otherTask.id } });
      await prisma.project.delete({ where: { id: otherProject.id } });
      await prisma.team.delete({ where: { id: otherTeam.id } });
    });
  });

  describe('Backlog Item Management', () => {
    test('should update backlog item', async () => {
      const updateData = {
        storyPoints: 8,
        businessValue: 200,
        riskLevel: 'HIGH',
        readyForSprint: true,
        acceptanceCriteria: [
          'Updated acceptance criteria',
          'Additional validation required'
        ]
      };

      const response = await request(app)
        .put(`/api/backlog/items/${testBacklogItemId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.storyPoints).toBe(8);
      expect(response.body.data.businessValue).toBe(200);
      expect(response.body.data.riskLevel).toBe('HIGH');
      expect(response.body.data.readyForSprint).toBe(true);
      expect(response.body.data.acceptanceCriteria).toEqual(updateData.acceptanceCriteria);
    });

    test('should prioritize backlog item', async () => {
      const prioritizationData = {
        newPriority: 1,
        reason: 'High business priority'
      };

      const response = await request(app)
        .put(`/api/backlog/items/${testBacklogItemId}/priority`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(prioritizationData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.priority).toBe(1);
    });

    test('should search backlog items', async () => {
      const response = await request(app)
        .get('/api/backlog/items')
        .query({
          projectId: testProjectId,
          readyForSprint: 'true',
          page: 1,
          limit: 10
        })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.pagination).toHaveProperty('total');
      expect(response.body.pagination).toHaveProperty('page');
      expect(response.body.pagination).toHaveProperty('limit');
    });

    test('should search backlog items with filters', async () => {
      const response = await request(app)
        .get('/api/backlog/items')
        .query({
          projectId: testProjectId,
          riskLevel: 'HIGH',
          hasStoryPoints: 'true',
          sortBy: 'priority',
          sortOrder: 'asc'
        })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      
      // Verify filtering worked
      if (response.body.data.length > 0) {
        expect(response.body.data[0].riskLevel).toBe('HIGH');
        expect(response.body.data[0].storyPoints).not.toBeNull();
      }
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
        startDate: '2024-02-01T00:00:00Z',
        targetDate: '2024-03-31T23:59:59Z',
        businessValue: 1000,
        color: '#FF5722',
        labels: ['authentication', 'security', 'core']
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
      expect(response.body.data.description).toBe(epicData.description);
      expect(response.body.data.projectId).toBe(testProjectId);
      expect(response.body.data.priority).toBe(epicData.priority);
      expect(response.body.data.ownerId).toBe(testUserId);
      expect(response.body.data.businessValue).toBe(epicData.businessValue);
      expect(response.body.data.color).toBe(epicData.color);
      expect(response.body.data.labels).toEqual(epicData.labels);
      expect(response.body.data.status).toBe('DRAFT');
      expect(response.body.data.progress).toBe(0);

      testEpicId = response.body.data.id;
    });

    test('should update epic', async () => {
      const updateData = {
        status: 'IN_PROGRESS',
        progress: 25,
        targetDate: '2024-04-15T23:59:59Z',
        businessValue: 1500
      };

      const response = await request(app)
        .put(`/api/epics/${testEpicId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('IN_PROGRESS');
      expect(response.body.data.businessValue).toBe(1500);
    });

    test('should search epics', async () => {
      const response = await request(app)
        .get('/api/epics')
        .query({
          projectId: testProjectId,
          status: 'IN_PROGRESS',
          includeStories: 'true'
        })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.data[0].status).toBe('IN_PROGRESS');
      expect(response.body.pagination).toHaveProperty('total');
    });

    test('should associate backlog item with epic', async () => {
      const updateData = {
        epicId: testEpicId
      };

      const response = await request(app)
        .put(`/api/backlog/items/${testBacklogItemId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.epicId).toBe(testEpicId);
      expect(response.body.data.epic).toHaveProperty('id', testEpicId);
    });
  });

  describe('Bulk Operations', () => {
    let secondTaskId: string;
    let secondBacklogItemId: string;

    beforeAll(async () => {
      // Create second task and backlog item for bulk operations
      const secondTask = await prisma.task.create({
        data: {
          key: 'BTP-2',
          title: 'Second Test Task',
          description: 'Second task for bulk operations',
          type: 'TASK',
          status: 'TODO',
          priority: 'LOW',
          reporterId: testUserId,
          projectId: testProjectId
        }
      });
      secondTaskId = secondTask.id;

      const response = await request(app)
        .post(`/api/projects/${testProjectId}/backlog/items`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          taskId: secondTaskId,
          storyPoints: 3,
          businessValue: 50
        });

      secondBacklogItemId = response.body.data.id;
    });

    test('should bulk prioritize backlog items', async () => {
      const bulkData = {
        items: [
          { itemId: testBacklogItemId, priority: 2 },
          { itemId: secondBacklogItemId, priority: 1 }
        ],
        reason: 'Reprioritized based on sprint planning'
      };

      const response = await request(app)
        .put('/api/backlog/items/bulk-priority')
        .set('Authorization', `Bearer ${authToken}`)
        .send(bulkData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBe(2);
      expect(response.body.message).toContain('2 items prioritized successfully');

      // Verify priorities were updated
      const firstItem = response.body.data.find((item: any) => item.id === testBacklogItemId);
      const secondItem = response.body.data.find((item: any) => item.id === secondBacklogItemId);
      
      expect(firstItem.priority).toBe(2);
      expect(secondItem.priority).toBe(1);
    });
  });

  describe('Backlog Analytics', () => {
    test('should get backlog metrics', async () => {
      const response = await request(app)
        .get(`/api/projects/${testProjectId}/backlog/metrics`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('projectId', testProjectId);
      expect(response.body.data).toHaveProperty('totalItems');
      expect(response.body.data).toHaveProperty('readyItems');
      expect(response.body.data).toHaveProperty('estimatedItems');
      expect(response.body.data).toHaveProperty('totalStoryPoints');
      expect(response.body.data).toHaveProperty('averageStoryPoints');
      expect(response.body.data).toHaveProperty('totalBusinessValue');
      expect(response.body.data).toHaveProperty('averageBusinessValue');
      expect(response.body.data).toHaveProperty('byEpic');
      expect(response.body.data).toHaveProperty('byRiskLevel');
      expect(response.body.data).toHaveProperty('byStatus');

      // Verify metrics are calculated correctly
      expect(response.body.data.totalItems).toBeGreaterThan(0);
      expect(response.body.data.totalStoryPoints).toBeGreaterThan(0);
      expect(response.body.data.totalBusinessValue).toBeGreaterThan(0);
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
      expect(response.body.data).toHaveProperty('dependencyRisk');
      expect(response.body.data).toHaveProperty('recommendations');

      // Verify health scores are within valid range
      expect(response.body.data.healthScore).toBeGreaterThanOrEqual(0);
      expect(response.body.data.healthScore).toBeLessThanOrEqual(100);
      expect(response.body.data.readinessScore).toBeGreaterThanOrEqual(0);
      expect(response.body.data.readinessScore).toBeLessThanOrEqual(100);
      expect(response.body.data.estimationCoverage).toBeGreaterThanOrEqual(0);
      expect(response.body.data.estimationCoverage).toBeLessThanOrEqual(100);
      expect(response.body.data.dependencyRisk).toBeGreaterThanOrEqual(0);
      expect(response.body.data.dependencyRisk).toBeLessThanOrEqual(100);

      // Verify recommendations structure
      expect(response.body.data.recommendations).toBeInstanceOf(Array);
      if (response.body.data.recommendations.length > 0) {
        const recommendation = response.body.data.recommendations[0];
        expect(recommendation).toHaveProperty('type');
        expect(recommendation).toHaveProperty('severity');
        expect(recommendation).toHaveProperty('message');
        expect(recommendation).toHaveProperty('suggestedAction');
        expect(recommendation).toHaveProperty('impact');
      }
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid project ID', async () => {
      await request(app)
        .get('/api/projects/invalid-uuid/backlog')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);
    });

    test('should handle invalid backlog item ID', async () => {
      await request(app)
        .put('/api/backlog/items/invalid-uuid')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ storyPoints: 5 })
        .expect(400);
    });

    test('should handle invalid epic ID', async () => {
      await request(app)
        .put('/api/epics/invalid-uuid')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'Updated Epic' })
        .expect(400);
    });

    test('should handle missing required fields', async () => {
      await request(app)
        .post('/api/epics')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          // Missing required title and projectId
          description: 'Epic without title'
        })
        .expect(400);
    });

    test('should handle unauthorized access', async () => {
      await request(app)
        .get(`/api/projects/${testProjectId}/backlog`)
        .expect(401);
    });

    test('should handle non-existent backlog item', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000';
      
      await request(app)
        .put(`/api/backlog/items/${nonExistentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ storyPoints: 5 })
        .expect(404);
    });

    test('should handle non-existent epic', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000';
      
      await request(app)
        .put(`/api/epics/${nonExistentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'Updated Epic' })
        .expect(404);
    });
  });

  describe('Data Cleanup', () => {
    test('should remove item from backlog', async () => {
      await request(app)
        .delete(`/api/backlog/items/${testBacklogItemId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Verify item was removed
      await request(app)
        .put(`/api/backlog/items/${testBacklogItemId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ storyPoints: 10 })
        .expect(404);
    });
  });
});
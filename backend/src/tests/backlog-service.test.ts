import { PrismaClient } from '@prisma/client';
import { BacklogService } from '../services/BacklogService';
import { generateTestToken } from '../utils/testHelpers';
import { RiskLevel, EpicStatus } from '../types/backlog.types';

const prisma = new PrismaClient();

describe('BacklogService Integration Tests', () => {
  let backlogService: BacklogService;
  let testUserId: string;
  let testProjectId: string;
  let testTaskId: string;
  let testTeamId: string;
  let testBacklogId: string;

  beforeAll(async () => {
    backlogService = new BacklogService();

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
        email: 'backlog.service.test@example.com',
        passwordHash: 'hashedpassword',
        firstName: 'Backlog',
        lastName: 'ServiceTester',
        role: 'DEVELOPER',
        isActive: true
      }
    });
    testUserId = testUser.id;

    // Create test team
    const testTeam = await prisma.team.create({
      data: {
        name: 'Backlog Service Test Team',
        key: 'BSTT',
        description: 'Test team for backlog service testing',
        ownerId: testUserId
      }
    });
    testTeamId = testTeam.id;

    // Create test project
    const testProject = await prisma.project.create({
      data: {
        name: 'Backlog Service Test Project',
        key: 'BSTP',
        description: 'Test project for backlog service testing',
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
        key: 'BSTP-1',
        title: 'Test Task for Backlog Service',
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

  describe('Backlog Management', () => {
    test('should get or create backlog for project', async () => {
      const backlog = await backlogService.getOrCreateBacklog(testProjectId);

      expect(backlog).toHaveProperty('id');
      expect(backlog.projectId).toBe(testProjectId);
      expect(backlog.items).toEqual([]);
      expect(backlog.priorityOrder).toEqual([]);

      testBacklogId = backlog.id;
    });

    test('should add item to backlog', async () => {
      const itemData = {
        taskId: testTaskId,
        storyPoints: 5,
        businessValue: 100,
        riskLevel: RiskLevel.MEDIUM,
        acceptanceCriteria: [
          'User can complete the task',
          'Task is properly validated'
        ],
        dependencies: []
      };

      const backlogItem = await backlogService.addItemToBacklog(
        testProjectId,
        itemData,
        testUserId
      );

      expect(backlogItem).toHaveProperty('id');
      expect(backlogItem.taskId).toBe(testTaskId);
      expect(backlogItem.storyPoints).toBe(5);
      expect(backlogItem.businessValue).toBe(100);
      expect(backlogItem.riskLevel).toBe('MEDIUM');
      expect(backlogItem.acceptanceCriteria).toEqual(itemData.acceptanceCriteria);
      expect(backlogItem.readyForSprint).toBe(false);
    });

    test('should not add duplicate task to backlog', async () => {
      const itemData = {
        taskId: testTaskId,
        storyPoints: 3
      };

      await expect(
        backlogService.addItemToBacklog(testProjectId, itemData, testUserId)
      ).rejects.toThrow('Task is already in the backlog');
    });

    test('should update backlog item', async () => {
      // First get the backlog item
      const backlog = await backlogService.getOrCreateBacklog(testProjectId);
      const backlogItem = backlog.items![0];

      const updateData = {
        storyPoints: 8,
        businessValue: 200,
        riskLevel: RiskLevel.HIGH,
        readyForSprint: true,
        acceptanceCriteria: [
          'Updated acceptance criteria',
          'Additional validation required'
        ]
      };

      const updatedItem = await backlogService.updateBacklogItem(
        backlogItem.id,
        updateData,
        testUserId
      );

      expect(updatedItem.storyPoints).toBe(8);
      expect(updatedItem.businessValue).toBe(200);
      expect(updatedItem.riskLevel).toBe('HIGH');
      expect(updatedItem.readyForSprint).toBe(true);
      expect(updatedItem.acceptanceCriteria).toEqual(updateData.acceptanceCriteria);
    });

    test('should prioritize backlog item', async () => {
      const backlog = await backlogService.getOrCreateBacklog(testProjectId);
      const backlogItem = backlog.items![0];

      const prioritization = {
        itemId: backlogItem.id,
        newPriority: 1,
        reason: 'High business priority'
      };

      const prioritizedItem = await backlogService.prioritizeItem(
        prioritization,
        testUserId
      );

      expect(prioritizedItem.priority).toBe(1);
    });

    test('should search backlog items', async () => {
      const filters = {
        projectId: testProjectId,
        readyForSprint: true,
        riskLevel: RiskLevel.HIGH
      };

      const options = {
        page: 1,
        limit: 10,
        sortBy: 'priority',
        sortOrder: 'asc' as const
      };

      const result = await backlogService.searchBacklogItems(filters, options);

      expect(result.items).toBeInstanceOf(Array);
      expect(result.total).toBeGreaterThan(0);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
      
      // Verify filtering worked
      if (result.items.length > 0) {
        expect(result.items[0].riskLevel).toBe('HIGH');
        expect(result.items[0].readyForSprint).toBe(true);
      }
    });

    test('should get backlog metrics', async () => {
      const metrics = await backlogService.getBacklogMetrics(testProjectId);

      expect(metrics).toHaveProperty('projectId', testProjectId);
      expect(metrics).toHaveProperty('totalItems');
      expect(metrics).toHaveProperty('readyItems');
      expect(metrics).toHaveProperty('estimatedItems');
      expect(metrics).toHaveProperty('totalStoryPoints');
      expect(metrics).toHaveProperty('averageStoryPoints');
      expect(metrics).toHaveProperty('totalBusinessValue');
      expect(metrics).toHaveProperty('averageBusinessValue');
      expect(metrics).toHaveProperty('byRiskLevel');

      // Verify metrics are calculated correctly
      expect(metrics.totalItems).toBeGreaterThan(0);
      expect(metrics.totalStoryPoints).toBeGreaterThan(0);
      expect(metrics.totalBusinessValue).toBeGreaterThan(0);
    });

    test('should get backlog health', async () => {
      const health = await backlogService.getBacklogHealth(testProjectId);

      expect(health).toHaveProperty('projectId', testProjectId);
      expect(health).toHaveProperty('healthScore');
      expect(health).toHaveProperty('readinessScore');
      expect(health).toHaveProperty('estimationCoverage');
      expect(health).toHaveProperty('dependencyRisk');
      expect(health).toHaveProperty('recommendations');

      // Verify health scores are within valid range
      expect(health.healthScore).toBeGreaterThanOrEqual(0);
      expect(health.healthScore).toBeLessThanOrEqual(100);
      expect(health.readinessScore).toBeGreaterThanOrEqual(0);
      expect(health.readinessScore).toBeLessThanOrEqual(100);
      expect(health.estimationCoverage).toBeGreaterThanOrEqual(0);
      expect(health.estimationCoverage).toBeLessThanOrEqual(100);

      // Verify recommendations structure
      expect(health.recommendations).toBeInstanceOf(Array);
    });
  });

  describe('Epic Management', () => {
    let testEpicId: string;

    test('should create epic', async () => {
      const epicData = {
        title: 'User Authentication Epic',
        description: 'Complete user authentication system',
        projectId: testProjectId,
        priority: 'HIGH' as const,
        ownerId: testUserId,
        startDate: new Date('2024-02-01'),
        targetDate: new Date('2024-03-31'),
        businessValue: 1000,
        color: '#FF5722',
        labels: ['authentication', 'security', 'core']
      };

      const epic = await backlogService.createEpic(epicData, testUserId);

      expect(epic).toHaveProperty('id');
      expect(epic).toHaveProperty('key');
      expect(epic.title).toBe(epicData.title);
      expect(epic.description).toBe(epicData.description);
      expect(epic.projectId).toBe(testProjectId);
      expect(epic.priority).toBe(epicData.priority);
      expect(epic.ownerId).toBe(testUserId);
      expect(epic.businessValue).toBe(epicData.businessValue);
      expect(epic.color).toBe(epicData.color);
      expect(epic.labels).toEqual(epicData.labels);
      expect(epic.status).toBe('DRAFT');
      expect(epic.progress).toBe(0);

      testEpicId = epic.id;
    });

    test('should update epic', async () => {
      const updateData = {
        status: EpicStatus.IN_PROGRESS,
        targetDate: new Date('2024-04-15'),
        businessValue: 1500
      };

      const updatedEpic = await backlogService.updateEpic(
        testEpicId,
        updateData,
        testUserId
      );

      expect(updatedEpic.status).toBe('IN_PROGRESS');
      expect(updatedEpic.businessValue).toBe(1500);
    });

    test('should search epics', async () => {
      const filters = {
        projectId: testProjectId,
        status: EpicStatus.IN_PROGRESS
      };

      const options = {
        page: 1,
        limit: 10,
        sortBy: 'createdAt',
        sortOrder: 'desc' as const,
        includeStories: true
      };

      const result = await backlogService.searchEpics(filters, options);

      expect(result.epics).toBeInstanceOf(Array);
      expect(result.total).toBeGreaterThan(0);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
      
      if (result.epics.length > 0) {
        expect(result.epics[0].status).toBe('IN_PROGRESS');
      }
    });

    test('should associate backlog item with epic', async () => {
      const backlog = await backlogService.getOrCreateBacklog(testProjectId);
      const backlogItem = backlog.items![0];

      const updateData = {
        epicId: testEpicId
      };

      const updatedItem = await backlogService.updateBacklogItem(
        backlogItem.id,
        updateData,
        testUserId
      );

      expect(updatedItem.epicId).toBe(testEpicId);
      expect(updatedItem.epic).toHaveProperty('id', testEpicId);
    });
  });

  describe('Bulk Operations', () => {
    let secondTaskId: string;
    let secondBacklogItemId: string;

    beforeAll(async () => {
      // Create second task and backlog item for bulk operations
      const secondTask = await prisma.task.create({
        data: {
          key: 'BSTP-2',
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

      const secondItem = await backlogService.addItemToBacklog(
        testProjectId,
        {
          taskId: secondTaskId,
          storyPoints: 3,
          businessValue: 50
        },
        testUserId
      );

      secondBacklogItemId = secondItem.id;
    });

    test('should bulk prioritize backlog items', async () => {
      const backlog = await backlogService.getOrCreateBacklog(testProjectId);
      const firstItem = backlog.items!.find(item => item.taskId === testTaskId);
      const secondItem = backlog.items!.find(item => item.taskId === secondTaskId);

      const bulkData = {
        items: [
          { itemId: firstItem!.id, priority: 2 },
          { itemId: secondItem!.id, priority: 1 }
        ],
        reason: 'Reprioritized based on sprint planning'
      };

      const updatedItems = await backlogService.bulkPrioritize(bulkData, testUserId);

      expect(updatedItems).toBeInstanceOf(Array);
      expect(updatedItems.length).toBe(2);

      // Verify priorities were updated
      const firstUpdated = updatedItems.find(item => item.id === firstItem!.id);
      const secondUpdated = updatedItems.find(item => item.id === secondItem!.id);
      
      expect(firstUpdated!.priority).toBe(2);
      expect(secondUpdated!.priority).toBe(1);
    });
  });

  describe('Error Handling', () => {
    test('should handle non-existent project', async () => {
      const nonExistentProjectId = '00000000-0000-0000-0000-000000000000';
      
      // This should still work as it creates a backlog for any project ID
      const backlog = await backlogService.getOrCreateBacklog(nonExistentProjectId);
      expect(backlog).toHaveProperty('id');
      expect(backlog.projectId).toBe(nonExistentProjectId);
    });

    test('should handle non-existent task', async () => {
      const nonExistentTaskId = '00000000-0000-0000-0000-000000000000';
      
      await expect(
        backlogService.addItemToBacklog(
          testProjectId,
          { taskId: nonExistentTaskId, storyPoints: 5 },
          testUserId
        )
      ).rejects.toThrow('Task not found');
    });

    test('should handle non-existent backlog item', async () => {
      const nonExistentItemId = '00000000-0000-0000-0000-000000000000';
      
      await expect(
        backlogService.updateBacklogItem(
          nonExistentItemId,
          { storyPoints: 10 },
          testUserId
        )
      ).rejects.toThrow('Backlog item not found');
    });

    test('should handle non-existent epic', async () => {
      const nonExistentEpicId = '00000000-0000-0000-0000-000000000000';
      
      await expect(
        backlogService.updateEpic(
          nonExistentEpicId,
          { title: 'Updated Epic' },
          testUserId
        )
      ).rejects.toThrow('Epic not found');
    });
  });
});
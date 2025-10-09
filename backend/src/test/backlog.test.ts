import { BacklogService } from '../services/BacklogService';
import { PrismaClient, EpicStatus, RiskLevel } from '@prisma/client';

// Mock Prisma
jest.mock('@prisma/client');
const mockPrisma = {
  backlog: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  backlogItem: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
    findFirst: jest.fn(),
  },
  epic: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
  },
  task: {
    findUnique: jest.fn(),
  },
  project: {
    findUnique: jest.fn(),
  },
  user: {
    findUnique: jest.fn(),
  },
  auditLog: {
    create: jest.fn(),
  },
};

// Mock logger
jest.mock('../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

// Mock NotificationService
jest.mock('../services/NotificationService', () => ({
  NotificationService: jest.fn().mockImplementation(() => ({
    createNotification: jest.fn(),
  })),
}));

describe('BacklogService', () => {
  let backlogService: BacklogService;

  beforeEach(() => {
    jest.clearAllMocks();
    // Replace the actual prisma instance with our mock
    (PrismaClient as jest.Mock).mockImplementation(() => mockPrisma);
    backlogService = new BacklogService();
  });

  describe('getOrCreateBacklog', () => {
    const mockProject = {
      id: 'project-1',
      name: 'Test Project',
      key: 'TEST'
    };

    const mockBacklog = {
      id: 'backlog-1',
      projectId: 'project-1',
      priorityOrder: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      project: mockProject,
      items: []
    };

    it('should return existing backlog if it exists', async () => {
      mockPrisma.backlog.findUnique.mockResolvedValue(mockBacklog);

      const result = await backlogService.getOrCreateBacklog('project-1');

      expect(mockPrisma.backlog.findUnique).toHaveBeenCalledWith({
        where: { projectId: 'project-1' },
        include: expect.any(Object)
      });

      expect(result).toEqual(expect.objectContaining({
        id: 'backlog-1',
        projectId: 'project-1'
      }));
    });

    it('should create new backlog if it does not exist', async () => {
      mockPrisma.backlog.findUnique.mockResolvedValue(null);
      mockPrisma.backlog.create.mockResolvedValue(mockBacklog);

      const result = await backlogService.getOrCreateBacklog('project-1');

      expect(mockPrisma.backlog.findUnique).toHaveBeenCalled();
      expect(mockPrisma.backlog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          projectId: 'project-1',
          priorityOrder: []
        }),
        include: expect.any(Object)
      });

      expect(result).toEqual(expect.objectContaining({
        id: 'backlog-1',
        projectId: 'project-1'
      }));
    });
  });

  describe('addItemToBacklog', () => {
    const mockBacklog = {
      id: 'backlog-1',
      projectId: 'project-1',
      priorityOrder: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const mockTask = {
      id: 'task-1',
      key: 'TEST-1',
      title: 'Test Task',
      projectId: 'project-1',
      type: 'STORY',
      status: 'TODO'
    };

    const mockBacklogItem = {
      id: 'item-1',
      taskId: 'task-1',
      backlogId: 'backlog-1',
      priority: 1,
      storyPoints: 5,
      epicId: null,
      businessValue: 10,
      riskLevel: RiskLevel.MEDIUM,
      readyForSprint: false,
      acceptanceCriteria: [],
      dependencies: [],
      labels: [],
      estimatedHours: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      task: mockTask,
      epic: null
    };

    const itemData = {
      taskId: 'task-1',
      storyPoints: 5,
      businessValue: 10
    };

    it('should add item to backlog successfully', async () => {
      mockPrisma.backlog.findUnique.mockResolvedValue(mockBacklog);
      mockPrisma.task.findUnique.mkResolvedValue(mockTask);
      mockPrisma.backlogItem.findUnique.mockResolvedValue(null); // Item not already in backlog
      mockPrisma.backlogItem.findFirst.mockResolvedValue(null); // No existing items for priority calculation
      mockPrisma.backlogItem.create.mockResolvedValue(mockBacklogItem);
      mockPrisma.backlogItem.findMany.mockResolvedValue([mockBacklogItem]);
      mockPrisma.backlog.update.mockResolvedValue(mockBacklog);

      const result = await backlogService.addItemToBacklog('project-1', itemData, 'user-1');

      expect(mockPrisma.task.findUnique).toHaveBeenCalledWith({
        where: { id: 'task-1' },
        select: expect.any(Object)
      });

      expect(mockPrisma.backlogItem.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          taskId: 'task-1',
          backlogId: 'backlog-1',
          storyPoints: 5,
          businessValue: 10,
          riskLevel: RiskLevel.MEDIUM
        }),
        include: expect.any(Object)
      });

      expect(result).toEqual(expect.objectContaining({
        id: 'item-1',
        taskId: 'task-1',
        storyPoints: 5
      }));
    });

    it('should throw error if task not found', async () => {
      mockPrisma.backlog.findUnique.mockResolvedValue(mockBacklog);
      mockPrisma.task.findUnique.mockResolvedValue(null);

      await expect(
        backlogService.addItemToBacklog('project-1', itemData, 'user-1')
      ).rejects.toThrow('Task not found');
    });

    it('should throw error if task is in different project', async () => {
      const taskInDifferentProject = {
        ...mockTask,
        projectId: 'different-project'
      };

      mockPrisma.backlog.findUnique.mockResolvedValue(mockBacklog);
      mockPrisma.task.findUnique.mockResolvedValue(taskInDifferentProject);

      await expect(
        backlogService.addItemToBacklog('project-1', itemData, 'user-1')
      ).rejects.toThrow('Task must be in the same project as the backlog');
    });

    it('should throw error if task is already in backlog', async () => {
      mockPrisma.backlog.findUnique.mockResolvedValue(mockBacklog);
      mockPrisma.task.findUnique.mockResolvedValue(mockTask);
      mockPrisma.backlogItem.findUnique.mockResolvedValue(mockBacklogItem); // Item already exists

      await expect(
        backlogService.addItemToBacklog('project-1', itemData, 'user-1')
      ).rejects.toThrow('Task is already in the backlog');
    });
  });

  describe('createEpic', () => {
    const mockProject = {
      id: 'project-1',
      name: 'Test Project',
      key: 'TEST'
    };

    const mockUser = {
      id: 'user-1',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com'
    };

    const mockEpic = {
      id: 'epic-1',
      key: 'TEST-EPIC-1',
      title: 'User Authentication Epic',
      description: 'Implement complete user authentication system',
      projectId: 'project-1',
      status: EpicStatus.DRAFT,
      priority: 'HIGH',
      ownerId: 'user-1',
      startDate: new Date('2024-02-01'),
      targetDate: new Date('2024-03-01'),
      businessValue: 100,
      storyPoints: null,
      progress: 0,
      color: '#FF5722',
      labels: ['authentication', 'security'],
      createdAt: new Date(),
      updatedAt: new Date(),
      project: mockProject,
      owner: mockUser,
      backlogItems: []
    };

    const epicData = {
      title: 'User Authentication Epic',
      description: 'Implement complete user authentication system',
      projectId: 'project-1',
      priority: 'HIGH' as any,
      ownerId: 'user-1',
      startDate: new Date('2024-02-01'),
      targetDate: new Date('2024-03-01'),
      businessValue: 100,
      color: '#FF5722',
      labels: ['authentication', 'security']
    };

    it('should create epic successfully', async () => {
      mockPrisma.project.findUnique.mockResolvedValue(mockProject);
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.epic.findFirst.mockResolvedValue(null); // No existing epics for key generation
      mockPrisma.epic.create.mockResolvedValue(mockEpic);

      const result = await backlogService.createEpic(epicData, 'user-1');

      expect(mockPrisma.project.findUnique).toHaveBeenCalledWith({
        where: { id: 'project-1' }
      });

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-1' }
      });

      expect(mockPrisma.epic.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          title: 'User Authentication Epic',
          projectId: 'project-1',
          status: EpicStatus.DRAFT,
          ownerId: 'user-1'
        }),
        include: expect.any(Object)
      });

      expect(result).toEqual(expect.objectContaining({
        id: 'epic-1',
        title: 'User Authentication Epic',
        status: EpicStatus.DRAFT
      }));
    });

    it('should throw error for invalid epic data', async () => {
      const invalidEpicData = {
        ...epicData,
        title: '', // Empty title
        startDate: new Date('2024-03-01'),
        targetDate: new Date('2024-02-01') // Target before start
      };

      await expect(
        backlogService.createEpic(invalidEpicData, 'user-1')
      ).rejects.toThrow('Epic validation failed');
    });

    it('should throw error if project not found', async () => {
      mockPrisma.project.findUnique.mockResolvedValue(null);

      await expect(
        backlogService.createEpic(epicData, 'user-1')
      ).rejects.toThrow('Epic validation failed: Project not found');
    });

    it('should throw error if owner not found', async () => {
      mockPrisma.project.findUnique.mockResolvedValue(mockProject);
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(
        backlogService.createEpic(epicData, 'user-1')
      ).rejects.toThrow('Epic validation failed: Epic owner not found');
    });
  });

  describe('prioritizeItem', () => {
    const mockBacklogItem = {
      id: 'item-1',
      taskId: 'task-1',
      backlogId: 'backlog-1',
      priority: 5,
      task: { key: 'TEST-1' },
      backlog: { id: 'backlog-1' }
    };

    const prioritization = {
      itemId: 'item-1',
      newPriority: 1,
      reason: 'High business value'
    };

    it('should prioritize item successfully', async () => {
      mockPrisma.backlogItem.findUnique.mockResolvedValue(mockBacklogItem);
      
      // Mock the updateBacklogItem call
      const updatedItem = { ...mockBacklogItem, priority: 1 };
      mockPrisma.backlogItem.update.mockResolvedValue(updatedItem);
      mockPrisma.backlogItem.findMany.mockResolvedValue([updatedItem]);
      mockPrisma.backlog.update.mockResolvedValue({});

      const result = await backlogService.prioritizeItem(prioritization, 'user-1');

      expect(mockPrisma.backlogItem.findUnique).toHaveBeenCalledWith({
        where: { id: 'item-1' },
        include: expect.any(Object)
      });

      expect(result.priority).toBe(1);
    });

    it('should throw error if item not found', async () => {
      mockPrisma.backlogItem.findUnique.mockResolvedValue(null);

      await expect(
        backlogService.prioritizeItem(prioritization, 'user-1')
      ).rejects.toThrow('Backlog item not found');
    });
  });

  describe('getBacklogMetrics', () => {
    const mockBacklog = {
      id: 'backlog-1',
      projectId: 'project-1',
      priorityOrder: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const mockBacklogItems = [
      {
        id: 'item-1',
        storyPoints: 5,
        businessValue: 10,
        readyForSprint: true,
        riskLevel: RiskLevel.LOW,
        task: { status: 'DONE', storyPoints: 5 },
        epic: { id: 'epic-1', title: 'Epic 1' }
      },
      {
        id: 'item-2',
        storyPoints: 3,
        businessValue: 8,
        readyForSprint: false,
        riskLevel: RiskLevel.MEDIUM,
        task: { status: 'TODO', storyPoints: 3 },
        epic: { id: 'epic-1', title: 'Epic 1' }
      },
      {
        id: 'item-3',
        storyPoints: null,
        businessValue: 5,
        readyForSprint: true,
        riskLevel: RiskLevel.HIGH,
        task: { status: 'IN_PROGRESS', storyPoints: null },
        epic: null
      }
    ];

    it('should calculate backlog metrics correctly', async () => {
      mockPrisma.backlog.findUnique.mockResolvedValue(mockBacklog);
      mockPrisma.backlogItem.findMany.mockResolvedValue(mockBacklogItems);

      const result = await backlogService.getBacklogMetrics('project-1');

      expect(result).toEqual(expect.objectContaining({
        projectId: 'project-1',
        totalItems: 3,
        readyItems: 2,
        estimatedItems: 2, // Items with story points
        totalStoryPoints: 8, // 5 + 3
        averageStoryPoints: 4, // 8 / 2
        totalBusinessValue: 23, // 10 + 8 + 5
        averageBusinessValue: 7.67, // 23 / 3 (rounded)
        byEpic: expect.objectContaining({
          'epic-1': expect.objectContaining({
            epicName: 'Epic 1',
            itemCount: 2,
            storyPoints: 8
          })
        }),
        byRiskLevel: expect.objectContaining({
          'LOW': 1,
          'MEDIUM': 1,
          'HIGH': 1
        }),
        byStatus: expect.objectContaining({
          'DONE': 1,
          'TODO': 1,
          'IN_PROGRESS': 1
        })
      }));
    });

    it('should handle empty backlog', async () => {
      const emptyBacklog = { ...mockBacklog };
      mockPrisma.backlog.findUnique.mockResolvedValue(emptyBacklog);
      mockPrisma.backlogItem.findMany.mockResolvedValue([]);

      const result = await backlogService.getBacklogMetrics('project-1');

      expect(result).toEqual(expect.objectContaining({
        totalItems: 0,
        readyItems: 0,
        estimatedItems: 0,
        totalStoryPoints: 0,
        averageStoryPoints: 0,
        totalBusinessValue: 0,
        averageBusinessValue: 0
      }));
    });
  });

  describe('getBacklogHealth', () => {
    const mockBacklog = {
      id: 'backlog-1',
      projectId: 'project-1'
    };

    const mockHealthyItems = [
      {
        storyPoints: 5,
        readyForSprint: true,
        acceptanceCriteria: ['Criteria 1', 'Criteria 2'],
        dependencies: [],
        task: { status: 'TODO', storyPoints: 5 }
      },
      {
        storyPoints: 3,
        readyForSprint: true,
        acceptanceCriteria: ['Criteria 1'],
        dependencies: ['task-1'],
        task: { status: 'DONE', storyPoints: 3 }
      }
    ];

    it('should calculate backlog health correctly', async () => {
      mockPrisma.backlog.findUnique.mockResolvedValue(mockBacklog);
      mockPrisma.backlogItem.findMany.mockResolvedValue(mockHealthyItems);

      const result = await backlogService.getBacklogHealth('project-1');

      expect(result).toEqual(expect.objectContaining({
        projectId: 'project-1',
        readinessScore: 100, // All items ready
        estimationCoverage: 100, // All items estimated
        dependencyRisk: 50, // 1 out of 2 items has dependencies
        recommendations: expect.any(Array)
      }));

      expect(result.healthScore).toBeGreaterThan(0);
      expect(result.recommendations).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: 'DEPENDENCY',
            severity: 'MEDIUM'
          })
        ])
      );
    });

    it('should generate recommendations for poor health', async () => {
      const unhealthyItems = [
        {
          storyPoints: null, // No estimation
          readyForSprint: false, // Not ready
          acceptanceCriteria: [], // No criteria
          dependencies: ['task-1', 'task-2'], // Has dependencies
          task: { status: 'TODO', storyPoints: null }
        },
        {
          storyPoints: null,
          readyForSprint: false,
          acceptanceCriteria: [],
          dependencies: [],
          task: { status: 'TODO', storyPoints: null }
        }
      ];

      mockPrisma.backlog.findUnique.mockResolvedValue(mockBacklog);
      mockPrisma.backlogItem.findMany.mockResolvedValue(unhealthyItems);

      const result = await backlogService.getBacklogHealth('project-1');

      expect(result.readinessScore).toBe(0);
      expect(result.estimationCoverage).toBe(0);
      expect(result.recommendations).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ type: 'ESTIMATION', severity: 'HIGH' }),
          expect.objectContaining({ type: 'REFINEMENT', severity: 'HIGH' }),
          expect.objectContaining({ type: 'ACCEPTANCE_CRITERIA', severity: 'MEDIUM' })
        ])
      );
    });
  });
});

// Mock Prisma
jest.mock('@prisma/client');
const mockPrisma = {
  backlog: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  backlogItem: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  epic: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  task: {
    findUnique: jest.fn(),
  },
  project: {
    findUnique: jest.fn(),
  },
  user: {
    findUnique: jest.fn(),
  },
  auditLog: {
    create: jest.fn(),
  },
};

// Mock logger
jest.mock('../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

// Mock NotificationService
jest.mock('../services/NotificationService', () => ({
  NotificationService: jest.fn().mockImplementation(() => ({
    createNotification: jest.fn(),
  })),
}));

describe('BacklogService', () => {
  let backlogService: BacklogService;

  beforeEach(() => {
    jest.clearAllMocks();
    // Replace the actual prisma instance with our mock
    (PrismaClient as jest.Mock).mockImplementation(() => mockPrisma);
    backlogService = new BacklogService();
  });

  describe('getOrCreateBacklog', () => {
    const mockProject = {
      id: 'project-1',
      name: 'Test Project',
      key: 'TEST'
    };

    const mockBacklog = {
      id: 'backlog-1',
      projectId: 'project-1',
      priorityOrder: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      project: mockProject,
      items: []
    };

    it('should return existing backlog if it exists', async () => {
      mockPrisma.backlog.findUnique.mockResolvedValue(mockBacklog);

      const result = await backlogService.getOrCreateBacklog('project-1');

      expect(mockPrisma.backlog.findUnique).toHaveBeenCalledWith({
        where: { projectId: 'project-1' },
        include: expect.any(Object)
      });

      expect(result).toEqual(expect.objectContaining({
        id: 'backlog-1',
        projectId: 'project-1'
      }));
    });

    it('should create new backlog if it does not exist', async () => {
      mockPrisma.backlog.findUnique.mockResolvedValue(null);
      mockPrisma.backlog.create.mockResolvedValue(mockBacklog);

      const result = await backlogService.getOrCreateBacklog('project-1');

      expect(mockPrisma.backlog.findUnique).toHaveBeenCalled();
      expect(mockPrisma.backlog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          projectId: 'project-1',
          priorityOrder: []
        }),
        include: expect.any(Object)
      });

      expect(result).toEqual(expect.objectContaining({
        id: 'backlog-1',
        projectId: 'project-1'
      }));
    });
  });

  describe('addItemToBacklog', () => {
    const mockBacklog = {
      id: 'backlog-1',
      projectId: 'project-1',
      priorityOrder: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      project: {
        id: 'project-1',
        name: 'Test Project',
        key: 'TEST'
      },
      items: []
    };

    const mockTask = {
      id: 'task-1',
      key: 'TEST-1',
      title: 'Test Task',
      projectId: 'project-1',
      type: 'STORY',
      status: 'TODO'
    };

    const mockBacklogItem = {
      id: 'item-1',
      taskId: 'task-1',
      backlogId: 'backlog-1',
      priority: 1,
      storyPoints: 5,
      epicId: null,
      businessValue: 10,
      riskLevel: RiskLevel.MEDIUM,
      readyForSprint: false,
      acceptanceCriteria: [],
      dependencies: [],
      labels: [],
      estimatedHours: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      task: mockTask,
      epic: null
    };

    it('should add item to backlog successfully', async () => {
      mockPrisma.backlog.findUnique.mockResolvedValue(mockBacklog);
      mockPrisma.task.findUnique.mockResolvedValue(mockTask);
      mockPrisma.backlogItem.findUnique.mockResolvedValue(null); // Task not already in backlog
      mockPrisma.backlogItem.findFirst.mockResolvedValue(null); // No existing items for priority calculation
      mockPrisma.backlogItem.create.mockResolvedValue(mockBacklogItem);
      mockPrisma.backlogItem.findMany.mockResolvedValue([mockBacklogItem]);
      mockPrisma.backlog.update.mockResolvedValue(mockBacklog);

      const itemData = {
        taskId: 'task-1',
        storyPoints: 5,
        businessValue: 10
      };

      const result = await backlogService.addItemToBacklog('project-1', itemData, 'user-1');

      expect(mockPrisma.task.findUnique).toHaveBeenCalledWith({
        where: { id: 'task-1' },
        select: expect.any(Object)
      });

      expect(mockPrisma.backlogItem.findUnique).toHaveBeenCalledWith({
        where: { taskId: 'task-1' }
      });

      expect(mockPrisma.backlogItem.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          taskId: 'task-1',
          backlogId: 'backlog-1',
          storyPoints: 5,
          businessValue: 10,
          riskLevel: RiskLevel.MEDIUM
        }),
        include: expect.any(Object)
      });

      expect(result).toEqual(expect.objectContaining({
        id: 'item-1',
        taskId: 'task-1',
        storyPoints: 5
      }));
    });

    it('should throw error if task not found', async () => {
      mockPrisma.backlog.findUnique.mockResolvedValue(mockBacklog);
      mockPrisma.task.findUnique.mockResolvedValue(null);

      const itemData = {
        taskId: 'non-existent-task'
      };

      await expect(
        backlogService.addItemToBacklog('project-1', itemData, 'user-1')
      ).rejects.toThrow('Task not found');
    });

    it('should throw error if task is in different project', async () => {
      const taskInDifferentProject = {
        ...mockTask,
        projectId: 'different-project'
      };

      mockPrisma.backlog.findUnique.mockResolvedValue(mockBacklog);
      mockPrisma.task.findUnique.mockResolvedValue(taskInDifferentProject);

      const itemData = {
        taskId: 'task-1'
      };

      await expect(
        backlogService.addItemToBacklog('project-1', itemData, 'user-1')
      ).rejects.toThrow('Task must be in the same project as the backlog');
    });

    it('should throw error if task is already in backlog', async () => {
      mockPrisma.backlog.findUnique.mockResolvedValue(mockBacklog);
      mockPrisma.task.findUnique.mockResolvedValue(mockTask);
      mockPrisma.backlogItem.findUnique.mockResolvedValue(mockBacklogItem); // Task already in backlog

      const itemData = {
        taskId: 'task-1'
      };

      await expect(
        backlogService.addItemToBacklog('project-1', itemData, 'user-1')
      ).rejects.toThrow('Task is already in the backlog');
    });

    it('should validate epic if provided', async () => {
      const mockEpic = {
        id: 'epic-1',
        projectId: 'project-1'
      };

      mockPrisma.backlog.findUnique.mockResolvedValue(mockBacklog);
      mockPrisma.task.findUnique.mockResolvedValue(mockTask);
      mockPrisma.backlogItem.findUnique.mockResolvedValue(null);
      mockPrisma.epic.findUnique.mockResolvedValue(mockEpic);
      mockPrisma.backlogItem.findFirst.mockResolvedValue(null);
      mockPrisma.backlogItem.create.mockResolvedValue({
        ...mockBacklogItem,
        epicId: 'epic-1'
      });
      mockPrisma.backlogItem.findMany.mockResolvedValue([mockBacklogItem]);
      mockPrisma.backlog.update.mockResolvedValue(mockBacklog);

      const itemData = {
        taskId: 'task-1',
        epicId: 'epic-1'
      };

      await backlogService.addItemToBacklog('project-1', itemData, 'user-1');

      expect(mockPrisma.epic.findUnique).toHaveBeenCalledWith({
        where: { id: 'epic-1' },
        select: { id: true, projectId: true }
      });
    });

    it('should throw error if epic is in different project', async () => {
      const epicInDifferentProject = {
        id: 'epic-1',
        projectId: 'different-project'
      };

      mockPrisma.backlog.findUnique.mockResolvedValue(mockBacklog);
      mockPrisma.task.findUnique.mockResolvedValue(mockTask);
      mockPrisma.backlogItem.findUnique.mockResolvedValue(null);
      mockPrisma.epic.findUnique.mockResolvedValue(epicInDifferentProject);

      const itemData = {
        taskId: 'task-1',
        epicId: 'epic-1'
      };

      await expect(
        backlogService.addItemToBacklog('project-1', itemData, 'user-1')
      ).rejects.toThrow('Epic not found or not in the same project');
    });
  });

  describe('createEpic', () => {
    const mockProject = {
      id: 'project-1',
      name: 'Test Project',
      key: 'TEST'
    };

    const mockUser = {
      id: 'user-1',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com'
    };

    const mockEpic = {
      id: 'epic-1',
      key: 'TEST-EPIC-1',
      title: 'Test Epic',
      description: 'Epic description',
      projectId: 'project-1',
      status: EpicStatus.DRAFT,
      priority: 'HIGH',
      ownerId: 'user-1',
      startDate: new Date('2024-02-01'),
      targetDate: new Date('2024-06-01'),
      businessValue: 100,
      storyPoints: null,
      progress: 0,
      color: '#FF5722',
      labels: ['feature'],
      createdAt: new Date(),
      updatedAt: new Date(),
      project: mockProject,
      owner: mockUser,
      backlogItems: []
    };

    it('should create epic successfully', async () => {
      mockPrisma.project.findUnique.mockResolvedValue(mockProject);
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.epic.findFirst.mockResolvedValue(null); // No existing epics for key generation
      mockPrisma.epic.create.mockResolvedValue(mockEpic);

      const epicData = {
        title: 'Test Epic',
        description: 'Epic description',
        projectId: 'project-1',
        priority: 'HIGH' as any,
        ownerId: 'user-1',
        startDate: new Date('2024-02-01'),
        targetDate: new Date('2024-06-01'),
        businessValue: 100,
        color: '#FF5722',
        labels: ['feature']
      };

      const result = await backlogService.createEpic(epicData, 'user-1');

      expect(mockPrisma.project.findUnique).toHaveBeenCalledWith({
        where: { id: 'project-1' }
      });

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-1' }
      });

      expect(mockPrisma.epic.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          title: 'Test Epic',
          projectId: 'project-1',
          status: EpicStatus.DRAFT,
          ownerId: 'user-1'
        }),
        include: expect.any(Object)
      });

      expect(result).toEqual(expect.objectContaining({
        id: 'epic-1',
        title: 'Test Epic',
        status: EpicStatus.DRAFT
      }));
    });

    it('should throw error for invalid epic data', async () => {
      const invalidEpicData = {
        title: '', // Empty title
        projectId: 'project-1',
        ownerId: 'user-1'
      };

      await expect(
        backlogService.createEpic(invalidEpicData, 'user-1')
      ).rejects.toThrow('Epic validation failed');
    });

    it('should throw error if project not found', async () => {
      mockPrisma.project.findUnique.mockResolvedValue(null);

      const epicData = {
        title: 'Test Epic',
        projectId: 'non-existent-project',
        ownerId: 'user-1'
      };

      await expect(
        backlogService.createEpic(epicData, 'user-1')
      ).rejects.toThrow('Epic validation failed: Project not found');
    });

    it('should throw error if owner not found', async () => {
      mockPrisma.project.findUnique.mockResolvedValue(mockProject);
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const epicData = {
        title: 'Test Epic',
        projectId: 'project-1',
        ownerId: 'non-existent-user'
      };

      await expect(
        backlogService.createEpic(epicData, 'user-1')
      ).rejects.toThrow('Epic validation failed: Epic owner not found');
    });

    it('should validate date ranges', async () => {
      const epicDataWithInvalidDates = {
        title: 'Test Epic',
        projectId: 'project-1',
        ownerId: 'user-1',
        startDate: new Date('2024-06-01'),
        targetDate: new Date('2024-02-01') // Target before start
      };

      await expect(
        backlogService.createEpic(epicDataWithInvalidDates, 'user-1')
      ).rejects.toThrow('Epic validation failed: Epic start date must be before target date');
    });
  });

  describe('getBacklogMetrics', () => {
    const mockBacklog = {
      id: 'backlog-1',
      projectId: 'project-1',
      priorityOrder: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      project: {
        id: 'project-1',
        name: 'Test Project',
        key: 'TEST'
      },
      items: []
    };

    const mockBacklogItems = [
      {
        id: 'item-1',
        storyPoints: 5,
        businessValue: 10,
        riskLevel: RiskLevel.MEDIUM,
        readyForSprint: true,
        task: { status: 'TODO', storyPoints: 5 },
        epic: { id: 'epic-1', title: 'Epic 1' }
      },
      {
        id: 'item-2',
        storyPoints: 8,
        businessValue: 15,
        riskLevel: RiskLevel.HIGH,
        readyForSprint: false,
        task: { status: 'DONE', storyPoints: 8 },
        epic: { id: 'epic-1', title: 'Epic 1' }
      },
      {
        id: 'item-3',
        storyPoints: null,
        businessValue: 5,
        riskLevel: RiskLevel.LOW,
        readyForSprint: true,
        task: { status: 'IN_PROGRESS', storyPoints: null },
        epic: null
      }
    ];

    it('should calculate backlog metrics correctly', async () => {
      mockPrisma.backlog.findUnique.mockResolvedValue(mockBacklog);
      mockPrisma.backlogItem.findMany.mockResolvedValue(mockBacklogItems);

      const result = await backlogService.getBacklogMetrics('project-1');

      expect(result).toEqual(expect.objectContaining({
        projectId: 'project-1',
        totalItems: 3,
        readyItems: 2,
        estimatedItems: 2, // Only items with story points
        totalStoryPoints: 13, // 5 + 8 + 0
        averageStoryPoints: 6.5, // 13 / 2
        totalBusinessValue: 30, // 10 + 15 + 5
        averageBusinessValue: 10, // 30 / 3
        byEpic: {
          'epic-1': {
            epicName: 'Epic 1',
            itemCount: 2,
            storyPoints: 13,
            progress: 0
          }
        },
        byRiskLevel: {
          'MEDIUM': 1,
          'HIGH': 1,
          'LOW': 1
        },
        byStatus: {
          'TODO': 1,
          'DONE': 1,
          'IN_PROGRESS': 1
        }
      }));

      expect(result.velocityProjection).toBeDefined();
    });

    it('should handle empty backlog', async () => {
      mockPrisma.backlog.findUnique.mockResolvedValue(mockBacklog);
      mockPrisma.backlogItem.findMany.mockResolvedValue([]);

      const result = await backlogService.getBacklogMetrics('project-1');

      expect(result).toEqual(expect.objectContaining({
        totalItems: 0,
        readyItems: 0,
        estimatedItems: 0,
        totalStoryPoints: 0,
        averageStoryPoints: 0,
        totalBusinessValue: 0,
        averageBusinessValue: 0
      }));
    });
  });
});
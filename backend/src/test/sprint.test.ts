import { SprintService } from '../services/SprintService';
import { PrismaClient, SprintStatus } from '@prisma/client';

// Mock Prisma
jest.mock('@prisma/client');
const mockPrisma = {
  sprint: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
    groupBy: jest.fn(),
  },
  sprintTask: {
    create: jest.fn(),
    findUnique: jest.fn(),
    deleteMany: jest.fn(),
  },
  project: {
    findUnique: jest.fn(),
  },
  task: {
    findUnique: jest.fn(),
  },
  projectMember: {
    findMany: jest.fn(),
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

describe('SprintService', () => {
  let sprintService: SprintService;

  beforeEach(() => {
    jest.clearAllMocks();
    // Replace the actual prisma instance with our mock
    (PrismaClient as jest.Mock).mockImplementation(() => mockPrisma);
    sprintService = new SprintService();
  });

  describe('createSprint', () => {
    const mockProject = {
      id: 'project-1',
      name: 'Test Project',
      key: 'TEST'
    };

    const mockSprintData = {
      name: 'Sprint 1',
      goal: 'Complete user authentication',
      projectId: 'project-1',
      startDate: new Date('2024-02-01'),
      endDate: new Date('2024-02-14'),
      capacity: 80
    };

    const mockCreatedSprint = {
      id: 'sprint-1',
      name: 'Sprint 1',
      goal: 'Complete user authentication',
      projectId: 'project-1',
      startDate: new Date('2024-02-01'),
      endDate: new Date('2024-02-14'),
      status: SprintStatus.PLANNING,
      capacity: 80,
      velocity: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      project: mockProject,
      sprintTasks: []
    };

    it('should create a sprint successfully', async () => {
      mockPrisma.project.findUnique.mockResolvedValue(mockProject);
      mockPrisma.sprint.findFirst.mockResolvedValue(null); // No overlapping sprints
      mockPrisma.sprint.create.mockResolvedValue(mockCreatedSprint);

      const result = await sprintService.createSprint(mockSprintData, 'user-1');

      expect(mockPrisma.project.findUnique).toHaveBeenCalledWith({
        where: { id: 'project-1' }
      });

      expect(mockPrisma.sprint.findFirst).toHaveBeenCalledWith({
        where: expect.objectContaining({
          projectId: 'project-1',
          status: { in: [SprintStatus.PLANNING, SprintStatus.ACTIVE] }
        }),
        select: expect.any(Object)
      });

      expect(mockPrisma.sprint.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: 'Sprint 1',
          goal: 'Complete user authentication',
          projectId: 'project-1',
          status: SprintStatus.PLANNING
        }),
        include: expect.any(Object)
      });

      expect(result).toEqual(expect.objectContaining({
        id: 'sprint-1',
        name: 'Sprint 1',
        status: SprintStatus.PLANNING
      }));
    });

    it('should throw error for invalid sprint data', async () => {
      const invalidSprintData = {
        ...mockSprintData,
        name: '', // Empty name
        startDate: new Date('2024-02-14'),
        endDate: new Date('2024-02-01') // End before start
      };

      await expect(
        sprintService.createSprint(invalidSprintData, 'user-1')
      ).rejects.toThrow('Sprint validation failed');
    });

    it('should throw error for overlapping sprints', async () => {
      const overlappingSprint = {
        id: 'existing-sprint',
        name: 'Existing Sprint',
        startDate: new Date('2024-01-28'),
        endDate: new Date('2024-02-10')
      };

      mockPrisma.project.findUnique.mockResolvedValue(mockProject);
      mockPrisma.sprint.findFirst.mockResolvedValue(overlappingSprint);

      await expect(
        sprintService.createSprint(mockSprintData, 'user-1')
      ).rejects.toThrow('Sprint dates overlap with existing sprint: Existing Sprint');
    });

    it('should throw error if project not found', async () => {
      mockPrisma.project.findUnique.mockResolvedValue(null);

      await expect(
        sprintService.createSprint(mockSprintData, 'user-1')
      ).rejects.toThrow('Sprint validation failed: Project not found');
    });
  });

  describe('getSprint', () => {
    const mockSprint = {
      id: 'sprint-1',
      name: 'Sprint 1',
      goal: 'Complete user authentication',
      projectId: 'project-1',
      startDate: new Date('2024-02-01'),
      endDate: new Date('2024-02-14'),
      status: SprintStatus.ACTIVE,
      capacity: 80,
      velocity: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      project: {
        id: 'project-1',
        name: 'Test Project',
        key: 'TEST'
      },
      sprintTasks: []
    };

    it('should get sprint successfully', async () => {
      mockPrisma.sprint.findUnique.mockResolvedValue(mockSprint);

      const result = await sprintService.getSprint('sprint-1');

      expect(mockPrisma.sprint.findUnique).toHaveBeenCalledWith({
        where: { id: 'sprint-1' },
        include: expect.any(Object)
      });

      expect(result).toEqual(expect.objectContaining({
        id: 'sprint-1',
        name: 'Sprint 1',
        status: SprintStatus.ACTIVE
      }));
    });

    it('should return null if sprint not found', async () => {
      mockPrisma.sprint.findUnique.mockResolvedValue(null);

      const result = await sprintService.getSprint('non-existent-sprint');

      expect(result).toBeNull();
    });

    it('should include tasks when requested', async () => {
      mockPrisma.sprint.findUnique.mockResolvedValue(mockSprint);

      await sprintService.getSprint('sprint-1', { includeTasks: true });

      expect(mockPrisma.sprint.findUnique).toHaveBeenCalledWith({
        where: { id: 'sprint-1' },
        include: expect.objectContaining({
          sprintTasks: expect.any(Object)
        })
      });
    });
  });

  describe('addTaskToSprint', () => {
    const mockSprint = {
      id: 'sprint-1',
      name: 'Sprint 1',
      projectId: 'project-1',
      status: SprintStatus.PLANNING
    };

    const mockTask = {
      id: 'task-1',
      key: 'TEST-1',
      title: 'Test Task',
      projectId: 'project-1',
      type: 'STORY',
      status: 'TODO',
      priority: 'MEDIUM',
      assigneeId: 'user-1',
      storyPoints: 5,
      estimatedHours: 8,
      loggedHours: 0,
      remainingHours: 8
    };

    const mockSprintTask = {
      id: 'sprint-task-1',
      sprintId: 'sprint-1',
      taskId: 'task-1',
      addedAt: new Date()
    };

    it('should add task to sprint successfully', async () => {
      mockPrisma.sprint.findUnique.mockResolvedValue(mockSprint);
      mockPrisma.task.findUnique.mockResolvedValue(mockTask);
      mockPrisma.sprintTask.findUnique.mockResolvedValue(null); // Task not already in sprint
      mockPrisma.sprintTask.create.mockResolvedValue(mockSprintTask);

      const result = await sprintService.addTaskToSprint('sprint-1', 'task-1', 'user-1');

      expect(mockPrisma.sprintTask.create).toHaveBeenCalledWith({
        data: {
          sprintId: 'sprint-1',
          taskId: 'task-1',
          addedAt: expect.any(Date)
        }
      });

      expect(result).toEqual(expect.objectContaining({
        id: 'sprint-task-1',
        sprintId: 'sprint-1',
        taskId: 'task-1',
        task: mockTask
      }));
    });

    it('should throw error if sprint not found', async () => {
      mockPrisma.sprint.findUnique.mockResolvedValue(null);

      await expect(
        sprintService.addTaskToSprint('non-existent-sprint', 'task-1', 'user-1')
      ).rejects.toThrow('Sprint not found');
    });

    it('should throw error if task not found', async () => {
      mockPrisma.sprint.findUnique.mockResolvedValue(mockSprint);
      mockPrisma.task.findUnique.mockResolvedValue(null);

      await expect(
        sprintService.addTaskToSprint('sprint-1', 'non-existent-task', 'user-1')
      ).rejects.toThrow('Task not found');
    });

    it('should throw error if task is in different project', async () => {
      const taskInDifferentProject = {
        ...mockTask,
        projectId: 'different-project'
      };

      mockPrisma.sprint.findUnique.mockResolvedValue(mockSprint);
      mockPrisma.task.findUnique.mockResolvedValue(taskInDifferentProject);

      await expect(
        sprintService.addTaskToSprint('sprint-1', 'task-1', 'user-1')
      ).rejects.toThrow('Task must be in the same project as the sprint');
    });

    it('should throw error if task is already in sprint', async () => {
      mockPrisma.sprint.findUnique.mockResolvedValue(mockSprint);
      mockPrisma.task.findUnique.mockResolvedValue(mockTask);
      mockPrisma.sprintTask.findUnique.mockResolvedValue(mockSprintTask); // Task already in sprint

      await expect(
        sprintService.addTaskToSprint('sprint-1', 'task-1', 'user-1')
      ).rejects.toThrow('Task is already in this sprint');
    });

    it('should throw error if sprint is completed', async () => {
      const completedSprint = {
        ...mockSprint,
        status: SprintStatus.COMPLETED
      };

      mockPrisma.sprint.findUnique.mockResolvedValue(completedSprint);

      await expect(
        sprintService.addTaskToSprint('sprint-1', 'task-1', 'user-1')
      ).rejects.toThrow('Cannot add tasks to a completed or cancelled sprint');
    });
  });

  describe('startSprint', () => {
    const mockSprint = {
      id: 'sprint-1',
      name: 'Sprint 1',
      projectId: 'project-1',
      status: SprintStatus.PLANNING,
      startDate: new Date('2024-02-01'),
      endDate: new Date('2024-02-14')
    };

    it('should start sprint successfully', async () => {
      mockPrisma.sprint.findUnique.mockResolvedValue(mockSprint);
      mockPrisma.sprint.findFirst.mockResolvedValue(null); // No active sprint in project
      
      const updatedSprint = {
        ...mockSprint,
        status: SprintStatus.ACTIVE
      };
      mockPrisma.sprint.update.mockResolvedValue(updatedSprint);

      const result = await sprintService.startSprint('sprint-1', 'user-1');

      expect(mockPrisma.sprint.findFirst).toHaveBeenCalledWith({
        where: {
          projectId: 'project-1',
          status: SprintStatus.ACTIVE
        }
      });

      expect(result.status).toBe(SprintStatus.ACTIVE);
    });

    it('should throw error if sprint not found', async () => {
      mockPrisma.sprint.findUnique.mockResolvedValue(null);

      await expect(
        sprintService.startSprint('non-existent-sprint', 'user-1')
      ).rejects.toThrow('Sprint not found');
    });

    it('should throw error if sprint is not in planning status', async () => {
      const activeSprint = {
        ...mockSprint,
        status: SprintStatus.ACTIVE
      };

      mockPrisma.sprint.findUnique.mockResolvedValue(activeSprint);

      await expect(
        sprintService.startSprint('sprint-1', 'user-1')
      ).rejects.toThrow('Only sprints in planning status can be started');
    });

    it('should throw error if there is already an active sprint', async () => {
      const existingActiveSprint = {
        id: 'other-sprint',
        projectId: 'project-1',
        status: SprintStatus.ACTIVE
      };

      mockPrisma.sprint.findUnique.mockResolvedValue(mockSprint);
      mockPrisma.sprint.findFirst.mockResolvedValue(existingActiveSprint);

      await expect(
        sprintService.startSprint('sprint-1', 'user-1')
      ).rejects.toThrow('There is already an active sprint in this project');
    });
  });

  describe('getSprintMetrics', () => {
    const mockSprintWithTasks = {
      id: 'sprint-1',
      name: 'Sprint 1',
      projectId: 'project-1',
      startDate: new Date('2024-02-01'),
      endDate: new Date('2024-02-14'),
      status: SprintStatus.ACTIVE,
      tasks: [
        {
          id: 'st-1',
          sprintId: 'sprint-1',
          taskId: 'task-1',
          addedAt: new Date(),
          task: {
            id: 'task-1',
            key: 'TEST-1',
            title: 'Task 1',
            status: 'DONE',
            storyPoints: 5,
            estimatedHours: 8,
            loggedHours: 8,
            remainingHours: 0
          }
        },
        {
          id: 'st-2',
          sprintId: 'sprint-1',
          taskId: 'task-2',
          addedAt: new Date(),
          task: {
            id: 'task-2',
            key: 'TEST-2',
            title: 'Task 2',
            status: 'IN_PROGRESS',
            storyPoints: 3,
            estimatedHours: 5,
            loggedHours: 2,
            remainingHours: 3
          }
        }
      ]
    };

    it('should calculate sprint metrics correctly', async () => {
      mockPrisma.sprint.findUnique.mockResolvedValue(mockSprintWithTasks);

      const result = await sprintService.getSprintMetrics('sprint-1');

      expect(result).toEqual(expect.objectContaining({
        sprintId: 'sprint-1',
        totalTasks: 2,
        completedTasks: 1,
        inProgressTasks: 1,
        todoTasks: 0,
        totalStoryPoints: 8,
        completedStoryPoints: 5,
        totalEstimatedHours: 13,
        totalLoggedHours: 10,
        totalRemainingHours: 3,
        completionPercentage: 50,
        velocityPoints: 5,
        velocityHours: 10
      }));

      expect(result.burndownData).toBeDefined();
      expect(result.dailyProgress).toBeDefined();
    });

    it('should handle sprint with no tasks', async () => {
      const sprintWithNoTasks = {
        ...mockSprintWithTasks,
        tasks: []
      };

      mockPrisma.sprint.findUnique.mockResolvedValue(sprintWithNoTasks);

      const result = await sprintService.getSprintMetrics('sprint-1');

      expect(result).toEqual(expect.objectContaining({
        totalTasks: 0,
        completedTasks: 0,
        inProgressTasks: 0,
        todoTasks: 0,
        totalStoryPoints: 0,
        completedStoryPoints: 0,
        completionPercentage: 0
      }));
    });
  });

  describe('getVelocityData', () => {
    const mockCompletedSprints = [
      {
        id: 'sprint-1',
        name: 'Sprint 1',
        velocity: 15,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-14'),
        sprintTasks: [
          {
            task: { storyPoints: 5, status: 'DONE' }
          },
          {
            task: { storyPoints: 8, status: 'DONE' }
          },
          {
            task: { storyPoints: 2, status: 'DONE' }
          }
        ]
      },
      {
        id: 'sprint-2',
        name: 'Sprint 2',
        velocity: 12,
        startDate: new Date('2024-01-15'),
        endDate: new Date('2024-01-28'),
        sprintTasks: [
          {
            task: { storyPoints: 3, status: 'DONE' }
          },
          {
            task: { storyPoints: 5, status: 'DONE' }
          },
          {
            task: { storyPoints: 4, status: 'DONE' }
          }
        ]
      }
    ];

    it('should calculate velocity data correctly', async () => {
      mockPrisma.sprint.findMany.mockResolvedValue(mockCompletedSprints);

      const result = await sprintService.getVelocityData('project-1');

      expect(result).toEqual(expect.objectContaining({
        projectId: 'project-1',
        averageVelocity: 13.5, // (15 + 12) / 2
        lastSprintVelocity: 15,
        velocityTrend: 'STABLE',
        historicalVelocity: expect.arrayContaining([
          expect.objectContaining({
            sprintId: 'sprint-1',
            sprintName: 'Sprint 1',
            velocity: 15,
            completedStoryPoints: 15
          })
        ])
      }));
    });

    it('should handle project with no completed sprints', async () => {
      mockPrisma.sprint.findMany.mockResolvedValue([]);

      const result = await sprintService.getVelocityData('project-1');

      expect(result).toEqual(expect.objectContaining({
        projectId: 'project-1',
        averageVelocity: 0,
        lastSprintVelocity: undefined,
        velocityTrend: 'STABLE',
        historicalVelocity: []
      }));
    });
  });
});
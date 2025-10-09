import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import app from '@/server';
import { ProjectService } from '@/services/ProjectService';
import { 
  ProjectStatus, 
  ProjectPriority, 
  ProjectMethodology, 
  ProjectMemberRole 
} from '@/types/project.types';

// Mock Prisma client
const mockPrisma = {
  project: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
  },
  projectMember: {
    findUnique: jest.fn(),
    create: jest.fn(),
    createMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  projectActivity: {
    create: jest.fn(),
  },
  task: {
    groupBy: jest.fn(),
  },
  timeEntry: {
    aggregate: jest.fn(),
  },
  $transaction: jest.fn(),
} as unknown as PrismaClient;

// Mock Redis cache
const mockCache = {
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
};

jest.mock('@/config/database', () => ({
  prisma: mockPrisma,
}));

jest.mock('@/config/redis', () => ({
  CacheService: {
    getInstance: () => mockCache,
  },
}));

describe('Project Management System', () => {
  let projectService: ProjectService;

  const mockAdminUser = {
    id: 'admin-123',
    email: 'admin@example.com',
    firstName: 'Admin',
    lastName: 'User',
    role: 'ADMIN',
  };

  const mockProjectManagerUser = {
    id: 'pm-123',
    email: 'pm@example.com',
    firstName: 'Project',
    lastName: 'Manager',
    role: 'PROJECT_MANAGER',
  };

  const mockProject = {
    id: 'project-123',
    name: 'Test Project',
    description: 'A test project',
    key: 'TEST',
    status: ProjectStatus.ACTIVE,
    priority: ProjectPriority.HIGH,
    methodology: ProjectMethodology.AGILE,
    ownerId: 'pm-123',
    teamId: null,
    settings: {
      workflowStatuses: [],
      notifyOnTaskCreation: true,
    },
    customFields: {},
    isArchived: false,
    isTemplate: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const generateToken = (user: any) => {
    return jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: '1h' }
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
    projectService = new ProjectService(mockPrisma);
    
    process.env.JWT_SECRET = 'test-secret-key-for-testing-purposes-only';
    
    mockCache.get.mockResolvedValue(null);
    mockCache.set.mockResolvedValue(true);
    mockCache.del.mockResolvedValue(true);
  });

  describe('ProjectService', () => {
    describe('createProject', () => {
      it('should create a project successfully', async () => {
        const projectData = {
          name: 'New Project',
          description: 'A new project',
          methodology: ProjectMethodology.AGILE,
        };

        mockPrisma.project.findUnique.mockResolvedValue(null);
        mockPrisma.$transaction.mockImplementation(async (callback) => {
          return callback({
            project: {
              create: jest.fn().mockResolvedValue({
                ...mockProject,
                name: projectData.name,
                description: projectData.description,
              }),
            },
            projectMember: {
              create: jest.fn().mockResolvedValue({}),
              createMany: jest.fn().mockResolvedValue({}),
            },
          });
        });

        const result = await projectService.createProject(projectData, 'pm-123');

        expect(result.name).toBe(projectData.name);
        expect(result.methodology).toBe(projectData.methodology);
      });
    });
  });
});
import request from 'supertest';
import { PrismaClient, UserRole } from '@prisma/client';
import jwt from 'jsonwebtoken';
import app from '@/server';

// Mock Prisma client
const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    update: jest.fn(),
    findMany: jest.fn(),
  },
  permission: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    findMany: jest.fn(),
  },
  projectMember: {
    findUnique: jest.fn(),
  },
  teamMember: {
    findUnique: jest.fn(),
  },
  project: {
    findUnique: jest.fn(),
  },
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

describe('RBAC Integration Tests', () => {
  const users = {
    admin: {
      id: 'admin-123',
      email: 'admin@example.com',
      firstName: 'Admin',
      lastName: 'User',
      role: UserRole.ADMIN,
      isActive: true,
      userPermissions: [],
      projectMembers: [],
      teamMembers: [],
    },
    projectManager: {
      id: 'pm-123',
      email: 'pm@example.com',
      firstName: 'Project',
      lastName: 'Manager',
      role: UserRole.PROJECT_MANAGER,
      isActive: true,
      userPermissions: [],
      projectMembers: [],
      teamMembers: [],
    },
    teamLead: {
      id: 'tl-123',
      email: 'tl@example.com',
      firstName: 'Team',
      lastName: 'Lead',
      role: UserRole.TEAM_LEAD,
      isActive: true,
      userPermissions: [],
      projectMembers: [],
      teamMembers: [],
    },
    developer: {
      id: 'dev-123',
      email: 'dev@example.com',
      firstName: 'Developer',
      lastName: 'User',
      role: UserRole.DEVELOPER,
      isActive: true,
      userPermissions: [],
      projectMembers: [],
      teamMembers: [],
    },
    viewer: {
      id: 'viewer-123',
      email: 'viewer@example.com',
      firstName: 'Viewer',
      lastName: 'User',
      role: UserRole.VIEWER,
      isActive: true,
      userPermissions: [],
      projectMembers: [],
      teamMembers: [],
    },
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
    
    // Set up environment variables
    process.env.JWT_SECRET = 'test-secret-key-for-testing-purposes-only';
    process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-key-for-testing';
    
    // Default cache behavior
    mockCache.get.mockResolvedValue(null);
    mockCache.set.mockResolvedValue(true);
    mockCache.del.mockResolvedValue(true);
  });

  describe('Role-based Access Control Matrix', () => {
    const testCases = [
      // Admin permissions
      {
        role: 'admin',
        endpoint: 'POST /api/permissions/grant',
        payload: { userId: 'dev-123', resource: 'projects', actions: ['create'] },
        expectedStatus: 200,
        description: 'Admin can grant permissions',
      },
      {
        role: 'admin',
        endpoint: 'PUT /api/permissions/users/dev-123/role',
        payload: { role: UserRole.TEAM_LEAD },
        expectedStatus: 200,
        description: 'Admin can change user roles',
      },
      
      // Project Manager permissions
      {
        role: 'projectManager',
        endpoint: 'POST /api/permissions/grant',
        payload: { userId: 'dev-123', resource: 'projects', actions: ['create'] },
        expectedStatus: 403,
        description: 'Project Manager cannot grant permissions',
      },
      {
        role: 'projectManager',
        endpoint: 'GET /api/permissions/me',
        payload: {},
        expectedStatus: 200,
        description: 'Project Manager can view own permissions',
      },
      
      // Team Lead permissions
      {
        role: 'teamLead',
        endpoint: 'PUT /api/permissions/users/dev-123/role',
        payload: { role: UserRole.DEVELOPER },
        expectedStatus: 403,
        description: 'Team Lead cannot change user roles',
      },
      {
        role: 'teamLead',
        endpoint: 'GET /api/permissions/roles',
        payload: {},
        expectedStatus: 200,
        description: 'Team Lead can view role information',
      },
      
      // Developer permissions
      {
        role: 'developer',
        endpoint: 'POST /api/permissions/grant',
        payload: { userId: 'dev-123', resource: 'projects', actions: ['create'] },
        expectedStatus: 403,
        description: 'Developer cannot grant permissions',
      },
      {
        role: 'developer',
        endpoint: 'GET /api/permissions/me',
        payload: {},
        expectedStatus: 200,
        description: 'Developer can view own permissions',
      },
      
      // Viewer permissions
      {
        role: 'viewer',
        endpoint: 'POST /api/permissions/grant',
        payload: { userId: 'dev-123', resource: 'projects', actions: ['create'] },
        expectedStatus: 403,
        description: 'Viewer cannot grant permissions',
      },
      {
        role: 'viewer',
        endpoint: 'GET /api/permissions/matrix',
        payload: {},
        expectedStatus: 200,
        description: 'Viewer can view permission matrix',
      },
    ];

    testCases.forEach(({ role, endpoint, payload, expectedStatus, description }) => {
      it(description, async () => {
        const user = users[role as keyof typeof users];
        const token = generateToken(user);
        
        // Mock user lookup
        mockPrisma.user.findUnique.mockResolvedValue(user);
        
        // Mock permission operations based on endpoint
        if (endpoint.includes('grant')) {
          mockPrisma.permission.findUnique.mockResolvedValue(null);
          mockPrisma.permission.create.mockResolvedValue({
            id: 'perm-1',
            userId: payload.userId,
            resource: payload.resource,
            actions: payload.actions,
          });
        }
        
        if (endpoint.includes('role')) {
          mockPrisma.user.update.mockResolvedValue({
            ...user,
            role: payload.role,
          });
        }

        const [method, path] = endpoint.split(' ');
        let response;

        switch (method) {
          case 'GET':
            response = await request(app)
              .get(path)
              .set('Authorization', `Bearer ${token}`);
            break;
          case 'POST':
            response = await request(app)
              .post(path)
              .set('Authorization', `Bearer ${token}`)
              .send(payload);
            break;
          case 'PUT':
            response = await request(app)
              .put(path)
              .set('Authorization', `Bearer ${token}`)
              .send(payload);
            break;
          default:
            throw new Error(`Unsupported method: ${method}`);
        }

        expect(response.status).toBe(expectedStatus);
        
        if (expectedStatus === 200) {
          expect(response.body.success).toBe(true);
        } else if (expectedStatus === 403) {
          expect(response.body.success).toBe(false);
        }
      });
    });
  });

  describe('Permission Inheritance and Hierarchy', () => {
    it('should respect role hierarchy for permissions', async () => {
      const testPermissions = [
        { resource: 'users', action: 'create', roles: [UserRole.ADMIN] },
        { resource: 'projects', action: 'create', roles: [UserRole.ADMIN, UserRole.PROJECT_MANAGER] },
        { resource: 'tasks', action: 'read', roles: [UserRole.ADMIN, UserRole.PROJECT_MANAGER, UserRole.TEAM_LEAD, UserRole.DEVELOPER] },
        { resource: 'reports', action: 'read', roles: [UserRole.ADMIN, UserRole.PROJECT_MANAGER, UserRole.TEAM_LEAD, UserRole.DEVELOPER, UserRole.VIEWER] },
      ];

      for (const permission of testPermissions) {
        for (const [roleName, user] of Object.entries(users)) {
          const token = generateToken(user);
          mockPrisma.user.findUnique.mockResolvedValue(user);

          const response = await request(app)
            .get('/api/permissions/matrix')
            .set('Authorization', `Bearer ${token}`)
            .expect(200);

          const rolePermissions = response.body.data[user.role];
          const hasPermission = rolePermissions.includes(`${permission.resource}:${permission.action}`);
          const shouldHavePermission = permission.roles.includes(user.role);

          expect(hasPermission).toBe(shouldHavePermission);
        }
      }
    });
  });

  describe('Custom Permission Management', () => {
    it('should allow granting custom permissions to users', async () => {
      const adminToken = generateToken(users.admin);
      
      mockPrisma.user.findUnique.mockResolvedValue(users.admin);
      mockPrisma.permission.findUnique.mockResolvedValue(null);
      mockPrisma.permission.create.mockResolvedValue({
        id: 'perm-1',
        userId: 'dev-123',
        resource: 'projects',
        actions: ['create'],
      });

      const response = await request(app)
        .post('/api/permissions/grant')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          userId: 'dev-123',
          resource: 'projects',
          actions: ['create'],
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(mockPrisma.permission.create).toHaveBeenCalledWith({
        data: {
          userId: 'dev-123',
          resource: 'projects',
          actions: ['create'],
        },
      });
    });

    it('should allow revoking custom permissions from users', async () => {
      const adminToken = generateToken(users.admin);
      
      mockPrisma.user.findUnique.mockResolvedValue(users.admin);
      mockPrisma.permission.findUnique.mockResolvedValue({
        id: 'perm-1',
        userId: 'dev-123',
        resource: 'projects',
        actions: ['create', 'update'],
      });
      mockPrisma.permission.update.mockResolvedValue({
        id: 'perm-1',
        userId: 'dev-123',
        resource: 'projects',
        actions: ['update'],
      });

      const response = await request(app)
        .post('/api/permissions/revoke')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          userId: 'dev-123',
          resource: 'projects',
          actions: ['create'],
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(mockPrisma.permission.update).toHaveBeenCalledWith({
        where: { id: 'perm-1' },
        data: { actions: ['update'] },
      });
    });
  });

  describe('Bulk Permission Operations', () => {
    it('should allow bulk granting permissions to multiple users', async () => {
      const adminToken = generateToken(users.admin);
      
      mockPrisma.user.findUnique.mockResolvedValue(users.admin);
      mockPrisma.permission.findUnique.mockResolvedValue(null);
      mockPrisma.permission.create.mockResolvedValue({
        id: 'perm-1',
        userId: 'dev-123',
        resource: 'projects',
        actions: ['read'],
      });

      const response = await request(app)
        .post('/api/permissions/bulk-grant')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          userIds: ['dev-123', 'tl-123'],
          resource: 'projects',
          actions: ['read'],
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('2 users');
    });
  });

  describe('Permission Validation and Error Handling', () => {
    it('should validate permission grant request format', async () => {
      const adminToken = generateToken(users.admin);
      
      mockPrisma.user.findUnique.mockResolvedValue(users.admin);

      // Invalid user ID format
      const response1 = await request(app)
        .post('/api/permissions/grant')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          userId: 'invalid-id',
          resource: 'projects',
          actions: ['create'],
        })
        .expect(400);

      expect(response1.body.success).toBe(false);

      // Invalid resource format
      const response2 = await request(app)
        .post('/api/permissions/grant')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          userId: 'dev-123',
          resource: '123invalid',
          actions: ['create'],
        })
        .expect(400);

      expect(response2.body.success).toBe(false);

      // Empty actions array
      const response3 = await request(app)
        .post('/api/permissions/grant')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          userId: 'dev-123',
          resource: 'projects',
          actions: [],
        })
        .expect(400);

      expect(response3.body.success).toBe(false);
    });

    it('should validate role change requests', async () => {
      const adminToken = generateToken(users.admin);
      
      mockPrisma.user.findUnique.mockResolvedValue(users.admin);

      // Invalid role
      const response = await request(app)
        .put('/api/permissions/users/dev-123/role')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          role: 'INVALID_ROLE',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Permission Caching', () => {
    it('should cache user permissions for performance', async () => {
      const developerToken = generateToken(users.developer);
      
      // First request - cache miss
      mockCache.get.mockResolvedValueOnce(null);
      mockPrisma.user.findUnique.mockResolvedValue(users.developer);
      mockCache.set.mockResolvedValue(true);

      const response1 = await request(app)
        .get('/api/permissions/me')
        .set('Authorization', `Bearer ${developerToken}`)
        .expect(200);

      expect(response1.body.success).toBe(true);
      expect(mockCache.set).toHaveBeenCalled();

      // Second request - cache hit
      const cachedPermissions = {
        userId: 'dev-123',
        role: UserRole.DEVELOPER,
        permissions: [],
        contextualPermissions: { projects: {}, teams: {} },
      };
      
      mockCache.get.mockResolvedValueOnce(cachedPermissions);

      const response2 = await request(app)
        .get('/api/permissions/me')
        .set('Authorization', `Bearer ${developerToken}`)
        .expect(200);

      expect(response2.body.success).toBe(true);
      expect(mockPrisma.user.findUnique).toHaveBeenCalledTimes(1); // Should not be called again
    });

    it('should invalidate cache when permissions change', async () => {
      const adminToken = generateToken(users.admin);
      
      mockPrisma.user.findUnique.mockResolvedValue(users.admin);
      mockPrisma.permission.findUnique.mockResolvedValue(null);
      mockPrisma.permission.create.mockResolvedValue({
        id: 'perm-1',
        userId: 'dev-123',
        resource: 'projects',
        actions: ['create'],
      });

      const response = await request(app)
        .post('/api/permissions/grant')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          userId: 'dev-123',
          resource: 'projects',
          actions: ['create'],
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(mockCache.del).toHaveBeenCalledWith('user_permissions:dev-123');
    });
  });
});
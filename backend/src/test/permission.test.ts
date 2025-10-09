import request from 'supertest';
import { PrismaClient, UserRole } from '@prisma/client';
import jwt from 'jsonwebtoken';
import app from '@/server';
import { PermissionService } from '@/services/PermissionService';

// Mock Prisma client
const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    update: jest.fn(),
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

describe('Permission System', () => {
  let permissionService: PermissionService;

  const mockAdminUser = {
    id: 'admin-123',
    email: 'admin@example.com',
    firstName: 'Admin',
    lastName: 'User',
    role: UserRole.ADMIN,
    isActive: true,
    userPermissions: [],
    projectMembers: [],
    teamMembers: [],
  };

  const mockDeveloperUser = {
    id: 'dev-123',
    email: 'dev@example.com',
    firstName: 'Developer',
    lastName: 'User',
    role: UserRole.DEVELOPER,
    isActive: true,
    userPermissions: [],
    projectMembers: [],
    teamMembers: [],
  };

  const mockProjectManagerUser = {
    id: 'pm-123',
    email: 'pm@example.com',
    firstName: 'Project',
    lastName: 'Manager',
    role: UserRole.PROJECT_MANAGER,
    isActive: true,
    userPermissions: [],
    projectMembers: [],
    teamMembers: [],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    permissionService = new PermissionService(mockPrisma);
    
    // Set up environment variables
    process.env.JWT_SECRET = 'test-secret-key-for-testing-purposes-only';\n    process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-key-for-testing';
  });

  describe('PermissionService', () => {
    describe('hasPermission', () => {
      it('should grant all permissions to admin users', async () => {
        mockCache.get.mockResolvedValue(null);
        mockPrisma.user.findUnique.mockResolvedValue(mockAdminUser);
        mockCache.set.mockResolvedValue(true);

        const hasPermission = await permissionService.hasPermission('admin-123', {
          resource: 'projects',
          action: 'delete',
        });

        expect(hasPermission).toBe(true);
      });

      it('should check role-based permissions for non-admin users', async () => {
        mockCache.get.mockResolvedValue(null);
        mockPrisma.user.findUnique.mockResolvedValue(mockDeveloperUser);
        mockCache.set.mockResolvedValue(true);

        // Developer should have read access to projects
        const hasReadPermission = await permissionService.hasPermission('dev-123', {
          resource: 'projects',
          action: 'read',
        });

        // Developer should NOT have delete access to projects
        const hasDeletePermission = await permissionService.hasPermission('dev-123', {
          resource: 'projects',
          action: 'delete',
        });

        expect(hasReadPermission).toBe(true);
        expect(hasDeletePermission).toBe(false);
      });

      it('should check custom user permissions', async () => {
        const userWithCustomPermissions = {
          ...mockDeveloperUser,
          userPermissions: [
            {
              id: 'perm-1',
              userId: 'dev-123',
              resource: 'projects',
              actions: ['create', 'update'],
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          ],
        };

        mockCache.get.mockResolvedValue(null);
        mockPrisma.user.findUnique.mockResolvedValue(userWithCustomPermissions);
        mockCache.set.mockResolvedValue(true);

        const hasCreatePermission = await permissionService.hasPermission('dev-123', {
          resource: 'projects',
          action: 'create',
        });

        expect(hasCreatePermission).toBe(true);
      });

      it('should check contextual permissions for project membership', async () => {
        mockCache.get.mockResolvedValue(null);
        mockPrisma.user.findUnique.mockResolvedValue(mockDeveloperUser);
        mockCache.set.mockResolvedValue(true);

        // Mock project membership
        mockPrisma.projectMember.findUnique.mockResolvedValue({
          projectId: 'project-123',
          userId: 'dev-123',
          role: 'MEMBER',
        });

        const hasPermission = await permissionService.hasPermission('dev-123', {
          resource: 'projects',
          action: 'read',
          context: { projectId: 'project-123' },
        });

        expect(hasPermission).toBe(true);
      });
    });

    describe('grantPermission', () => {
      it('should grant new permission to user', async () => {
        mockPrisma.permission.findUnique.mockResolvedValue(null);
        mockPrisma.permission.create.mockResolvedValue({
          id: 'perm-1',
          userId: 'dev-123',
          resource: 'projects',
          actions: ['create'],
        });
        mockCache.del.mockResolvedValue(true);

        await permissionService.grantPermission('dev-123', 'projects', ['create']);

        expect(mockPrisma.permission.create).toHaveBeenCalledWith({
          data: {
            userId: 'dev-123',
            resource: 'projects',
            actions: ['create'],
          },
        });
      });

      it('should update existing permission', async () => {
        const existingPermission = {
          id: 'perm-1',
          userId: 'dev-123',
          resource: 'projects',
          actions: ['read'],
        };

        mockPrisma.permission.findUnique.mockResolvedValue(existingPermission);
        mockPrisma.permission.update.mockResolvedValue({
          ...existingPermission,
          actions: ['read', 'create'],
        });
        mockCache.del.mockResolvedValue(true);

        await permissionService.grantPermission('dev-123', 'projects', ['create']);

        expect(mockPrisma.permission.update).toHaveBeenCalledWith({
          where: { id: 'perm-1' },
          data: { actions: ['read', 'create'] },
        });
      });
    });

    describe('revokePermission', () => {
      it('should revoke specific actions from permission', async () => {
        const existingPermission = {
          id: 'perm-1',
          userId: 'dev-123',
          resource: 'projects',
          actions: ['read', 'create', 'update'],
        };

        mockPrisma.permission.findUnique.mockResolvedValue(existingPermission);
        mockPrisma.permission.update.mockResolvedValue({
          ...existingPermission,
          actions: ['read'],
        });
        mockCache.del.mockResolvedValue(true);

        await permissionService.revokePermission('dev-123', 'projects', ['create', 'update']);

        expect(mockPrisma.permission.update).toHaveBeenCalledWith({
          where: { id: 'perm-1' },
          data: { actions: ['read'] },
        });
      });

      it('should delete permission when all actions are revoked', async () => {
        const existingPermission = {
          id: 'perm-1',
          userId: 'dev-123',
          resource: 'projects',
          actions: ['create'],
        };

        mockPrisma.permission.findUnique.mockResolvedValue(existingPermission);
        mockPrisma.permission.delete.mockResolvedValue(existingPermission);
        mockCache.del.mockResolvedValue(true);

        await permissionService.revokePermission('dev-123', 'projects', ['create']);

        expect(mockPrisma.permission.delete).toHaveBeenCalledWith({
          where: { id: 'perm-1' },
        });
      });
    });

    describe('changeUserRole', () => {
      it('should change user role', async () => {
        mockPrisma.user.update.mockResolvedValue({
          ...mockDeveloperUser,
          role: UserRole.TEAM_LEAD,
        });
        mockCache.del.mockResolvedValue(true);

        await permissionService.changeUserRole('dev-123', UserRole.TEAM_LEAD);

        expect(mockPrisma.user.update).toHaveBeenCalledWith({
          where: { id: 'dev-123' },
          data: { role: UserRole.TEAM_LEAD },
        });
      });
    });

    describe('getRolePermissions', () => {
      it('should return correct permissions for each role', () => {
        const adminPermissions = permissionService.getRolePermissions(UserRole.ADMIN);
        const developerPermissions = permissionService.getRolePermissions(UserRole.DEVELOPER);
        const pmPermissions = permissionService.getRolePermissions(UserRole.PROJECT_MANAGER);

        expect(adminPermissions).toContain('users:create');
        expect(adminPermissions).toContain('projects:delete');
        expect(adminPermissions).toContain('system:configure');

        expect(developerPermissions).toContain('projects:read');
        expect(developerPermissions).toContain('tasks:update');
        expect(developerPermissions).not.toContain('users:create');

        expect(pmPermissions).toContain('projects:create');
        expect(pmPermissions).toContain('tasks:assign');
        expect(pmPermissions).not.toContain('system:configure');
      });
    });
  });

  describe('API Endpoints', () => {
    const generateToken = (user: any) => {
      return jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET!,
        { expiresIn: '1h' }
      );
    };

    describe('GET /api/permissions/me', () => {
      it('should return current user permissions', async () => {
        const token = generateToken(mockDeveloperUser);
        
        mockPrisma.user.findUnique.mockResolvedValue(mockDeveloperUser);
        mockCache.get.mockResolvedValue(null);
        mockCache.set.mockResolvedValue(true);

        const response = await request(app)
          .get('/api/permissions/me')
          .set('Authorization', `Bearer ${token}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('userId');
        expect(response.body.data).toHaveProperty('role');
        expect(response.body.data).toHaveProperty('permissions');
      });
    });

    describe('POST /api/permissions/grant', () => {
      it('should grant permission (admin only)', async () => {
        const token = generateToken(mockAdminUser);
        
        mockPrisma.user.findUnique.mockResolvedValue(mockAdminUser);
        mockPrisma.permission.findUnique.mockResolvedValue(null);
        mockPrisma.permission.create.mockResolvedValue({
          id: 'perm-1',
          userId: 'dev-123',
          resource: 'projects',
          actions: ['create'],
        });
        mockCache.del.mockResolvedValue(true);

        const response = await request(app)
          .post('/api/permissions/grant')
          .set('Authorization', `Bearer ${token}`)
          .send({
            userId: 'dev-123',
            resource: 'projects',
            actions: ['create'],
          })
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.message).toBe('Permission granted successfully');
      });

      it('should deny permission grant for non-admin users', async () => {
        const token = generateToken(mockDeveloperUser);
        
        mockPrisma.user.findUnique.mockResolvedValue(mockDeveloperUser);
        mockCache.get.mockResolvedValue(null);
        mockCache.set.mockResolvedValue(true);

        const response = await request(app)
          .post('/api/permissions/grant')
          .set('Authorization', `Bearer ${token}`)
          .send({
            userId: 'dev-123',
            resource: 'projects',
            actions: ['create'],
          })
          .expect(403);

        expect(response.body.success).toBe(false);
      });
    });

    describe('PUT /api/permissions/users/:userId/role', () => {
      it('should change user role (admin only)', async () => {
        const token = generateToken(mockAdminUser);
        
        mockPrisma.user.findUnique.mockResolvedValue(mockAdminUser);
        mockPrisma.user.update.mockResolvedValue({
          ...mockDeveloperUser,
          role: UserRole.TEAM_LEAD,
        });
        mockCache.del.mockResolvedValue(true);

        const response = await request(app)
          .put('/api/permissions/users/dev-123/role')
          .set('Authorization', `Bearer ${token}`)
          .send({
            role: UserRole.TEAM_LEAD,
          })
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.message).toBe('User role changed successfully');
      });
    });

    describe('GET /api/permissions/roles', () => {
      it('should return all roles and their permissions', async () => {
        const token = generateToken(mockDeveloperUser);
        
        mockPrisma.user.findUnique.mockResolvedValue(mockDeveloperUser);

        const response = await request(app)
          .get('/api/permissions/roles')
          .set('Authorization', `Bearer ${token}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toBeInstanceOf(Array);
        expect(response.body.data.length).toBe(Object.values(UserRole).length);
        
        const adminRole = response.body.data.find((r: any) => r.role === UserRole.ADMIN);
        expect(adminRole).toBeDefined();
        expect(adminRole.permissions).toContain('users:create');
      });
    });

    describe('GET /api/permissions/matrix', () => {
      it('should return permission matrix', async () => {
        const token = generateToken(mockDeveloperUser);
        
        mockPrisma.user.findUnique.mockResolvedValue(mockDeveloperUser);

        const response = await request(app)
          .get('/api/permissions/matrix')
          .set('Authorization', `Bearer ${token}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty(UserRole.ADMIN);
        expect(response.body.data).toHaveProperty(UserRole.DEVELOPER);
        expect(response.body.data).toHaveProperty(UserRole.PROJECT_MANAGER);
        
        expect(response.body.data[UserRole.ADMIN]).toContain('users:create');
        expect(response.body.data[UserRole.DEVELOPER]).toContain('projects:read');
      });
    });
  });

  describe('Authorization Middleware', () => {
    it('should allow access with correct permissions', async () => {
      const token = generateToken(mockProjectManagerUser);
      
      mockPrisma.user.findUnique.mockResolvedValue(mockProjectManagerUser);
      mockCache.get.mockResolvedValue(null);
      mockCache.set.mockResolvedValue(true);

      // Project managers should be able to access their permissions
      const response = await request(app)
        .get('/api/permissions/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should deny access without proper permissions', async () => {
      const token = generateToken(mockDeveloperUser);
      
      mockPrisma.user.findUnique.mockResolvedValue(mockDeveloperUser);
      mockCache.get.mockResolvedValue(null);
      mockCache.set.mockResolvedValue(true);

      // Developers should not be able to grant permissions
      const response = await request(app)
        .post('/api/permissions/grant')
        .set('Authorization', `Bearer ${token}`)
        .send({
          userId: 'dev-123',
          resource: 'projects',
          actions: ['create'],
        })
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });
});
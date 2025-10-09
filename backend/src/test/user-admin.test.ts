import request from 'supertest';
import { PrismaClient, UserRole } from '@prisma/client';
import jwt from 'jsonwebtoken';
import app from '@/server';
import { UserAdminService } from '@/services/UserAdminService';

// Mock Prisma client
const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
    count: jest.fn(),
    groupBy: jest.fn(),
  },
  userInvite: {
    create: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  auditLog: {
    create: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
  },
  userSession: {
    findMany: jest.fn(),
    updateMany: jest.fn(),
    count: jest.fn(),
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

describe('User Administration System', () => {
  let userAdminService: UserAdminService;

  const mockAdminUser = {
    id: 'admin-123',
    email: 'admin@example.com',
    firstName: 'Admin',
    lastName: 'User',
    role: UserRole.ADMIN,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockDeveloperUser = {
    id: 'dev-123',
    email: 'dev@example.com',
    firstName: 'Developer',
    lastName: 'User',
    role: UserRole.DEVELOPER,
    isActive: true,
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
    userAdminService = new UserAdminService(mockPrisma);
    
    // Set up environment variables
    process.env.JWT_SECRET = 'test-secret-key-for-testing-purposes-only';
    process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-key-for-testing';
    
    // Default cache behavior
    mockCache.get.mockResolvedValue(null);
    mockCache.set.mockResolvedValue(true);
    mockCache.del.mockResolvedValue(true);
  });

  describe('UserAdminService', () => {
    describe('inviteUser', () => {
      it('should create user invitation successfully', async () => {
        const inviteData = {
          email: 'newuser@example.com',
          role: UserRole.DEVELOPER,
          message: 'Welcome to the team!',
        };

        mockPrisma.user.findUnique.mockResolvedValue(null); // User doesn't exist

        const result = await userAdminService.inviteUser(inviteData, 'admin-123');

        expect(result).toHaveProperty('inviteId');
        expect(result).toHaveProperty('inviteToken');
        expect(mockCache.set).toHaveBeenCalled();
      });

      it('should throw error for existing user email', async () => {
        const inviteData = {
          email: 'existing@example.com',
          role: UserRole.DEVELOPER,
        };

        mockPrisma.user.findUnique.mockResolvedValue(mockDeveloperUser);

        await expect(userAdminService.inviteUser(inviteData, 'admin-123'))
          .rejects.toThrow('User with this email already exists');
      });
    });

    describe('acceptInvitation', () => {
      it('should accept invitation and create user', async () => {
        const token = 'valid-invite-token';
        const userData = {
          firstName: 'New',
          lastName: 'User',
          password: 'Password123!',
        };

        const mockInvite = {
          id: 'invite-123',
          email: 'newuser@example.com',
          role: UserRole.DEVELOPER,
          invitedBy: 'admin-123',
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 1 day from now
        };

        mockCache.get.mockResolvedValue(mockInvite);
        mockPrisma.user.findUnique.mockResolvedValue(null); // For user creation
        mockPrisma.user.create.mockResolvedValue({
          ...mockDeveloperUser,
          email: mockInvite.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
        });

        const result = await userAdminService.acceptInvitation(token, userData);

        expect(result.user).toBeDefined();
        expect(result.message).toContain('successfully');
        expect(mockCache.del).toHaveBeenCalledWith(`invite:${token}`);
      });

      it('should throw error for invalid token', async () => {
        const token = 'invalid-token';
        const userData = {
          firstName: 'New',
          lastName: 'User',
          password: 'Password123!',
        };

        mockCache.get.mockResolvedValue(null);

        await expect(userAdminService.acceptInvitation(token, userData))
          .rejects.toThrow('Invalid or expired invitation token');
      });

      it('should throw error for expired invitation', async () => {
        const token = 'expired-token';
        const userData = {
          firstName: 'New',
          lastName: 'User',
          password: 'Password123!',
        };

        const expiredInvite = {
          id: 'invite-123',
          email: 'newuser@example.com',
          role: UserRole.DEVELOPER,
          invitedBy: 'admin-123',
          expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
        };

        mockCache.get.mockResolvedValue(expiredInvite);

        await expect(userAdminService.acceptInvitation(token, userData))
          .rejects.toThrow('Invitation has expired');
      });
    });

    describe('bulkUpdateUsers', () => {
      it('should update multiple users successfully', async () => {
        const updateRequest = {
          updates: [
            {
              userId: 'user-1',
              data: { firstName: 'Updated1' },
            },
            {
              userId: 'user-2',
              data: { firstName: 'Updated2' },
            },
          ],
        };

        mockPrisma.user.findUnique.mockResolvedValue(mockDeveloperUser);
        mockPrisma.user.update.mockResolvedValue(mockDeveloperUser);

        const result = await userAdminService.bulkUpdateUsers(updateRequest, 'admin-123');

        expect(result.updated).toBe(2);
        expect(result.errors).toHaveLength(0);
      });

      it('should handle partial failures in bulk update', async () => {
        const updateRequest = {
          updates: [
            {
              userId: 'valid-user',
              data: { firstName: 'Updated' },
            },
            {
              userId: 'invalid-user',
              data: { firstName: 'Updated' },
            },
          ],
        };

        mockPrisma.user.findUnique
          .mockResolvedValueOnce(mockDeveloperUser) // First user exists
          .mockResolvedValueOnce(null); // Second user doesn't exist

        mockPrisma.user.update.mockResolvedValue(mockDeveloperUser);

        const result = await userAdminService.bulkUpdateUsers(updateRequest, 'admin-123');

        expect(result.updated).toBe(1);
        expect(result.errors).toHaveLength(1);
        expect(result.errors[0].userId).toBe('invalid-user');
      });
    });

    describe('getAdminDashboardStats', () => {
      it('should return dashboard statistics', async () => {
        // Mock user stats
        mockPrisma.user.count
          .mockResolvedValueOnce(100) // total
          .mockResolvedValueOnce(90)  // active
          .mockResolvedValueOnce(10)  // inactive
          .mockResolvedValueOnce(5);  // recent

        mockPrisma.user.groupBy.mockResolvedValue([
          { role: UserRole.ADMIN, _count: { role: 2 } },
          { role: UserRole.DEVELOPER, _count: { role: 80 } },
        ]);

        const stats = await userAdminService.getAdminDashboardStats();

        expect(stats.users.total).toBe(100);
        expect(stats.users.active).toBe(90);
        expect(stats.users.roleDistribution[UserRole.DEVELOPER]).toBe(80);
        expect(stats.activity).toBeDefined();
        expect(stats.timestamp).toBeInstanceOf(Date);
      });

      it('should use cached stats when available', async () => {
        const cachedStats = {
          users: { total: 50, active: 45, inactive: 5 },
          activity: { recentLogins: 10 },
          timestamp: new Date(),
        };

        mockCache.get.mockResolvedValue(cachedStats);

        const stats = await userAdminService.getAdminDashboardStats();

        expect(stats).toEqual(cachedStats);
        expect(mockPrisma.user.count).not.toHaveBeenCalled();
      });
    });

    describe('forceUserLogout', () => {
      it('should force logout user successfully', async () => {
        await userAdminService.forceUserLogout('user-123', 'admin-123');

        expect(mockCache.del).toHaveBeenCalledWith('refresh_token:user-123');
        expect(mockCache.del).toHaveBeenCalledWith('user_sessions:user-123');
        expect(mockCache.del).toHaveBeenCalledWith('user_permissions:user-123');
      });
    });

    describe('exportUsers', () => {
      it('should export users data', async () => {
        const filters = { roles: [UserRole.DEVELOPER] };
        const format = 'csv';

        // Mock search results
        const mockSearchResult = {
          users: [mockDeveloperUser],
          pagination: { total: 1, page: 1, limit: 1000, totalPages: 1 },
        };

        // Mock the searchUsers method
        jest.spyOn(userAdminService as any, 'userService', 'get').mockReturnValue({
          searchUsers: jest.fn().mockResolvedValue(mockSearchResult),
        });

        const result = await userAdminService.exportUsers(filters, format, 'admin-123');

        expect(result).toHaveProperty('downloadUrl');
        expect(result).toHaveProperty('filename');
        expect(result.filename).toContain('.csv');
      });
    });

    describe('importUsers', () => {
      it('should import users successfully', async () => {
        const userData = [
          {
            email: 'import1@example.com',
            firstName: 'Import',
            lastName: 'User1',
            password: 'Password123!',
          },
          {
            email: 'import2@example.com',
            firstName: 'Import',
            lastName: 'User2',
            password: 'Password123!',
          },
        ];

        mockPrisma.user.findUnique.mockResolvedValue(null); // No existing users
        mockPrisma.user.create.mockResolvedValue(mockDeveloperUser);

        const result = await userAdminService.importUsers(userData, {}, 'admin-123');

        expect(result.imported).toBe(2);
        expect(result.errors).toHaveLength(0);
        expect(result.duplicates).toBe(0);
      });

      it('should handle duplicates based on options', async () => {
        const userData = [
          {
            email: 'existing@example.com',
            firstName: 'Existing',
            lastName: 'User',
          },
        ];

        mockPrisma.user.findUnique.mockResolvedValue(mockDeveloperUser); // User exists

        const result = await userAdminService.importUsers(
          userData,
          { skipDuplicates: true },
          'admin-123'
        );

        expect(result.imported).toBe(0);
        expect(result.duplicates).toBe(1);
        expect(result.errors).toHaveLength(0);
      });
    });
  });

  describe('API Endpoints', () => {
    describe('GET /api/admin/dashboard/stats', () => {
      it('should return dashboard statistics for admin', async () => {
        const adminToken = generateToken(mockAdminUser);

        mockPrisma.user.findUnique.mockResolvedValue(mockAdminUser);
        mockCache.get.mockResolvedValue(null);

        // Mock stats
        mockPrisma.user.count
          .mockResolvedValueOnce(100)
          .mockResolvedValueOnce(90)
          .mockResolvedValueOnce(10)
          .mockResolvedValueOnce(5);

        mockPrisma.user.groupBy.mockResolvedValue([
          { role: UserRole.DEVELOPER, _count: { role: 80 } },
        ]);

        const response = await request(app)
          .get('/api/admin/dashboard/stats')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.users).toBeDefined();
        expect(response.body.data.activity).toBeDefined();
      });

      it('should deny access to non-admin users', async () => {
        const devToken = generateToken(mockDeveloperUser);

        mockPrisma.user.findUnique.mockResolvedValue(mockDeveloperUser);

        const response = await request(app)
          .get('/api/admin/dashboard/stats')
          .set('Authorization', `Bearer ${devToken}`)
          .expect(403);

        expect(response.body.success).toBe(false);
      });
    });

    describe('POST /api/admin/users/invite', () => {
      it('should invite user successfully', async () => {
        const adminToken = generateToken(mockAdminUser);
        const inviteData = {
          email: 'newuser@example.com',
          role: UserRole.DEVELOPER,
          message: 'Welcome!',
        };

        mockPrisma.user.findUnique
          .mockResolvedValueOnce(mockAdminUser) // Auth check
          .mockResolvedValueOnce(null); // User doesn't exist

        const response = await request(app)
          .post('/api/admin/users/invite')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(inviteData)
          .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.data.inviteId).toBeDefined();
        expect(response.body.data.inviteToken).toBeDefined();
      });

      it('should validate invite data', async () => {
        const adminToken = generateToken(mockAdminUser);
        const invalidData = {
          email: 'invalid-email',
          role: 'INVALID_ROLE',
        };

        mockPrisma.user.findUnique.mockResolvedValue(mockAdminUser);

        const response = await request(app)
          .post('/api/admin/users/invite')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(invalidData)
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.errors).toBeDefined();
      });
    });

    describe('POST /api/public/accept-invitation', () => {
      it('should accept invitation successfully', async () => {
        const invitationData = {
          token: 'valid-token',
          firstName: 'New',
          lastName: 'User',
          password: 'Password123!',
        };

        const mockInvite = {
          id: 'invite-123',
          email: 'newuser@example.com',
          role: UserRole.DEVELOPER,
          invitedBy: 'admin-123',
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        };

        mockCache.get.mockResolvedValue(mockInvite);
        mockPrisma.user.findUnique.mockResolvedValue(null);
        mockPrisma.user.create.mockResolvedValue({
          ...mockDeveloperUser,
          email: mockInvite.email,
        });

        const response = await request(app)
          .post('/api/public/accept-invitation')
          .send(invitationData)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.user).toBeDefined();
      });
    });

    describe('POST /api/admin/users/bulk-update', () => {
      it('should bulk update users successfully', async () => {
        const adminToken = generateToken(mockAdminUser);
        const bulkUpdateData = {
          updates: [
            {
              userId: 'user-1',
              data: { firstName: 'Updated1' },
            },
            {
              userId: 'user-2',
              data: { firstName: 'Updated2' },
            },
          ],
        };

        mockPrisma.user.findUnique.mockResolvedValue(mockAdminUser);
        // Mock successful updates
        mockPrisma.user.findUnique.mockResolvedValue(mockDeveloperUser);
        mockPrisma.user.update.mockResolvedValue(mockDeveloperUser);

        const response = await request(app)
          .post('/api/admin/users/bulk-update')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(bulkUpdateData)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.updated).toBe(2);
      });
    });

    describe('GET /api/admin/users/:userId/audit', () => {
      it('should return user audit log', async () => {
        const adminToken = generateToken(mockAdminUser);

        mockPrisma.user.findUnique.mockResolvedValue(mockAdminUser);

        const response = await request(app)
          .get('/api/admin/users/dev-123/audit?page=1&limit=20')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.entries).toBeDefined();
        expect(response.body.data.pagination).toBeDefined();
      });
    });

    describe('POST /api/admin/users/:userId/force-logout', () => {
      it('should force logout user', async () => {
        const adminToken = generateToken(mockAdminUser);

        mockPrisma.user.findUnique.mockResolvedValue(mockAdminUser);

        const response = await request(app)
          .post('/api/admin/users/dev-123/force-logout')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.message).toContain('logged out');
      });
    });

    describe('POST /api/admin/users/export', () => {
      it('should export users data', async () => {
        const adminToken = generateToken(mockAdminUser);
        const exportData = {
          filters: { roles: [UserRole.DEVELOPER] },
          format: 'csv',
        };

        mockPrisma.user.findUnique.mockResolvedValue(mockAdminUser);
        mockPrisma.user.findMany.mockResolvedValue([mockDeveloperUser]);
        mockPrisma.user.count.mockResolvedValue(1);

        const response = await request(app)
          .post('/api/admin/users/export')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(exportData)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.downloadUrl).toBeDefined();
        expect(response.body.data.filename).toBeDefined();
      });
    });

    describe('GET /api/admin/system/info', () => {
      it('should return system information', async () => {
        const adminToken = generateToken(mockAdminUser);

        mockPrisma.user.findUnique.mockResolvedValue(mockAdminUser);

        const response = await request(app)
          .get('/api/admin/system/info')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.version).toBeDefined();
        expect(response.body.data.environment).toBeDefined();
        expect(response.body.data.uptime).toBeDefined();
      });
    });

    describe('GET /api/admin/system/health', () => {
      it('should return system health status', async () => {
        const adminToken = generateToken(mockAdminUser);

        mockPrisma.user.findUnique.mockResolvedValue(mockAdminUser);

        const response = await request(app)
          .get('/api/admin/system/health')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.status).toBeDefined();
        expect(response.body.data.checks).toBeDefined();
        expect(response.body.data.checks.database).toBeDefined();
        expect(response.body.data.checks.redis).toBeDefined();
      });
    });
  });

  describe('Validation', () => {
    it('should validate invitation data', async () => {
      const adminToken = generateToken(mockAdminUser);
      const invalidData = {
        email: 'not-an-email',
        role: 'INVALID_ROLE',
        message: 'x'.repeat(501), // Too long
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockAdminUser);

      const response = await request(app)
        .post('/api/admin/users/invite')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });

    it('should validate bulk update data', async () => {
      const adminToken = generateToken(mockAdminUser);
      const invalidData = {
        updates: [], // Empty array
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockAdminUser);

      const response = await request(app)
        .post('/api/admin/users/bulk-update')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });
});
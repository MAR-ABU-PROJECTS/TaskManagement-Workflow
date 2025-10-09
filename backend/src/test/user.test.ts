import request from 'supertest';
import { PrismaClient, UserRole } from '@prisma/client';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import app from '@/server';
import { UserService } from '@/services/UserService';

// Mock Prisma client
const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
    groupBy: jest.fn(),
  },
  permission: {
    findUnique: jest.fn(),
    create: jest.fn(),
    deleteMany: jest.fn(),
  },
  projectMember: {
    deleteMany: jest.fn(),
  },
  teamMember: {
    deleteMany: jest.fn(),
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

describe('User Management System', () => {
  let userService: UserService;

  const mockAdminUser = {
    id: 'admin-123',
    email: 'admin@example.com',
    passwordHash: '$2a$12$hashedpassword',
    firstName: 'Admin',
    lastName: 'User',
    role: UserRole.ADMIN,
    isActive: true,
    profilePicture: null,
    phoneNumber: null,
    timezone: 'UTC',
    language: 'en',
    jobTitle: null,
    department: null,
    location: null,
    bio: null,
    skills: [],
    socialLinks: {},
    preferences: {},
    createdAt: new Date(),
    updatedAt: new Date(),
    userPermissions: [],
    projectMembers: [],
    teamMembers: [],
  };

  const mockDeveloperUser = {
    id: 'dev-123',
    email: 'dev@example.com',
    passwordHash: '$2a$12$hashedpassword',
    firstName: 'Developer',
    lastName: 'User',
    role: UserRole.DEVELOPER,
    isActive: true,
    profilePicture: null,
    phoneNumber: null,
    timezone: 'UTC',
    language: 'en',
    jobTitle: 'Software Developer',
    department: 'Engineering',
    location: 'Remote',
    bio: 'Passionate developer',
    skills: ['JavaScript', 'TypeScript', 'React'],
    socialLinks: { github: 'https://github.com/dev' },
    preferences: { theme: 'dark' },
    createdAt: new Date(),
    updatedAt: new Date(),
    userPermissions: [],
    projectMembers: [],
    teamMembers: [],
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
    userService = new UserService(mockPrisma);
    
    // Set up environment variables
    process.env.JWT_SECRET = 'test-secret-key-for-testing-purposes-only';
    process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-key-for-testing';
    
    // Default cache behavior
    mockCache.get.mockResolvedValue(null);
    mockCache.set.mockResolvedValue(true);
    mockCache.del.mockResolvedValue(true);
  });

  describe('UserService', () => {
    describe('createUser', () => {
      it('should create a new user successfully', async () => {
        const userData = {
          email: 'newuser@example.com',
          password: 'Password123!',
          firstName: 'New',
          lastName: 'User',
          role: UserRole.DEVELOPER,
        };

        mockPrisma.user.findUnique.mockResolvedValue(null); // Email not exists
        mockPrisma.user.create.mockResolvedValue({
          ...mockDeveloperUser,
          id: 'new-user-123',
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
        });

        const result = await userService.createUser(userData, 'admin-123');

        expect(result).toHaveProperty('id');
        expect(result).toHaveProperty('email', userData.email);
        expect(result).not.toHaveProperty('passwordHash');
        expect(mockPrisma.user.create).toHaveBeenCalled();
      });

      it('should throw error for duplicate email', async () => {
        const userData = {
          email: 'existing@example.com',
          password: 'Password123!',
          firstName: 'New',
          lastName: 'User',
        };

        mockPrisma.user.findUnique.mockResolvedValue(mockDeveloperUser);

        await expect(userService.createUser(userData)).rejects.toThrow('User with this email already exists');
      });

      it('should restrict role assignment for non-admin creators', async () => {
        const userData = {
          email: 'newuser@example.com',
          password: 'Password123!',
          firstName: 'New',
          lastName: 'User',
          role: UserRole.ADMIN,
        };

        mockPrisma.user.findUnique
          .mockResolvedValueOnce(null) // Email check
          .mockResolvedValueOnce(mockDeveloperUser); // Creator check

        await expect(userService.createUser(userData, 'dev-123')).rejects.toThrow('Only administrators can assign elevated roles');
      });
    });

    describe('getUserById', () => {
      it('should return user without password hash', async () => {
        mockPrisma.user.findUnique.mockResolvedValue(mockDeveloperUser);

        const result = await userService.getUserById('dev-123');

        expect(result).toBeDefined();
        expect(result).not.toHaveProperty('passwordHash');
        expect(result?.id).toBe('dev-123');
      });

      it('should return null for non-existent user', async () => {
        mockPrisma.user.findUnique.mockResolvedValue(null);

        const result = await userService.getUserById('non-existent');

        expect(result).toBeNull();
      });

      it('should include permissions when requested', async () => {
        mockPrisma.user.findUnique.mockResolvedValue({
          ...mockDeveloperUser,
          userPermissions: [
            { resource: 'projects', actions: ['read'] },
          ],
        });

        const result = await userService.getUserById('dev-123', { includePermissions: true });

        expect(result).toBeDefined();
        expect(result?.userPermissions).toBeDefined();
      });
    });

    describe('updateUser', () => {
      it('should update user successfully', async () => {
        const updateData = {
          firstName: 'Updated',
          lastName: 'Name',
          jobTitle: 'Senior Developer',
        };

        mockPrisma.user.findUnique.mockResolvedValue(mockDeveloperUser);
        mockPrisma.user.update.mockResolvedValue({
          ...mockDeveloperUser,
          ...updateData,
        });

        const result = await userService.updateUser('dev-123', updateData, 'admin-123');

        expect(result.firstName).toBe('Updated');
        expect(result.lastName).toBe('Name');
        expect(result.jobTitle).toBe('Senior Developer');
        expect(mockPrisma.user.update).toHaveBeenCalled();
      });

      it('should prevent email conflicts', async () => {
        const updateData = { email: 'existing@example.com' };

        mockPrisma.user.findUnique
          .mockResolvedValueOnce(mockDeveloperUser) // User exists
          .mockResolvedValueOnce(mockAdminUser); // Email conflict

        await expect(userService.updateUser('dev-123', updateData)).rejects.toThrow('Email already in use by another user');
      });

      it('should restrict role changes to admins', async () => {
        const updateData = { role: UserRole.ADMIN };

        mockPrisma.user.findUnique
          .mockResolvedValueOnce(mockDeveloperUser) // User exists
          .mockResolvedValueOnce(mockDeveloperUser); // Updater is not admin

        await expect(userService.updateUser('dev-123', updateData, 'dev-456')).rejects.toThrow('Only administrators can change user roles');
      });
    });

    describe('deactivateUser', () => {
      it('should deactivate user successfully', async () => {
        mockPrisma.user.findUnique.mockResolvedValue(mockDeveloperUser);
        mockPrisma.user.update.mockResolvedValue({
          ...mockDeveloperUser,
          isActive: false,
        });

        await userService.deactivateUser('dev-123', 'admin-123');

        expect(mockPrisma.user.update).toHaveBeenCalledWith({
          where: { id: 'dev-123' },
          data: { isActive: false, updatedAt: expect.any(Date) },
        });
      });

      it('should throw error for already deactivated user', async () => {
        mockPrisma.user.findUnique.mockResolvedValue({
          ...mockDeveloperUser,
          isActive: false,
        });

        await expect(userService.deactivateUser('dev-123')).rejects.toThrow('User is already deactivated');
      });
    });

    describe('searchUsers', () => {
      it('should search users with filters', async () => {
        const mockUsers = [mockDeveloperUser, mockAdminUser];
        
        mockPrisma.user.findMany.mockResolvedValue(mockUsers);
        mockPrisma.user.count.mockResolvedValue(2);

        const filters = {
          search: 'dev',
          role: UserRole.DEVELOPER,
          isActive: true,
        };

        const result = await userService.searchUsers(filters, 1, 10);

        expect(result.users).toHaveLength(2);
        expect(result.pagination.total).toBe(2);
        expect(result.pagination.page).toBe(1);
      });

      it('should handle pagination correctly', async () => {
        mockPrisma.user.findMany.mockResolvedValue([mockDeveloperUser]);
        mockPrisma.user.count.mockResolvedValue(25);

        const result = await userService.searchUsers({}, 2, 10);

        expect(result.pagination.page).toBe(2);
        expect(result.pagination.totalPages).toBe(3);
        expect(result.pagination.hasNext).toBe(true);
        expect(result.pagination.hasPrev).toBe(true);
      });
    });

    describe('getUserStats', () => {
      it('should return user statistics', async () => {
        mockPrisma.user.count
          .mockResolvedValueOnce(100) // total
          .mockResolvedValueOnce(90)  // active
          .mockResolvedValueOnce(10)  // inactive
          .mockResolvedValueOnce(5);  // recently created

        mockPrisma.user.groupBy.mockResolvedValue([
          { role: UserRole.ADMIN, _count: { role: 2 } },
          { role: UserRole.DEVELOPER, _count: { role: 80 } },
          { role: UserRole.PROJECT_MANAGER, _count: { role: 18 } },
        ]);

        const stats = await userService.getUserStats();

        expect(stats.total).toBe(100);
        expect(stats.active).toBe(90);
        expect(stats.inactive).toBe(10);
        expect(stats.byRole[UserRole.DEVELOPER]).toBe(80);
        expect(stats.recentlyCreated).toBe(5);
      });
    });

    describe('changeUserPassword', () => {
      it('should change password for self with current password', async () => {
        const passwordData = {
          currentPassword: 'oldPassword123!',
          newPassword: 'newPassword123!',
        };

        mockPrisma.user.findUnique.mockResolvedValue(mockDeveloperUser);
        jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);
        mockPrisma.user.update.mockResolvedValue(mockDeveloperUser);

        await userService.changeUserPassword('dev-123', passwordData, 'dev-123');

        expect(bcrypt.compare).toHaveBeenCalledWith('oldPassword123!', mockDeveloperUser.passwordHash);
      });

      it('should allow admin to change password without current password', async () => {
        const passwordData = { newPassword: 'newPassword123!' };

        mockPrisma.user.findUnique
          .mockResolvedValueOnce(mockDeveloperUser) // Target user
          .mockResolvedValueOnce(mockAdminUser); // Admin user

        mockPrisma.user.update.mockResolvedValue(mockDeveloperUser);

        await userService.changeUserPassword('dev-123', passwordData, 'admin-123');

        expect(mockPrisma.user.update).toHaveBeenCalled();
      });

      it('should reject incorrect current password', async () => {
        const passwordData = {
          currentPassword: 'wrongPassword',
          newPassword: 'newPassword123!',
        };

        mockPrisma.user.findUnique.mockResolvedValue(mockDeveloperUser);
        jest.spyOn(bcrypt, 'compare').mockResolvedValue(false as never);

        await expect(userService.changeUserPassword('dev-123', passwordData, 'dev-123')).rejects.toThrow('Current password is incorrect');
      });
    });
  });

  describe('API Endpoints', () => {
    describe('POST /api/users', () => {
      it('should create user successfully (admin)', async () => {
        const adminToken = generateToken(mockAdminUser);
        const userData = {
          email: 'newuser@example.com',
          password: 'Password123!',
          firstName: 'New',
          lastName: 'User',
          role: UserRole.DEVELOPER,
        };

        mockPrisma.user.findUnique
          .mockResolvedValueOnce(mockAdminUser) // Auth check
          .mockResolvedValueOnce(null); // Email uniqueness check

        mockPrisma.user.create.mockResolvedValue({
          ...mockDeveloperUser,
          id: 'new-user-123',
          email: userData.email,
        });

        const response = await request(app)
          .post('/api/users')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(userData)
          .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.data.email).toBe(userData.email);
      });

      it('should reject user creation for non-admin', async () => {
        const devToken = generateToken(mockDeveloperUser);
        const userData = {
          email: 'newuser@example.com',
          password: 'Password123!',
          firstName: 'New',
          lastName: 'User',
        };

        mockPrisma.user.findUnique.mockResolvedValue(mockDeveloperUser);
        mockCache.get.mockResolvedValue(null);
        mockCache.set.mockResolvedValue(true);

        const response = await request(app)
          .post('/api/users')
          .set('Authorization', `Bearer ${devToken}`)
          .send(userData)
          .expect(403);

        expect(response.body.success).toBe(false);
      });
    });

    describe('GET /api/users/me', () => {
      it('should return current user profile', async () => {
        const devToken = generateToken(mockDeveloperUser);

        mockPrisma.user.findUnique.mockResolvedValue(mockDeveloperUser);

        const response = await request(app)
          .get('/api/users/me')
          .set('Authorization', `Bearer ${devToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.id).toBe('dev-123');
        expect(response.body.data).not.toHaveProperty('passwordHash');
      });
    });

    describe('PUT /api/users/me/profile', () => {
      it('should update user profile', async () => {
        const devToken = generateToken(mockDeveloperUser);
        const updateData = {
          firstName: 'Updated',
          bio: 'Updated bio',
          skills: ['JavaScript', 'Python'],
        };

        mockPrisma.user.findUnique.mockResolvedValue(mockDeveloperUser);
        mockPrisma.user.update.mockResolvedValue({
          ...mockDeveloperUser,
          ...updateData,
        });

        const response = await request(app)
          .put('/api/users/me/profile')
          .set('Authorization', `Bearer ${devToken}`)
          .send(updateData)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.firstName).toBe('Updated');
      });
    });

    describe('GET /api/users', () => {
      it('should search users with filters', async () => {
        const adminToken = generateToken(mockAdminUser);

        mockPrisma.user.findUnique.mockResolvedValue(mockAdminUser);
        mockPrisma.user.findMany.mockResolvedValue([mockDeveloperUser]);
        mockPrisma.user.count.mockResolvedValue(1);
        mockCache.get.mockResolvedValue(null);
        mockCache.set.mockResolvedValue(true);

        const response = await request(app)
          .get('/api/users?search=dev&role=DEVELOPER&page=1&limit=10')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.users).toHaveLength(1);
        expect(response.body.data.pagination.page).toBe(1);
      });
    });

    describe('PUT /api/users/:id', () => {
      it('should update user (admin only)', async () => {
        const adminToken = generateToken(mockAdminUser);
        const updateData = {
          firstName: 'Updated',
          role: UserRole.TEAM_LEAD,
        };

        mockPrisma.user.findUnique
          .mockResolvedValueOnce(mockAdminUser) // Auth check
          .mockResolvedValueOnce(mockDeveloperUser); // Target user

        mockPrisma.user.update.mockResolvedValue({
          ...mockDeveloperUser,
          ...updateData,
        });

        mockCache.get.mockResolvedValue(null);
        mockCache.set.mockResolvedValue(true);

        const response = await request(app)
          .put('/api/users/dev-123')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(updateData)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.firstName).toBe('Updated');
      });
    });

    describe('POST /api/users/:id/deactivate', () => {
      it('should deactivate user (admin only)', async () => {
        const adminToken = generateToken(mockAdminUser);

        mockPrisma.user.findUnique
          .mockResolvedValueOnce(mockAdminUser) // Auth check
          .mockResolvedValueOnce(mockDeveloperUser); // Target user

        mockPrisma.user.update.mockResolvedValue({
          ...mockDeveloperUser,
          isActive: false,
        });

        mockCache.get.mockResolvedValue(null);
        mockCache.set.mockResolvedValue(true);

        const response = await request(app)
          .post('/api/users/dev-123/deactivate')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.message).toBe('User deactivated successfully');
      });
    });

    describe('POST /api/users/bulk/deactivate', () => {
      it('should bulk deactivate users (admin only)', async () => {
        const adminToken = generateToken(mockAdminUser);
        const userIds = ['dev-123', 'dev-456'];

        mockPrisma.user.findUnique.mockResolvedValue(mockAdminUser);
        mockPrisma.user.updateMany.mockResolvedValue({ count: 2 });
        mockCache.get.mockResolvedValue(null);
        mockCache.set.mockResolvedValue(true);

        const response = await request(app)
          .post('/api/users/bulk/deactivate')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ userIds })
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.message).toContain('2 users deactivated');
      });
    });

    describe('GET /api/users/stats', () => {
      it('should return user statistics (admin only)', async () => {
        const adminToken = generateToken(mockAdminUser);

        mockPrisma.user.findUnique.mockResolvedValue(mockAdminUser);
        mockPrisma.user.count
          .mockResolvedValueOnce(100)
          .mockResolvedValueOnce(90)
          .mockResolvedValueOnce(10)
          .mockResolvedValueOnce(5);

        mockPrisma.user.groupBy.mockResolvedValue([
          { role: UserRole.DEVELOPER, _count: { role: 80 } },
        ]);

        mockCache.get.mockResolvedValue(null);
        mockCache.set.mockResolvedValue(true);

        const response = await request(app)
          .get('/api/users/stats')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.total).toBe(100);
        expect(response.body.data.active).toBe(90);
      });
    });

    describe('Validation', () => {
      it('should validate user creation data', async () => {
        const adminToken = generateToken(mockAdminUser);
        const invalidData = {
          email: 'invalid-email',
          password: '123', // Too short
          firstName: '', // Empty
        };

        mockPrisma.user.findUnique.mockResolvedValue(mockAdminUser);

        const response = await request(app)
          .post('/api/users')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(invalidData)
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.errors).toBeDefined();
      });

      it('should validate search parameters', async () => {
        const adminToken = generateToken(mockAdminUser);

        mockPrisma.user.findUnique.mockResolvedValue(mockAdminUser);

        const response = await request(app)
          .get('/api/users?page=0&limit=200') // Invalid pagination
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(400);

        expect(response.body.success).toBe(false);
      });
    });
  });
});
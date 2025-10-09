import { PrismaClient, User, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { UserModel } from '@/models/UserModel';
import { PermissionService } from '@/services/PermissionService';
import { CacheService } from '@/config/redis';
import { logger } from '@/utils/logger';
import {
  CreateUserRequest,
  UpdateUserRequest,
  UpdateUserProfileRequest,
  ChangePasswordRequest,
  UserSearchFilters,
  UserListResponse,
  IUser,
  UserWithPermissions,
} from '@/types/user.types';
import {
  ValidationError,
  NotFoundError,
  ConflictError,
  AuthorizationError,
} from '@/middleware/errorHandler';

export interface UserServiceOptions {
  includePermissions?: boolean;
  includeProjects?: boolean;
  includeTeams?: boolean;
}

export class UserService {
  private prisma: PrismaClient;
  private userModel: UserModel;
  private permissionService: PermissionService;
  private cache: CacheService;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.userModel = new UserModel(prisma);
    this.permissionService = new PermissionService(prisma);
    this.cache = CacheService.getInstance();
  }

  /**
   * Create a new user
   */
  async createUser(userData: CreateUserRequest, createdBy?: string): Promise<IUser> {
    try {
      // Validate email uniqueness
      const existingUser = await this.userModel.findByEmail(userData.email);
      if (existingUser) {
        throw new ConflictError('User with this email already exists');
      }

      // Validate role assignment permissions
      if (userData.role && userData.role !== UserRole.DEVELOPER) {
        // Only admins can assign non-developer roles
        if (createdBy) {
          const creator = await this.userModel.findById(createdBy);
          if (!creator || creator.role !== UserRole.ADMIN) {
            throw new AuthorizationError('Only administrators can assign elevated roles');
          }
        }
      }

      // Create user with UserModel
      const user = await this.userModel.create({
        email: userData.email,
        passwordHash: userData.password, // UserModel will hash this
        firstName: userData.firstName,
        lastName: userData.lastName,
        role: userData.role || UserRole.DEVELOPER,
        isActive: userData.isActive ?? true,
        profilePicture: userData.profilePicture,
        phoneNumber: userData.phoneNumber,
        timezone: userData.timezone || 'UTC',
        language: userData.language || 'en',
        jobTitle: userData.jobTitle,
        department: userData.department,
        location: userData.location,
        bio: userData.bio,
        skills: userData.skills || [],
        socialLinks: userData.socialLinks || {},
        preferences: userData.preferences || {},
      });

      // Grant default permissions based on role if specified
      if (userData.permissions && userData.permissions.length > 0) {
        for (const permission of userData.permissions) {
          await this.permissionService.grantPermission(
            user.id,
            permission.resource,
            permission.actions
          );
        }
      }

      logger.info(`User created: ${user.email} (${user.id}) by ${createdBy || 'system'}`);

      // Return user without password hash
      const { passwordHash, ...userWithoutPassword } = user;
      return userWithoutPassword as IUser;
    } catch (error) {
      logger.error('Failed to create user:', error);
      throw error;
    }
  }

  /**
   * Get user by ID
   */
  async getUserById(
    userId: string,
    options: UserServiceOptions = {}
  ): Promise<UserWithPermissions | null> {
    try {
      const cacheKey = `user:${userId}:${JSON.stringify(options)}`;
      
      // Try cache first
      const cached = await this.cache.get<UserWithPermissions>(cacheKey);
      if (cached) {
        return cached;
      }

      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: {
          userPermissions: options.includePermissions,
          projectMembers: options.includeProjects ? {
            include: {
              project: {
                select: {
                  id: true,
                  name: true,
                  description: true,
                  status: true,
                },
              },
            },
          } : false,
          teamMembers: options.includeTeams ? {
            include: {
              team: {
                select: {
                  id: true,
                  name: true,
                  description: true,
                },
              },
            },
          } : false,
        },
      });

      if (!user) {
        return null;
      }

      // Remove password hash
      const { passwordHash, ...userWithoutPassword } = user;
      const result = userWithoutPassword as UserWithPermissions;

      // Add computed permissions if requested
      if (options.includePermissions) {
        const permissions = await this.permissionService.getUserPermissions(userId);
        result.computedPermissions = permissions;
      }

      // Cache for 5 minutes
      await this.cache.set(cacheKey, result, 300);

      return result;
    } catch (error) {
      logger.error('Failed to get user by ID:', error);
      throw error;
    }
  }

  /**
   * Get user by email
   */
  async getUserByEmail(email: string): Promise<IUser | null> {
    try {
      const user = await this.userModel.findByEmail(email);
      if (!user) {
        return null;
      }

      const { passwordHash, ...userWithoutPassword } = user;
      return userWithoutPassword as IUser;
    } catch (error) {
      logger.error('Failed to get user by email:', error);
      throw error;
    }
  }

  /**
   * Update user
   */
  async updateUser(
    userId: string,
    updateData: UpdateUserRequest,
    updatedBy?: string
  ): Promise<IUser> {
    try {
      const existingUser = await this.userModel.findById(userId);
      if (!existingUser) {
        throw new NotFoundError('User not found');
      }

      // Check email uniqueness if email is being updated
      if (updateData.email && updateData.email !== existingUser.email) {
        const emailExists = await this.userModel.findByEmail(updateData.email);
        if (emailExists) {
          throw new ConflictError('Email already in use by another user');
        }
      }

      // Validate role change permissions
      if (updateData.role && updateData.role !== existingUser.role) {
        if (updatedBy) {
          const updater = await this.userModel.findById(updatedBy);
          if (!updater || updater.role !== UserRole.ADMIN) {
            throw new AuthorizationError('Only administrators can change user roles');
          }
        }
      }

      // Update user
      const updatedUser = await this.prisma.user.update({
        where: { id: userId },
        data: {
          email: updateData.email,
          firstName: updateData.firstName,
          lastName: updateData.lastName,
          role: updateData.role,
          isActive: updateData.isActive,
          profilePicture: updateData.profilePicture,
          phoneNumber: updateData.phoneNumber,
          timezone: updateData.timezone,
          language: updateData.language,
          jobTitle: updateData.jobTitle,
          department: updateData.department,
          location: updateData.location,
          bio: updateData.bio,
          skills: updateData.skills,
          socialLinks: updateData.socialLinks,
          preferences: updateData.preferences,
          updatedAt: new Date(),
        },
      });

      // Handle role change
      if (updateData.role && updateData.role !== existingUser.role) {
        await this.permissionService.changeUserRole(userId, updateData.role);
      }

      // Invalidate cache
      await this.invalidateUserCache(userId);

      logger.info(`User updated: ${updatedUser.email} (${userId}) by ${updatedBy || 'system'}`);

      const { passwordHash, ...userWithoutPassword } = updatedUser;
      return userWithoutPassword as IUser;
    } catch (error) {
      logger.error('Failed to update user:', error);
      throw error;
    }
  }

  /**
   * Update user profile (self-service)
   */
  async updateUserProfile(
    userId: string,
    profileData: UpdateUserProfileRequest
  ): Promise<IUser> {
    try {
      const existingUser = await this.userModel.findById(userId);
      if (!existingUser) {
        throw new NotFoundError('User not found');
      }

      // Users can only update their own profiles (except admins)
      const updatedUser = await this.prisma.user.update({
        where: { id: userId },
        data: {
          firstName: profileData.firstName,
          lastName: profileData.lastName,
          profilePicture: profileData.profilePicture,
          phoneNumber: profileData.phoneNumber,
          timezone: profileData.timezone,
          language: profileData.language,
          bio: profileData.bio,
          skills: profileData.skills,
          socialLinks: profileData.socialLinks,
          preferences: profileData.preferences,
          updatedAt: new Date(),
        },
      });

      // Invalidate cache
      await this.invalidateUserCache(userId);

      logger.info(`User profile updated: ${updatedUser.email} (${userId})`);

      const { passwordHash, ...userWithoutPassword } = updatedUser;
      return userWithoutPassword as IUser;
    } catch (error) {
      logger.error('Failed to update user profile:', error);
      throw error;
    }
  }

  /**
   * Deactivate user (soft delete)
   */
  async deactivateUser(userId: string, deactivatedBy?: string): Promise<void> {
    try {
      const user = await this.userModel.findById(userId);
      if (!user) {
        throw new NotFoundError('User not found');
      }

      if (!user.isActive) {
        throw new ValidationError('User is already deactivated');
      }

      await this.prisma.user.update({
        where: { id: userId },
        data: {
          isActive: false,
          updatedAt: new Date(),
        },
      });

      // Invalidate all user sessions
      await this.cache.del(`refresh_token:${userId}`);
      await this.cache.del(`user_sessions:${userId}`);

      // Invalidate cache
      await this.invalidateUserCache(userId);

      logger.info(`User deactivated: ${user.email} (${userId}) by ${deactivatedBy || 'system'}`);
    } catch (error) {
      logger.error('Failed to deactivate user:', error);
      throw error;
    }
  }

  /**
   * Reactivate user
   */
  async reactivateUser(userId: string, reactivatedBy?: string): Promise<void> {
    try {
      const user = await this.userModel.findById(userId);
      if (!user) {
        throw new NotFoundError('User not found');
      }

      if (user.isActive) {
        throw new ValidationError('User is already active');
      }

      await this.prisma.user.update({
        where: { id: userId },
        data: {
          isActive: true,
          updatedAt: new Date(),
        },
      });

      // Invalidate cache
      await this.invalidateUserCache(userId);

      logger.info(`User reactivated: ${user.email} (${userId}) by ${reactivatedBy || 'system'}`);
    } catch (error) {
      logger.error('Failed to reactivate user:', error);
      throw error;
    }
  }

  /**
   * Delete user (hard delete - admin only)
   */
  async deleteUser(userId: string, deletedBy?: string): Promise<void> {
    try {
      const user = await this.userModel.findById(userId);
      if (!user) {
        throw new NotFoundError('User not found');
      }

      // Remove user from all projects and teams first
      await this.prisma.$transaction([
        this.prisma.projectMember.deleteMany({ where: { userId } }),
        this.prisma.teamMember.deleteMany({ where: { userId } }),
        this.prisma.permission.deleteMany({ where: { userId } }),
        this.prisma.user.delete({ where: { id: userId } }),
      ]);

      // Clear all user-related cache
      await this.invalidateUserCache(userId);
      await this.cache.del(`refresh_token:${userId}`);
      await this.cache.del(`user_sessions:${userId}`);
      await this.cache.del(`user_permissions:${userId}`);

      logger.warn(`User deleted: ${user.email} (${userId}) by ${deletedBy || 'system'}`);
    } catch (error) {
      logger.error('Failed to delete user:', error);
      throw error;
    }
  }

  /**
   * Search and list users with filters and pagination
   */
  async searchUsers(
    filters: UserSearchFilters,
    page: number = 1,
    limit: number = 20
  ): Promise<UserListResponse> {
    try {
      const offset = (page - 1) * limit;

      // Build where clause
      const where: any = {};

      if (filters.search) {
        where.OR = [
          { firstName: { contains: filters.search, mode: 'insensitive' } },
          { lastName: { contains: filters.search, mode: 'insensitive' } },
          { email: { contains: filters.search, mode: 'insensitive' } },
        ];
      }

      if (filters.role) {
        where.role = filters.role;
      }

      if (filters.isActive !== undefined) {
        where.isActive = filters.isActive;
      }

      if (filters.department) {
        where.department = { contains: filters.department, mode: 'insensitive' };
      }

      if (filters.location) {
        where.location = { contains: filters.location, mode: 'insensitive' };
      }

      if (filters.skills && filters.skills.length > 0) {
        where.skills = { hasSome: filters.skills };
      }

      if (filters.createdAfter) {
        where.createdAt = { gte: filters.createdAfter };
      }

      if (filters.createdBefore) {
        where.createdAt = { ...where.createdAt, lte: filters.createdBefore };
      }

      // Execute query with pagination
      const [users, total] = await Promise.all([
        this.prisma.user.findMany({
          where,
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            isActive: true,
            profilePicture: true,
            jobTitle: true,
            department: true,
            location: true,
            createdAt: true,
            updatedAt: true,
          },
          orderBy: filters.sortBy ? {
            [filters.sortBy]: filters.sortOrder || 'asc'
          } : { createdAt: 'desc' },
          skip: offset,
          take: limit,
        }),
        this.prisma.user.count({ where }),
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
        users: users as IUser[],
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
        filters,
      };
    } catch (error) {
      logger.error('Failed to search users:', error);
      throw error;
    }
  }

  /**
   * Get user statistics
   */
  async getUserStats(): Promise<{
    total: number;
    active: number;
    inactive: number;
    byRole: Record<UserRole, number>;
    recentlyCreated: number;
  }> {
    try {
      const cacheKey = 'user_stats';
      const cached = await this.cache.get(cacheKey);
      if (cached) {
        return cached;
      }

      const [total, active, inactive, byRole, recentlyCreated] = await Promise.all([
        this.prisma.user.count(),
        this.prisma.user.count({ where: { isActive: true } }),
        this.prisma.user.count({ where: { isActive: false } }),
        this.prisma.user.groupBy({
          by: ['role'],
          _count: { role: true },
        }),
        this.prisma.user.count({
          where: {
            createdAt: {
              gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
            },
          },
        }),
      ]);

      const roleStats = byRole.reduce((acc, item) => {
        acc[item.role] = item._count.role;
        return acc;
      }, {} as Record<UserRole, number>);

      // Ensure all roles are represented
      Object.values(UserRole).forEach(role => {
        if (!roleStats[role]) {
          roleStats[role] = 0;
        }
      });

      const stats = {
        total,
        active,
        inactive,
        byRole: roleStats,
        recentlyCreated,
      };

      // Cache for 10 minutes
      await this.cache.set(cacheKey, stats, 600);

      return stats;
    } catch (error) {
      logger.error('Failed to get user stats:', error);
      throw error;
    }
  }

  /**
   * Change user password (admin or self)
   */
  async changeUserPassword(
    userId: string,
    passwordData: ChangePasswordRequest,
    changedBy?: string
  ): Promise<void> {
    try {
      const user = await this.userModel.findById(userId);
      if (!user) {
        throw new NotFoundError('User not found');
      }

      // If not admin, verify current password
      if (changedBy !== userId) {
        const changer = await this.userModel.findById(changedBy || '');
        if (!changer || changer.role !== UserRole.ADMIN) {
          throw new AuthorizationError('Only administrators can change other users\' passwords');
        }
      } else {
        // Self password change - verify current password
        if (!passwordData.currentPassword) {
          throw new ValidationError('Current password is required');
        }

        const isCurrentPasswordValid = await bcrypt.compare(
          passwordData.currentPassword,
          user.passwordHash
        );

        if (!isCurrentPasswordValid) {
          throw new ValidationError('Current password is incorrect');
        }
      }

      // Change password
      await this.userModel.changePassword(userId, passwordData.newPassword);

      // Invalidate all user sessions to force re-login
      await this.cache.del(`refresh_token:${userId}`);
      await this.cache.del(`user_sessions:${userId}`);

      logger.info(`Password changed for user: ${user.email} (${userId}) by ${changedBy || 'self'}`);
    } catch (error) {
      logger.error('Failed to change user password:', error);
      throw error;
    }
  }

  /**
   * Invalidate user cache
   */
  private async invalidateUserCache(userId: string): Promise<void> {
    const patterns = [
      `user:${userId}:*`,
      `user_permissions:${userId}`,
      'user_stats',
    ];

    await Promise.all(patterns.map(pattern => this.cache.del(pattern)));
  }

  /**
   * Bulk operations
   */
  async bulkDeactivateUsers(userIds: string[], deactivatedBy?: string): Promise<void> {
    try {
      await this.prisma.user.updateMany({
        where: { id: { in: userIds } },
        data: { isActive: false, updatedAt: new Date() },
      });

      // Clear sessions for all users
      await Promise.all(userIds.map(userId => 
        Promise.all([
          this.cache.del(`refresh_token:${userId}`),
          this.cache.del(`user_sessions:${userId}`),
          this.invalidateUserCache(userId),
        ])
      ));

      logger.info(`Bulk deactivated ${userIds.length} users by ${deactivatedBy || 'system'}`);
    } catch (error) {
      logger.error('Failed to bulk deactivate users:', error);
      throw error;
    }
  }

  async bulkReactivateUsers(userIds: string[], reactivatedBy?: string): Promise<void> {
    try {
      await this.prisma.user.updateMany({
        where: { id: { in: userIds } },
        data: { isActive: true, updatedAt: new Date() },
      });

      // Invalidate cache for all users
      await Promise.all(userIds.map(userId => this.invalidateUserCache(userId)));

      logger.info(`Bulk reactivated ${userIds.length} users by ${reactivatedBy || 'system'}`);
    } catch (error) {
      logger.error('Failed to bulk reactivate users:', error);
      throw error;
    }
  }
}
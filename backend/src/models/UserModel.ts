import { PrismaClient, User, UserRole, Prisma } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { BaseModel } from './BaseModel';
import { 
  CreateUserRequest, 
  UpdateUserRequest, 
  UserFilters, 
  UserListQuery,
  IUser 
} from '@/types/user.types';
import { logger } from '@/utils/logger';

export class UserModel extends BaseModel {
  constructor(prisma: PrismaClient) {
    super(prisma, 'user');
  }

  async create(data: CreateUserRequest): Promise<IUser> {
    try {
      const hashedPassword = await bcrypt.hash(data.password, 12);
      
      const user = await this.prisma.user.create({
        data: {
          email: data.email,
          passwordHash: hashedPassword,
          firstName: data.firstName,
          lastName: data.lastName,
          role: data.role,
        },
        include: {
          userPermissions: true,
        },
      });

      // Remove password hash from response
      const { passwordHash, ...userWithoutPassword } = user;
      
      // Invalidate user list cache
      await this.invalidateCache('user:list:*');
      
      logger.info(`User created: ${user.email}`);
      return userWithoutPassword as IUser;
    } catch (error) {
      logger.error('Error creating user:', error);
      throw error;
    }
  }

  async findById(id: string): Promise<IUser | null> {
    const cacheKey = this.getCacheKey('findById', { id });
    
    return this.getCachedOrFetch(
      cacheKey,
      async () => {
        const user = await this.prisma.user.findUnique({
          where: { id },
          include: {
            userPermissions: true,
          },
        });

        if (!user) return null;

        const { passwordHash, ...userWithoutPassword } = user;
        return userWithoutPassword as IUser;
      },
      600 // 10 minutes cache
    );
  }

  async findByEmail(email: string): Promise<User | null> {
    const cacheKey = this.getCacheKey('findByEmail', { email });
    
    return this.getCachedOrFetch(
      cacheKey,
      async () => {
        return await this.prisma.user.findUnique({
          where: { email },
          include: {
            userPermissions: true,
          },
        });
      },
      300 // 5 minutes cache
    );
  }

  async update(id: string, data: UpdateUserRequest): Promise<IUser> {
    try {
      const user = await this.prisma.user.update({
        where: { id },
        data,
        include: {
          userPermissions: true,
        },
      });

      const { passwordHash, ...userWithoutPassword } = user;
      
      // Invalidate caches
      await this.invalidateCache(`user:findById:${id}`);
      await this.invalidateCache(`user:findByEmail:${user.email}`);
      await this.invalidateCache('user:list:*');
      
      logger.info(`User updated: ${user.email}`);
      return userWithoutPassword as IUser;
    } catch (error) {
      logger.error('Error updating user:', error);
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    try {
      const user = await this.prisma.user.update({
        where: { id },
        data: { isActive: false },
      });

      // Invalidate caches
      await this.invalidateCache(`user:findById:${id}`);
      await this.invalidateCache(`user:findByEmail:${user.email}`);
      await this.invalidateCache('user:list:*');
      
      logger.info(`User deactivated: ${user.email}`);
    } catch (error) {
      logger.error('Error deactivating user:', error);
      throw error;
    }
  }
}  
async findMany(query: UserListQuery): Promise<{ users: IUser[]; total: number }> {
    const cacheKey = this.getCacheKey('findMany', query);
    
    return this.getCachedOrFetch(
      cacheKey,
      async () => {
        const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc', ...filters } = query;
        const { skip, take } = this.getPaginationParams(page, limit);
        const orderBy = this.getSortParams(sortBy, sortOrder);

        // Build where clause
        const where: Prisma.UserWhereInput = {};
        
        if (filters.role) {
          where.role = filters.role;
        }
        
        if (filters.isActive !== undefined) {
          where.isActive = filters.isActive;
        }
        
        if (filters.search) {
          where.OR = [
            { firstName: { contains: filters.search, mode: 'insensitive' } },
            { lastName: { contains: filters.search, mode: 'insensitive' } },
            { email: { contains: filters.search, mode: 'insensitive' } },
          ];
        }

        const [users, total] = await Promise.all([
          this.prisma.user.findMany({
            where,
            skip,
            take,
            orderBy,
            include: {
              userPermissions: true,
            },
          }),
          this.prisma.user.count({ where }),
        ]);

        // Remove password hashes
        const usersWithoutPasswords = users.map(({ passwordHash, ...user }) => user) as IUser[];

        return { users: usersWithoutPasswords, total };
      },
      180 // 3 minutes cache
    );
  }

  async verifyPassword(email: string, password: string): Promise<User | null> {
    try {
      const user = await this.findByEmail(email);
      if (!user || !user.isActive) {
        return null;
      }

      const isValid = await bcrypt.compare(password, user.passwordHash);
      if (!isValid) {
        return null;
      }

      // Update last login
      await this.prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      });

      return user;
    } catch (error) {
      logger.error('Error verifying password:', error);
      return null;
    }
  }

  async changePassword(id: string, newPassword: string): Promise<void> {
    try {
      const hashedPassword = await bcrypt.hash(newPassword, 12);
      
      await this.prisma.user.update({
        where: { id },
        data: { passwordHash: hashedPassword },
      });

      logger.info(`Password changed for user ID: ${id}`);
    } catch (error) {
      logger.error('Error changing password:', error);
      throw error;
    }
  }

  async assignPermissions(userId: string, permissions: { resource: string; actions: string[] }[]): Promise<void> {
    try {
      // Delete existing permissions
      await this.prisma.userPermission.deleteMany({
        where: { userId },
      });

      // Create new permissions
      await this.prisma.userPermission.createMany({
        data: permissions.map(permission => ({
          userId,
          resource: permission.resource,
          actions: permission.actions,
        })),
      });

      // Invalidate user cache
      await this.invalidateCache(`user:findById:${userId}`);
      
      logger.info(`Permissions assigned for user ID: ${userId}`);
    } catch (error) {
      logger.error('Error assigning permissions:', error);
      throw error;
    }
  }

  async getStats(): Promise<{
    totalUsers: number;
    activeUsers: number;
    usersByRole: Record<UserRole, number>;
    recentLogins: number;
  }> {
    const cacheKey = this.getCacheKey('getStats');
    
    return this.getCachedOrFetch(
      cacheKey,
      async () => {
        const [totalUsers, activeUsers, usersByRole, recentLogins] = await Promise.all([
          this.prisma.user.count(),
          this.prisma.user.count({ where: { isActive: true } }),
          this.prisma.user.groupBy({
            by: ['role'],
            _count: { role: true },
          }),
          this.prisma.user.count({
            where: {
              lastLoginAt: {
                gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
              },
            },
          }),
        ]);

        const roleStats = Object.values(UserRole).reduce((acc, role) => {
          acc[role] = 0;
          return acc;
        }, {} as Record<UserRole, number>);

        usersByRole.forEach(group => {
          roleStats[group.role] = group._count.role;
        });

        return {
          totalUsers,
          activeUsers,
          usersByRole: roleStats,
          recentLogins,
        };
      },
      300 // 5 minutes cache
    );
  }
}
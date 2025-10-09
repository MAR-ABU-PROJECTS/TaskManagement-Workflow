import { PrismaClient, UserRole, Permission } from '@prisma/client';
import { logger } from '@/utils/logger';
import { CacheService } from '@/config/redis';
import { 
  NotFoundError, 
  ValidationError, 
  AuthorizationError 
} from '@/middleware/errorHandler';

export interface PermissionCheck {
  resource: string;
  action: string;
  context?: {
    projectId?: string;
    teamId?: string;
    userId?: string;
    resourceOwnerId?: string;
  };
}

export interface RolePermissions {
  role: UserRole;
  permissions: Permission[];
}

export interface UserPermissions {
  userId: string;
  role: UserRole;
  permissions: Permission[];
  contextualPermissions: {
    projects: { [projectId: string]: string[] };
    teams: { [teamId: string]: string[] };
  };
}

export class PermissionService {
  private prisma: PrismaClient;
  private cache: CacheService;

  // Define default role permissions
  private static readonly ROLE_PERMISSIONS: Record<UserRole, string[]> = {
    [UserRole.ADMIN]: [
      // User management
      'users:create', 'users:read', 'users:update', 'users:delete',
      'users:manage_roles', 'users:manage_permissions',
      
      // Project management
      'projects:create', 'projects:read', 'projects:update', 'projects:delete',
      'projects:manage_members', 'projects:manage_settings',
      
      // Task management
      'tasks:create', 'tasks:read', 'tasks:update', 'tasks:delete',
      'tasks:assign', 'tasks:manage_status',
      
      // Team management
      'teams:create', 'teams:read', 'teams:update', 'teams:delete',
      'teams:manage_members',
      
      // Sprint management
      'sprints:create', 'sprints:read', 'sprints:update', 'sprints:delete',
      'sprints:manage',
      
      // Reporting and analytics
      'reports:read', 'reports:create', 'reports:export',
      'analytics:read',
      
      // System administration
      'system:configure', 'system:backup', 'system:monitor',
      'integrations:manage',
    ],
    
    [UserRole.PROJECT_MANAGER]: [
      // Limited user management
      'users:read', 'users:invite',
      
      // Project management
      'projects:create', 'projects:read', 'projects:update',
      'projects:manage_members', 'projects:manage_settings',
      
      // Task management
      'tasks:create', 'tasks:read', 'tasks:update', 'tasks:delete',
      'tasks:assign', 'tasks:manage_status',
      
      // Team management (limited)
      'teams:read', 'teams:manage_members',
      
      // Sprint management
      'sprints:create', 'sprints:read', 'sprints:update', 'sprints:delete',
      'sprints:manage',
      
      // Reporting
      'reports:read', 'reports:create', 'reports:export',
      'analytics:read',
      
      // Time tracking
      'time:read', 'time:manage',
    ],
    
    [UserRole.TEAM_LEAD]: [
      // Limited user management
      'users:read',
      
      // Project access
      'projects:read', 'projects:update',
      
      // Task management
      'tasks:create', 'tasks:read', 'tasks:update',
      'tasks:assign', 'tasks:manage_status',
      
      // Team management (own team)
      'teams:read', 'teams:update',
      
      // Sprint participation
      'sprints:read', 'sprints:update',
      
      // Reporting (limited)
      'reports:read', 'analytics:read',
      
      // Time tracking
      'time:read', 'time:log',
    ],
    
    [UserRole.DEVELOPER]: [
      // Basic user access
      'users:read',
      
      // Project access
      'projects:read',
      
      // Task management (assigned tasks)
      'tasks:read', 'tasks:update', 'tasks:comment',
      
      // Team access
      'teams:read',
      
      // Sprint participation
      'sprints:read',
      
      // Time tracking
      'time:log', 'time:read',
      
      // Basic reporting
      'reports:read',
    ],
    
    [UserRole.VIEWER]: [
      // Read-only access
      'users:read',
      'projects:read',
      'tasks:read',
      'teams:read',
      'sprints:read',
      'reports:read',
    ],
  };

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.cache = CacheService.getInstance();
  }

  /**
   * Check if user has permission for a specific action
   */
  async hasPermission(
    userId: string, 
    permission: PermissionCheck
  ): Promise<boolean> {
    try {
      const userPermissions = await this.getUserPermissions(userId);
      
      // Check role-based permissions first
      const hasRolePermission = this.checkRolePermission(
        userPermissions.role, 
        permission.resource, 
        permission.action
      );
      
      if (hasRolePermission) {
        // For admin users, grant access immediately
        if (userPermissions.role === UserRole.ADMIN) {
          return true;
        }
        
        // Check contextual permissions if context is provided
        if (permission.context) {
          return await this.checkContextualPermission(
            userId, 
            permission, 
            userPermissions
          );
        }
        
        return true;
      }
      
      // Check custom user permissions
      const hasCustomPermission = userPermissions.permissions.some(p => 
        p.resource === permission.resource && 
        p.actions.includes(permission.action)
      );
      
      if (hasCustomPermission && permission.context) {
        return await this.checkContextualPermission(
          userId, 
          permission, 
          userPermissions
        );
      }
      
      return hasCustomPermission;
    } catch (error) {
      logger.error('Permission check failed:', error);
      return false;
    }
  }

  /**
   * Get all permissions for a user
   */
  async getUserPermissions(userId: string): Promise<UserPermissions> {
    const cacheKey = `user_permissions:${userId}`;
    
    // Try to get from cache first
    const cached = await this.cache.get<UserPermissions>(cacheKey);
    if (cached) {
      return cached;
    }
    
    // Fetch from database
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        userPermissions: true,
        projectMembers: {
          include: {
            project: true,
          },
        },
        teamMembers: {
          include: {
            team: true,
          },
        },
      },
    });
    
    if (!user) {
      throw new NotFoundError('User not found');
    }
    
    const permissions: UserPermissions = {
      userId,
      role: user.role,
      permissions: user.userPermissions,
      contextualPermissions: {
        projects: {},
        teams: {},
      },
    };
    
    // Build contextual permissions
    user.projectMembers.forEach(pm => {
      permissions.contextualPermissions.projects[pm.projectId] = [pm.role];
    });
    
    user.teamMembers.forEach(tm => {
      permissions.contextualPermissions.teams[tm.teamId] = [tm.role];
    });
    
    // Cache for 5 minutes
    await this.cache.set(cacheKey, permissions, 300);
    
    return permissions;
  }

  /**
   * Grant permission to user
   */
  async grantPermission(
    userId: string, 
    resource: string, 
    actions: string[]
  ): Promise<void> {
    try {
      // Check if permission already exists
      const existingPermission = await this.prisma.permission.findUnique({
        where: {
          userId_resource: {
            userId,
            resource,
          },
        },
      });
      
      if (existingPermission) {
        // Update existing permission
        const updatedActions = Array.from(
          new Set([...existingPermission.actions, ...actions])
        );
        
        await this.prisma.permission.update({
          where: { id: existingPermission.id },
          data: { actions: updatedActions },
        });
      } else {
        // Create new permission
        await this.prisma.permission.create({
          data: {
            userId,
            resource,
            actions,
          },
        });
      }
      
      // Invalidate cache
      await this.invalidateUserPermissionsCache(userId);
      
      logger.info(`Permission granted to user ${userId}: ${resource}:${actions.join(',')}`);
    } catch (error) {
      logger.error('Failed to grant permission:', error);
      throw error;
    }
  }

  /**
   * Revoke permission from user
   */
  async revokePermission(
    userId: string, 
    resource: string, 
    actions?: string[]
  ): Promise<void> {
    try {
      const permission = await this.prisma.permission.findUnique({
        where: {
          userId_resource: {
            userId,
            resource,
          },
        },
      });
      
      if (!permission) {
        return; // Permission doesn't exist
      }
      
      if (!actions || actions.length === 0) {
        // Remove entire permission
        await this.prisma.permission.delete({
          where: { id: permission.id },
        });
      } else {
        // Remove specific actions
        const remainingActions = permission.actions.filter(
          action => !actions.includes(action)
        );
        
        if (remainingActions.length === 0) {
          await this.prisma.permission.delete({
            where: { id: permission.id },
          });
        } else {
          await this.prisma.permission.update({
            where: { id: permission.id },
            data: { actions: remainingActions },
          });
        }
      }
      
      // Invalidate cache
      await this.invalidateUserPermissionsCache(userId);
      
      logger.info(`Permission revoked from user ${userId}: ${resource}:${actions?.join(',') || 'all'}`);
    } catch (error) {
      logger.error('Failed to revoke permission:', error);
      throw error;
    }
  }

  /**
   * Change user role
   */
  async changeUserRole(userId: string, newRole: UserRole): Promise<void> {
    try {
      await this.prisma.user.update({
        where: { id: userId },
        data: { role: newRole },
      });
      
      // Invalidate cache
      await this.invalidateUserPermissionsCache(userId);
      
      logger.info(`User role changed: ${userId} -> ${newRole}`);
    } catch (error) {
      logger.error('Failed to change user role:', error);
      throw error;
    }
  }

  /**
   * Get all permissions for a role
   */
  getRolePermissions(role: UserRole): string[] {
    return PermissionService.ROLE_PERMISSIONS[role] || [];
  }

  /**
   * Check if role has specific permission
   */
  private checkRolePermission(
    role: UserRole, 
    resource: string, 
    action: string
  ): boolean {
    const rolePermissions = this.getRolePermissions(role);
    return rolePermissions.includes(`${resource}:${action}`);
  }

  /**
   * Check contextual permissions (project/team membership, ownership, etc.)
   */
  private async checkContextualPermission(
    userId: string,
    permission: PermissionCheck,
    userPermissions: UserPermissions
  ): Promise<boolean> {
    const { context } = permission;
    if (!context) return true;

    // Check resource ownership
    if (context.resourceOwnerId && context.resourceOwnerId === userId) {
      return true;
    }

    // Check project membership
    if (context.projectId) {
      const hasProjectAccess = await this.checkProjectMembership(
        userId, 
        context.projectId, 
        permission
      );
      if (!hasProjectAccess) return false;
    }

    // Check team membership
    if (context.teamId) {
      const hasTeamAccess = await this.checkTeamMembership(
        userId, 
        context.teamId, 
        permission
      );
      if (!hasTeamAccess) return false;
    }

    return true;
  }

  /**
   * Check project membership and permissions
   */
  private async checkProjectMembership(
    userId: string, 
    projectId: string, 
    permission: PermissionCheck
  ): Promise<boolean> {
    const projectMember = await this.prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId,
        },
      },
    });

    if (!projectMember) {
      // Check if user is member of project's team
      const project = await this.prisma.project.findUnique({
        where: { id: projectId },
        include: {
          team: {
            include: {
              members: {
                where: { userId },
              },
            },
          },
        },
      });

      return project?.team.members.length > 0;
    }

    return true;
  }

  /**
   * Check team membership and permissions
   */
  private async checkTeamMembership(
    userId: string, 
    teamId: string, 
    permission: PermissionCheck
  ): Promise<boolean> {
    const teamMember = await this.prisma.teamMember.findUnique({
      where: {
        teamId_userId: {
          teamId,
          userId,
        },
      },
    });

    return !!teamMember;
  }

  /**
   * Invalidate user permissions cache
   */
  private async invalidateUserPermissionsCache(userId: string): Promise<void> {
    await this.cache.del(`user_permissions:${userId}`);
  }

  /**
   * Bulk permission operations
   */
  async bulkGrantPermissions(
    userIds: string[], 
    resource: string, 
    actions: string[]
  ): Promise<void> {
    try {
      const operations = userIds.map(userId => 
        this.grantPermission(userId, resource, actions)
      );
      
      await Promise.all(operations);
      
      logger.info(`Bulk permissions granted to ${userIds.length} users: ${resource}:${actions.join(',')}`);
    } catch (error) {
      logger.error('Bulk permission grant failed:', error);
      throw error;
    }
  }

  /**
   * Get users with specific permission
   */
  async getUsersWithPermission(
    resource: string, 
    action: string
  ): Promise<string[]> {
    // Get users with custom permissions
    const customPermissions = await this.prisma.permission.findMany({
      where: {
        resource,
        actions: {
          has: action,
        },
      },
      select: { userId: true },
    });

    // Get users with role-based permissions
    const rolesWithPermission = Object.entries(PermissionService.ROLE_PERMISSIONS)
      .filter(([_, permissions]) => permissions.includes(`${resource}:${action}`))
      .map(([role]) => role as UserRole);

    const roleBasedUsers = await this.prisma.user.findMany({
      where: {
        role: { in: rolesWithPermission },
        isActive: true,
      },
      select: { id: true },
    });

    // Combine and deduplicate
    const allUserIds = [
      ...customPermissions.map(p => p.userId),
      ...roleBasedUsers.map(u => u.id),
    ];

    return Array.from(new Set(allUserIds));
  }
}
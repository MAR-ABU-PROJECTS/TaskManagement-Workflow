import { UserRole, Department } from "../types/enums";
import prisma from "../db/prisma";

/**
 * Role Hierarchy Service
 *
 * Implements Jira-style hierarchical role system with strict promotion/demotion rules.
 *
 * Hierarchy (top to bottom):
 * 1. SUPER_ADMIN - Outside organization, controls everything
 * 2. CEO - Top of organization, controls department heads
 * 3. HOO & HR - Department heads, control Admins in their departments
 * 4. ADMIN - Manages tasks, cannot change roles
 * 5. STAFF - Base level, default role
 */
export class RoleHierarchyService {
  /**
   * Role hierarchy levels (higher number = more power)
   */
  private static ROLE_LEVELS: Record<UserRole, number> = {
    [UserRole.SUPER_ADMIN]: 100,
    [UserRole.CEO]: 80,
    [UserRole.HOO]: 60,
    [UserRole.HR]: 60,
    [UserRole.ADMIN]: 40,
    [UserRole.STAFF]: 20,
  };

  /**
   * Check if promoter has authority to promote/demote target user
   */
  static canModifyUser(
    promoterRole: UserRole,
    promoterIsSuperAdmin: boolean,
    targetRole: UserRole,
    targetIsSuperAdmin: boolean
  ): { allowed: boolean; reason?: string } {
    // Super Admins cannot be modified by anyone
    if (targetIsSuperAdmin) {
      return {
        allowed: false,
        reason: "Super Admins are immutable and cannot be modified",
      };
    }

    // Only Super Admin can modify anyone
    if (promoterIsSuperAdmin) {
      return { allowed: true };
    }

    // No one can create or promote to Super Admin (only exists as 2 permanent accounts)
    if (targetRole === UserRole.SUPER_ADMIN) {
      return {
        allowed: false,
        reason:
          "Super Admin role cannot be assigned. Only 2 permanent accounts exist.",
      };
    }

    // CEO can modify HOO, HR, and ADMIN
    if (promoterRole === UserRole.CEO) {
      if (targetRole === UserRole.CEO) {
        return {
          allowed: false,
          reason: "Only Super Admin can modify another CEO",
        };
      }
      return { allowed: true };
    }

    // HOO can only modify ADMIN in OPS department
    if (promoterRole === UserRole.HOO) {
      if (targetRole === UserRole.ADMIN) {
        return { allowed: true };
      }
      return {
        allowed: false,
        reason: "HOO can only promote/demote Admins",
      };
    }

    // HR can only modify ADMIN in HR department
    if (promoterRole === UserRole.HR) {
      if (targetRole === UserRole.ADMIN) {
        return { allowed: true };
      }
      return {
        allowed: false,
        reason: "HR can only promote/demote Admins",
      };
    }

    // ADMIN and STAFF cannot modify anyone
    return {
      allowed: false,
      reason: "You do not have permission to modify user roles",
    };
  }

  /**
   * Validate promotion from one role to another
   */
  static canPromoteToRole(
    promoterRole: UserRole,
    promoterIsSuperAdmin: boolean,
    currentRole: UserRole,
    targetRole: UserRole
  ): { allowed: boolean; reason?: string; requiredDepartment?: Department } {
    // Cannot promote to Super Admin
    if (targetRole === UserRole.SUPER_ADMIN) {
      return {
        allowed: false,
        reason: "Cannot promote to Super Admin role",
      };
    }

    // Check if promoter has authority
    const canModify = this.canModifyUser(
      promoterRole,
      promoterIsSuperAdmin,
      targetRole,
      false
    );
    if (!canModify.allowed) {
      return canModify;
    }

    // Super Admin can promote to any role
    if (promoterIsSuperAdmin) {
      // Auto-assign departments for HOO and HR
      if (targetRole === UserRole.HOO) {
        return { allowed: true, requiredDepartment: Department.OPS };
      }
      if (targetRole === UserRole.HR) {
        return { allowed: true, requiredDepartment: Department.HR };
      }
      return { allowed: true };
    }

    // CEO can promote to HOO, HR, or ADMIN
    if (promoterRole === UserRole.CEO) {
      if (targetRole === UserRole.CEO) {
        return {
          allowed: false,
          reason: "Only Super Admin can promote to CEO",
        };
      }
      if (targetRole === UserRole.HOO) {
        return { allowed: true, requiredDepartment: Department.OPS };
      }
      if (targetRole === UserRole.HR) {
        return { allowed: true, requiredDepartment: Department.HR };
      }
      return { allowed: true };
    }

    // HOO can only promote STAFF to ADMIN in OPS department
    if (promoterRole === UserRole.HOO) {
      if (currentRole === UserRole.STAFF && targetRole === UserRole.ADMIN) {
        return { allowed: true, requiredDepartment: Department.OPS };
      }
      return {
        allowed: false,
        reason: "HOO can only promote Staff to Admin in Operations department",
      };
    }

    // HR can only promote STAFF to ADMIN in HR department
    if (promoterRole === UserRole.HR) {
      if (currentRole === UserRole.STAFF && targetRole === UserRole.ADMIN) {
        return { allowed: true, requiredDepartment: Department.HR };
      }
      return {
        allowed: false,
        reason: "HR can only promote Staff to Admin in HR department",
      };
    }

    return {
      allowed: false,
      reason: "Invalid promotion path",
    };
  }

  /**
   * Validate demotion from one role to another
   */
  static canDemoteToRole(
    promoterRole: UserRole,
    promoterIsSuperAdmin: boolean,
    currentRole: UserRole,
    targetRole: UserRole
  ): { allowed: boolean; reason?: string } {
    // Cannot demote to Super Admin (it doesn't make sense)
    if (targetRole === UserRole.SUPER_ADMIN) {
      return {
        allowed: false,
        reason: "Cannot demote to Super Admin role",
      };
    }

    // Check if promoter has authority over target
    const canModify = this.canModifyUser(
      promoterRole,
      promoterIsSuperAdmin,
      currentRole,
      false
    );
    if (!canModify.allowed) {
      return canModify;
    }

    // Must be demoting to a lower role
    if (this.ROLE_LEVELS[targetRole] >= this.ROLE_LEVELS[currentRole]) {
      return {
        allowed: false,
        reason: "Target role must be lower than current role",
      };
    }

    return { allowed: true };
  }

  /**
   * Verify Super Admin count (should only be 2)
   */
  static async verifySuperAdminCount(): Promise<{
    valid: boolean;
    count: number;
    reason?: string;
  }> {
    const count = await prisma.user.count({
      where: { isSuperAdmin: true },
    });

    if (count > 2) {
      return {
        valid: false,
        count,
        reason: "More than 2 Super Admins exist in the system",
      };
    }

    return { valid: true, count };
  }

  /**
   * Get users who can be promoted by a specific user
   */
  static async getPromotableUsers(promoterId: string): Promise<any[]> {
    const promoter = await prisma.user.findUnique({
      where: { id: promoterId },
      select: {
        role: true,
        isSuperAdmin: true,
        department: true,
      },
    });

    if (!promoter) {
      return [];
    }

    let whereClause: any = {
      id: { not: promoterId }, // Cannot promote self
      isSuperAdmin: false, // Cannot modify Super Admins
    };

    if (promoter.isSuperAdmin) {
      // Super Admin can modify anyone except other Super Admins
      // Already handled in whereClause
    } else if (promoter.role === UserRole.CEO) {
      // CEO can modify HOO, HR, ADMIN, STAFF
      whereClause.role = {
        in: [UserRole.HOO, UserRole.HR, UserRole.ADMIN, UserRole.STAFF],
      };
    } else if (promoter.role === UserRole.HOO) {
      // HOO can only modify ADMINs in OPS department
      whereClause.role = { in: [UserRole.ADMIN, UserRole.STAFF] };
      whereClause.department = Department.OPS;
    } else if (promoter.role === UserRole.HR) {
      // HR can only modify ADMINs in HR department
      whereClause.role = { in: [UserRole.ADMIN, UserRole.STAFF] };
      whereClause.department = Department.HR;
    } else {
      // ADMIN and STAFF cannot modify anyone
      return [];
    }

    return await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        department: true,
      },
    });
  }

  /**
   * Get available roles a user can promote someone to
   */
  static getAvailablePromotionRoles(
    promoterRole: UserRole,
    promoterIsSuperAdmin: boolean
  ): UserRole[] {
    if (promoterIsSuperAdmin) {
      return [
        UserRole.CEO,
        UserRole.HOO,
        UserRole.HR,
        UserRole.ADMIN,
        UserRole.STAFF,
      ];
    }

    switch (promoterRole) {
      case UserRole.CEO:
        return [UserRole.HOO, UserRole.HR, UserRole.ADMIN, UserRole.STAFF];
      case UserRole.HOO:
      case UserRole.HR:
        return [UserRole.ADMIN, UserRole.STAFF];
      default:
        return [];
    }
  }

  /**
   * Check if user has any assigned tasks (for removal validation)
   */
  static async hasAssignedTasks(userId: string): Promise<{
    hasTasks: boolean;
    taskCount: number;
    taskIds: string[];
  }> {
    const tasks = await prisma.task.findMany({
      where: {
        OR: [
          { assigneeId: userId },
          { creatorId: userId },
          { approvedById: userId },
        ],
      },
      select: { id: true },
    });

    return {
      hasTasks: tasks.length > 0,
      taskCount: tasks.length,
      taskIds: tasks.map((t) => t.id),
    };
  }

  /**
   * Reassign user's tasks before removal
   */
  static async reassignUserTasks(
    fromUserId: string,
    toUserId: string
  ): Promise<{ reassignedCount: number }> {
    // Reassign assigned tasks
    const assignedUpdate = await prisma.task.updateMany({
      where: { assigneeId: fromUserId },
      data: { assigneeId: toUserId },
    });

    // Reassign created tasks
    const createdUpdate = await prisma.task.updateMany({
      where: { creatorId: fromUserId },
      data: { creatorId: toUserId },
    });

    // Reassign approved tasks
    const approvedUpdate = await prisma.task.updateMany({
      where: { approvedById: fromUserId },
      data: { approvedById: toUserId },
    });

    return {
      reassignedCount:
        assignedUpdate.count + createdUpdate.count + approvedUpdate.count,
    };
  }
}

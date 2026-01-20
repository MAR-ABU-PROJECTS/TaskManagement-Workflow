import { Request, Response } from "express";
import prisma from "../db/prisma";
import { UserRole } from "../types/enums";
import { RoleHierarchyService } from "../services/RoleHierarchyService";
import emailService from "../services/EmailService";

/**
 * User Hierarchy Controller
 *
 * Manages user promotions, demotions, and removals with strict hierarchical validation.
 * Implements Jira-style role-based access control.
 */
class UserHierarchyController {
  /**
   * Promote a user to a higher role
   * POST /api/users/:userId/promote
   */
  async promoteUser(req: Request, res: Response) {
    try {
      const { userId } = req.params;
      const { newRole } = req.body;
      const promoterId = req.user?.id;

      if (!promoterId) {
        return res
          .status(403)
          .json({ message: "Forbidden: Authentication required" });
      }

      // Get promoter details
      const promoter = await prisma.user.findUnique({
        where: { id: promoterId },
        select: {
          isSuperAdmin: true,
          role: true,
        },
      });

      if (!promoter) {
        return res.status(404).json({ message: "Promoter not found" });
      }

      if (!promoter.isSuperAdmin) {
        return res.status(403).json({
          message: "Only Super Admins can delete user accounts",
        });
      }

      // Get target user
      const targetUser = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isSuperAdmin: true,
        },
      });

      if (!targetUser) {
        return res.status(404).json({ message: "User not found" });
      }

      // Validate promotion
      const validation = RoleHierarchyService.canPromoteToRole(
        promoter.role as UserRole,
        promoter.isSuperAdmin,
        targetUser.role as UserRole,
        newRole as UserRole
      );

      if (!validation.allowed) {
        return res.status(403).json({ message: validation.reason });
      }

      // Perform promotion
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          role: newRole as UserRole,
          promotedById: promoterId,
          promotedAt: new Date(),
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          promotedAt: true,
          promotedBy: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
        },
      });

      // Send promotion email (async, don't block response)
      emailService
        .sendPromotionEmail(updatedUser.email, {
          userName: updatedUser.name,
          oldRole: targetUser.role as string,
          newRole: newRole as string,
          promotedBy: updatedUser.promotedBy?.name || "Administrator",
        })
        .catch((error) =>
          console.error("Failed to send promotion email:", error)
        );

      return res.json({
        message: `User promoted to ${newRole}`,
        user: updatedUser,
      });
    } catch (error: any) {
      console.error("Promotion error:", error);
      return res.status(500).json({
        message: "Failed to promote user",
        error: error.message,
      });
    }
  }

  /**
   * Demote a user to a lower role
   * POST /api/users/:userId/demote
   */
  async demoteUser(req: Request, res: Response) {
    try {
      const { userId } = req.params;
      const { newRole } = req.body;
      const promoterId = req.user?.id;

      if (!promoterId) {
        return res
          .status(403)
          .json({ message: "Forbidden: Authentication required" });
      }

      // Get promoter details
      const promoter = await prisma.user.findUnique({
        where: { id: promoterId },
        select: {
          isSuperAdmin: true,
          role: true,
        },
      });

      if (!promoter) {
        return res.status(404).json({ message: "Promoter not found" });
      }

      // Get target user
      const targetUser = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isSuperAdmin: true,
        },
      });

      if (!targetUser) {
        return res.status(404).json({ message: "User not found" });
      }

      // Validate demotion
      const validation = RoleHierarchyService.canDemoteToRole(
        promoter.role as UserRole,
        promoter.isSuperAdmin,
        targetUser.role as UserRole,
        newRole as UserRole
      );

      if (!validation.allowed) {
        return res.status(403).json({ message: validation.reason });
      }

      // Perform demotion
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          role: newRole as UserRole,
          promotedById: promoterId,
          promotedAt: new Date(),
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          promotedAt: true,
          promotedBy: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
        },
      });

      // Send demotion email (async, don't block response)
      emailService
        .sendDemotionEmail(updatedUser.email, {
          userName: updatedUser.name,
          oldRole: targetUser.role as string,
          newRole: newRole as string,
          demotedBy: updatedUser.promotedBy?.name || "Administrator",
        })
        .catch((error) =>
          console.error("Failed to send demotion email:", error)
        );

      return res.json({
        message: `User demoted to ${newRole}`,
        user: updatedUser,
      });
    } catch (error: any) {
      console.error("Demotion error:", error);
      return res.status(500).json({
        message: "Failed to demote user",
        error: error.message,
      });
    }
  }

  /**
   * Get users who can be promoted by the current user
   * GET /api/users/promotable
   */
  async getPromotableUsers(req: Request, res: Response) {
    try {
      const promoterId = req.user?.id;

      if (!promoterId) {
        return res
          .status(403)
          .json({ message: "Forbidden: Authentication required" });
      }

      const users = await RoleHierarchyService.getPromotableUsers(promoterId);

      return res.json({ users });
    } catch (error: any) {
      console.error("Get promotable users error:", error);
      return res.status(500).json({
        message: "Failed to get promotable users",
        error: error.message,
      });
    }
  }

  /**
   * Get available promotion roles for current user
   * GET /api/users/available-roles
   */
  async getAvailableRoles(req: Request, res: Response) {
    try {
      const userRole = req.user?.role as UserRole;
      const promoter = await prisma.user.findUnique({
        where: { id: req.user?.id },
        select: { isSuperAdmin: true },
      });

      if (!promoter) {
        return res.status(404).json({ message: "User not found" });
      }

      const roles = RoleHierarchyService.getAvailablePromotionRoles(
        userRole,
        promoter.isSuperAdmin
      );

      return res.json({ roles });
    } catch (error: any) {
      console.error("Get available roles error:", error);
      return res.status(500).json({
        message: "Failed to get available roles",
        error: error.message,
      });
    }
  }

  /**
   * Remove a user from the system
   * DELETE /api/users/:userId
   */
  async removeUser(req: Request, res: Response) {
    try {
      const { userId } = req.params;
      const { reassignToUserId } = req.body;
      const promoterId = req.user?.id;

      if (!promoterId) {
        return res
          .status(403)
          .json({ message: "Forbidden: Authentication required" });
      }

      // Get promoter details
      const promoter = await prisma.user.findUnique({
        where: { id: promoterId },
        select: {
          isSuperAdmin: true,
          role: true,
        },
      });

      if (!promoter) {
        return res.status(404).json({ message: "Promoter not found" });
      }

      // Get target user
      const targetUser = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isSuperAdmin: true,
        },
      });

      if (!targetUser) {
        return res.status(404).json({ message: "User not found" });
      }

      if (targetUser.isSuperAdmin) {
        return res.status(403).json({
          message: "Super Admin accounts cannot be deleted",
        });
      }

      // Check for assigned tasks
      const taskCheck = await RoleHierarchyService.hasAssignedTasks(userId!);

      if (taskCheck.hasTasks) {
        if (!reassignToUserId) {
          return res.status(400).json({
            message: `User has ${taskCheck.taskCount} assigned tasks. Please provide reassignToUserId to reassign them before removal.`,
            taskCount: taskCheck.taskCount,
            taskIds: taskCheck.taskIds,
          });
        }

        // Verify reassign target exists
        const reassignTarget = await prisma.user.findUnique({
          where: { id: reassignToUserId },
          select: { id: true, name: true },
        });

        if (!reassignTarget) {
          return res.status(404).json({
            message: "Reassignment target user not found",
          });
        }

        // Reassign tasks
        await RoleHierarchyService.reassignUserTasks(userId!, reassignToUserId);
      }

      // Delete user
      await prisma.user.delete({
        where: { id: userId! },
      });

      return res.json({
        message: `User ${targetUser.name} (${targetUser.email}) removed successfully`,
        tasksReassigned: taskCheck.hasTasks,
        taskCount: taskCheck.taskCount,
      });
    } catch (error: any) {
      console.error("Remove user error:", error);
      return res.status(500).json({
        message: "Failed to remove user",
        error: error.message,
      });
    }
  }

  /**
   * Get all users with their hierarchy info
   * GET /api/users/hierarchy
   */
  async getUserHierarchy(req: Request, res: Response) {
    try {
      const currentUserId = req.user?.id;
      const currentUser = await prisma.user.findUnique({
        where: { id: currentUserId },
        select: {
          role: true,
          isSuperAdmin: true,
        },
      });

      if (!currentUser) {
        return res.status(404).json({ message: "User not found" });
      }

      // Build query based on user's role
      let whereClause: any = {};

      if (!currentUser.isSuperAdmin) {
        if (currentUser.role === UserRole.CEO) {
          // CEO sees everyone except Super Admins
          whereClause.isSuperAdmin = false;
        } else if (
          currentUser.role === UserRole.HOO ||
          currentUser.role === UserRole.HR
        ) {
          // HOO and HR see all staff except Super Admins
          whereClause.isSuperAdmin = false;
        } else {
          // ADMIN and STAFF see only themselves
          whereClause.id = currentUserId;
        }
      }
      // Super Admin sees everyone

      const users = await prisma.user.findMany({
        where: whereClause,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isSuperAdmin: true,
          isActive: true,
          promotedAt: true,
          createdAt: true,
          promotedBy: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
        },
        orderBy: [{ role: "asc" }, { name: "asc" }],
      });

      return res.json({ users });
    } catch (error: any) {
      console.error("Get user hierarchy error:", error);
      return res.status(500).json({
        message: "Failed to get user hierarchy",
        error: error.message,
      });
    }
  }

  /**
   * Verify Super Admin count
   * GET /api/users/super-admin/verify
   */
  async verifySuperAdminCount(req: Request, res: Response) {
    try {
      const currentUser = await prisma.user.findUnique({
        where: { id: req.user?.id },
        select: { isSuperAdmin: true },
      });

      if (!currentUser?.isSuperAdmin) {
        return res
          .status(403)
          .json({ message: "Only Super Admins can verify Super Admin count" });
      }

      const verification = await RoleHierarchyService.verifySuperAdminCount();

      return res.json(verification);
    } catch (error: any) {
      console.error("Verify Super Admin count error:", error);
      return res.status(500).json({
        message: "Failed to verify Super Admin count",
        error: error.message,
      });
    }
  }
}

export default new UserHierarchyController();

import { Request, Response, NextFunction } from "express";
import prisma from "../db/prisma";
import { UserRole } from "../types/enums";

/**
 * Middleware to verify user is a Super Admin
 */
export const requireSuperAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { isSuperAdmin: true, role: true },
    });

    if (!user || !user.isSuperAdmin) {
      res.status(403).json({
        message: "Access denied. Super Admin privileges required.",
      });
      return;
    }

    next();
  } catch (error: any) {
    console.error("Super Admin verification error:", error);
    res.status(500).json({
      message: "Failed to verify Super Admin status",
      error: error.message,
    });
  }
};

/**
 * Middleware to verify user can manage other users (CEO, HOO, HR, or Super Admin)
 */
export const canManageUsers = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { isSuperAdmin: true, role: true },
    });

    if (!user) {
      res.status(401).json({ message: "User not found" });
      return;
    }

    // Super Admin, CEO, HOO, or HR can manage users
    const allowedRoles = [UserRole.CEO, UserRole.HOO, UserRole.HR];

    if (!user.isSuperAdmin && !allowedRoles.includes(user.role as UserRole)) {
      res.status(403).json({
        message: "Access denied. User management privileges required.",
      });
      return;
    }

    next();
  } catch (error: any) {
    console.error("User management verification error:", error);
    res.status(500).json({
      message: "Failed to verify user management permissions",
      error: error.message,
    });
  }
};

/**
 * Middleware to prevent modification of Super Admin accounts
 */
export const protectSuperAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return next();
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { isSuperAdmin: true, name: true },
    });

    if (!targetUser) {
      return res.status(404).json({ message: "User not found" });
    }

    if (targetUser.isSuperAdmin) {
      // Check if requester is also Super Admin
      const requester = await prisma.user.findUnique({
        where: { id: req.user?.id },
        select: { isSuperAdmin: true },
      });

      if (!requester?.isSuperAdmin) {
        return res.status(403).json({
          message: "Super Admin accounts are protected and cannot be modified.",
        });
      }
    }

    next();
  } catch (error: any) {
    console.error("Super Admin protection error:", error);
    return res.status(500).json({
      message: "Failed to verify Super Admin protection",
      error: error.message,
    });
  }
};

/**
 * Middleware to verify role hierarchy authority
 */
export const hasRoleAuthority = (minimumRole: UserRole) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { isSuperAdmin: true, role: true },
      });

      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      // Super Admin always has authority
      if (user.isSuperAdmin) {
        return next();
      }

      // Define role hierarchy levels
      const roleLevel: Record<UserRole, number> = {
        [UserRole.SUPER_ADMIN]: 100,
        [UserRole.CEO]: 80,
        [UserRole.HOO]: 60,
        [UserRole.HR]: 60,
        [UserRole.ADMIN]: 40,
        [UserRole.STAFF]: 20,
      };

      if (roleLevel[user.role] < roleLevel[minimumRole]) {
        return res.status(403).json({
          message: `Access denied. ${minimumRole} role or higher required.`,
        });
      }

      next();
    } catch (error: any) {
      console.error("Role authority verification error:", error);
      return res.status(500).json({
        message: "Failed to verify role authority",
        error: error.message,
      });
    }
  };
};

/**
 * Middleware to verify department-level authority
 */
export const hasDepartmentAuthority = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { isSuperAdmin: true, role: true, department: true },
    });

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    // Super Admin and CEO have authority across all departments
    if (user.isSuperAdmin || user.role === UserRole.CEO) {
      return next();
    }

    // Store department in request for later use (optional)
    if (user.department) {
      req.body.requesterDepartment = user.department;
    }

    next();
  } catch (error: any) {
    console.error("Department authority verification error:", error);
    return res.status(500).json({
      message: "Failed to verify department authority",
      error: error.message,
    });
  }
};

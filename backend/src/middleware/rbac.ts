import { Request, Response, NextFunction } from "express";
import {
  UserRole,
  ROLE_HIERARCHY,
  Permission,
  ProjectRole,
} from "../types/enums";
import PermissionService from "../services/PermissionService";

/**
 * Middleware to check if user has one of the required roles
 */
export function requireRoles(...roles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res
        .status(403)
        .json({ message: "Forbidden: Authentication required" });
    }

    const userRole = req.user.role as UserRole;

    if (!roles.includes(userRole)) {
      return res.status(403).json({
        message: "Forbidden: Insufficient permissions",
        required: roles,
        current: userRole,
      });
    }

    return next();
  };
}

/**
 * Middleware to check if user has minimum role level
 */
export function requireMinRole(minRole: UserRole) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res
        .status(403)
        .json({ message: "Forbidden: Authentication required" });
    }

    const userRole = req.user.role as UserRole;
    const userLevel = ROLE_HIERARCHY[userRole];
    const minLevel = ROLE_HIERARCHY[minRole];

    if (userLevel < minLevel) {
      return res.status(403).json({
        message: "Forbidden: Insufficient permissions",
        required: minRole,
        current: userRole,
      });
    }

    return next();
  };
}

/**
 * Check if user can create projects
 * CEO, HOO, HR, and optionally ADMIN can create
 */
export function canCreateProject(
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (!req.user) {
    return res
      .status(403)
      .json({ message: "Forbidden: Authentication required" });
  }

  const userRole = req.user.role as UserRole;
  const allowedRoles: UserRole[] = [
    UserRole.CEO,
    UserRole.HOO,
    UserRole.HR,
    UserRole.ADMIN,
  ];

  if (!allowedRoles.includes(userRole)) {
    return res.status(403).json({
      message: "Forbidden: Only CEO, HOO, HR, and ADMIN can create projects",
    });
  }

  return next();
}

/**
 * Check if user can approve tasks
 * CEO, HOO, and HR can approve
 */
export function canApproveTask(
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (!req.user) {
    return res
      .status(403)
      .json({ message: "Forbidden: Authentication required" });
  }

  const userRole = req.user.role as UserRole;
  const allowedRoles: UserRole[] = [UserRole.CEO, UserRole.HOO, UserRole.HR];

  if (!allowedRoles.includes(userRole)) {
    return res.status(403).json({
      message: "Forbidden: Only CEO, HOO, and HR can approve tasks",
    });
  }

  return next();
}

/**
 * Check if user is CEO
 */
export const isCEO = requireRoles(UserRole.CEO);

/**
 * Check if user is CEO, HOO, or HR
 */
export const isManagement = requireRoles(
  UserRole.CEO,
  UserRole.HOO,
  UserRole.HR
);

/**
 * Check if user is Admin or higher
 */
export const isAdminOrHigher = requireMinRole(UserRole.ADMIN);

// ============================================================================
// JIRA-LIKE PROJECT PERMISSION MIDDLEWARE
// ============================================================================

/**
 * Check if user has specific permission in a project
 * Uses project-level permission system
 */
export function hasProjectPermission(permission: Permission) {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res
        .status(403)
        .json({ message: "Forbidden: Authentication required" });
    }

    const projectId =
      req.params.id || req.params.projectId || req.body.projectId;

    if (!projectId) {
      return res.status(400).json({ message: "Project ID required" });
    }

    try {
      const hasPermission = await PermissionService.hasProjectPermission(
        req.user.id,
        projectId,
        permission
      );

      if (!hasPermission) {
        return res.status(403).json({
          message: `Forbidden: ${permission} permission required`,
        });
      }

      return next();
    } catch (error) {
      return res.status(500).json({ message: "Permission check failed" });
    }
  };
}

/**
 * Check if user can edit a specific issue
 */
export async function canEditIssue(
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (!req.user) {
    return res
      .status(403)
      .json({ message: "Forbidden: Authentication required" });
  }

  const taskId = req.params.id || req.params.taskId;

  if (!taskId) {
    return res.status(400).json({ message: "Task ID required" });
  }

  try {
    const canEdit = await PermissionService.canEditIssue(req.user.id, taskId);

    if (!canEdit) {
      return res.status(403).json({
        message: "Forbidden: You cannot edit this issue",
      });
    }

    return next();
  } catch (error) {
    return res.status(500).json({ message: "Permission check failed" });
  }
}

/**
 * Check if user can delete a specific issue
 */
export async function canDeleteIssue(
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (!req.user) {
    return res
      .status(403)
      .json({ message: "Forbidden: Authentication required" });
  }

  const taskId = req.params.id || req.params.taskId;

  if (!taskId) {
    return res.status(400).json({ message: "Task ID required" });
  }

  try {
    const canDelete = await PermissionService.canDeleteIssue(
      req.user.id,
      taskId
    );

    if (!canDelete) {
      return res.status(403).json({
        message: "Forbidden: You cannot delete this issue",
      });
    }

    return next();
  } catch (error) {
    return res.status(500).json({ message: "Permission check failed" });
  }
}

/**
 * Check if user has specific project role or higher
 */
export function requireProjectRole(minRole: ProjectRole) {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res
        .status(403)
        .json({ message: "Forbidden: Authentication required" });
    }

    const projectId = req.params.projectId || req.body.projectId;

    if (!projectId) {
      return res.status(400).json({ message: "Project ID required" });
    }

    try {
      const hasRole = await PermissionService.hasProjectRole(
        req.user.id,
        projectId,
        minRole
      );

      if (!hasRole) {
        return res.status(403).json({
          message: `Forbidden: ${minRole} role required`,
        });
      }

      return next();
    } catch (error) {
      return res.status(500).json({ message: "Role check failed" });
    }
  };
}

/**
 * Check if user is project member
 */
export async function isProjectMember(
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (!req.user) {
    return res
      .status(403)
      .json({ message: "Forbidden: Authentication required" });
  }

  const projectId = req.params.projectId || req.body.projectId;

  if (!projectId) {
    return res.status(400).json({ message: "Project ID required" });
  }

  try {
    const isMember = await PermissionService.isProjectMember(
      req.user.id,
      projectId
    );

    if (!isMember) {
      return res.status(403).json({
        message: "Forbidden: You are not a member of this project",
      });
    }

    return next();
  } catch (error) {
    return res.status(500).json({ message: "Membership check failed" });
  }
}

import { Request, Response, NextFunction } from "express";
import { UserRole, ROLE_HIERARCHY } from "../types/enums";

/**
 * Middleware to check if user has one of the required roles
 */
export function requireRoles(...roles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
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
      return res.status(401).json({ message: "Unauthorized" });
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
    return res.status(401).json({ message: "Unauthorized" });
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
    return res.status(401).json({ message: "Unauthorized" });
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

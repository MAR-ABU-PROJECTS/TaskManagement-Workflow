/**
 * Role-Based Permission Mapping
 * Maps ProjectRoles to their allowed Permissions
 */

import { Permission, ProjectRole, UserRole } from "@prisma/client";

/**
 * Default permissions for each ProjectRole
 */
export const ROLE_PERMISSIONS: Record<ProjectRole, Permission[]> = {
  PROJECT_ADMIN: [
    // Full project control
    Permission.ADMINISTER_PROJECT,
    Permission.BROWSE_PROJECT,
    Permission.EDIT_PROJECT,

    // Full issue control
    Permission.CREATE_ISSUES,
    Permission.EDIT_ISSUES,
    Permission.EDIT_OWN_ISSUES,
    Permission.DELETE_ISSUES,
    Permission.DELETE_OWN_ISSUES,
    Permission.ASSIGN_ISSUES,
    Permission.ASSIGNABLE_USER,
    Permission.CLOSE_ISSUES,
    Permission.TRANSITION_ISSUES,
    Permission.MOVE_ISSUES,

    // Full comment control
    Permission.ADD_COMMENTS,
    Permission.EDIT_ALL_COMMENTS,
    Permission.EDIT_OWN_COMMENTS,
    Permission.DELETE_ALL_COMMENTS,
    Permission.DELETE_OWN_COMMENTS,

    // Full attachment control
    Permission.CREATE_ATTACHMENTS,
    Permission.DELETE_ALL_ATTACHMENTS,
    Permission.DELETE_OWN_ATTACHMENTS,

    // Sprint management
    Permission.MANAGE_SPRINTS,
    Permission.VIEW_SPRINTS,

    // Epic management
    Permission.MANAGE_EPICS,
    Permission.VIEW_EPICS,

    // Time tracking
    Permission.WORK_ON_ISSUES,
    Permission.EDIT_ALL_WORKLOGS,
    Permission.EDIT_OWN_WORKLOGS,
    Permission.DELETE_ALL_WORKLOGS,
    Permission.DELETE_OWN_WORKLOGS,
  ],

  PROJECT_LEAD: [
    // Project viewing
    Permission.BROWSE_PROJECT,
    Permission.EDIT_PROJECT,

    // Issue management
    Permission.CREATE_ISSUES,
    Permission.EDIT_ISSUES,
    Permission.EDIT_OWN_ISSUES,
    Permission.DELETE_OWN_ISSUES,
    Permission.ASSIGN_ISSUES,
    Permission.ASSIGNABLE_USER,
    Permission.CLOSE_ISSUES,
    Permission.TRANSITION_ISSUES,
    Permission.MOVE_ISSUES,

    // Comments
    Permission.ADD_COMMENTS,
    Permission.EDIT_ALL_COMMENTS,
    Permission.EDIT_OWN_COMMENTS,
    Permission.DELETE_OWN_COMMENTS,

    // Attachments
    Permission.CREATE_ATTACHMENTS,
    Permission.DELETE_OWN_ATTACHMENTS,

    // Sprint management
    Permission.MANAGE_SPRINTS,
    Permission.VIEW_SPRINTS,

    // Epic management
    Permission.MANAGE_EPICS,
    Permission.VIEW_EPICS,

    // Time tracking
    Permission.WORK_ON_ISSUES,
    Permission.EDIT_OWN_WORKLOGS,
    Permission.DELETE_OWN_WORKLOGS,
  ],

  DEVELOPER: [
    // Project viewing
    Permission.BROWSE_PROJECT,

    // Issue management (limited)
    Permission.CREATE_ISSUES,
    Permission.EDIT_OWN_ISSUES,
    Permission.DELETE_OWN_ISSUES,
    Permission.ASSIGNABLE_USER,
    Permission.TRANSITION_ISSUES,

    // Comments
    Permission.ADD_COMMENTS,
    Permission.EDIT_OWN_COMMENTS,
    Permission.DELETE_OWN_COMMENTS,

    // Attachments
    Permission.CREATE_ATTACHMENTS,
    Permission.DELETE_OWN_ATTACHMENTS,

    // Time tracking
    Permission.WORK_ON_ISSUES,
    Permission.EDIT_OWN_WORKLOGS,
    Permission.DELETE_OWN_WORKLOGS,
  ],

  REPORTER: [
    // Project viewing
    Permission.BROWSE_PROJECT,

    // Create and edit own issues
    Permission.CREATE_ISSUES,
    Permission.EDIT_OWN_ISSUES,

    // Comments
    Permission.ADD_COMMENTS,
    Permission.EDIT_OWN_COMMENTS,
    Permission.DELETE_OWN_COMMENTS,

    // Attachments
    Permission.CREATE_ATTACHMENTS,
    Permission.DELETE_OWN_ATTACHMENTS,
  ],

  VIEWER: [
    // Read-only access
    Permission.BROWSE_PROJECT,
  ],
};

/**
 * System-wide UserRole permissions (override project permissions)
 */
export const SYSTEM_ROLE_PERMISSIONS: Partial<Record<UserRole, Permission[]>> =
  {
    SUPER_ADMIN: Object.values(Permission), // All permissions
    CEO: Object.values(Permission), // All permissions
    HOO: [
      // Department-wide control
      Permission.ADMINISTER_PROJECT,
      Permission.BROWSE_PROJECT,
      Permission.EDIT_PROJECT,
      Permission.CREATE_ISSUES,
      Permission.EDIT_ISSUES,
      Permission.DELETE_ISSUES,
      Permission.ASSIGN_ISSUES,
      Permission.MANAGE_SPRINTS,
    ],
  };

/**
 * Check if a user has a specific permission in a project
 */
export function hasPermission(
  permission: Permission,
  projectRole?: ProjectRole,
  userRole?: UserRole
): boolean {
  // System roles override project permissions
  if (userRole && SYSTEM_ROLE_PERMISSIONS[userRole]?.includes(permission)) {
    return true;
  }

  // Check project role permissions
  if (projectRole && ROLE_PERMISSIONS[projectRole]?.includes(permission)) {
    return true;
  }

  return false;
}

/**
 * Get all permissions for a user based on their roles
 */
export function getUserPermissions(
  projectRole?: ProjectRole,
  userRole?: UserRole
): Permission[] {
  const permissions = new Set<Permission>();

  // Add system role permissions
  if (userRole && SYSTEM_ROLE_PERMISSIONS[userRole]) {
    SYSTEM_ROLE_PERMISSIONS[userRole]!.forEach((p) => permissions.add(p));
  }

  // Add project role permissions
  if (projectRole && ROLE_PERMISSIONS[projectRole]) {
    ROLE_PERMISSIONS[projectRole].forEach((p) => permissions.add(p));
  }

  return Array.from(permissions);
}

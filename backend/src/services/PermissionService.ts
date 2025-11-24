import prisma from "../db/prisma";
import { UserRole, ProjectRole, Permission } from "../types/enums";

/**
 * Permission Service - Jira-like Granular Permission System
 * Handles both global (UserRole) and project-level (ProjectRole) permissions
 */
export class PermissionService {
  /**
   * Check if user has permission in a project
   * Combines global role permissions and project-level permissions
   */
  static async hasProjectPermission(
    userId: string,
    projectId: string,
    permission: Permission
  ): Promise<boolean> {
    // Get user's global role
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!user) return false;

    // CEO and HOO have all permissions globally
    if (user.role === UserRole.CEO || user.role === UserRole.HOO) {
      return true;
    }

    // Get project and user's project role
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        members: {
          where: { userId },
        },
        permissionScheme: {
          include: {
            grants: true,
          },
        },
      },
    });

    if (!project) return false;

    // Project creator has all permissions
    if (project.creatorId === userId) {
      return true;
    }

    // Check if user is project member
    const membership = project.members[0];
    if (!membership) {
      // Not a member - check if project is public for browse permission
      if (permission === Permission.BROWSE_PROJECT && project.isPublic) {
        return true;
      }
      return false;
    }

    // Check permission scheme if exists
    if (project.permissionScheme) {
      return this.checkPermissionGrant(
        project.permissionScheme.grants,
        permission,
        user.role as UserRole,
        membership.role as ProjectRole
      );
    }

    // Fallback to default permission rules
    return this.hasDefaultPermission(
      permission,
      user.role as UserRole,
      membership.role as ProjectRole
    );
  }

  /**
   * Check if user can edit a specific issue
   */
  static async canEditIssue(userId: string, taskId: string): Promise<boolean> {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        project: true,
      },
    });

    if (!task || !task.projectId) return false;

    // Creator can always edit their own tasks
    if (task.creatorId === userId) {
      const hasOwnPermission = await this.hasProjectPermission(
        userId,
        task.projectId,
        Permission.EDIT_OWN_ISSUES
      );
      if (hasOwnPermission) return true;
    }

    // Assignee can edit assigned tasks
    if (task.assigneeId === userId) {
      const hasOwnPermission = await this.hasProjectPermission(
        userId,
        task.projectId,
        Permission.EDIT_OWN_ISSUES
      );
      if (hasOwnPermission) return true;
    }

    // Check general edit permission
    return this.hasProjectPermission(
      userId,
      task.projectId,
      Permission.EDIT_ISSUES
    );
  }

  /**
   * Check if user can delete a specific issue
   */
  static async canDeleteIssue(
    userId: string,
    taskId: string
  ): Promise<boolean> {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        project: true,
      },
    });

    if (!task || !task.projectId) return false;

    // Creator can delete their own tasks if they have the permission
    if (task.creatorId === userId) {
      const hasOwnPermission = await this.hasProjectPermission(
        userId,
        task.projectId,
        Permission.DELETE_OWN_ISSUES
      );
      if (hasOwnPermission) return true;
    }

    // Check general delete permission
    return this.hasProjectPermission(
      userId,
      task.projectId,
      Permission.DELETE_ISSUES
    );
  }

  /**
   * Check if user can add/edit comments
   */
  static async canManageComment(
    userId: string,
    commentId: string,
    action: "edit" | "delete"
  ): Promise<boolean> {
    const comment = await prisma.taskComment.findUnique({
      where: { id: commentId },
      include: {
        task: {
          include: {
            project: true,
          },
        },
      },
    });

    if (!comment || !comment.task.projectId) return false;

    const projectId = comment.task.projectId;

    // Owner can manage their own comments
    if (comment.userId === userId) {
      const ownPermission =
        action === "edit"
          ? Permission.EDIT_OWN_COMMENTS
          : Permission.DELETE_OWN_COMMENTS;
      return this.hasProjectPermission(userId, projectId, ownPermission);
    }

    // Check all comments permission
    const allPermission =
      action === "edit"
        ? Permission.EDIT_ALL_COMMENTS
        : Permission.DELETE_ALL_COMMENTS;
    return this.hasProjectPermission(userId, projectId, allPermission);
  }

  /**
   * Check if user can manage time entries
   */
  static async canManageWorklog(
    userId: string,
    timeEntryId: string,
    action: "edit" | "delete"
  ): Promise<boolean> {
    const timeEntry = await prisma.timeEntry.findUnique({
      where: { id: timeEntryId },
      include: {
        task: {
          include: {
            project: true,
          },
        },
      },
    });

    if (!timeEntry || !timeEntry.task.projectId) return false;

    const projectId = timeEntry.task.projectId;

    // Owner can manage their own worklogs
    if (timeEntry.userId === userId) {
      const ownPermission =
        action === "edit"
          ? Permission.EDIT_OWN_WORKLOGS
          : Permission.DELETE_OWN_WORKLOGS;
      return this.hasProjectPermission(userId, projectId, ownPermission);
    }

    // Check all worklogs permission
    const allPermission =
      action === "edit"
        ? Permission.EDIT_ALL_WORKLOGS
        : Permission.DELETE_ALL_WORKLOGS;
    return this.hasProjectPermission(userId, projectId, allPermission);
  }

  /**
   * Get all users who can be assigned to issues in a project
   */
  static async getAssignableUsers(projectId: string): Promise<string[]> {
    const members = await prisma.projectMember.findMany({
      where: { projectId },
      select: { userId: true, role: true },
    });

    // Filter members who have ASSIGNABLE_USER permission
    const assignableUserIds: string[] = [];

    for (const member of members) {
      // PROJECT_ADMIN, PROJECT_LEAD, and DEVELOPER can be assigned
      if (
        member.role === ProjectRole.PROJECT_ADMIN ||
        member.role === ProjectRole.PROJECT_LEAD ||
        member.role === ProjectRole.DEVELOPER
      ) {
        assignableUserIds.push(member.userId);
      }
    }

    return assignableUserIds;
  }

  /**
   * Check permission against grants in permission scheme
   */
  private static checkPermissionGrant(
    grants: any[],
    permission: Permission,
    userRole: UserRole,
    projectRole: ProjectRole
  ): boolean {
    for (const grant of grants) {
      if (grant.permission === permission) {
        // Check if granted to project role
        if (grant.grantedToRole && grant.grantedToRole === projectRole) {
          return true;
        }
        // Check if granted to user role
        if (grant.grantedToUserRole && grant.grantedToUserRole === userRole) {
          return true;
        }
      }
    }
    return false;
  }

  /**
   * Default permission rules when no scheme is configured
   * Mimics Jira's default permission scheme
   */
  private static hasDefaultPermission(
    permission: Permission,
    _userRole: UserRole,
    projectRole: ProjectRole
  ): boolean {
    // PROJECT_ADMIN has all permissions
    if (projectRole === ProjectRole.PROJECT_ADMIN) {
      return true;
    }

    // PROJECT_LEAD permissions
    if (projectRole === ProjectRole.PROJECT_LEAD) {
      const leadPermissions = [
        Permission.BROWSE_PROJECT,
        Permission.CREATE_ISSUES,
        Permission.EDIT_ISSUES,
        Permission.EDIT_OWN_ISSUES,
        Permission.DELETE_OWN_ISSUES,
        Permission.ASSIGN_ISSUES,
        Permission.ASSIGNABLE_USER,
        Permission.CLOSE_ISSUES,
        Permission.TRANSITION_ISSUES,
        Permission.ADD_COMMENTS,
        Permission.EDIT_OWN_COMMENTS,
        Permission.DELETE_OWN_COMMENTS,
        Permission.CREATE_ATTACHMENTS,
        Permission.DELETE_OWN_ATTACHMENTS,
        Permission.WORK_ON_ISSUES,
        Permission.EDIT_OWN_WORKLOGS,
        Permission.DELETE_OWN_WORKLOGS,
        Permission.MANAGE_SPRINTS,
        Permission.VIEW_SPRINTS,
        Permission.MANAGE_EPICS,
        Permission.VIEW_EPICS,
      ];
      return leadPermissions.includes(permission);
    }

    // DEVELOPER permissions
    if (projectRole === ProjectRole.DEVELOPER) {
      const devPermissions = [
        Permission.BROWSE_PROJECT,
        Permission.CREATE_ISSUES,
        Permission.EDIT_OWN_ISSUES,
        Permission.DELETE_OWN_ISSUES,
        Permission.ASSIGNABLE_USER,
        Permission.TRANSITION_ISSUES,
        Permission.ADD_COMMENTS,
        Permission.EDIT_OWN_COMMENTS,
        Permission.DELETE_OWN_COMMENTS,
        Permission.CREATE_ATTACHMENTS,
        Permission.DELETE_OWN_ATTACHMENTS,
        Permission.WORK_ON_ISSUES,
        Permission.EDIT_OWN_WORKLOGS,
        Permission.DELETE_OWN_WORKLOGS,
        Permission.VIEW_SPRINTS,
        Permission.VIEW_EPICS,
      ];
      return devPermissions.includes(permission);
    }

    // REPORTER permissions
    if (projectRole === ProjectRole.REPORTER) {
      const reporterPermissions = [
        Permission.BROWSE_PROJECT,
        Permission.CREATE_ISSUES,
        Permission.EDIT_OWN_ISSUES,
        Permission.ADD_COMMENTS,
        Permission.EDIT_OWN_COMMENTS,
        Permission.CREATE_ATTACHMENTS,
        Permission.VIEW_SPRINTS,
        Permission.VIEW_EPICS,
      ];
      return reporterPermissions.includes(permission);
    }

    // VIEWER permissions (read-only)
    if (projectRole === ProjectRole.VIEWER) {
      const viewerPermissions = [
        Permission.BROWSE_PROJECT,
        Permission.VIEW_SPRINTS,
        Permission.VIEW_EPICS,
      ];
      return viewerPermissions.includes(permission);
    }

    return false;
  }

  /**
   * Check if user is project member
   */
  static async isProjectMember(
    userId: string,
    projectId: string
  ): Promise<boolean> {
    const membership = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId,
        },
      },
    });

    return !!membership;
  }

  /**
   * Check if user has specific project role or higher
   */
  static async hasProjectRole(
    userId: string,
    projectId: string,
    minRole: ProjectRole
  ): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!user) return false;

    // CEO and HOO bypass project roles
    if (user.role === UserRole.CEO || user.role === UserRole.HOO) {
      return true;
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        members: {
          where: { userId },
        },
      },
    });

    if (!project) return false;

    // Project creator is treated as PROJECT_ADMIN
    if (project.creatorId === userId) {
      return true;
    }

    const membership = project.members[0];
    if (!membership) return false;

    const roleHierarchy = {
      [ProjectRole.PROJECT_ADMIN]: 4,
      [ProjectRole.PROJECT_LEAD]: 3,
      [ProjectRole.DEVELOPER]: 2,
      [ProjectRole.REPORTER]: 1,
      [ProjectRole.VIEWER]: 0,
    };

    return (
      roleHierarchy[membership.role as ProjectRole] >= roleHierarchy[minRole]
    );
  }
}

export default PermissionService;

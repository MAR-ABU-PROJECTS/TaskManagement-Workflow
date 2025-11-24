import prisma from "../db/prisma";
import { Permission, ProjectRole, UserRole } from "../types/enums";

export class PermissionSchemeService {
  /**
   * Create a new permission scheme
   */
  async createPermissionScheme(data: {
    name: string;
    description?: string;
    isDefault?: boolean;
  }) {
    return await prisma.permissionScheme.create({
      data: {
        name: data.name,
        description: data.description,
        isDefault: data.isDefault || false,
      },
      include: {
        grants: true,
      },
    });
  }

  /**
   * Get all permission schemes
   */
  async getAllPermissionSchemes() {
    return await prisma.permissionScheme.findMany({
      include: {
        grants: true,
        _count: {
          select: {
            projects: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Get permission scheme by ID
   */
  async getPermissionSchemeById(id: string) {
    return await prisma.permissionScheme.findUnique({
      where: { id },
      include: {
        grants: {
          orderBy: { createdAt: "asc" },
        },
        projects: {
          select: {
            id: true,
            name: true,
            key: true,
          },
        },
      },
    });
  }

  /**
   * Update permission scheme
   */
  async updatePermissionScheme(
    id: string,
    data: {
      name?: string;
      description?: string;
      isDefault?: boolean;
    }
  ) {
    return await prisma.permissionScheme.update({
      where: { id },
      data,
      include: {
        grants: true,
      },
    });
  }

  /**
   * Delete permission scheme
   */
  async deletePermissionScheme(id: string) {
    // Check if scheme is assigned to projects
    const scheme = await prisma.permissionScheme.findUnique({
      where: { id },
      include: {
        _count: {
          select: { projects: true },
        },
      },
    });

    if (!scheme) {
      throw new Error("Permission scheme not found");
    }

    if (scheme._count.projects > 0) {
      throw new Error(
        "Cannot delete permission scheme that is assigned to projects"
      );
    }

    return await prisma.permissionScheme.delete({
      where: { id },
    });
  }

  /**
   * Add permission grant to scheme
   */
  async addGrant(data: {
    schemeId: string;
    permission: Permission;
    grantedToRole?: ProjectRole;
    grantedToUserRole?: UserRole;
  }) {
    return await prisma.permissionGrant.create({
      data: {
        schemeId: data.schemeId,
        permission: data.permission,
        grantedToRole: data.grantedToRole,
        grantedToUserRole: data.grantedToUserRole,
      },
    });
  }

  /**
   * Remove permission grant
   */
  async removeGrant(grantId: string) {
    return await prisma.permissionGrant.delete({
      where: { id: grantId },
    });
  }

  /**
   * Get grants for a scheme
   */
  async getGrants(schemeId: string) {
    return await prisma.permissionGrant.findMany({
      where: { schemeId },
      orderBy: { createdAt: "asc" },
    });
  }

  /**
   * Bulk update grants for a scheme (replace all)
   */
  async bulkUpdateGrants(
    schemeId: string,
    grants: Array<{
      permission: Permission;
      grantedToRole?: ProjectRole;
      grantedToUserRole?: UserRole;
    }>
  ) {
    // Delete existing grants
    await prisma.permissionGrant.deleteMany({
      where: { schemeId },
    });

    // Create new grants
    if (grants.length > 0) {
      await prisma.permissionGrant.createMany({
        data: grants.map((g) => ({
          schemeId,
          permission: g.permission,
          grantedToRole: g.grantedToRole,
          grantedToUserRole: g.grantedToUserRole,
        })),
      });
    }

    return await this.getGrants(schemeId);
  }

  /**
   * Assign permission scheme to project
   */
  async assignToProject(projectId: string, schemeId: string) {
    return await prisma.project.update({
      where: { id: projectId },
      data: {
        permissionSchemeId: schemeId,
      },
      include: {
        permissionScheme: {
          include: {
            grants: true,
          },
        },
      },
    });
  }

  /**
   * Create default permission scheme with standard grants
   */
  async createDefaultScheme() {
    // Check if default already exists
    const existing = await prisma.permissionScheme.findFirst({
      where: { isDefault: true },
    });

    if (existing) {
      return existing;
    }

    // Create default scheme
    const scheme = await prisma.permissionScheme.create({
      data: {
        name: "Default Permission Scheme",
        description: "Standard permission scheme for projects",
        isDefault: true,
      },
    });

    // Define default grants
    const grants = [
      // PROJECT_ADMIN - Full access
      ...Object.values(Permission).map((permission) => ({
        permission,
        grantedToRole: ProjectRole.PROJECT_ADMIN,
      })),

      // PROJECT_LEAD - Most permissions except project administration
      {
        permission: Permission.BROWSE_PROJECT,
        grantedToRole: ProjectRole.PROJECT_LEAD,
      },
      {
        permission: Permission.CREATE_ISSUES,
        grantedToRole: ProjectRole.PROJECT_LEAD,
      },
      {
        permission: Permission.EDIT_ISSUES,
        grantedToRole: ProjectRole.PROJECT_LEAD,
      },
      {
        permission: Permission.DELETE_ISSUES,
        grantedToRole: ProjectRole.PROJECT_LEAD,
      },
      {
        permission: Permission.ASSIGN_ISSUES,
        grantedToRole: ProjectRole.PROJECT_LEAD,
      },
      {
        permission: Permission.ASSIGNABLE_USER,
        grantedToRole: ProjectRole.PROJECT_LEAD,
      },
      {
        permission: Permission.CLOSE_ISSUES,
        grantedToRole: ProjectRole.PROJECT_LEAD,
      },
      {
        permission: Permission.TRANSITION_ISSUES,
        grantedToRole: ProjectRole.PROJECT_LEAD,
      },
      {
        permission: Permission.MOVE_ISSUES,
        grantedToRole: ProjectRole.PROJECT_LEAD,
      },
      {
        permission: Permission.ADD_COMMENTS,
        grantedToRole: ProjectRole.PROJECT_LEAD,
      },
      {
        permission: Permission.EDIT_ALL_COMMENTS,
        grantedToRole: ProjectRole.PROJECT_LEAD,
      },
      {
        permission: Permission.DELETE_ALL_COMMENTS,
        grantedToRole: ProjectRole.PROJECT_LEAD,
      },
      {
        permission: Permission.CREATE_ATTACHMENTS,
        grantedToRole: ProjectRole.PROJECT_LEAD,
      },
      {
        permission: Permission.DELETE_ALL_ATTACHMENTS,
        grantedToRole: ProjectRole.PROJECT_LEAD,
      },
      {
        permission: Permission.WORK_ON_ISSUES,
        grantedToRole: ProjectRole.PROJECT_LEAD,
      },
      {
        permission: Permission.EDIT_ALL_WORKLOGS,
        grantedToRole: ProjectRole.PROJECT_LEAD,
      },
      {
        permission: Permission.DELETE_ALL_WORKLOGS,
        grantedToRole: ProjectRole.PROJECT_LEAD,
      },
      {
        permission: Permission.MANAGE_SPRINTS,
        grantedToRole: ProjectRole.PROJECT_LEAD,
      },
      {
        permission: Permission.VIEW_SPRINTS,
        grantedToRole: ProjectRole.PROJECT_LEAD,
      },
      {
        permission: Permission.MANAGE_EPICS,
        grantedToRole: ProjectRole.PROJECT_LEAD,
      },
      {
        permission: Permission.VIEW_EPICS,
        grantedToRole: ProjectRole.PROJECT_LEAD,
      },

      // DEVELOPER - Development permissions
      {
        permission: Permission.BROWSE_PROJECT,
        grantedToRole: ProjectRole.DEVELOPER,
      },
      {
        permission: Permission.CREATE_ISSUES,
        grantedToRole: ProjectRole.DEVELOPER,
      },
      {
        permission: Permission.EDIT_OWN_ISSUES,
        grantedToRole: ProjectRole.DEVELOPER,
      },
      {
        permission: Permission.DELETE_OWN_ISSUES,
        grantedToRole: ProjectRole.DEVELOPER,
      },
      {
        permission: Permission.ASSIGNABLE_USER,
        grantedToRole: ProjectRole.DEVELOPER,
      },
      {
        permission: Permission.TRANSITION_ISSUES,
        grantedToRole: ProjectRole.DEVELOPER,
      },
      {
        permission: Permission.ADD_COMMENTS,
        grantedToRole: ProjectRole.DEVELOPER,
      },
      {
        permission: Permission.EDIT_OWN_COMMENTS,
        grantedToRole: ProjectRole.DEVELOPER,
      },
      {
        permission: Permission.DELETE_OWN_COMMENTS,
        grantedToRole: ProjectRole.DEVELOPER,
      },
      {
        permission: Permission.CREATE_ATTACHMENTS,
        grantedToRole: ProjectRole.DEVELOPER,
      },
      {
        permission: Permission.DELETE_OWN_ATTACHMENTS,
        grantedToRole: ProjectRole.DEVELOPER,
      },
      {
        permission: Permission.WORK_ON_ISSUES,
        grantedToRole: ProjectRole.DEVELOPER,
      },
      {
        permission: Permission.EDIT_OWN_WORKLOGS,
        grantedToRole: ProjectRole.DEVELOPER,
      },
      {
        permission: Permission.DELETE_OWN_WORKLOGS,
        grantedToRole: ProjectRole.DEVELOPER,
      },
      {
        permission: Permission.VIEW_SPRINTS,
        grantedToRole: ProjectRole.DEVELOPER,
      },
      {
        permission: Permission.VIEW_EPICS,
        grantedToRole: ProjectRole.DEVELOPER,
      },

      // REPORTER - Reporting permissions
      {
        permission: Permission.BROWSE_PROJECT,
        grantedToRole: ProjectRole.REPORTER,
      },
      {
        permission: Permission.CREATE_ISSUES,
        grantedToRole: ProjectRole.REPORTER,
      },
      {
        permission: Permission.EDIT_OWN_ISSUES,
        grantedToRole: ProjectRole.REPORTER,
      },
      {
        permission: Permission.ADD_COMMENTS,
        grantedToRole: ProjectRole.REPORTER,
      },
      {
        permission: Permission.EDIT_OWN_COMMENTS,
        grantedToRole: ProjectRole.REPORTER,
      },
      {
        permission: Permission.DELETE_OWN_COMMENTS,
        grantedToRole: ProjectRole.REPORTER,
      },
      {
        permission: Permission.CREATE_ATTACHMENTS,
        grantedToRole: ProjectRole.REPORTER,
      },
      {
        permission: Permission.DELETE_OWN_ATTACHMENTS,
        grantedToRole: ProjectRole.REPORTER,
      },
      {
        permission: Permission.VIEW_SPRINTS,
        grantedToRole: ProjectRole.REPORTER,
      },
      {
        permission: Permission.VIEW_EPICS,
        grantedToRole: ProjectRole.REPORTER,
      },

      // VIEWER - Read-only
      {
        permission: Permission.BROWSE_PROJECT,
        grantedToRole: ProjectRole.VIEWER,
      },
      {
        permission: Permission.VIEW_SPRINTS,
        grantedToRole: ProjectRole.VIEWER,
      },
      { permission: Permission.VIEW_EPICS, grantedToRole: ProjectRole.VIEWER },

      // Global Admin overrides (UserRole.ADMIN and above get all permissions)
      ...Object.values(Permission).map((permission) => ({
        permission,
        grantedToUserRole: UserRole.ADMIN,
      })),
      ...Object.values(Permission).map((permission) => ({
        permission,
        grantedToUserRole: UserRole.HR,
      })),
      ...Object.values(Permission).map((permission) => ({
        permission,
        grantedToUserRole: UserRole.HOO,
      })),
      ...Object.values(Permission).map((permission) => ({
        permission,
        grantedToUserRole: UserRole.CEO,
      })),
    ];

    await prisma.permissionGrant.createMany({
      data: grants.map((g) => ({
        schemeId: scheme.id,
        ...g,
      })),
    });

    return await this.getPermissionSchemeById(scheme.id);
  }
}

export default new PermissionSchemeService();

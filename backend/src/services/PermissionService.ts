/**
 * Permission Service - Uses enum-based permission system
 */

import prisma from "../db/prisma";
import { Permission, ProjectRole, UserRole } from "@prisma/client";
import { hasPermission } from "../config/permissions";

export class PermissionService {
  async hasProjectPermission(
    userId: string,
    projectId: string,
    permission: Permission
  ): Promise<boolean> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true },
      });

      if (!user) return false;

      const membership = await prisma.projectMember.findFirst({
        where: { projectId, userId },
        select: { role: true },
      });

      let projectRole = membership?.role;
      if (!projectRole) {
        const project = await prisma.project.findUnique({
          where: { id: projectId },
          select: { creatorId: true },
        });
        if (project?.creatorId === userId) {
          projectRole = ProjectRole.PROJECT_ADMIN;
        }
      }

      return hasPermission(permission, projectRole, user.role as UserRole);
    } catch (error) {
      console.error("Error checking project permission:", error);
      return false;
    }
  }

  async canEditIssue(userId: string, taskId: string): Promise<boolean> {
    try {
      const task = await prisma.task.findUnique({
        where: { id: taskId },
        select: { assignees: { select: { userId: true } }, projectId: true },
      });

      if (!task?.projectId) return false;

      const isAssignee = task.assignees.some((a) => a.userId === userId);
      if (isAssignee) {
        return this.hasProjectPermission(
          userId,
          task.projectId,
          Permission.EDIT_OWN_ISSUES
        );
      }

      return this.hasProjectPermission(
        userId,
        task.projectId,
        Permission.EDIT_ISSUES
      );
    } catch (error) {
      return false;
    }
  }

  async canDeleteIssue(userId: string, taskId: string): Promise<boolean> {
    try {
      const task = await prisma.task.findUnique({
        where: { id: taskId },
        select: { creatorId: true, projectId: true },
      });

      if (!task?.projectId) return false;

      if (task.creatorId === userId) {
        return this.hasProjectPermission(
          userId,
          task.projectId,
          Permission.DELETE_OWN_ISSUES
        );
      }

      return this.hasProjectPermission(
        userId,
        task.projectId,
        Permission.DELETE_ISSUES
      );
    } catch (error) {
      return false;
    }
  }

  async hasProjectRole(
    userId: string,
    projectId: string,
    role: ProjectRole
  ): Promise<boolean> {
    try {
      const membership = await prisma.projectMember.findFirst({
        where: { projectId, userId, role },
      });
      return !!membership;
    } catch (error) {
      return false;
    }
  }

  async isProjectMember(userId: string, projectId: string): Promise<boolean> {
    try {
      const membership = await prisma.projectMember.findFirst({
        where: { projectId, userId },
      });
      if (membership) return true;

      const project = await prisma.project.findUnique({
        where: { id: projectId },
        select: { creatorId: true },
      });
      return project?.creatorId === userId;
    } catch (error) {
      return false;
    }
  }
}

export default new PermissionService();

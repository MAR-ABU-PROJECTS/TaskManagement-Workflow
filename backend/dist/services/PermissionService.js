"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PermissionService = void 0;
const prisma_1 = __importDefault(require("../db/prisma"));
const enums_1 = require("../types/enums");
class PermissionService {
    static async hasProjectPermission(userId, projectId, permission) {
        const user = await prisma_1.default.user.findUnique({
            where: { id: userId },
            select: { role: true },
        });
        if (!user)
            return false;
        if (user.role === enums_1.UserRole.CEO || user.role === enums_1.UserRole.HOO) {
            return true;
        }
        const project = await prisma_1.default.project.findUnique({
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
        if (!project)
            return false;
        if (project.creatorId === userId) {
            return true;
        }
        const membership = project.members[0];
        if (!membership) {
            if (permission === enums_1.Permission.BROWSE_PROJECT && project.isPublic) {
                return true;
            }
            return false;
        }
        if (project.permissionScheme) {
            return this.checkPermissionGrant(project.permissionScheme.grants, permission, user.role, membership.role);
        }
        return this.hasDefaultPermission(permission, user.role, membership.role);
    }
    static async canEditIssue(userId, taskId) {
        const task = await prisma_1.default.task.findUnique({
            where: { id: taskId },
            include: {
                project: true,
            },
        });
        if (!task || !task.projectId)
            return false;
        if (task.creatorId === userId) {
            const hasOwnPermission = await this.hasProjectPermission(userId, task.projectId, enums_1.Permission.EDIT_OWN_ISSUES);
            if (hasOwnPermission)
                return true;
        }
        if (task.assigneeId === userId) {
            const hasOwnPermission = await this.hasProjectPermission(userId, task.projectId, enums_1.Permission.EDIT_OWN_ISSUES);
            if (hasOwnPermission)
                return true;
        }
        return this.hasProjectPermission(userId, task.projectId, enums_1.Permission.EDIT_ISSUES);
    }
    static async canDeleteIssue(userId, taskId) {
        const task = await prisma_1.default.task.findUnique({
            where: { id: taskId },
            include: {
                project: true,
            },
        });
        if (!task || !task.projectId)
            return false;
        if (task.creatorId === userId) {
            const hasOwnPermission = await this.hasProjectPermission(userId, task.projectId, enums_1.Permission.DELETE_OWN_ISSUES);
            if (hasOwnPermission)
                return true;
        }
        return this.hasProjectPermission(userId, task.projectId, enums_1.Permission.DELETE_ISSUES);
    }
    static async canManageComment(userId, commentId, action) {
        const comment = await prisma_1.default.taskComment.findUnique({
            where: { id: commentId },
            include: {
                task: {
                    include: {
                        project: true,
                    },
                },
            },
        });
        if (!comment || !comment.task.projectId)
            return false;
        const projectId = comment.task.projectId;
        if (comment.userId === userId) {
            const ownPermission = action === "edit"
                ? enums_1.Permission.EDIT_OWN_COMMENTS
                : enums_1.Permission.DELETE_OWN_COMMENTS;
            return this.hasProjectPermission(userId, projectId, ownPermission);
        }
        const allPermission = action === "edit"
            ? enums_1.Permission.EDIT_ALL_COMMENTS
            : enums_1.Permission.DELETE_ALL_COMMENTS;
        return this.hasProjectPermission(userId, projectId, allPermission);
    }
    static async canManageWorklog(userId, timeEntryId, action) {
        const timeEntry = await prisma_1.default.timeEntry.findUnique({
            where: { id: timeEntryId },
            include: {
                task: {
                    include: {
                        project: true,
                    },
                },
            },
        });
        if (!timeEntry || !timeEntry.task.projectId)
            return false;
        const projectId = timeEntry.task.projectId;
        if (timeEntry.userId === userId) {
            const ownPermission = action === "edit"
                ? enums_1.Permission.EDIT_OWN_WORKLOGS
                : enums_1.Permission.DELETE_OWN_WORKLOGS;
            return this.hasProjectPermission(userId, projectId, ownPermission);
        }
        const allPermission = action === "edit"
            ? enums_1.Permission.EDIT_ALL_WORKLOGS
            : enums_1.Permission.DELETE_ALL_WORKLOGS;
        return this.hasProjectPermission(userId, projectId, allPermission);
    }
    static async getAssignableUsers(projectId) {
        const members = await prisma_1.default.projectMember.findMany({
            where: { projectId },
            select: { userId: true, role: true },
        });
        const assignableUserIds = [];
        for (const member of members) {
            if (member.role === enums_1.ProjectRole.PROJECT_ADMIN ||
                member.role === enums_1.ProjectRole.PROJECT_LEAD ||
                member.role === enums_1.ProjectRole.DEVELOPER) {
                assignableUserIds.push(member.userId);
            }
        }
        return assignableUserIds;
    }
    static checkPermissionGrant(grants, permission, userRole, projectRole) {
        for (const grant of grants) {
            if (grant.permission === permission) {
                if (grant.grantedToRole && grant.grantedToRole === projectRole) {
                    return true;
                }
                if (grant.grantedToUserRole && grant.grantedToUserRole === userRole) {
                    return true;
                }
            }
        }
        return false;
    }
    static hasDefaultPermission(permission, _userRole, projectRole) {
        if (projectRole === enums_1.ProjectRole.PROJECT_ADMIN) {
            return true;
        }
        if (projectRole === enums_1.ProjectRole.PROJECT_LEAD) {
            const leadPermissions = [
                enums_1.Permission.BROWSE_PROJECT,
                enums_1.Permission.CREATE_ISSUES,
                enums_1.Permission.EDIT_ISSUES,
                enums_1.Permission.EDIT_OWN_ISSUES,
                enums_1.Permission.DELETE_OWN_ISSUES,
                enums_1.Permission.ASSIGN_ISSUES,
                enums_1.Permission.ASSIGNABLE_USER,
                enums_1.Permission.CLOSE_ISSUES,
                enums_1.Permission.TRANSITION_ISSUES,
                enums_1.Permission.ADD_COMMENTS,
                enums_1.Permission.EDIT_OWN_COMMENTS,
                enums_1.Permission.DELETE_OWN_COMMENTS,
                enums_1.Permission.CREATE_ATTACHMENTS,
                enums_1.Permission.DELETE_OWN_ATTACHMENTS,
                enums_1.Permission.WORK_ON_ISSUES,
                enums_1.Permission.EDIT_OWN_WORKLOGS,
                enums_1.Permission.DELETE_OWN_WORKLOGS,
                enums_1.Permission.MANAGE_SPRINTS,
                enums_1.Permission.VIEW_SPRINTS,
                enums_1.Permission.MANAGE_EPICS,
                enums_1.Permission.VIEW_EPICS,
            ];
            return leadPermissions.includes(permission);
        }
        if (projectRole === enums_1.ProjectRole.DEVELOPER) {
            const devPermissions = [
                enums_1.Permission.BROWSE_PROJECT,
                enums_1.Permission.CREATE_ISSUES,
                enums_1.Permission.EDIT_OWN_ISSUES,
                enums_1.Permission.DELETE_OWN_ISSUES,
                enums_1.Permission.ASSIGNABLE_USER,
                enums_1.Permission.TRANSITION_ISSUES,
                enums_1.Permission.ADD_COMMENTS,
                enums_1.Permission.EDIT_OWN_COMMENTS,
                enums_1.Permission.DELETE_OWN_COMMENTS,
                enums_1.Permission.CREATE_ATTACHMENTS,
                enums_1.Permission.DELETE_OWN_ATTACHMENTS,
                enums_1.Permission.WORK_ON_ISSUES,
                enums_1.Permission.EDIT_OWN_WORKLOGS,
                enums_1.Permission.DELETE_OWN_WORKLOGS,
                enums_1.Permission.VIEW_SPRINTS,
                enums_1.Permission.VIEW_EPICS,
            ];
            return devPermissions.includes(permission);
        }
        if (projectRole === enums_1.ProjectRole.REPORTER) {
            const reporterPermissions = [
                enums_1.Permission.BROWSE_PROJECT,
                enums_1.Permission.CREATE_ISSUES,
                enums_1.Permission.EDIT_OWN_ISSUES,
                enums_1.Permission.ADD_COMMENTS,
                enums_1.Permission.EDIT_OWN_COMMENTS,
                enums_1.Permission.CREATE_ATTACHMENTS,
                enums_1.Permission.VIEW_SPRINTS,
                enums_1.Permission.VIEW_EPICS,
            ];
            return reporterPermissions.includes(permission);
        }
        if (projectRole === enums_1.ProjectRole.VIEWER) {
            const viewerPermissions = [
                enums_1.Permission.BROWSE_PROJECT,
                enums_1.Permission.VIEW_SPRINTS,
                enums_1.Permission.VIEW_EPICS,
            ];
            return viewerPermissions.includes(permission);
        }
        return false;
    }
    static async isProjectMember(userId, projectId) {
        const membership = await prisma_1.default.projectMember.findUnique({
            where: {
                projectId_userId: {
                    projectId,
                    userId,
                },
            },
        });
        return !!membership;
    }
    static async hasProjectRole(userId, projectId, minRole) {
        const user = await prisma_1.default.user.findUnique({
            where: { id: userId },
            select: { role: true },
        });
        if (!user)
            return false;
        if (user.role === enums_1.UserRole.CEO || user.role === enums_1.UserRole.HOO) {
            return true;
        }
        const project = await prisma_1.default.project.findUnique({
            where: { id: projectId },
            include: {
                members: {
                    where: { userId },
                },
            },
        });
        if (!project)
            return false;
        if (project.creatorId === userId) {
            return true;
        }
        const membership = project.members[0];
        if (!membership)
            return false;
        const roleHierarchy = {
            [enums_1.ProjectRole.PROJECT_ADMIN]: 4,
            [enums_1.ProjectRole.PROJECT_LEAD]: 3,
            [enums_1.ProjectRole.DEVELOPER]: 2,
            [enums_1.ProjectRole.REPORTER]: 1,
            [enums_1.ProjectRole.VIEWER]: 0,
        };
        return (roleHierarchy[membership.role] >= roleHierarchy[minRole]);
    }
}
exports.PermissionService = PermissionService;
exports.default = PermissionService;

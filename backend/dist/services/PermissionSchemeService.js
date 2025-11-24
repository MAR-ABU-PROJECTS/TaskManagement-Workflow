"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PermissionSchemeService = void 0;
const prisma_1 = __importDefault(require("../db/prisma"));
const enums_1 = require("../types/enums");
class PermissionSchemeService {
    async createPermissionScheme(data) {
        return await prisma_1.default.permissionScheme.create({
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
    async getAllPermissionSchemes() {
        return await prisma_1.default.permissionScheme.findMany({
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
    async getPermissionSchemeById(id) {
        return await prisma_1.default.permissionScheme.findUnique({
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
    async updatePermissionScheme(id, data) {
        return await prisma_1.default.permissionScheme.update({
            where: { id },
            data,
            include: {
                grants: true,
            },
        });
    }
    async deletePermissionScheme(id) {
        const scheme = await prisma_1.default.permissionScheme.findUnique({
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
            throw new Error("Cannot delete permission scheme that is assigned to projects");
        }
        return await prisma_1.default.permissionScheme.delete({
            where: { id },
        });
    }
    async addGrant(data) {
        return await prisma_1.default.permissionGrant.create({
            data: {
                schemeId: data.schemeId,
                permission: data.permission,
                grantedToRole: data.grantedToRole,
                grantedToUserRole: data.grantedToUserRole,
            },
        });
    }
    async removeGrant(grantId) {
        return await prisma_1.default.permissionGrant.delete({
            where: { id: grantId },
        });
    }
    async getGrants(schemeId) {
        return await prisma_1.default.permissionGrant.findMany({
            where: { schemeId },
            orderBy: { createdAt: "asc" },
        });
    }
    async bulkUpdateGrants(schemeId, grants) {
        await prisma_1.default.permissionGrant.deleteMany({
            where: { schemeId },
        });
        if (grants.length > 0) {
            await prisma_1.default.permissionGrant.createMany({
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
    async assignToProject(projectId, schemeId) {
        return await prisma_1.default.project.update({
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
    async createDefaultScheme() {
        const existing = await prisma_1.default.permissionScheme.findFirst({
            where: { isDefault: true },
        });
        if (existing) {
            return existing;
        }
        const scheme = await prisma_1.default.permissionScheme.create({
            data: {
                name: "Default Permission Scheme",
                description: "Standard permission scheme for projects",
                isDefault: true,
            },
        });
        const grants = [
            ...Object.values(enums_1.Permission).map((permission) => ({
                permission,
                grantedToRole: enums_1.ProjectRole.PROJECT_ADMIN,
            })),
            {
                permission: enums_1.Permission.BROWSE_PROJECT,
                grantedToRole: enums_1.ProjectRole.PROJECT_LEAD,
            },
            {
                permission: enums_1.Permission.CREATE_ISSUES,
                grantedToRole: enums_1.ProjectRole.PROJECT_LEAD,
            },
            {
                permission: enums_1.Permission.EDIT_ISSUES,
                grantedToRole: enums_1.ProjectRole.PROJECT_LEAD,
            },
            {
                permission: enums_1.Permission.DELETE_ISSUES,
                grantedToRole: enums_1.ProjectRole.PROJECT_LEAD,
            },
            {
                permission: enums_1.Permission.ASSIGN_ISSUES,
                grantedToRole: enums_1.ProjectRole.PROJECT_LEAD,
            },
            {
                permission: enums_1.Permission.ASSIGNABLE_USER,
                grantedToRole: enums_1.ProjectRole.PROJECT_LEAD,
            },
            {
                permission: enums_1.Permission.CLOSE_ISSUES,
                grantedToRole: enums_1.ProjectRole.PROJECT_LEAD,
            },
            {
                permission: enums_1.Permission.TRANSITION_ISSUES,
                grantedToRole: enums_1.ProjectRole.PROJECT_LEAD,
            },
            {
                permission: enums_1.Permission.MOVE_ISSUES,
                grantedToRole: enums_1.ProjectRole.PROJECT_LEAD,
            },
            {
                permission: enums_1.Permission.ADD_COMMENTS,
                grantedToRole: enums_1.ProjectRole.PROJECT_LEAD,
            },
            {
                permission: enums_1.Permission.EDIT_ALL_COMMENTS,
                grantedToRole: enums_1.ProjectRole.PROJECT_LEAD,
            },
            {
                permission: enums_1.Permission.DELETE_ALL_COMMENTS,
                grantedToRole: enums_1.ProjectRole.PROJECT_LEAD,
            },
            {
                permission: enums_1.Permission.CREATE_ATTACHMENTS,
                grantedToRole: enums_1.ProjectRole.PROJECT_LEAD,
            },
            {
                permission: enums_1.Permission.DELETE_ALL_ATTACHMENTS,
                grantedToRole: enums_1.ProjectRole.PROJECT_LEAD,
            },
            {
                permission: enums_1.Permission.WORK_ON_ISSUES,
                grantedToRole: enums_1.ProjectRole.PROJECT_LEAD,
            },
            {
                permission: enums_1.Permission.EDIT_ALL_WORKLOGS,
                grantedToRole: enums_1.ProjectRole.PROJECT_LEAD,
            },
            {
                permission: enums_1.Permission.DELETE_ALL_WORKLOGS,
                grantedToRole: enums_1.ProjectRole.PROJECT_LEAD,
            },
            {
                permission: enums_1.Permission.MANAGE_SPRINTS,
                grantedToRole: enums_1.ProjectRole.PROJECT_LEAD,
            },
            {
                permission: enums_1.Permission.VIEW_SPRINTS,
                grantedToRole: enums_1.ProjectRole.PROJECT_LEAD,
            },
            {
                permission: enums_1.Permission.MANAGE_EPICS,
                grantedToRole: enums_1.ProjectRole.PROJECT_LEAD,
            },
            {
                permission: enums_1.Permission.VIEW_EPICS,
                grantedToRole: enums_1.ProjectRole.PROJECT_LEAD,
            },
            {
                permission: enums_1.Permission.BROWSE_PROJECT,
                grantedToRole: enums_1.ProjectRole.DEVELOPER,
            },
            {
                permission: enums_1.Permission.CREATE_ISSUES,
                grantedToRole: enums_1.ProjectRole.DEVELOPER,
            },
            {
                permission: enums_1.Permission.EDIT_OWN_ISSUES,
                grantedToRole: enums_1.ProjectRole.DEVELOPER,
            },
            {
                permission: enums_1.Permission.DELETE_OWN_ISSUES,
                grantedToRole: enums_1.ProjectRole.DEVELOPER,
            },
            {
                permission: enums_1.Permission.ASSIGNABLE_USER,
                grantedToRole: enums_1.ProjectRole.DEVELOPER,
            },
            {
                permission: enums_1.Permission.TRANSITION_ISSUES,
                grantedToRole: enums_1.ProjectRole.DEVELOPER,
            },
            {
                permission: enums_1.Permission.ADD_COMMENTS,
                grantedToRole: enums_1.ProjectRole.DEVELOPER,
            },
            {
                permission: enums_1.Permission.EDIT_OWN_COMMENTS,
                grantedToRole: enums_1.ProjectRole.DEVELOPER,
            },
            {
                permission: enums_1.Permission.DELETE_OWN_COMMENTS,
                grantedToRole: enums_1.ProjectRole.DEVELOPER,
            },
            {
                permission: enums_1.Permission.CREATE_ATTACHMENTS,
                grantedToRole: enums_1.ProjectRole.DEVELOPER,
            },
            {
                permission: enums_1.Permission.DELETE_OWN_ATTACHMENTS,
                grantedToRole: enums_1.ProjectRole.DEVELOPER,
            },
            {
                permission: enums_1.Permission.WORK_ON_ISSUES,
                grantedToRole: enums_1.ProjectRole.DEVELOPER,
            },
            {
                permission: enums_1.Permission.EDIT_OWN_WORKLOGS,
                grantedToRole: enums_1.ProjectRole.DEVELOPER,
            },
            {
                permission: enums_1.Permission.DELETE_OWN_WORKLOGS,
                grantedToRole: enums_1.ProjectRole.DEVELOPER,
            },
            {
                permission: enums_1.Permission.VIEW_SPRINTS,
                grantedToRole: enums_1.ProjectRole.DEVELOPER,
            },
            {
                permission: enums_1.Permission.VIEW_EPICS,
                grantedToRole: enums_1.ProjectRole.DEVELOPER,
            },
            {
                permission: enums_1.Permission.BROWSE_PROJECT,
                grantedToRole: enums_1.ProjectRole.REPORTER,
            },
            {
                permission: enums_1.Permission.CREATE_ISSUES,
                grantedToRole: enums_1.ProjectRole.REPORTER,
            },
            {
                permission: enums_1.Permission.EDIT_OWN_ISSUES,
                grantedToRole: enums_1.ProjectRole.REPORTER,
            },
            {
                permission: enums_1.Permission.ADD_COMMENTS,
                grantedToRole: enums_1.ProjectRole.REPORTER,
            },
            {
                permission: enums_1.Permission.EDIT_OWN_COMMENTS,
                grantedToRole: enums_1.ProjectRole.REPORTER,
            },
            {
                permission: enums_1.Permission.DELETE_OWN_COMMENTS,
                grantedToRole: enums_1.ProjectRole.REPORTER,
            },
            {
                permission: enums_1.Permission.CREATE_ATTACHMENTS,
                grantedToRole: enums_1.ProjectRole.REPORTER,
            },
            {
                permission: enums_1.Permission.DELETE_OWN_ATTACHMENTS,
                grantedToRole: enums_1.ProjectRole.REPORTER,
            },
            {
                permission: enums_1.Permission.VIEW_SPRINTS,
                grantedToRole: enums_1.ProjectRole.REPORTER,
            },
            {
                permission: enums_1.Permission.VIEW_EPICS,
                grantedToRole: enums_1.ProjectRole.REPORTER,
            },
            {
                permission: enums_1.Permission.BROWSE_PROJECT,
                grantedToRole: enums_1.ProjectRole.VIEWER,
            },
            {
                permission: enums_1.Permission.VIEW_SPRINTS,
                grantedToRole: enums_1.ProjectRole.VIEWER,
            },
            { permission: enums_1.Permission.VIEW_EPICS, grantedToRole: enums_1.ProjectRole.VIEWER },
            ...Object.values(enums_1.Permission).map((permission) => ({
                permission,
                grantedToUserRole: enums_1.UserRole.ADMIN,
            })),
            ...Object.values(enums_1.Permission).map((permission) => ({
                permission,
                grantedToUserRole: enums_1.UserRole.HR,
            })),
            ...Object.values(enums_1.Permission).map((permission) => ({
                permission,
                grantedToUserRole: enums_1.UserRole.HOO,
            })),
            ...Object.values(enums_1.Permission).map((permission) => ({
                permission,
                grantedToUserRole: enums_1.UserRole.CEO,
            })),
        ];
        await prisma_1.default.permissionGrant.createMany({
            data: grants.map((g) => ({
                schemeId: scheme.id,
                ...g,
            })),
        });
        return await this.getPermissionSchemeById(scheme.id);
    }
}
exports.PermissionSchemeService = PermissionSchemeService;
exports.default = new PermissionSchemeService();

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkflowService = void 0;
const prisma_1 = __importDefault(require("../db/prisma"));
const enums_1 = require("../types/enums");
class WorkflowService {
    async createWorkflowScheme(data) {
        return await prisma_1.default.workflowScheme.create({
            data: {
                name: data.name,
                description: data.description,
                isDefault: data.isDefault || false,
            },
            include: {
                transitions: true,
            },
        });
    }
    async getAllWorkflowSchemes() {
        return await prisma_1.default.workflowScheme.findMany({
            include: {
                transitions: true,
                _count: {
                    select: {
                        projects: true,
                    },
                },
            },
            orderBy: { createdAt: "desc" },
        });
    }
    async getWorkflowSchemeById(id) {
        return await prisma_1.default.workflowScheme.findUnique({
            where: { id },
            include: {
                transitions: {
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
    async updateWorkflowScheme(id, data) {
        return await prisma_1.default.workflowScheme.update({
            where: { id },
            data,
            include: {
                transitions: true,
            },
        });
    }
    async deleteWorkflowScheme(id) {
        const scheme = await prisma_1.default.workflowScheme.findUnique({
            where: { id },
            include: {
                _count: {
                    select: { projects: true },
                },
            },
        });
        if (!scheme) {
            throw new Error("Workflow scheme not found");
        }
        if (scheme._count.projects > 0) {
            throw new Error("Cannot delete workflow scheme that is assigned to projects");
        }
        return await prisma_1.default.workflowScheme.delete({
            where: { id },
        });
    }
    async addTransition(data) {
        return await prisma_1.default.workflowTransition.create({
            data: {
                schemeId: data.schemeId,
                name: data.name,
                fromStatus: data.fromStatus,
                toStatus: data.toStatus,
                issueType: data.issueType,
                requiredRole: data.requiredRole,
            },
        });
    }
    async getTransitions(schemeId, issueType) {
        return await prisma_1.default.workflowTransition.findMany({
            where: {
                schemeId,
                ...(issueType ? { issueType } : {}),
            },
            orderBy: { createdAt: "asc" },
        });
    }
    async deleteTransition(transitionId) {
        return await prisma_1.default.workflowTransition.delete({
            where: { id: transitionId },
        });
    }
    async validateTransition(projectId, fromStatus, toStatus, issueType, userProjectRole) {
        const project = await prisma_1.default.project.findUnique({
            where: { id: projectId },
            include: {
                workflowScheme: {
                    include: {
                        transitions: true,
                    },
                },
            },
        });
        if (!project?.workflowScheme) {
            return { allowed: true };
        }
        const transition = project.workflowScheme.transitions.find((t) => t.fromStatus === fromStatus &&
            t.toStatus === toStatus &&
            (!t.issueType || t.issueType === issueType));
        if (!transition) {
            return {
                allowed: false,
                reason: `No transition defined from ${fromStatus} to ${toStatus}`,
            };
        }
        if (transition.requiredRole && userProjectRole) {
            const roleHierarchy = {
                [enums_1.ProjectRole.VIEWER]: 0,
                [enums_1.ProjectRole.REPORTER]: 1,
                [enums_1.ProjectRole.DEVELOPER]: 2,
                [enums_1.ProjectRole.PROJECT_LEAD]: 3,
                [enums_1.ProjectRole.PROJECT_ADMIN]: 4,
            };
            const userLevel = roleHierarchy[userProjectRole] || 0;
            const requiredLevel = roleHierarchy[transition.requiredRole] || 0;
            if (userLevel < requiredLevel) {
                return {
                    allowed: false,
                    reason: `Requires ${transition.requiredRole} role or higher`,
                };
            }
        }
        return { allowed: true };
    }
    async getAvailableTransitions(taskId, userId) {
        const task = await prisma_1.default.task.findUnique({
            where: { id: taskId },
            include: {
                project: {
                    include: {
                        workflowScheme: {
                            include: {
                                transitions: true,
                            },
                        },
                        members: {
                            where: { userId },
                        },
                    },
                },
            },
        });
        if (!task?.project?.workflowScheme) {
            return [];
        }
        const transitions = task.project.workflowScheme.transitions.filter((t) => t.fromStatus === task.status &&
            (!t.issueType || t.issueType === task.issueType));
        return transitions.map((t) => ({
            name: t.name,
            toStatus: t.toStatus,
            requiredRole: t.requiredRole,
        }));
    }
    async assignToProject(projectId, schemeId) {
        return await prisma_1.default.project.update({
            where: { id: projectId },
            data: {
                workflowSchemeId: schemeId,
            },
            include: {
                workflowScheme: {
                    include: {
                        transitions: true,
                    },
                },
            },
        });
    }
    async createDefaultScheme() {
        const existing = await prisma_1.default.workflowScheme.findFirst({
            where: { isDefault: true },
        });
        if (existing) {
            return existing;
        }
        const scheme = await prisma_1.default.workflowScheme.create({
            data: {
                name: "Default Workflow",
                description: "Standard workflow with common transitions",
                isDefault: true,
            },
        });
        const transitions = [
            {
                name: "Start Progress",
                fromStatus: enums_1.TaskStatus.DRAFT,
                toStatus: enums_1.TaskStatus.ASSIGNED,
                requiredRole: enums_1.ProjectRole.DEVELOPER,
            },
            {
                name: "Begin Work",
                fromStatus: enums_1.TaskStatus.ASSIGNED,
                toStatus: enums_1.TaskStatus.IN_PROGRESS,
                requiredRole: enums_1.ProjectRole.DEVELOPER,
            },
            {
                name: "Pause Work",
                fromStatus: enums_1.TaskStatus.IN_PROGRESS,
                toStatus: enums_1.TaskStatus.PAUSED,
                requiredRole: enums_1.ProjectRole.DEVELOPER,
            },
            {
                name: "Submit for Review",
                fromStatus: enums_1.TaskStatus.IN_PROGRESS,
                toStatus: enums_1.TaskStatus.REVIEW,
                requiredRole: enums_1.ProjectRole.DEVELOPER,
            },
            {
                name: "Resume Work",
                fromStatus: enums_1.TaskStatus.PAUSED,
                toStatus: enums_1.TaskStatus.IN_PROGRESS,
                requiredRole: enums_1.ProjectRole.DEVELOPER,
            },
            {
                name: "Approve",
                fromStatus: enums_1.TaskStatus.REVIEW,
                toStatus: enums_1.TaskStatus.COMPLETED,
                requiredRole: enums_1.ProjectRole.PROJECT_LEAD,
            },
            {
                name: "Reject",
                fromStatus: enums_1.TaskStatus.REVIEW,
                toStatus: enums_1.TaskStatus.REJECTED,
                requiredRole: enums_1.ProjectRole.PROJECT_LEAD,
            },
            {
                name: "Request Changes",
                fromStatus: enums_1.TaskStatus.REVIEW,
                toStatus: enums_1.TaskStatus.IN_PROGRESS,
                requiredRole: enums_1.ProjectRole.PROJECT_LEAD,
            },
            {
                name: "Reopen",
                fromStatus: enums_1.TaskStatus.REJECTED,
                toStatus: enums_1.TaskStatus.ASSIGNED,
                requiredRole: enums_1.ProjectRole.DEVELOPER,
            },
            {
                name: "Reopen Completed",
                fromStatus: enums_1.TaskStatus.COMPLETED,
                toStatus: enums_1.TaskStatus.IN_PROGRESS,
                requiredRole: enums_1.ProjectRole.PROJECT_LEAD,
            },
        ];
        await prisma_1.default.workflowTransition.createMany({
            data: transitions.map((t) => ({
                schemeId: scheme.id,
                ...t,
            })),
        });
        return await this.getWorkflowSchemeById(scheme.id);
    }
}
exports.WorkflowService = WorkflowService;
exports.default = new WorkflowService();

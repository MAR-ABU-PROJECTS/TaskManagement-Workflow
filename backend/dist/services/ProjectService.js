"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProjectService = void 0;
const prisma_1 = __importDefault(require("../db/prisma"));
const enums_1 = require("../types/enums");
class ProjectService {
    async createProject(data, creatorId) {
        const project = await prisma_1.default.project.create({
            data: {
                name: data.name,
                key: data.key,
                description: data.description || null,
                department: data.department || null,
                creatorId,
            },
        });
        return project;
    }
    async getAllProjects(userId, userRole, userDepartment) {
        if (userRole === enums_1.UserRole.CEO) {
            return (await prisma_1.default.project.findMany({
                orderBy: { createdAt: "desc" },
                include: {
                    creator: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            role: true,
                        },
                    },
                    _count: {
                        select: {
                            tasks: true,
                        },
                    },
                },
            }));
        }
        if (userRole === enums_1.UserRole.HOO || userRole === enums_1.UserRole.HR) {
            return (await prisma_1.default.project.findMany({
                where: userDepartment
                    ? {
                        OR: [{ department: userDepartment }, { department: null }],
                    }
                    : undefined,
                orderBy: { createdAt: "desc" },
                include: {
                    creator: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            role: true,
                        },
                    },
                    _count: {
                        select: {
                            tasks: true,
                        },
                    },
                },
            }));
        }
        return (await prisma_1.default.project.findMany({
            where: {
                OR: [
                    { creatorId: userId },
                    { tasks: { some: { assigneeId: userId } } },
                ],
            },
            orderBy: { createdAt: "desc" },
            include: {
                creator: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        role: true,
                    },
                },
                _count: {
                    select: {
                        tasks: true,
                    },
                },
            },
        }));
    }
    async getProjectById(id, userId, userRole) {
        const project = await prisma_1.default.project.findUnique({
            where: { id },
            include: {
                creator: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        role: true,
                    },
                },
                tasks: {
                    select: {
                        id: true,
                        title: true,
                        status: true,
                        priority: true,
                        assigneeId: true,
                        createdAt: true,
                    },
                },
            },
        });
        if (!project) {
            return null;
        }
        const hasAccess = userRole === enums_1.UserRole.CEO ||
            project.creatorId === userId ||
            project.tasks.some((task) => task.assigneeId === userId);
        if (!hasAccess) {
            return null;
        }
        return project;
    }
    async updateProject(id, data, userId, userRole) {
        const project = await prisma_1.default.project.findUnique({
            where: { id },
        });
        if (!project) {
            return null;
        }
        const canUpdate = userRole === enums_1.UserRole.CEO ||
            userRole === enums_1.UserRole.HOO ||
            userRole === enums_1.UserRole.HR ||
            project.creatorId === userId;
        if (!canUpdate) {
            throw new Error("Forbidden: You do not have permission to update this project");
        }
        const updated = await prisma_1.default.project.update({
            where: { id },
            data: {
                name: data.name,
                description: data.description,
                department: data.department || null,
            },
        });
        return updated;
    }
    async archiveProject(id, userId, userRole) {
        const project = await prisma_1.default.project.findUnique({
            where: { id },
        });
        if (!project) {
            return false;
        }
        const canArchive = userRole === enums_1.UserRole.CEO ||
            userRole === enums_1.UserRole.HOO ||
            userRole === enums_1.UserRole.HR ||
            project.creatorId === userId;
        if (!canArchive) {
            throw new Error("Forbidden: You do not have permission to archive this project");
        }
        await prisma_1.default.project.delete({
            where: { id },
        });
        return true;
    }
}
exports.ProjectService = ProjectService;
exports.default = new ProjectService();

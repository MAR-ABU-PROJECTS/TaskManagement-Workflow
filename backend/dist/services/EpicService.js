"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const prisma_1 = __importDefault(require("../db/prisma"));
class EpicService {
    async createEpic(projectId, data) {
        const epic = await prisma_1.default.epic.create({
            data: {
                projectId,
                ...data,
            },
            include: {
                project: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
        });
        return epic;
    }
    async getProjectEpics(projectId) {
        const epics = await prisma_1.default.epic.findMany({
            where: { projectId },
            include: {
                tasks: {
                    select: {
                        id: true,
                        title: true,
                        status: true,
                        storyPoints: true,
                    },
                },
            },
            orderBy: { createdAt: "desc" },
        });
        return epics.map((epic) => ({
            ...epic,
            stats: {
                totalTasks: epic.tasks.length,
                completedTasks: epic.tasks.filter((t) => t.status === "COMPLETED")
                    .length,
                totalStoryPoints: epic.tasks.reduce((sum, t) => sum + (t.storyPoints || 0), 0),
            },
        }));
    }
    async getEpicById(epicId) {
        const epic = await prisma_1.default.epic.findUnique({
            where: { id: epicId },
            include: {
                project: true,
                tasks: {
                    include: {
                        assignee: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                            },
                        },
                    },
                    orderBy: { createdAt: "desc" },
                },
            },
        });
        if (!epic) {
            throw new Error("Epic not found");
        }
        return epic;
    }
    async updateEpic(epicId, data) {
        const epic = await prisma_1.default.epic.update({
            where: { id: epicId },
            data,
            include: {
                tasks: {
                    select: {
                        id: true,
                        title: true,
                    },
                },
            },
        });
        return epic;
    }
    async deleteEpic(epicId) {
        await prisma_1.default.task.updateMany({
            where: { epicId },
            data: { epicId: null },
        });
        await prisma_1.default.epic.delete({
            where: { id: epicId },
        });
        return { message: "Epic deleted successfully" };
    }
    async addTaskToEpic(epicId, taskId) {
        const task = await prisma_1.default.task.update({
            where: { id: taskId },
            data: { epicId },
            include: {
                epic: true,
            },
        });
        return task;
    }
    async removeTaskFromEpic(taskId) {
        const task = await prisma_1.default.task.update({
            where: { id: taskId },
            data: { epicId: null },
        });
        return task;
    }
}
exports.default = new EpicService();

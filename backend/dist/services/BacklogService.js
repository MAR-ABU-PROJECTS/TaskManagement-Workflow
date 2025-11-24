"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const prisma_1 = __importDefault(require("../db/prisma"));
const enums_1 = require("../types/enums");
class BacklogService {
    async getProjectBacklog(projectId, options) {
        const where = {
            projectId,
            sprintId: null,
        };
        if (options?.epicId) {
            where.epicId = options.epicId;
        }
        if (options?.priority) {
            where.priority = options.priority;
        }
        if (options?.assigneeId) {
            where.assigneeId = options.assigneeId;
        }
        const tasks = await prisma_1.default.task.findMany({
            where,
            include: {
                assignee: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                epic: {
                    select: {
                        id: true,
                        name: true,
                        color: true,
                    },
                },
                dependentOn: {
                    include: {
                        blockingTask: {
                            select: {
                                id: true,
                                title: true,
                                status: true,
                            },
                        },
                    },
                },
            },
            orderBy: [{ priority: "asc" }, { createdAt: "desc" }],
        });
        return tasks;
    }
    async getBacklogByEpic(projectId) {
        const epics = await prisma_1.default.epic.findMany({
            where: { projectId },
            include: {
                tasks: {
                    where: { sprintId: null },
                    include: {
                        assignee: {
                            select: {
                                id: true,
                                name: true,
                            },
                        },
                    },
                    orderBy: [{ priority: "asc" }, { createdAt: "desc" }],
                },
            },
            orderBy: { createdAt: "desc" },
        });
        const tasksWithoutEpic = await prisma_1.default.task.findMany({
            where: {
                projectId,
                sprintId: null,
                epicId: null,
            },
            include: {
                assignee: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
            orderBy: [{ priority: "asc" }, { createdAt: "desc" }],
        });
        return {
            epics: epics.map((epic) => ({
                ...epic,
                taskCount: epic.tasks.length,
                totalStoryPoints: epic.tasks.reduce((sum, t) => sum + (t.storyPoints || 0), 0),
            })),
            unassignedTasks: tasksWithoutEpic,
        };
    }
    async updateBacklogPriority(taskId, priority) {
        const task = await prisma_1.default.task.update({
            where: { id: taskId },
            data: { priority: priority },
            include: {
                assignee: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                epic: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
        });
        return task;
    }
    async estimateTask(taskId, storyPoints) {
        if (storyPoints < 0) {
            throw new Error("Story points cannot be negative");
        }
        const task = await prisma_1.default.task.update({
            where: { id: taskId },
            data: { storyPoints },
        });
        return task;
    }
    async bulkEstimate(estimates) {
        const updatePromises = estimates.map(({ taskId, storyPoints }) => prisma_1.default.task.update({
            where: { id: taskId },
            data: { storyPoints },
        }));
        await Promise.all(updatePromises);
        return { message: `${estimates.length} tasks estimated` };
    }
    async getBacklogStats(projectId) {
        const backlogTasks = await prisma_1.default.task.findMany({
            where: {
                projectId,
                sprintId: null,
            },
            select: {
                id: true,
                priority: true,
                storyPoints: true,
                status: true,
            },
        });
        const totalTasks = backlogTasks.length;
        const estimatedTasks = backlogTasks.filter((t) => t.storyPoints).length;
        const totalStoryPoints = backlogTasks.reduce((sum, t) => sum + (t.storyPoints || 0), 0);
        const byPriority = {
            LOW: backlogTasks.filter((t) => t.priority === enums_1.TaskPriority.LOW).length,
            MEDIUM: backlogTasks.filter((t) => t.priority === enums_1.TaskPriority.MEDIUM)
                .length,
            HIGH: backlogTasks.filter((t) => t.priority === enums_1.TaskPriority.HIGH).length,
            CRITICAL: backlogTasks.filter((t) => t.priority === "CRITICAL")
                .length,
        };
        return {
            projectId,
            totalTasks,
            estimatedTasks,
            estimationPercentage: totalTasks > 0 ? Math.round((estimatedTasks / totalTasks) * 100) : 0,
            totalStoryPoints,
            byPriority,
        };
    }
    async getReadyTasks(projectId) {
        const tasks = await prisma_1.default.task.findMany({
            where: {
                projectId,
                sprintId: null,
                storyPoints: { not: null },
            },
            include: {
                assignee: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                epic: {
                    select: {
                        id: true,
                        name: true,
                        color: true,
                    },
                },
                dependentOn: {
                    include: {
                        blockingTask: {
                            select: {
                                id: true,
                                title: true,
                                status: true,
                            },
                        },
                    },
                },
            },
            orderBy: [{ priority: "asc" }, { createdAt: "desc" }],
        });
        const readyTasks = tasks.filter((task) => !task.dependentOn.some((dep) => dep.blockingTask.status !== "COMPLETED"));
        return readyTasks;
    }
    async moveTasksToSprint(taskIds, sprintId) {
        const sprint = await prisma_1.default.sprint.findUnique({
            where: { id: sprintId },
        });
        if (!sprint) {
            throw new Error("Sprint not found");
        }
        if (sprint.status === "COMPLETED" || sprint.status === "CANCELLED") {
            throw new Error("Cannot add tasks to completed or cancelled sprint");
        }
        await prisma_1.default.task.updateMany({
            where: {
                id: { in: taskIds },
                projectId: sprint.projectId,
            },
            data: { sprintId },
        });
        return { message: `${taskIds.length} tasks moved to sprint` };
    }
}
exports.default = new BacklogService();

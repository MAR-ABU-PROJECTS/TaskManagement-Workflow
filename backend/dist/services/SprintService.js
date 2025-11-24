"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const prisma_1 = __importDefault(require("../db/prisma"));
class SprintService {
    async createSprint(projectId, data) {
        const activeSprint = await prisma_1.default.sprint.findFirst({
            where: {
                projectId,
                status: "ACTIVE",
            },
        });
        if (activeSprint) {
            throw new Error("Project already has an active sprint");
        }
        const sprint = await prisma_1.default.sprint.create({
            data: {
                projectId,
                status: "PLANNING",
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
        return sprint;
    }
    async getProjectSprints(projectId, includeCompleted = true) {
        const where = { projectId };
        if (!includeCompleted) {
            where.status = {
                in: ["PLANNING", "ACTIVE"],
            };
        }
        const sprints = await prisma_1.default.sprint.findMany({
            where,
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
            orderBy: { startDate: "desc" },
        });
        return sprints.map((sprint) => ({
            ...sprint,
            stats: this.calculateSprintStats(sprint),
        }));
    }
    async getSprintById(sprintId) {
        const sprint = await prisma_1.default.sprint.findUnique({
            where: { id: sprintId },
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
                        epic: {
                            select: {
                                id: true,
                                name: true,
                                color: true,
                            },
                        },
                    },
                    orderBy: { createdAt: "desc" },
                },
            },
        });
        if (!sprint) {
            throw new Error("Sprint not found");
        }
        return {
            ...sprint,
            stats: this.calculateSprintStats(sprint),
        };
    }
    async updateSprint(sprintId, data) {
        const sprint = await prisma_1.default.sprint.update({
            where: { id: sprintId },
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
        return sprint;
    }
    async startSprint(sprintId) {
        const sprint = await prisma_1.default.sprint.findUnique({
            where: { id: sprintId },
        });
        if (!sprint) {
            throw new Error("Sprint not found");
        }
        if (sprint.status !== "PLANNING") {
            throw new Error("Only planning sprints can be started");
        }
        const activeSprint = await prisma_1.default.sprint.findFirst({
            where: {
                projectId: sprint.projectId,
                status: "ACTIVE",
                id: { not: sprintId },
            },
        });
        if (activeSprint) {
            throw new Error("Another sprint is already active in this project");
        }
        const updatedSprint = await prisma_1.default.sprint.update({
            where: { id: sprintId },
            data: { status: "ACTIVE" },
            include: {
                tasks: true,
            },
        });
        return updatedSprint;
    }
    async completeSprint(sprintId, moveIncompleteTo) {
        const sprint = await prisma_1.default.sprint.findUnique({
            where: { id: sprintId },
            include: {
                tasks: true,
            },
        });
        if (!sprint) {
            throw new Error("Sprint not found");
        }
        if (sprint.status !== "ACTIVE") {
            throw new Error("Only active sprints can be completed");
        }
        if (moveIncompleteTo) {
            const incompleteTasks = sprint.tasks.filter((t) => t.status !== "COMPLETED");
            await prisma_1.default.task.updateMany({
                where: {
                    id: { in: incompleteTasks.map((t) => t.id) },
                },
                data: { sprintId: moveIncompleteTo },
            });
        }
        else {
            await prisma_1.default.task.updateMany({
                where: {
                    sprintId,
                    status: { not: "COMPLETED" },
                },
                data: { sprintId: null },
            });
        }
        const completedSprint = await prisma_1.default.sprint.update({
            where: { id: sprintId },
            data: { status: "COMPLETED" },
            include: {
                tasks: true,
            },
        });
        return completedSprint;
    }
    async cancelSprint(sprintId) {
        const sprint = await prisma_1.default.sprint.findUnique({
            where: { id: sprintId },
        });
        if (!sprint) {
            throw new Error("Sprint not found");
        }
        if (sprint.status === "COMPLETED") {
            throw new Error("Cannot cancel a completed sprint");
        }
        await prisma_1.default.task.updateMany({
            where: { sprintId },
            data: { sprintId: null },
        });
        const cancelledSprint = await prisma_1.default.sprint.update({
            where: { id: sprintId },
            data: { status: "CANCELLED" },
        });
        return cancelledSprint;
    }
    async addTasksToSprint(sprintId, taskIds) {
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
        return { message: `${taskIds.length} tasks added to sprint` };
    }
    async removeTasksFromSprint(taskIds) {
        await prisma_1.default.task.updateMany({
            where: { id: { in: taskIds } },
            data: { sprintId: null },
        });
        return { message: `${taskIds.length} tasks removed from sprint` };
    }
    async getBurndownData(sprintId) {
        const sprint = await prisma_1.default.sprint.findUnique({
            where: { id: sprintId },
            include: {
                tasks: {
                    include: {
                        activityLogs: {
                            where: {
                                action: "STATUS_UPDATE",
                            },
                            orderBy: { timestamp: "asc" },
                        },
                    },
                },
            },
        });
        if (!sprint) {
            throw new Error("Sprint not found");
        }
        if (!sprint.startDate || !sprint.endDate) {
            throw new Error("Sprint must have start and end dates");
        }
        const startDate = new Date(sprint.startDate);
        const endDate = new Date(sprint.endDate);
        const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        const totalStoryPoints = sprint.tasks.reduce((sum, task) => sum + (task.storyPoints || 0), 0);
        const burndownData = [];
        for (let i = 0; i <= totalDays; i++) {
            const currentDate = new Date(startDate);
            currentDate.setDate(currentDate.getDate() + i);
            let remainingPoints = totalStoryPoints;
            sprint.tasks.forEach((task) => {
                const completedActivity = task.activityLogs.find((a) => a.newStatus === "COMPLETED" && new Date(a.timestamp) <= currentDate);
                if (completedActivity) {
                    remainingPoints -= task.storyPoints || 0;
                }
            });
            burndownData.push({
                date: currentDate.toISOString().split("T")[0],
                remaining: remainingPoints,
                ideal: totalStoryPoints - (totalStoryPoints / totalDays) * i,
            });
        }
        return {
            sprintId,
            sprintName: sprint.name,
            totalStoryPoints,
            burndownData,
        };
    }
    async calculateVelocity(sprintId) {
        const sprint = await prisma_1.default.sprint.findUnique({
            where: { id: sprintId },
            include: {
                tasks: true,
            },
        });
        if (!sprint) {
            throw new Error("Sprint not found");
        }
        const completedPoints = sprint.tasks
            .filter((t) => t.status === "COMPLETED")
            .reduce((sum, t) => sum + (t.storyPoints || 0), 0);
        return {
            sprintId,
            sprintName: sprint.name,
            velocity: completedPoints,
            totalPlanned: sprint.tasks.reduce((sum, t) => sum + (t.storyPoints || 0), 0),
        };
    }
    async getTeamVelocity(projectId, lastNSprints = 3) {
        const completedSprints = await prisma_1.default.sprint.findMany({
            where: {
                projectId,
                status: "COMPLETED",
            },
            include: {
                tasks: true,
            },
            orderBy: { endDate: "desc" },
            take: lastNSprints,
        });
        const velocities = completedSprints.map((sprint) => {
            const completedPoints = sprint.tasks
                .filter((t) => t.status === "COMPLETED")
                .reduce((sum, t) => sum + (t.storyPoints || 0), 0);
            return {
                sprintId: sprint.id,
                sprintName: sprint.name,
                velocity: completedPoints,
            };
        });
        const averageVelocity = velocities.length > 0
            ? velocities.reduce((sum, v) => sum + v.velocity, 0) / velocities.length
            : 0;
        return {
            projectId,
            sprints: velocities,
            averageVelocity: Math.round(averageVelocity),
        };
    }
    calculateSprintStats(sprint) {
        const tasks = sprint.tasks || [];
        const totalTasks = tasks.length;
        const completedTasks = tasks.filter((t) => t.status === "COMPLETED").length;
        const totalStoryPoints = tasks.reduce((sum, t) => sum + (t.storyPoints || 0), 0);
        const completedStoryPoints = tasks
            .filter((t) => t.status === "COMPLETED")
            .reduce((sum, t) => sum + (t.storyPoints || 0), 0);
        return {
            totalTasks,
            completedTasks,
            totalStoryPoints,
            completedStoryPoints,
            completionPercentage: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
            storyPointsPercentage: totalStoryPoints > 0
                ? Math.round((completedStoryPoints / totalStoryPoints) * 100)
                : 0,
        };
    }
}
exports.default = new SprintService();

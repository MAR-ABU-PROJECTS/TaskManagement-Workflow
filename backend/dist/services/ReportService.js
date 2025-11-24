"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const prisma_1 = __importDefault(require("../db/prisma"));
class ReportService {
    async getVelocityReport(projectId, lastNSprints = 5) {
        const sprints = await prisma_1.default.sprint.findMany({
            where: {
                projectId,
                status: "COMPLETED",
            },
            include: {
                tasks: {
                    select: {
                        id: true,
                        status: true,
                        storyPoints: true,
                    },
                },
            },
            orderBy: { endDate: "desc" },
            take: lastNSprints,
        });
        const sprintData = sprints.map((sprint) => {
            const totalPlanned = sprint.tasks.reduce((sum, t) => sum + (t.storyPoints || 0), 0);
            const completed = sprint.tasks
                .filter((t) => t.status === "COMPLETED")
                .reduce((sum, t) => sum + (t.storyPoints || 0), 0);
            return {
                sprintId: sprint.id,
                sprintName: sprint.name,
                startDate: sprint.startDate,
                endDate: sprint.endDate,
                planned: totalPlanned,
                completed,
                completionRate: totalPlanned > 0 ? Math.round((completed / totalPlanned) * 100) : 0,
            };
        });
        const averageVelocity = sprintData.length > 0
            ? Math.round(sprintData.reduce((sum, s) => sum + s.completed, 0) /
                sprintData.length)
            : 0;
        return {
            projectId,
            sprints: sprintData.reverse(),
            averageVelocity,
        };
    }
    async getTeamProductivity(projectId, startDate, endDate) {
        const where = { projectId };
        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate)
                where.createdAt.gte = startDate;
            if (endDate)
                where.createdAt.lte = endDate;
        }
        const tasks = await prisma_1.default.task.findMany({
            where,
            include: {
                assignee: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
        });
        const userMetrics = tasks.reduce((acc, task) => {
            if (!task.assignee)
                return acc;
            const userId = task.assignee.id;
            if (!acc[userId]) {
                acc[userId] = {
                    userId,
                    userName: task.assignee.name,
                    totalTasks: 0,
                    completedTasks: 0,
                    totalStoryPoints: 0,
                    completedStoryPoints: 0,
                };
            }
            acc[userId].totalTasks++;
            acc[userId].totalStoryPoints += task.storyPoints || 0;
            if (task.status === "COMPLETED") {
                acc[userId].completedTasks++;
                acc[userId].completedStoryPoints += task.storyPoints || 0;
            }
            return acc;
        }, {});
        return {
            projectId,
            dateRange: {
                start: startDate || null,
                end: endDate || null,
            },
            teamMembers: Object.values(userMetrics).map((user) => ({
                ...user,
                completionRate: user.totalTasks > 0
                    ? Math.round((user.completedTasks / user.totalTasks) * 100)
                    : 0,
            })),
        };
    }
    async getProjectHealth(projectId) {
        const project = await prisma_1.default.project.findUnique({
            where: { id: projectId },
            include: {
                tasks: {
                    include: {
                        assignee: true,
                    },
                },
                sprints: {
                    where: {
                        status: { in: ["PLANNING", "ACTIVE"] },
                    },
                },
                epics: {
                    include: {
                        tasks: true,
                    },
                },
            },
        });
        if (!project) {
            throw new Error("Project not found");
        }
        const tasks = project.tasks;
        const totalTasks = tasks.length;
        const completedTasks = tasks.filter((t) => t.status === "COMPLETED").length;
        const blockedTasks = await this.getBlockedTasksCount(projectId);
        const overdueTasks = tasks.filter((t) => t.dueDate &&
            new Date(t.dueDate) < new Date() &&
            t.status !== "COMPLETED").length;
        const backlogTasks = tasks.filter((t) => !t.sprintId);
        const estimatedBacklog = backlogTasks.filter((t) => t.storyPoints).length;
        const activeSprint = project.sprints.find((s) => s.status === "ACTIVE");
        let sprintHealth = null;
        if (activeSprint) {
            const sprintTasks = tasks.filter((t) => t.sprintId === activeSprint.id);
            const sprintCompleted = sprintTasks.filter((t) => t.status === "COMPLETED").length;
            if (!activeSprint.startDate || !activeSprint.endDate) {
                sprintHealth = {
                    sprintId: activeSprint.id,
                    sprintName: activeSprint.name,
                    timeProgress: 0,
                    workProgress: 0,
                    isOnTrack: false,
                };
            }
            else {
                const now = new Date();
                const start = new Date(activeSprint.startDate);
                const end = new Date(activeSprint.endDate);
                const totalDuration = end.getTime() - start.getTime();
                const elapsed = now.getTime() - start.getTime();
                const timeProgress = Math.min(100, Math.max(0, Math.round((elapsed / totalDuration) * 100)));
                const workProgress = sprintTasks.length > 0
                    ? Math.round((sprintCompleted / sprintTasks.length) * 100)
                    : 0;
                sprintHealth = {
                    sprintId: activeSprint.id,
                    sprintName: activeSprint.name,
                    timeProgress,
                    workProgress,
                    isOnTrack: workProgress >= timeProgress - 10,
                };
            }
        }
        return {
            projectId,
            projectName: project.name,
            overview: {
                totalTasks,
                completedTasks,
                completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
                blockedTasks,
                overdueTasks,
            },
            backlog: {
                totalTasks: backlogTasks.length,
                estimatedTasks: estimatedBacklog,
                estimationRate: backlogTasks.length > 0
                    ? Math.round((estimatedBacklog / backlogTasks.length) * 100)
                    : 0,
            },
            sprint: sprintHealth,
            epics: project.epics.map((epic) => ({
                id: epic.id,
                name: epic.name,
                totalTasks: epic.tasks.length,
                completedTasks: epic.tasks.filter((t) => t.status === "COMPLETED")
                    .length,
            })),
        };
    }
    async getCycleTimeReport(projectId) {
        const tasks = await prisma_1.default.task.findMany({
            where: {
                projectId,
                status: "COMPLETED",
            },
            include: {
                activityLogs: {
                    where: {
                        action: "STATUS_UPDATE",
                    },
                    orderBy: { timestamp: "asc" },
                },
            },
        });
        const cycleTimeData = tasks
            .map((task) => {
            const startedActivity = task.activityLogs.find((a) => a.newStatus === "IN_PROGRESS");
            const completedActivity = task.activityLogs.find((a) => a.newStatus === "COMPLETED");
            if (startedActivity && completedActivity) {
                const start = new Date(startedActivity.timestamp);
                const end = new Date(completedActivity.timestamp);
                const cycleTimeDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
                return {
                    taskId: task.id,
                    taskTitle: task.title,
                    cycleTimeDays,
                    storyPoints: task.storyPoints,
                };
            }
            return null;
        })
            .filter((data) => data !== null);
        const averageCycleTime = cycleTimeData.length > 0
            ? Math.round(cycleTimeData.reduce((sum, d) => sum + d.cycleTimeDays, 0) /
                cycleTimeData.length)
            : 0;
        return {
            projectId,
            averageCycleTime,
            totalCompletedTasks: cycleTimeData.length,
            tasks: cycleTimeData,
        };
    }
    async getBlockedTasksCount(projectId) {
        const tasks = await prisma_1.default.task.findMany({
            where: {
                projectId,
                status: { not: "COMPLETED" },
            },
            include: {
                dependentOn: {
                    include: {
                        blockingTask: {
                            select: {
                                status: true,
                            },
                        },
                    },
                },
            },
        });
        const blockedTasks = tasks.filter((task) => task.dependentOn.some((dep) => dep.blockingTask.status !== "COMPLETED"));
        return blockedTasks.length;
    }
    async getBurnupData(projectId) {
        const tasks = await prisma_1.default.task.findMany({
            where: { projectId },
            include: {
                activityLogs: {
                    where: {
                        OR: [
                            { action: "CREATE" },
                            { action: "STATUS_UPDATE", newStatus: "COMPLETED" },
                        ],
                    },
                    orderBy: { timestamp: "asc" },
                },
            },
            orderBy: { createdAt: "asc" },
        });
        if (tasks.length === 0) {
            return {
                projectId,
                burnupData: [],
            };
        }
        const firstTask = tasks[0];
        if (!firstTask) {
            return {
                projectId,
                burnupData: [],
            };
        }
        const startDate = new Date(firstTask.createdAt);
        const endDate = new Date();
        const burnupData = [];
        let currentDate = new Date(startDate);
        while (currentDate <= endDate) {
            const totalScope = tasks.filter((t) => new Date(t.createdAt) <= currentDate).length;
            const completed = tasks.filter((t) => {
                const completedActivity = t.activityLogs.find((a) => a.action === "STATUS_UPDATE" &&
                    a.newStatus === "COMPLETED" &&
                    new Date(a.timestamp) <= currentDate);
                return completedActivity !== undefined;
            }).length;
            burnupData.push({
                date: currentDate.toISOString().split("T")[0],
                totalScope,
                completed,
            });
            currentDate.setDate(currentDate.getDate() + 1);
        }
        return {
            projectId,
            burnupData,
        };
    }
}
exports.default = new ReportService();

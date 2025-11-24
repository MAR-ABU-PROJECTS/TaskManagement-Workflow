"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TimeTrackingService = void 0;
const prisma_1 = __importDefault(require("../db/prisma"));
const enums_1 = require("../types/enums");
class TimeTrackingService {
    async logTime(taskId, userId, hours, description, date) {
        const task = await prisma_1.default.task.findUnique({
            where: { id: taskId },
        });
        if (!task) {
            throw new Error("Task not found");
        }
        const user = await prisma_1.default.user.findUnique({
            where: { id: userId },
        });
        if (!user) {
            throw new Error("User not found");
        }
        if (hours <= 0 || hours > 24) {
            throw new Error("Hours must be between 0 and 24");
        }
        const timeEntry = await prisma_1.default.timeEntry.create({
            data: {
                taskId,
                userId,
                hours,
                description: description || null,
                date: date || new Date(),
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                task: {
                    select: {
                        id: true,
                        title: true,
                    },
                },
            },
        });
        const totalHours = await this.getTaskTotalHours(taskId);
        await prisma_1.default.task.update({
            where: { id: taskId },
            data: { loggedHours: totalHours },
        });
        return timeEntry;
    }
    async getTaskTimeEntries(taskId) {
        const entries = await prisma_1.default.timeEntry.findMany({
            where: { taskId },
            orderBy: { date: "desc" },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
        });
        return entries;
    }
    async getUserTimeEntries(userId, filters) {
        const where = { userId };
        if (filters?.startDate || filters?.endDate) {
            where.date = {};
            if (filters.startDate) {
                where.date.gte = filters.startDate;
            }
            if (filters.endDate) {
                where.date.lte = filters.endDate;
            }
        }
        if (filters?.taskId) {
            where.taskId = filters.taskId;
        }
        if (filters?.projectId) {
            where.task = { projectId: filters.projectId };
        }
        const entries = await prisma_1.default.timeEntry.findMany({
            where,
            orderBy: { date: "desc" },
            include: {
                task: {
                    select: {
                        id: true,
                        title: true,
                        projectId: true,
                    },
                },
            },
        });
        return entries;
    }
    async updateTimeEntry(entryId, userId, userRole, data) {
        const entry = await prisma_1.default.timeEntry.findUnique({
            where: { id: entryId },
        });
        if (!entry) {
            throw new Error("Time entry not found");
        }
        const canEdit = entry.userId === userId ||
            [enums_1.UserRole.CEO, enums_1.UserRole.HOO, enums_1.UserRole.HR, enums_1.UserRole.ADMIN].includes(userRole);
        if (!canEdit) {
            throw new Error("Forbidden: You do not have permission to edit this time entry");
        }
        if (data.hours !== undefined && (data.hours <= 0 || data.hours > 24)) {
            throw new Error("Hours must be between 0 and 24");
        }
        const updated = await prisma_1.default.timeEntry.update({
            where: { id: entryId },
            data: {
                ...(data.hours !== undefined && { hours: data.hours }),
                ...(data.description !== undefined && {
                    description: data.description,
                }),
                ...(data.date !== undefined && { date: data.date }),
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                task: {
                    select: {
                        id: true,
                        title: true,
                    },
                },
            },
        });
        const totalHours = await this.getTaskTotalHours(entry.taskId);
        await prisma_1.default.task.update({
            where: { id: entry.taskId },
            data: { loggedHours: totalHours },
        });
        return updated;
    }
    async deleteTimeEntry(entryId, userId, userRole) {
        const entry = await prisma_1.default.timeEntry.findUnique({
            where: { id: entryId },
        });
        if (!entry) {
            return false;
        }
        const canDelete = entry.userId === userId ||
            [enums_1.UserRole.CEO, enums_1.UserRole.HOO, enums_1.UserRole.HR, enums_1.UserRole.ADMIN].includes(userRole);
        if (!canDelete) {
            throw new Error("Forbidden: You do not have permission to delete this time entry");
        }
        await prisma_1.default.timeEntry.delete({
            where: { id: entryId },
        });
        const totalHours = await this.getTaskTotalHours(entry.taskId);
        await prisma_1.default.task.update({
            where: { id: entry.taskId },
            data: { loggedHours: totalHours },
        });
        return true;
    }
    async startTimer(taskId, userId, description) {
        const existingTimer = await prisma_1.default.activeTimer.findFirst({
            where: { userId },
        });
        if (existingTimer) {
            throw new Error("You already have an active timer. Stop it before starting a new one.");
        }
        const task = await prisma_1.default.task.findUnique({
            where: { id: taskId },
        });
        if (!task) {
            throw new Error("Task not found");
        }
        const timer = await prisma_1.default.activeTimer.create({
            data: {
                taskId,
                userId,
                description: description || null,
                startTime: new Date(),
            },
        });
        return timer;
    }
    async stopTimer(userId) {
        const timer = await prisma_1.default.activeTimer.findFirst({
            where: { userId },
        });
        if (!timer) {
            throw new Error("No active timer found");
        }
        const endTime = new Date();
        const startTime = new Date(timer.startTime);
        const hoursWorked = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
        const roundedHours = Math.round(hoursWorked * 100) / 100;
        const timeEntry = await this.logTime(timer.taskId, userId, roundedHours, timer.description || undefined, endTime);
        await prisma_1.default.activeTimer.delete({
            where: { id: timer.id },
        });
        return timeEntry;
    }
    async getActiveTimer(userId) {
        const timer = await prisma_1.default.activeTimer.findFirst({
            where: { userId },
            include: {
                task: {
                    select: {
                        id: true,
                        title: true,
                    },
                },
            },
        });
        return timer;
    }
    async getTaskTotalHours(taskId) {
        const result = await prisma_1.default.timeEntry.aggregate({
            where: { taskId },
            _sum: {
                hours: true,
            },
        });
        return result._sum.hours || 0;
    }
    async getProjectTimeSummary(projectId) {
        const tasks = await prisma_1.default.task.findMany({
            where: { projectId },
            include: {
                timeEntries: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                            },
                        },
                    },
                },
            },
        });
        const estimatedHours = tasks.reduce((sum, task) => sum + (task.estimatedHours || 0), 0);
        const totalHours = tasks.reduce((sum, task) => {
            const taskHours = task.timeEntries.reduce((taskSum, entry) => taskSum + entry.hours, 0);
            return sum + taskHours;
        }, 0);
        const remainingHours = Math.max(0, estimatedHours - totalHours);
        const userHours = {};
        tasks.forEach((task) => {
            task.timeEntries.forEach((entry) => {
                if (!userHours[entry.userId]) {
                    userHours[entry.userId] = {
                        name: entry.user.name,
                        hours: 0,
                    };
                }
                userHours[entry.userId].hours += entry.hours;
            });
        });
        const loggedByUser = Object.entries(userHours).map(([userId, { name, hours }]) => ({
            userId,
            userName: name,
            hours: Math.round(hours * 100) / 100,
        }));
        return {
            totalHours: Math.round(totalHours * 100) / 100,
            estimatedHours,
            remainingHours: Math.round(remainingHours * 100) / 100,
            loggedByUser,
        };
    }
    async getUserTimeSummary(userId, startDate, endDate) {
        const entries = await this.getUserTimeEntries(userId, {
            startDate,
            endDate,
        });
        const totalHours = entries.reduce((sum, entry) => sum + entry.hours, 0);
        const taskHours = {};
        entries.forEach((entry) => {
            if (!taskHours[entry.taskId]) {
                taskHours[entry.taskId] = {
                    title: entry.task?.title || "Unknown",
                    hours: 0,
                };
            }
            taskHours[entry.taskId].hours += entry.hours;
        });
        const byTask = Object.entries(taskHours).map(([taskId, { title, hours }]) => ({
            taskId,
            taskTitle: title,
            hours: Math.round(hours * 100) / 100,
        }));
        return {
            totalHours: Math.round(totalHours * 100) / 100,
            entriesCount: entries.length,
            byTask,
        };
    }
}
exports.TimeTrackingService = TimeTrackingService;
exports.default = new TimeTrackingService();

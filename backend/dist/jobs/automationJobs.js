"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startAutomationJobs = exports.startOverdueAutoLabeler = exports.startDeadlineReminderChecker = void 0;
const node_cron_1 = __importDefault(require("node-cron"));
const prisma_1 = __importDefault(require("../db/prisma"));
const NotificationService_1 = __importDefault(require("../services/NotificationService"));
const enums_1 = require("../types/enums");
const startDeadlineReminderChecker = () => {
    node_cron_1.default.schedule("0 * * * *", async () => {
        console.log(`[${new Date().toISOString()}] Running deadline reminder check...`);
        try {
            const now = new Date();
            const twentyFourHoursFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
            const upcomingTasks = await prisma_1.default.task.findMany({
                where: {
                    dueDate: {
                        gte: now,
                        lte: twentyFourHoursFromNow,
                    },
                    status: {
                        notIn: [enums_1.TaskStatus.COMPLETED, enums_1.TaskStatus.REJECTED],
                    },
                },
                include: {
                    assignee: true,
                    creator: true,
                },
            });
            for (const task of upcomingTasks) {
                if (task.assigneeId) {
                    await NotificationService_1.default.notifyTaskAssigned(task.id, task.assigneeId, task.creatorId);
                }
                if (task.creatorId && task.creatorId !== task.assigneeId) {
                    await NotificationService_1.default.notifyTaskAssigned(task.id, task.creatorId, task.creatorId);
                }
            }
            console.log(`[${new Date().toISOString()}] Deadline reminder check completed. Notified ${upcomingTasks.length} tasks.`);
        }
        catch (error) {
            console.error(`[${new Date().toISOString()}] Error in deadline reminder check:`, error);
        }
    });
    console.log("Deadline reminder checker started (runs hourly)");
};
exports.startDeadlineReminderChecker = startDeadlineReminderChecker;
const startOverdueAutoLabeler = () => {
    node_cron_1.default.schedule("0 * * * *", async () => {
        console.log(`[${new Date().toISOString()}] Running overdue auto-labeler...`);
        try {
            const now = new Date();
            const overdueTasks = await prisma_1.default.task.findMany({
                where: {
                    dueDate: {
                        lt: now,
                    },
                    status: {
                        notIn: [enums_1.TaskStatus.COMPLETED, enums_1.TaskStatus.REJECTED],
                    },
                },
            });
            for (const task of overdueTasks) {
                const currentLabels = task.labels || [];
                if (!currentLabels.includes("OVERDUE")) {
                    await prisma_1.default.task.update({
                        where: { id: task.id },
                        data: {
                            labels: [...currentLabels, "OVERDUE"],
                        },
                    });
                }
            }
            console.log(`[${new Date().toISOString()}] Overdue auto-labeler completed. Labeled ${overdueTasks.length} tasks.`);
        }
        catch (error) {
            console.error(`[${new Date().toISOString()}] Error in overdue auto-labeler:`, error);
        }
    });
    console.log("Overdue auto-labeler started (runs hourly)");
};
exports.startOverdueAutoLabeler = startOverdueAutoLabeler;
const startAutomationJobs = () => {
    (0, exports.startDeadlineReminderChecker)();
    (0, exports.startOverdueAutoLabeler)();
};
exports.startAutomationJobs = startAutomationJobs;

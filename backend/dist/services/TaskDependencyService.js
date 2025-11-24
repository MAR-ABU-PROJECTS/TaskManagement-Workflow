"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskDependencyService = exports.DependencyType = void 0;
const prisma_1 = __importDefault(require("../db/prisma"));
const enums_1 = require("../types/enums");
const NotificationService_1 = __importDefault(require("./NotificationService"));
var DependencyType;
(function (DependencyType) {
    DependencyType["BLOCKS"] = "BLOCKS";
    DependencyType["IS_BLOCKED_BY"] = "IS_BLOCKED_BY";
    DependencyType["RELATES_TO"] = "RELATES_TO";
})(DependencyType || (exports.DependencyType = DependencyType = {}));
class TaskDependencyService {
    async createDependency(dependentTaskId, blockingTaskId, type = DependencyType.BLOCKS) {
        const [dependentTask, blockingTask] = await Promise.all([
            prisma_1.default.task.findUnique({ where: { id: dependentTaskId } }),
            prisma_1.default.task.findUnique({ where: { id: blockingTaskId } }),
        ]);
        if (!dependentTask || !blockingTask) {
            throw new Error("One or both tasks not found");
        }
        if (dependentTaskId === blockingTaskId) {
            throw new Error("Task cannot depend on itself");
        }
        const wouldCreateCycle = await this.wouldCreateCycle(dependentTaskId, blockingTaskId);
        if (wouldCreateCycle) {
            throw new Error("This dependency would create a circular dependency chain");
        }
        const existing = await prisma_1.default.taskDependency.findFirst({
            where: {
                dependentTaskId,
                blockingTaskId,
            },
        });
        if (existing) {
            throw new Error("Dependency already exists");
        }
        const dependency = await prisma_1.default.taskDependency.create({
            data: {
                dependentTaskId,
                blockingTaskId,
                type,
            },
            include: {
                dependentTask: {
                    select: {
                        id: true,
                        title: true,
                        status: true,
                    },
                },
                blockingTask: {
                    select: {
                        id: true,
                        title: true,
                        status: true,
                    },
                },
            },
        });
        if (dependentTask.assigneeId) {
            await NotificationService_1.default.createNotification(dependentTask.assigneeId, "DEPENDENCY_ADDED", {
                taskId: dependentTask.id,
                taskTitle: dependentTask.title,
                blockingTaskTitle: blockingTask.title,
                message: `Task "${dependentTask.title}" now depends on "${blockingTask.title}"`,
            });
        }
        return dependency;
    }
    async getTaskDependencies(taskId) {
        const [blocking, blockedBy] = await Promise.all([
            prisma_1.default.taskDependency.findMany({
                where: { blockingTaskId: taskId },
                include: {
                    dependentTask: {
                        select: {
                            id: true,
                            title: true,
                            status: true,
                            priority: true,
                        },
                    },
                },
            }),
            prisma_1.default.taskDependency.findMany({
                where: { dependentTaskId: taskId },
                include: {
                    blockingTask: {
                        select: {
                            id: true,
                            title: true,
                            status: true,
                            priority: true,
                        },
                    },
                },
            }),
        ]);
        return {
            blocking: blocking,
            blockedBy: blockedBy,
        };
    }
    async getBlockingInfo(taskId) {
        const dependencies = await this.getTaskDependencies(taskId);
        const blockedBy = dependencies.blockedBy
            .filter((dep) => {
            const status = dep.blockingTask.status;
            return status !== enums_1.TaskStatus.COMPLETED;
        })
            .map((dep) => ({
            taskId: dep.blockingTask.id,
            taskKey: dep.blockingTask.id,
            title: dep.blockingTask.title,
            status: dep.blockingTask.status,
            type: dep.type,
        }));
        const blocking = dependencies.blocking.map((dep) => ({
            taskId: dep.dependentTask.id,
            taskKey: dep.dependentTask.id,
            title: dep.dependentTask.title,
            status: dep.dependentTask.status,
            type: dep.type,
        }));
        const isBlocked = blockedBy.length > 0;
        const canStart = !isBlocked;
        let blockedReason;
        if (isBlocked) {
            const blockingTitles = blockedBy.map((t) => t.title).join(", ");
            blockedReason = `Blocked by: ${blockingTitles}`;
        }
        return {
            taskId,
            isBlocked,
            blockedBy,
            blocking,
            canStart,
            blockedReason,
        };
    }
    async getSubtaskSummary(parentTaskId) {
        const subtasks = await prisma_1.default.task.findMany({
            where: { parentTaskId },
            include: {
                timeEntries: {
                    select: {
                        hours: true,
                    },
                },
            },
        });
        const totalSubtasks = subtasks.length;
        const completedSubtasks = subtasks.filter((t) => t.status === enums_1.TaskStatus.COMPLETED).length;
        const inProgressSubtasks = subtasks.filter((t) => t.status === enums_1.TaskStatus.IN_PROGRESS).length;
        const todoSubtasks = subtasks.filter((t) => t.status === enums_1.TaskStatus.DRAFT || t.status === enums_1.TaskStatus.ASSIGNED).length;
        const completionPercentage = totalSubtasks > 0
            ? Math.round((completedSubtasks / totalSubtasks) * 100)
            : 0;
        const estimatedHours = subtasks.reduce((sum, task) => sum + (task.estimatedHours || 0), 0);
        const loggedHours = subtasks.reduce((sum, task) => {
            const taskHours = task.timeEntries.reduce((taskSum, entry) => taskSum + entry.hours, 0);
            return sum + taskHours;
        }, 0);
        const remainingHours = Math.max(0, estimatedHours - loggedHours);
        return {
            parentTaskId,
            totalSubtasks,
            completedSubtasks,
            inProgressSubtasks,
            todoSubtasks,
            completionPercentage,
            estimatedHours,
            loggedHours,
            remainingHours,
        };
    }
    async deleteDependency(dependencyId) {
        const dependency = await prisma_1.default.taskDependency.findUnique({
            where: { id: dependencyId },
        });
        if (!dependency) {
            return false;
        }
        await prisma_1.default.taskDependency.delete({
            where: { id: dependencyId },
        });
        return true;
    }
    async wouldCreateCycle(dependentTaskId, blockingTaskId) {
        const visited = new Set();
        const recursionStack = new Set();
        const dfs = async (taskId) => {
            visited.add(taskId);
            recursionStack.add(taskId);
            const dependencies = await prisma_1.default.taskDependency.findMany({
                where: { dependentTaskId: taskId },
                select: { blockingTaskId: true },
            });
            for (const dep of dependencies) {
                const nextTaskId = dep.blockingTaskId;
                if (!visited.has(nextTaskId)) {
                    if (await dfs(nextTaskId)) {
                        return true;
                    }
                }
                else if (recursionStack.has(nextTaskId)) {
                    return true;
                }
            }
            recursionStack.delete(taskId);
            return false;
        };
        const tempDeps = await prisma_1.default.taskDependency.findMany({
            where: { dependentTaskId: blockingTaskId },
        });
        for (const dep of tempDeps) {
            if (dep.blockingTaskId === dependentTaskId) {
                return true;
            }
        }
        return await dfs(blockingTaskId);
    }
    async getAllDependencies(filters) {
        const where = {};
        if (filters?.type) {
            where.type = filters.type;
        }
        if (filters?.projectId) {
            where.OR = [
                { dependentTask: { projectId: filters.projectId } },
                { blockingTask: { projectId: filters.projectId } },
            ];
        }
        const dependencies = await prisma_1.default.taskDependency.findMany({
            where,
            include: {
                dependentTask: {
                    select: {
                        id: true,
                        title: true,
                        status: true,
                        projectId: true,
                    },
                },
                blockingTask: {
                    select: {
                        id: true,
                        title: true,
                        status: true,
                        projectId: true,
                    },
                },
            },
        });
        return dependencies;
    }
}
exports.TaskDependencyService = TaskDependencyService;
exports.default = new TaskDependencyService();

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskService = void 0;
const prisma_1 = __importDefault(require("../db/prisma"));
const enums_1 = require("../types/enums");
const NotificationService_1 = __importDefault(require("./NotificationService"));
const ActivityLogService_1 = __importDefault(require("./ActivityLogService"));
class TaskService {
    async createTask(data, creatorId, creatorRole) {
        if (data.projectId) {
            const project = await prisma_1.default.project.findUnique({
                where: { id: data.projectId },
            });
            if (!project) {
                throw new Error("Project not found");
            }
        }
        if (data.assigneeId) {
            const assignee = await prisma_1.default.user.findUnique({
                where: { id: data.assigneeId },
            });
            if (!assignee) {
                throw new Error("Assignee not found");
            }
        }
        const requiresApproval = await this.checkIfRequiresApproval(creatorId, creatorRole, data.assigneeId);
        const autoApprove = [enums_1.UserRole.CEO, enums_1.UserRole.HOO, enums_1.UserRole.HR].includes(creatorRole);
        const task = await prisma_1.default.task.create({
            data: {
                projectId: data.projectId || null,
                title: data.title,
                description: data.description || null,
                priority: data.priority || "MEDIUM",
                issueType: data.issueType || enums_1.IssueType.TASK,
                status: enums_1.TaskStatus.DRAFT,
                creatorId,
                assigneeId: data.assigneeId || null,
                parentTaskId: data.parentTaskId || null,
                requiresApproval,
                approvedById: autoApprove ? creatorId : null,
                labels: data.labels || [],
                dueDate: data.dueDate || null,
            },
        });
        await ActivityLogService_1.default.logActivity({
            taskId: task.id,
            userId: creatorId,
            action: enums_1.ActivityAction.CREATE,
            metadata: { taskData: data },
        });
        if (data.assigneeId && data.assigneeId !== creatorId) {
            await NotificationService_1.default.notifyTaskAssigned(task.id, data.assigneeId, creatorId);
        }
        if (requiresApproval && !autoApprove) {
            await NotificationService_1.default.notifyApprovalRequired(task.id);
        }
        return task;
    }
    async getAllTasks(userId, userRole, filters) {
        const where = {};
        if (filters?.projectId)
            where.projectId = filters.projectId;
        if (filters?.status)
            where.status = filters.status;
        if (filters?.assigneeId)
            where.assigneeId = filters.assigneeId;
        if (filters?.creatorId)
            where.creatorId = filters.creatorId;
        if (userRole === enums_1.UserRole.STAFF) {
            where.OR = [{ creatorId: userId }, { assigneeId: userId }];
        }
        else if (userRole === enums_1.UserRole.ADMIN) {
            where.OR = [
                { creatorId: userId },
                { assigneeId: userId },
                { creator: { role: enums_1.UserRole.STAFF } },
            ];
        }
        const tasks = await prisma_1.default.task.findMany({
            where,
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
                assignee: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        role: true,
                    },
                },
                project: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                _count: {
                    select: {
                        comments: true,
                        subTasks: true,
                    },
                },
            },
        });
        return tasks;
    }
    async getTaskById(id, userId, userRole) {
        const task = await prisma_1.default.task.findUnique({
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
                assignee: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        role: true,
                    },
                },
                approvedBy: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        role: true,
                    },
                },
                project: true,
                parentTask: true,
                subTasks: {
                    select: {
                        id: true,
                        title: true,
                        status: true,
                        priority: true,
                    },
                },
                comments: {
                    orderBy: { createdAt: "desc" },
                    take: 10,
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                            },
                        },
                    },
                },
            },
        });
        if (!task) {
            return null;
        }
        const hasAccess = this.checkTaskAccess(task, userId, userRole);
        if (!hasAccess) {
            return null;
        }
        return task;
    }
    async updateTask(id, data, userId, userRole) {
        const task = await prisma_1.default.task.findUnique({ where: { id } });
        if (!task) {
            return null;
        }
        const canUpdate = task.creatorId === userId ||
            task.assigneeId === userId ||
            [enums_1.UserRole.CEO, enums_1.UserRole.HOO, enums_1.UserRole.HR].includes(userRole);
        if (!canUpdate) {
            throw new Error("Forbidden: You do not have permission to update this task");
        }
        const updated = await prisma_1.default.task.update({
            where: { id },
            data: {
                title: data.title,
                description: data.description,
                priority: data.priority,
                issueType: data.issueType,
                labels: data.labels,
                dueDate: data.dueDate,
            },
        });
        return updated;
    }
    async changeStatus(id, newStatus, userId, userRole) {
        const task = await prisma_1.default.task.findUnique({ where: { id } });
        if (!task) {
            return null;
        }
        const allowedTransitions = enums_1.ALLOWED_STATUS_TRANSITIONS[task.status];
        if (!allowedTransitions.includes(newStatus)) {
            throw new Error(`Invalid status transition from ${task.status} to ${newStatus}`);
        }
        const canChange = task.creatorId === userId ||
            task.assigneeId === userId ||
            [enums_1.UserRole.CEO, enums_1.UserRole.HOO, enums_1.UserRole.HR].includes(userRole);
        if (!canChange) {
            throw new Error("Forbidden: You do not have permission to change this task status");
        }
        const updated = await prisma_1.default.task.update({
            where: { id },
            data: { status: newStatus },
        });
        await ActivityLogService_1.default.logActivity({
            taskId: id,
            userId,
            action: enums_1.ActivityAction.STATUS_UPDATE,
            previousStatus: task.status,
            newStatus,
            metadata: {},
        });
        await NotificationService_1.default.notifyStatusChanged(id, task.status, newStatus);
        return updated;
    }
    async assignTask(id, assigneeId, userId, userRole) {
        const task = await prisma_1.default.task.findUnique({ where: { id } });
        if (!task) {
            return null;
        }
        const canAssign = task.creatorId === userId ||
            [enums_1.UserRole.CEO, enums_1.UserRole.HOO, enums_1.UserRole.HR, enums_1.UserRole.ADMIN].includes(userRole);
        if (!canAssign) {
            throw new Error("Forbidden: You do not have permission to assign this task");
        }
        const assignee = await prisma_1.default.user.findUnique({
            where: { id: assigneeId },
        });
        if (!assignee) {
            throw new Error("Assignee not found");
        }
        const updated = await prisma_1.default.task.update({
            where: { id },
            data: {
                assigneeId,
                status: enums_1.TaskStatus.ASSIGNED,
            },
        });
        await ActivityLogService_1.default.logActivity({
            taskId: id,
            userId,
            action: enums_1.ActivityAction.ASSIGN,
            metadata: { assigneeId, assigneeName: assignee.name },
        });
        await NotificationService_1.default.notifyTaskAssigned(id, assigneeId, userId);
        return updated;
    }
    async approveTask(id, approverId, userRole) {
        const task = await prisma_1.default.task.findUnique({ where: { id } });
        if (!task) {
            return null;
        }
        if (!task.requiresApproval) {
            throw new Error("This task does not require approval");
        }
        if (task.approvedById) {
            throw new Error("Task already approved");
        }
        if (![enums_1.UserRole.CEO, enums_1.UserRole.HOO, enums_1.UserRole.HR].includes(userRole)) {
            throw new Error("Forbidden: Only CEO, HOO, or HR can approve tasks");
        }
        const updated = await prisma_1.default.task.update({
            where: { id },
            data: { approvedById: approverId },
        });
        await ActivityLogService_1.default.logActivity({
            taskId: id,
            userId: approverId,
            action: enums_1.ActivityAction.APPROVE,
            metadata: {},
        });
        await NotificationService_1.default.notifyTaskApproved(id);
        return updated;
    }
    async rejectTask(id, rejectionReason, userId, userRole) {
        const task = await prisma_1.default.task.findUnique({ where: { id } });
        if (!task) {
            return null;
        }
        if (![enums_1.UserRole.CEO, enums_1.UserRole.HOO, enums_1.UserRole.HR].includes(userRole)) {
            throw new Error("Forbidden: Only CEO, HOO, or HR can reject tasks");
        }
        if (!rejectionReason) {
            throw new Error("Rejection reason is required");
        }
        const updated = await prisma_1.default.task.update({
            where: { id },
            data: {
                status: enums_1.TaskStatus.REJECTED,
                rejectionReason,
            },
        });
        await ActivityLogService_1.default.logActivity({
            taskId: id,
            userId,
            action: enums_1.ActivityAction.REJECT,
            newStatus: enums_1.TaskStatus.REJECTED,
            metadata: { rejectionReason },
        });
        await NotificationService_1.default.notifyTaskRejected(id, rejectionReason);
        return updated;
    }
    async checkIfRequiresApproval(_creatorId, creatorRole, assigneeId) {
        if ([enums_1.UserRole.CEO, enums_1.UserRole.HOO, enums_1.UserRole.HR].includes(creatorRole)) {
            return false;
        }
        if (creatorRole === enums_1.UserRole.ADMIN && assigneeId) {
            const assignee = await prisma_1.default.user.findUnique({
                where: { id: assigneeId },
            });
            if (assignee?.role === enums_1.UserRole.STAFF) {
                return true;
            }
        }
        return false;
    }
    checkTaskAccess(task, userId, userRole) {
        if ([enums_1.UserRole.CEO, enums_1.UserRole.HOO, enums_1.UserRole.HR].includes(userRole)) {
            return true;
        }
        if (task.creatorId === userId || task.assigneeId === userId) {
            return true;
        }
        if (userRole === enums_1.UserRole.ADMIN && task.creator?.role === enums_1.UserRole.STAFF) {
            return true;
        }
        return false;
    }
    async searchTasks(whereClause) {
        const tasks = await prisma_1.default.task.findMany({
            where: whereClause,
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
                assignee: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        role: true,
                    },
                },
                project: {
                    select: {
                        id: true,
                        name: true,
                        description: true,
                    },
                },
                sprint: {
                    select: {
                        id: true,
                        name: true,
                        status: true,
                    },
                },
            },
        });
        return tasks;
    }
}
exports.TaskService = TaskService;
exports.default = new TaskService();

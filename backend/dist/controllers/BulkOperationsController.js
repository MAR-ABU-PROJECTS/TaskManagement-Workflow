"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const prisma_1 = __importDefault(require("../db/prisma"));
const enums_1 = require("../types/enums");
const ActivityLogService_1 = __importDefault(require("../services/ActivityLogService"));
const NotificationService_1 = __importDefault(require("../services/NotificationService"));
class BulkOperationsController {
    static async bulkEdit(req, res) {
        try {
            const { taskIds, updates } = req.body;
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ message: "Unauthorized" });
            }
            if (!taskIds || !Array.isArray(taskIds) || taskIds.length === 0) {
                return res.status(400).json({ message: "Task IDs are required" });
            }
            if (!updates || Object.keys(updates).length === 0) {
                return res.status(400).json({ message: "Updates are required" });
            }
            const allowedFields = [
                "priority",
                "assigneeId",
                "labels",
                "storyPoints",
                "dueDate",
                "sprintId",
                "epicId",
            ];
            const updateFields = Object.keys(updates);
            const invalidFields = updateFields.filter((f) => !allowedFields.includes(f));
            if (invalidFields.length > 0) {
                return res.status(400).json({
                    message: `Invalid fields: ${invalidFields.join(", ")}`,
                    allowedFields,
                });
            }
            const result = await prisma_1.default.task.updateMany({
                where: {
                    id: { in: taskIds },
                },
                data: updates,
            });
            for (const taskId of taskIds) {
                await ActivityLogService_1.default.logActivity({
                    taskId,
                    userId,
                    action: "UPDATED",
                });
            }
            return res.status(200).json({
                message: `${result.count} tasks updated successfully`,
                updated: result.count,
            });
        }
        catch (error) {
            return res.status(500).json({ message: error.message });
        }
    }
    static async bulkTransition(req, res) {
        try {
            const { taskIds, status } = req.body;
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ message: "Unauthorized" });
            }
            if (!taskIds || !Array.isArray(taskIds) || taskIds.length === 0) {
                return res.status(400).json({ message: "Task IDs are required" });
            }
            if (!status) {
                return res.status(400).json({ message: "Status is required" });
            }
            if (!Object.values(enums_1.TaskStatus).includes(status)) {
                return res.status(400).json({
                    message: "Invalid status",
                    validStatuses: Object.values(enums_1.TaskStatus),
                });
            }
            const result = await prisma_1.default.task.updateMany({
                where: {
                    id: { in: taskIds },
                },
                data: {
                    status: status,
                },
            });
            for (const taskId of taskIds) {
                await ActivityLogService_1.default.logActivity({
                    taskId,
                    userId,
                    action: "STATUS_CHANGED",
                });
                const task = await prisma_1.default.task.findUnique({
                    where: { id: taskId },
                    include: { assignee: true },
                });
                if (task?.assignee) {
                    await NotificationService_1.default.createNotification(task.assignee.id, "TASK_STATUS_CHANGED", {
                        title: "Task Status Changed",
                        message: `Task "${task.title}" status changed to ${status}`,
                        taskId,
                    });
                }
            }
            return res.status(200).json({
                message: `${result.count} tasks transitioned to ${status}`,
                updated: result.count,
            });
        }
        catch (error) {
            return res.status(500).json({ message: error.message });
        }
    }
    static async bulkAssign(req, res) {
        try {
            const { taskIds, assigneeId } = req.body;
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ message: "Unauthorized" });
            }
            if (!taskIds || !Array.isArray(taskIds) || taskIds.length === 0) {
                return res.status(400).json({ message: "Task IDs are required" });
            }
            if (!assigneeId) {
                return res.status(400).json({ message: "Assignee ID is required" });
            }
            const assignee = await prisma_1.default.user.findUnique({
                where: { id: assigneeId },
            });
            if (!assignee) {
                return res.status(404).json({ message: "Assignee not found" });
            }
            const result = await prisma_1.default.task.updateMany({
                where: {
                    id: { in: taskIds },
                },
                data: {
                    assigneeId,
                },
            });
            for (const taskId of taskIds) {
                await ActivityLogService_1.default.logActivity({
                    taskId,
                    userId,
                    action: "ASSIGNED",
                });
                const task = await prisma_1.default.task.findUnique({
                    where: { id: taskId },
                });
                if (task) {
                    await NotificationService_1.default.createNotification(assigneeId, "TASK_ASSIGNED", {
                        title: "Task Assigned",
                        message: `You have been assigned to task "${task.title}"`,
                        taskId,
                    });
                }
            }
            return res.status(200).json({
                message: `${result.count} tasks assigned to ${assignee.name}`,
                updated: result.count,
            });
        }
        catch (error) {
            return res.status(500).json({ message: error.message });
        }
    }
    static async bulkDelete(req, res) {
        try {
            const { taskIds } = req.body;
            const userId = req.user?.id;
            const userRole = req.user?.role;
            if (!userId) {
                return res.status(401).json({ message: "Unauthorized" });
            }
            if (!taskIds || !Array.isArray(taskIds) || taskIds.length === 0) {
                return res.status(400).json({ message: "Task IDs are required" });
            }
            const allowedRoles = ["CEO", "HOO", "HR", "ADMIN"];
            if (!allowedRoles.includes(userRole || "")) {
                return res.status(403).json({
                    message: "Insufficient permissions for bulk delete",
                });
            }
            const result = await prisma_1.default.task.updateMany({
                where: {
                    id: { in: taskIds },
                },
                data: {
                    status: "CANCELLED",
                },
            });
            for (const taskId of taskIds) {
                await ActivityLogService_1.default.logActivity({
                    taskId,
                    userId,
                    action: "DELETED",
                });
            }
            return res.status(200).json({
                message: `${result.count} tasks deleted successfully`,
                deleted: result.count,
            });
        }
        catch (error) {
            return res.status(500).json({ message: error.message });
        }
    }
    static async bulkMoveToSprint(req, res) {
        try {
            const { taskIds, sprintId } = req.body;
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ message: "Unauthorized" });
            }
            if (!taskIds || !Array.isArray(taskIds) || taskIds.length === 0) {
                return res.status(400).json({ message: "Task IDs are required" });
            }
            if (sprintId !== null) {
                const sprint = await prisma_1.default.sprint.findUnique({
                    where: { id: sprintId },
                });
                if (!sprint) {
                    return res.status(404).json({ message: "Sprint not found" });
                }
            }
            const result = await prisma_1.default.task.updateMany({
                where: {
                    id: { in: taskIds },
                },
                data: {
                    sprintId: sprintId || null,
                },
            });
            for (const taskId of taskIds) {
                await ActivityLogService_1.default.logActivity({
                    taskId,
                    userId,
                    action: "UPDATED",
                });
            }
            return res.status(200).json({
                message: `${result.count} tasks moved ${sprintId ? "to sprint" : "to backlog"}`,
                updated: result.count,
            });
        }
        catch (error) {
            return res.status(500).json({ message: error.message });
        }
    }
    static async bulkUpdatePriority(req, res) {
        try {
            const { taskIds, priority } = req.body;
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ message: "Unauthorized" });
            }
            if (!taskIds || !Array.isArray(taskIds) || taskIds.length === 0) {
                return res.status(400).json({ message: "Task IDs are required" });
            }
            if (!priority) {
                return res.status(400).json({ message: "Priority is required" });
            }
            if (!Object.values(enums_1.TaskPriority).includes(priority)) {
                return res.status(400).json({
                    message: "Invalid priority",
                    validPriorities: Object.values(enums_1.TaskPriority),
                });
            }
            const result = await prisma_1.default.task.updateMany({
                where: {
                    id: { in: taskIds },
                },
                data: {
                    priority: priority,
                },
            });
            for (const taskId of taskIds) {
                await ActivityLogService_1.default.logActivity({
                    taskId,
                    userId,
                    action: "UPDATED",
                });
            }
            return res.status(200).json({
                message: `${result.count} tasks priority updated to ${priority}`,
                updated: result.count,
            });
        }
        catch (error) {
            return res.status(500).json({ message: error.message });
        }
    }
}
exports.default = BulkOperationsController;

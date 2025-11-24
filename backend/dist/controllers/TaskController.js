"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskController = void 0;
const TaskService_1 = __importDefault(require("../services/TaskService"));
class TaskController {
    async createTask(req, res) {
        try {
            if (!req.user) {
                return res.status(401).json({ message: "Unauthorized" });
            }
            const data = req.body;
            if (!data.title) {
                return res.status(400).json({ message: "Task title is required" });
            }
            const task = await TaskService_1.default.createTask(data, req.user.id, req.user.role);
            return res.status(201).json({
                message: "Task created successfully",
                data: task,
            });
        }
        catch (error) {
            return res.status(500).json({
                message: "Failed to create task",
                error: error.message,
            });
        }
    }
    async getAllTasks(req, res) {
        try {
            if (!req.user) {
                return res.status(401).json({ message: "Unauthorized" });
            }
            const filters = {
                projectId: req.query.projectId,
                status: req.query.status,
                assigneeId: req.query.assigneeId,
                creatorId: req.query.creatorId,
            };
            const tasks = await TaskService_1.default.getAllTasks(req.user.id, req.user.role, filters);
            return res.status(200).json({
                message: "Tasks retrieved successfully",
                data: tasks,
                count: tasks.length,
            });
        }
        catch (error) {
            return res.status(500).json({
                message: "Failed to retrieve tasks",
                error: error.message,
            });
        }
    }
    async getTaskById(req, res) {
        try {
            if (!req.user) {
                return res.status(401).json({ message: "Unauthorized" });
            }
            const { id } = req.params;
            if (!id) {
                return res.status(400).json({ message: "Task ID is required" });
            }
            const task = await TaskService_1.default.getTaskById(id, req.user.id, req.user.role);
            if (!task) {
                return res
                    .status(404)
                    .json({ message: "Task not found or access denied" });
            }
            return res.status(200).json({
                message: "Task retrieved successfully",
                data: task,
            });
        }
        catch (error) {
            return res.status(500).json({
                message: "Failed to retrieve task",
                error: error.message,
            });
        }
    }
    async updateTask(req, res) {
        try {
            if (!req.user) {
                return res.status(401).json({ message: "Unauthorized" });
            }
            const { id } = req.params;
            if (!id) {
                return res.status(400).json({ message: "Task ID is required" });
            }
            const data = req.body;
            const task = await TaskService_1.default.updateTask(id, data, req.user.id, req.user.role);
            if (!task) {
                return res.status(404).json({ message: "Task not found" });
            }
            return res.status(200).json({
                message: "Task updated successfully",
                data: task,
            });
        }
        catch (error) {
            if (error.message.includes("Forbidden")) {
                return res.status(403).json({ message: error.message });
            }
            return res.status(500).json({
                message: "Failed to update task",
                error: error.message,
            });
        }
    }
    async changeStatus(req, res) {
        try {
            if (!req.user) {
                return res.status(401).json({ message: "Unauthorized" });
            }
            const { id } = req.params;
            if (!id) {
                return res.status(400).json({ message: "Task ID is required" });
            }
            const { status } = req.body;
            if (!status) {
                return res.status(400).json({ message: "Status is required" });
            }
            const task = await TaskService_1.default.changeStatus(id, status, req.user.id, req.user.role);
            if (!task) {
                return res.status(404).json({ message: "Task not found" });
            }
            return res.status(200).json({
                message: "Task status updated successfully",
                data: task,
            });
        }
        catch (error) {
            if (error.message.includes("Forbidden") ||
                error.message.includes("Invalid")) {
                return res.status(403).json({ message: error.message });
            }
            return res.status(500).json({
                message: "Failed to change task status",
                error: error.message,
            });
        }
    }
    async assignTask(req, res) {
        try {
            if (!req.user) {
                return res.status(401).json({ message: "Unauthorized" });
            }
            const { id } = req.params;
            if (!id) {
                return res.status(400).json({ message: "Task ID is required" });
            }
            const { assigneeId } = req.body;
            if (!assigneeId) {
                return res.status(400).json({ message: "Assignee ID is required" });
            }
            const task = await TaskService_1.default.assignTask(id, assigneeId, req.user.id, req.user.role);
            if (!task) {
                return res.status(404).json({ message: "Task not found" });
            }
            return res.status(200).json({
                message: "Task assigned successfully",
                data: task,
            });
        }
        catch (error) {
            if (error.message.includes("Forbidden") ||
                error.message.includes("not found")) {
                return res.status(403).json({ message: error.message });
            }
            return res.status(500).json({
                message: "Failed to assign task",
                error: error.message,
            });
        }
    }
    async approveTask(req, res) {
        try {
            if (!req.user) {
                return res.status(401).json({ message: "Unauthorized" });
            }
            const { id } = req.params;
            if (!id) {
                return res.status(400).json({ message: "Task ID is required" });
            }
            const task = await TaskService_1.default.approveTask(id, req.user.id, req.user.role);
            if (!task) {
                return res.status(404).json({ message: "Task not found" });
            }
            return res.status(200).json({
                message: "Task approved successfully",
                data: task,
            });
        }
        catch (error) {
            if (error.message.includes("Forbidden") ||
                error.message.includes("already")) {
                return res.status(403).json({ message: error.message });
            }
            return res.status(500).json({
                message: "Failed to approve task",
                error: error.message,
            });
        }
    }
    async rejectTask(req, res) {
        try {
            if (!req.user) {
                return res.status(401).json({ message: "Unauthorized" });
            }
            const { id } = req.params;
            if (!id) {
                return res.status(400).json({ message: "Task ID is required" });
            }
            const { rejectionReason } = req.body;
            if (!rejectionReason) {
                return res
                    .status(400)
                    .json({ message: "Rejection reason is required" });
            }
            const task = await TaskService_1.default.rejectTask(id, rejectionReason, req.user.id, req.user.role);
            if (!task) {
                return res.status(404).json({ message: "Task not found" });
            }
            return res.status(200).json({
                message: "Task rejected successfully",
                data: task,
            });
        }
        catch (error) {
            if (error.message.includes("Forbidden")) {
                return res.status(403).json({ message: error.message });
            }
            return res.status(500).json({
                message: "Failed to reject task",
                error: error.message,
            });
        }
    }
}
exports.TaskController = TaskController;
exports.default = new TaskController();

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const BacklogService_1 = __importDefault(require("../services/BacklogService"));
class BacklogController {
    async getProjectBacklog(req, res) {
        try {
            const { projectId } = req.params;
            if (!projectId) {
                return res.status(400).json({ error: "Project ID is required" });
            }
            const { epicId, priority, assigneeId } = req.query;
            const tasks = await BacklogService_1.default.getProjectBacklog(projectId, {
                epicId: epicId,
                priority: priority,
                assigneeId: assigneeId,
            });
            return res.json(tasks);
        }
        catch (error) {
            return res.status(400).json({ error: error.message });
        }
    }
    async getBacklogByEpic(req, res) {
        try {
            const { projectId } = req.params;
            if (!projectId) {
                return res.status(400).json({ error: "Project ID is required" });
            }
            const result = await BacklogService_1.default.getBacklogByEpic(projectId);
            return res.json(result);
        }
        catch (error) {
            return res.status(400).json({ error: error.message });
        }
    }
    async updateBacklogPriority(req, res) {
        try {
            const { taskId } = req.params;
            if (!taskId) {
                return res.status(400).json({ error: "Task ID is required" });
            }
            const { priority } = req.body;
            const task = await BacklogService_1.default.updateBacklogPriority(taskId, priority);
            return res.json(task);
        }
        catch (error) {
            return res.status(400).json({ error: error.message });
        }
    }
    async estimateTask(req, res) {
        try {
            const { taskId } = req.params;
            if (!taskId) {
                return res.status(400).json({ error: "Task ID is required" });
            }
            const { storyPoints } = req.body;
            const task = await BacklogService_1.default.estimateTask(taskId, storyPoints);
            return res.json(task);
        }
        catch (error) {
            return res.status(400).json({ error: error.message });
        }
    }
    async bulkEstimate(req, res) {
        try {
            const { estimates } = req.body;
            const result = await BacklogService_1.default.bulkEstimate(estimates);
            return res.json(result);
        }
        catch (error) {
            return res.status(400).json({ error: error.message });
        }
    }
    async getBacklogStats(req, res) {
        try {
            const { projectId } = req.params;
            if (!projectId) {
                return res.status(400).json({ error: "Project ID is required" });
            }
            const stats = await BacklogService_1.default.getBacklogStats(projectId);
            return res.json(stats);
        }
        catch (error) {
            return res.status(400).json({ error: error.message });
        }
    }
    async getReadyTasks(req, res) {
        try {
            const { projectId } = req.params;
            if (!projectId) {
                return res.status(400).json({ error: "Project ID is required" });
            }
            const tasks = await BacklogService_1.default.getReadyTasks(projectId);
            return res.json(tasks);
        }
        catch (error) {
            return res.status(400).json({ error: error.message });
        }
    }
    async moveTasksToSprint(req, res) {
        try {
            const { taskIds, sprintId } = req.body;
            const result = await BacklogService_1.default.moveTasksToSprint(taskIds, sprintId);
            return res.json(result);
        }
        catch (error) {
            return res.status(400).json({ error: error.message });
        }
    }
}
exports.default = new BacklogController();

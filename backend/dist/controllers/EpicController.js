"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const EpicService_1 = __importDefault(require("../services/EpicService"));
class EpicController {
    async createEpic(req, res) {
        try {
            const { projectId } = req.params;
            if (!projectId) {
                return res.status(400).json({ error: "Project ID is required" });
            }
            const epic = await EpicService_1.default.createEpic(projectId, req.body);
            return res.status(201).json(epic);
        }
        catch (error) {
            return res.status(400).json({ error: error.message });
        }
    }
    async getProjectEpics(req, res) {
        try {
            const { projectId } = req.params;
            if (!projectId) {
                return res.status(400).json({ error: "Project ID is required" });
            }
            const epics = await EpicService_1.default.getProjectEpics(projectId);
            return res.json(epics);
        }
        catch (error) {
            return res.status(400).json({ error: error.message });
        }
    }
    async getEpicById(req, res) {
        try {
            const { epicId } = req.params;
            if (!epicId) {
                return res.status(400).json({ error: "Epic ID is required" });
            }
            const epic = await EpicService_1.default.getEpicById(epicId);
            return res.json(epic);
        }
        catch (error) {
            return res.status(404).json({ error: error.message });
        }
    }
    async updateEpic(req, res) {
        try {
            const { epicId } = req.params;
            if (!epicId) {
                return res.status(400).json({ error: "Epic ID is required" });
            }
            const epic = await EpicService_1.default.updateEpic(epicId, req.body);
            return res.json(epic);
        }
        catch (error) {
            return res.status(400).json({ error: error.message });
        }
    }
    async deleteEpic(req, res) {
        try {
            const { epicId } = req.params;
            if (!epicId) {
                return res.status(400).json({ error: "Epic ID is required" });
            }
            const result = await EpicService_1.default.deleteEpic(epicId);
            return res.json(result);
        }
        catch (error) {
            return res.status(400).json({ error: error.message });
        }
    }
    async addTaskToEpic(req, res) {
        try {
            const { epicId, taskId } = req.params;
            if (!epicId || !taskId) {
                return res
                    .status(400)
                    .json({ error: "Epic ID and Task ID are required" });
            }
            const task = await EpicService_1.default.addTaskToEpic(epicId, taskId);
            return res.json(task);
        }
        catch (error) {
            return res.status(400).json({ error: error.message });
        }
    }
    async removeTaskFromEpic(req, res) {
        try {
            const { taskId } = req.params;
            if (!taskId) {
                return res.status(400).json({ error: "Task ID is required" });
            }
            const task = await EpicService_1.default.removeTaskFromEpic(taskId);
            return res.json(task);
        }
        catch (error) {
            return res.status(400).json({ error: error.message });
        }
    }
}
exports.default = new EpicController();

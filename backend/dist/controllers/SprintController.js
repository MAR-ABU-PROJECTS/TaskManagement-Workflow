"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const SprintService_1 = __importDefault(require("../services/SprintService"));
class SprintController {
    async createSprint(req, res) {
        try {
            const { projectId } = req.params;
            if (!projectId) {
                return res.status(400).json({ error: "Project ID is required" });
            }
            const sprint = await SprintService_1.default.createSprint(projectId, req.body);
            return res.status(201).json(sprint);
        }
        catch (error) {
            return res.status(400).json({ error: error.message });
        }
    }
    async getProjectSprints(req, res) {
        try {
            const { projectId } = req.params;
            if (!projectId) {
                return res.status(400).json({ error: "Project ID is required" });
            }
            const { includeCompleted } = req.query;
            const sprints = await SprintService_1.default.getProjectSprints(projectId, includeCompleted !== "false");
            return res.json(sprints);
        }
        catch (error) {
            return res.status(400).json({ error: error.message });
        }
    }
    async getSprintById(req, res) {
        try {
            const { sprintId } = req.params;
            if (!sprintId) {
                return res.status(400).json({ error: "Sprint ID is required" });
            }
            const sprint = await SprintService_1.default.getSprintById(sprintId);
            return res.json(sprint);
        }
        catch (error) {
            return res.status(404).json({ error: error.message });
        }
    }
    async updateSprint(req, res) {
        try {
            const { sprintId } = req.params;
            if (!sprintId) {
                return res.status(400).json({ error: "Sprint ID is required" });
            }
            const sprint = await SprintService_1.default.updateSprint(sprintId, req.body);
            return res.json(sprint);
        }
        catch (error) {
            return res.status(400).json({ error: error.message });
        }
    }
    async startSprint(req, res) {
        try {
            const { sprintId } = req.params;
            if (!sprintId) {
                return res.status(400).json({ error: "Sprint ID is required" });
            }
            const sprint = await SprintService_1.default.startSprint(sprintId);
            return res.json(sprint);
        }
        catch (error) {
            return res.status(400).json({ error: error.message });
        }
    }
    async completeSprint(req, res) {
        try {
            const { sprintId } = req.params;
            if (!sprintId) {
                return res.status(400).json({ error: "Sprint ID is required" });
            }
            const { moveIncompleteTo } = req.body;
            const sprint = await SprintService_1.default.completeSprint(sprintId, moveIncompleteTo);
            return res.json(sprint);
        }
        catch (error) {
            return res.status(400).json({ error: error.message });
        }
    }
    async cancelSprint(req, res) {
        try {
            const { sprintId } = req.params;
            if (!sprintId) {
                return res.status(400).json({ error: "Sprint ID is required" });
            }
            const sprint = await SprintService_1.default.cancelSprint(sprintId);
            return res.json(sprint);
        }
        catch (error) {
            return res.status(400).json({ error: error.message });
        }
    }
    async addTasksToSprint(req, res) {
        try {
            const { sprintId } = req.params;
            if (!sprintId) {
                return res.status(400).json({ error: "Sprint ID is required" });
            }
            const { taskIds } = req.body;
            const result = await SprintService_1.default.addTasksToSprint(sprintId, taskIds);
            return res.json(result);
        }
        catch (error) {
            return res.status(400).json({ error: error.message });
        }
    }
    async removeTasksFromSprint(req, res) {
        try {
            const { taskIds } = req.body;
            const result = await SprintService_1.default.removeTasksFromSprint(taskIds);
            return res.json(result);
        }
        catch (error) {
            return res.status(400).json({ error: error.message });
        }
    }
    async getBurndownData(req, res) {
        try {
            const { sprintId } = req.params;
            if (!sprintId) {
                return res.status(400).json({ error: "Sprint ID is required" });
            }
            const data = await SprintService_1.default.getBurndownData(sprintId);
            return res.json(data);
        }
        catch (error) {
            return res.status(400).json({ error: error.message });
        }
    }
    async getVelocity(req, res) {
        try {
            const { sprintId } = req.params;
            if (!sprintId) {
                return res.status(400).json({ error: "Sprint ID is required" });
            }
            const data = await SprintService_1.default.calculateVelocity(sprintId);
            return res.json(data);
        }
        catch (error) {
            return res.status(400).json({ error: error.message });
        }
    }
    async getTeamVelocity(req, res) {
        try {
            const { projectId } = req.params;
            if (!projectId) {
                return res.status(400).json({ error: "Project ID is required" });
            }
            const { lastNSprints } = req.query;
            const data = await SprintService_1.default.getTeamVelocity(projectId, lastNSprints ? parseInt(lastNSprints) : 3);
            return res.json(data);
        }
        catch (error) {
            return res.status(400).json({ error: error.message });
        }
    }
}
exports.default = new SprintController();

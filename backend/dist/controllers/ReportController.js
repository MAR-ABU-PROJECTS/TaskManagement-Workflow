"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ReportService_1 = __importDefault(require("../services/ReportService"));
class ReportController {
    async getVelocityReport(req, res) {
        try {
            const { projectId } = req.params;
            const { lastNSprints } = req.query;
            if (!projectId) {
                return res.status(400).json({ error: "Project ID is required" });
            }
            const report = await ReportService_1.default.getVelocityReport(projectId, lastNSprints ? parseInt(lastNSprints) : 5);
            return res.json(report);
        }
        catch (error) {
            return res.status(400).json({ error: error.message });
        }
    }
    async getTeamProductivity(req, res) {
        try {
            const { projectId } = req.params;
            const { startDate, endDate } = req.query;
            if (!projectId) {
                return res.status(400).json({ error: "Project ID is required" });
            }
            const report = await ReportService_1.default.getTeamProductivity(projectId, startDate ? new Date(startDate) : undefined, endDate ? new Date(endDate) : undefined);
            return res.json(report);
        }
        catch (error) {
            return res.status(400).json({ error: error.message });
        }
    }
    async getProjectHealth(req, res) {
        try {
            const { projectId } = req.params;
            if (!projectId) {
                return res.status(400).json({ error: "Project ID is required" });
            }
            const health = await ReportService_1.default.getProjectHealth(projectId);
            return res.json(health);
        }
        catch (error) {
            return res.status(400).json({ error: error.message });
        }
    }
    async getCycleTimeReport(req, res) {
        try {
            const { projectId } = req.params;
            if (!projectId) {
                return res.status(400).json({ error: "Project ID is required" });
            }
            const report = await ReportService_1.default.getCycleTimeReport(projectId);
            return res.json(report);
        }
        catch (error) {
            return res.status(400).json({ error: error.message });
        }
    }
    async getBurnupData(req, res) {
        try {
            const { projectId } = req.params;
            if (!projectId) {
                return res.status(400).json({ error: "Project ID is required" });
            }
            const data = await ReportService_1.default.getBurnupData(projectId);
            return res.json(data);
        }
        catch (error) {
            return res.status(400).json({ error: error.message });
        }
    }
}
exports.default = new ReportController();

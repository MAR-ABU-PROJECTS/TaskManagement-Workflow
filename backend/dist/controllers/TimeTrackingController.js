"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TimeTrackingController = void 0;
const TimeTrackingService_1 = __importDefault(require("../services/TimeTrackingService"));
class TimeTrackingController {
    async logTime(req, res) {
        try {
            if (!req.user) {
                return res.status(401).json({ message: "Unauthorized" });
            }
            const { taskId } = req.params;
            if (!taskId) {
                return res.status(400).json({ message: "Task ID is required" });
            }
            const { hours, description, date } = req.body;
            if (!hours) {
                return res.status(400).json({ message: "Hours is required" });
            }
            const timeEntry = await TimeTrackingService_1.default.logTime(taskId, req.user.id, hours, description, date ? new Date(date) : undefined);
            return res.status(201).json({
                message: "Time logged successfully",
                data: timeEntry,
            });
        }
        catch (error) {
            if (error.message.includes("not found") ||
                error.message.includes("must be")) {
                return res.status(400).json({ message: error.message });
            }
            return res.status(500).json({
                message: "Failed to log time",
                error: error.message,
            });
        }
    }
    async getTaskTimeEntries(req, res) {
        try {
            if (!req.user) {
                return res.status(401).json({ message: "Unauthorized" });
            }
            const { taskId } = req.params;
            if (!taskId) {
                return res.status(400).json({ message: "Task ID is required" });
            }
            const entries = await TimeTrackingService_1.default.getTaskTimeEntries(taskId);
            const totalHours = await TimeTrackingService_1.default.getTaskTotalHours(taskId);
            return res.status(200).json({
                message: "Time entries retrieved successfully",
                data: entries,
                totalHours,
                count: entries.length,
            });
        }
        catch (error) {
            return res.status(500).json({
                message: "Failed to retrieve time entries",
                error: error.message,
            });
        }
    }
    async getUserTimeEntries(req, res) {
        try {
            if (!req.user) {
                return res.status(401).json({ message: "Unauthorized" });
            }
            const { startDate, endDate, taskId, projectId } = req.query;
            const entries = await TimeTrackingService_1.default.getUserTimeEntries(req.user.id, {
                startDate: startDate ? new Date(startDate) : undefined,
                endDate: endDate ? new Date(endDate) : undefined,
                taskId: taskId,
                projectId: projectId,
            });
            return res.status(200).json({
                message: "Time entries retrieved successfully",
                data: entries,
                count: entries.length,
            });
        }
        catch (error) {
            return res.status(500).json({
                message: "Failed to retrieve time entries",
                error: error.message,
            });
        }
    }
    async updateTimeEntry(req, res) {
        try {
            if (!req.user) {
                return res.status(401).json({ message: "Unauthorized" });
            }
            const { id } = req.params;
            if (!id) {
                return res.status(400).json({ message: "Time entry ID is required" });
            }
            const { hours, description, date } = req.body;
            const updated = await TimeTrackingService_1.default.updateTimeEntry(id, req.user.id, req.user.role, {
                hours,
                description,
                date: date ? new Date(date) : undefined,
            });
            return res.status(200).json({
                message: "Time entry updated successfully",
                data: updated,
            });
        }
        catch (error) {
            if (error.message.includes("not found") ||
                error.message.includes("Forbidden") ||
                error.message.includes("must be")) {
                return res.status(400).json({ message: error.message });
            }
            return res.status(500).json({
                message: "Failed to update time entry",
                error: error.message,
            });
        }
    }
    async deleteTimeEntry(req, res) {
        try {
            if (!req.user) {
                return res.status(401).json({ message: "Unauthorized" });
            }
            const { id } = req.params;
            if (!id) {
                return res.status(400).json({ message: "Time entry ID is required" });
            }
            const deleted = await TimeTrackingService_1.default.deleteTimeEntry(id, req.user.id, req.user.role);
            if (!deleted) {
                return res.status(404).json({ message: "Time entry not found" });
            }
            return res.status(200).json({
                message: "Time entry deleted successfully",
            });
        }
        catch (error) {
            if (error.message.includes("Forbidden")) {
                return res.status(403).json({ message: error.message });
            }
            return res.status(500).json({
                message: "Failed to delete time entry",
                error: error.message,
            });
        }
    }
    async startTimer(req, res) {
        try {
            if (!req.user) {
                return res.status(401).json({ message: "Unauthorized" });
            }
            const { taskId, description } = req.body;
            if (!taskId) {
                return res.status(400).json({ message: "Task ID is required" });
            }
            const timer = await TimeTrackingService_1.default.startTimer(taskId, req.user.id, description);
            return res.status(201).json({
                message: "Timer started successfully",
                data: timer,
            });
        }
        catch (error) {
            if (error.message.includes("already have") ||
                error.message.includes("not found")) {
                return res.status(400).json({ message: error.message });
            }
            return res.status(500).json({
                message: "Failed to start timer",
                error: error.message,
            });
        }
    }
    async stopTimer(req, res) {
        try {
            if (!req.user) {
                return res.status(401).json({ message: "Unauthorized" });
            }
            const timeEntry = await TimeTrackingService_1.default.stopTimer(req.user.id);
            return res.status(200).json({
                message: "Timer stopped and time logged successfully",
                data: timeEntry,
            });
        }
        catch (error) {
            if (error.message.includes("No active timer")) {
                return res.status(400).json({ message: error.message });
            }
            return res.status(500).json({
                message: "Failed to stop timer",
                error: error.message,
            });
        }
    }
    async getActiveTimer(req, res) {
        try {
            if (!req.user) {
                return res.status(401).json({ message: "Unauthorized" });
            }
            const timer = await TimeTrackingService_1.default.getActiveTimer(req.user.id);
            return res.status(200).json({
                message: timer
                    ? "Active timer retrieved successfully"
                    : "No active timer",
                data: timer,
            });
        }
        catch (error) {
            return res.status(500).json({
                message: "Failed to retrieve active timer",
                error: error.message,
            });
        }
    }
    async getProjectTimeSummary(req, res) {
        try {
            if (!req.user) {
                return res.status(401).json({ message: "Unauthorized" });
            }
            const { projectId } = req.params;
            if (!projectId) {
                return res.status(400).json({ message: "Project ID is required" });
            }
            const summary = await TimeTrackingService_1.default.getProjectTimeSummary(projectId);
            return res.status(200).json({
                message: "Project time summary retrieved successfully",
                data: summary,
            });
        }
        catch (error) {
            return res.status(500).json({
                message: "Failed to retrieve project time summary",
                error: error.message,
            });
        }
    }
    async getUserTimeSummary(req, res) {
        try {
            if (!req.user) {
                return res.status(401).json({ message: "Unauthorized" });
            }
            const { startDate, endDate } = req.query;
            if (!startDate || !endDate) {
                return res
                    .status(400)
                    .json({ message: "startDate and endDate are required" });
            }
            const summary = await TimeTrackingService_1.default.getUserTimeSummary(req.user.id, new Date(startDate), new Date(endDate));
            return res.status(200).json({
                message: "User time summary retrieved successfully",
                data: summary,
            });
        }
        catch (error) {
            return res.status(500).json({
                message: "Failed to retrieve user time summary",
                error: error.message,
            });
        }
    }
}
exports.TimeTrackingController = TimeTrackingController;
exports.default = new TimeTrackingController();

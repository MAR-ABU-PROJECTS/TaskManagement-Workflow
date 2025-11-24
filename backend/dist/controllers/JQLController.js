"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const JQLParserService_1 = __importDefault(require("../services/JQLParserService"));
const TaskService_1 = __importDefault(require("../services/TaskService"));
class JQLController {
    static async searchWithJQL(req, res) {
        try {
            const { jql } = req.query;
            const userId = req.user?.id;
            if (!jql || typeof jql !== "string") {
                return res.status(400).json({
                    message: "JQL query is required",
                    example: 'project = "PROJ-1" AND status IN ("TODO", "IN_PROGRESS")',
                });
            }
            const whereClause = JQLParserService_1.default.parseJQL(jql, userId);
            const tasks = await TaskService_1.default.searchTasks(whereClause);
            return res.status(200).json({
                jql,
                count: tasks.length,
                tasks,
            });
        }
        catch (error) {
            return res.status(400).json({
                message: error.message || "JQL search failed",
                jql: req.query.jql,
            });
        }
    }
    static async validateJQL(req, res) {
        try {
            const { jql } = req.body;
            if (!jql || typeof jql !== "string") {
                return res.status(400).json({ message: "JQL query is required" });
            }
            const validation = JQLParserService_1.default.validateJQL(jql);
            return res.status(200).json(validation);
        }
        catch (error) {
            return res.status(500).json({ message: error.message });
        }
    }
    static async getJQLSuggestions(req, res) {
        try {
            const { partial } = req.query;
            if (typeof partial !== "string") {
                return res
                    .status(400)
                    .json({ message: "Partial JQL query is required" });
            }
            const suggestions = JQLParserService_1.default.getSuggestions(partial);
            return res.status(200).json({
                partial,
                suggestions,
            });
        }
        catch (error) {
            return res.status(500).json({ message: error.message });
        }
    }
}
exports.default = JQLController;

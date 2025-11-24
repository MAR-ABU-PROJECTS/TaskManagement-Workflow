"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const SavedFilterService_1 = __importDefault(require("../services/SavedFilterService"));
const JQLParserService_1 = __importDefault(require("../services/JQLParserService"));
class SavedFilterController {
    static async createFilter(req, res) {
        try {
            const { name, description, jql, projectId, isPublic } = req.body;
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ message: "Unauthorized" });
            }
            if (!name || !jql) {
                return res.status(400).json({ message: "Name and JQL are required" });
            }
            const validation = JQLParserService_1.default.validateJQL(jql);
            if (!validation.valid) {
                return res.status(400).json({
                    message: "Invalid JQL syntax",
                    error: validation.error,
                });
            }
            const filter = await SavedFilterService_1.default.createFilter({
                name,
                description,
                jql,
                projectId,
                isPublic: isPublic || false,
                userId,
            });
            return res.status(201).json(filter);
        }
        catch (error) {
            return res.status(500).json({ message: error.message });
        }
    }
    static async getUserFilters(req, res) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ message: "Unauthorized" });
            }
            const filters = await SavedFilterService_1.default.getUserFilters(userId);
            return res.status(200).json(filters);
        }
        catch (error) {
            return res.status(500).json({ message: error.message });
        }
    }
    static async getFilterById(req, res) {
        try {
            const { id } = req.params;
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ message: "Unauthorized" });
            }
            if (!id) {
                return res.status(400).json({ message: "Filter ID is required" });
            }
            const filter = await SavedFilterService_1.default.getFilterById(id, userId);
            return res.status(200).json(filter);
        }
        catch (error) {
            if (error.message === "Filter not found") {
                return res.status(404).json({ message: error.message });
            }
            if (error.message === "Access denied to this filter") {
                return res.status(403).json({ message: error.message });
            }
            return res.status(500).json({ message: error.message });
        }
    }
    static async updateFilter(req, res) {
        try {
            const { id } = req.params;
            const { name, description, jql, isPublic } = req.body;
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ message: "Unauthorized" });
            }
            if (!id) {
                return res.status(400).json({ message: "Filter ID is required" });
            }
            if (jql) {
                const validation = JQLParserService_1.default.validateJQL(jql);
                if (!validation.valid) {
                    return res.status(400).json({
                        message: "Invalid JQL syntax",
                        error: validation.error,
                    });
                }
            }
            const filter = await SavedFilterService_1.default.updateFilter(id, userId, {
                name,
                description,
                jql,
                isPublic,
            });
            return res.status(200).json(filter);
        }
        catch (error) {
            if (error.message === "Filter not found") {
                return res.status(404).json({ message: error.message });
            }
            if (error.message === "Only the owner can update this filter") {
                return res.status(403).json({ message: error.message });
            }
            return res.status(500).json({ message: error.message });
        }
    }
    static async deleteFilter(req, res) {
        try {
            const { id } = req.params;
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ message: "Unauthorized" });
            }
            if (!id) {
                return res.status(400).json({ message: "Filter ID is required" });
            }
            const result = await SavedFilterService_1.default.deleteFilter(id, userId);
            return res.status(200).json(result);
        }
        catch (error) {
            if (error.message === "Filter not found") {
                return res.status(404).json({ message: error.message });
            }
            if (error.message === "Only the owner can delete this filter") {
                return res.status(403).json({ message: error.message });
            }
            return res.status(500).json({ message: error.message });
        }
    }
    static async shareFilter(req, res) {
        try {
            const { id } = req.params;
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ message: "Unauthorized" });
            }
            if (!id) {
                return res.status(400).json({ message: "Filter ID is required" });
            }
            const filter = await SavedFilterService_1.default.shareFilter(id, userId);
            return res.status(200).json(filter);
        }
        catch (error) {
            if (error.message === "Filter not found") {
                return res.status(404).json({ message: error.message });
            }
            if (error.message === "Only the owner can share this filter") {
                return res.status(403).json({ message: error.message });
            }
            return res.status(500).json({ message: error.message });
        }
    }
    static async cloneFilter(req, res) {
        try {
            const { id } = req.params;
            const { name } = req.body;
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ message: "Unauthorized" });
            }
            if (!id) {
                return res.status(400).json({ message: "Filter ID is required" });
            }
            const filter = await SavedFilterService_1.default.cloneFilter(id, userId, name);
            return res.status(201).json(filter);
        }
        catch (error) {
            if (error.message === "Filter not found") {
                return res.status(404).json({ message: error.message });
            }
            return res.status(500).json({ message: error.message });
        }
    }
}
exports.default = SavedFilterController;

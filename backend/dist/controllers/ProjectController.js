"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProjectController = void 0;
const ProjectService_1 = __importDefault(require("../services/ProjectService"));
class ProjectController {
    async createProject(req, res) {
        try {
            if (!req.user) {
                return res.status(401).json({ message: "Unauthorized" });
            }
            const data = req.body;
            if (!data.name) {
                return res.status(400).json({ message: "Project name is required" });
            }
            const project = await ProjectService_1.default.createProject(data, req.user.id);
            return res.status(201).json({
                message: "Project created successfully",
                data: project,
            });
        }
        catch (error) {
            return res.status(500).json({
                message: "Failed to create project",
                error: error.message,
            });
        }
    }
    async getAllProjects(req, res) {
        try {
            if (!req.user) {
                return res.status(401).json({ message: "Unauthorized" });
            }
            const projects = await ProjectService_1.default.getAllProjects(req.user.id, req.user.role, req.user.department || null);
            return res.status(200).json({
                message: "Projects retrieved successfully",
                data: projects,
                count: projects.length,
            });
        }
        catch (error) {
            return res.status(500).json({
                message: "Failed to retrieve projects",
                error: error.message,
            });
        }
    }
    async getProjectById(req, res) {
        try {
            if (!req.user) {
                return res.status(401).json({ message: "Unauthorized" });
            }
            const { id } = req.params;
            if (!id) {
                return res.status(400).json({ message: "Project ID is required" });
            }
            const project = await ProjectService_1.default.getProjectById(id, req.user.id, req.user.role);
            if (!project) {
                return res
                    .status(404)
                    .json({ message: "Project not found or access denied" });
            }
            return res.status(200).json({
                message: "Project retrieved successfully",
                data: project,
            });
        }
        catch (error) {
            return res.status(500).json({
                message: "Failed to retrieve project",
                error: error.message,
            });
        }
    }
    async updateProject(req, res) {
        try {
            if (!req.user) {
                return res.status(401).json({ message: "Unauthorized" });
            }
            const { id } = req.params;
            if (!id) {
                return res.status(400).json({ message: "Project ID is required" });
            }
            const data = req.body;
            const project = await ProjectService_1.default.updateProject(id, data, req.user.id, req.user.role);
            if (!project) {
                return res.status(404).json({ message: "Project not found" });
            }
            return res.status(200).json({
                message: "Project updated successfully",
                data: project,
            });
        }
        catch (error) {
            if (error.message.includes("Forbidden")) {
                return res.status(403).json({ message: error.message });
            }
            return res.status(500).json({
                message: "Failed to update project",
                error: error.message,
            });
        }
    }
    async archiveProject(req, res) {
        try {
            if (!req.user) {
                return res.status(401).json({ message: "Unauthorized" });
            }
            const { id } = req.params;
            if (!id) {
                return res.status(400).json({ message: "Project ID is required" });
            }
            const success = await ProjectService_1.default.archiveProject(id, req.user.id, req.user.role);
            if (!success) {
                return res.status(404).json({ message: "Project not found" });
            }
            return res.status(200).json({
                message: "Project archived successfully",
            });
        }
        catch (error) {
            if (error.message.includes("Forbidden")) {
                return res.status(403).json({ message: error.message });
            }
            return res.status(500).json({
                message: "Failed to archive project",
                error: error.message,
            });
        }
    }
}
exports.ProjectController = ProjectController;
exports.default = new ProjectController();

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const TaskAttachmentService_1 = __importDefault(require("../services/TaskAttachmentService"));
class TaskAttachmentController {
    async uploadAttachment(req, res) {
        try {
            const { taskId } = req.params;
            const userId = req.user?.id;
            if (!taskId) {
                res.status(400).json({ error: "Task ID is required" });
                return;
            }
            if (!req.file) {
                res.status(400).json({ error: "No file uploaded" });
                return;
            }
            TaskAttachmentService_1.default.validateFile(req.file);
            const attachment = await TaskAttachmentService_1.default.uploadAttachment(taskId, userId, req.file);
            res.status(201).json({
                message: "Attachment uploaded successfully",
                data: attachment,
            });
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
    async getTaskAttachments(req, res) {
        try {
            const { taskId } = req.params;
            if (!taskId) {
                res.status(400).json({ error: "Task ID is required" });
                return;
            }
            const attachments = await TaskAttachmentService_1.default.getTaskAttachments(taskId);
            res.json({
                message: "Attachments retrieved successfully",
                data: attachments,
            });
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
    async downloadAttachment(req, res) {
        try {
            const { id } = req.params;
            if (!id) {
                res.status(400).json({ error: "Attachment ID is required" });
                return;
            }
            const { buffer, filename, mimeType } = await TaskAttachmentService_1.default.downloadAttachment(id);
            res.setHeader("Content-Type", mimeType);
            res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
            res.send(buffer);
        }
        catch (error) {
            res.status(404).json({ error: error.message });
        }
    }
    async getAttachment(req, res) {
        try {
            const { id } = req.params;
            if (!id) {
                res.status(400).json({ error: "Attachment ID is required" });
                return;
            }
            const attachment = await TaskAttachmentService_1.default.getAttachmentById(id);
            res.json({
                message: "Attachment retrieved successfully",
                data: attachment,
            });
        }
        catch (error) {
            res.status(404).json({ error: error.message });
        }
    }
    async deleteAttachment(req, res) {
        try {
            const { id } = req.params;
            const userId = req.user?.id;
            const userRole = req.user?.role;
            if (!id) {
                res.status(400).json({ error: "Attachment ID is required" });
                return;
            }
            const result = await TaskAttachmentService_1.default.deleteAttachment(id, userId, userRole);
            res.json(result);
        }
        catch (error) {
            res.status(403).json({ error: error.message });
        }
    }
    async getTaskAttachmentStats(req, res) {
        try {
            const { taskId } = req.params;
            if (!taskId) {
                res.status(400).json({ error: "Task ID is required" });
                return;
            }
            const stats = await TaskAttachmentService_1.default.getTaskAttachmentStats(taskId);
            res.json({
                message: "Attachment statistics retrieved successfully",
                data: stats,
            });
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
    async getUserAttachments(req, res) {
        try {
            const userId = req.user?.id;
            const attachments = await TaskAttachmentService_1.default.getUserAttachments(userId);
            res.json({
                message: "User attachments retrieved successfully",
                data: attachments,
            });
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
}
exports.default = new TaskAttachmentController();

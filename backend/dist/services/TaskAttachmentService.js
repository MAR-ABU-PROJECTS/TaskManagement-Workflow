"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const prisma_1 = __importDefault(require("../db/prisma"));
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const uuid_1 = require("uuid");
class TaskAttachmentService {
    constructor() {
        this.uploadDir = path_1.default.join(process.cwd(), "uploads", "attachments");
        this.ensureUploadDir();
    }
    async ensureUploadDir() {
        try {
            await promises_1.default.mkdir(this.uploadDir, { recursive: true });
        }
        catch (error) {
            console.error("Failed to create upload directory:", error);
        }
    }
    async uploadAttachment(taskId, userId, file) {
        const task = await prisma_1.default.task.findUnique({
            where: { id: taskId },
        });
        if (!task) {
            throw new Error("Task not found");
        }
        const fileExtension = path_1.default.extname(file.originalname);
        const fileName = `${(0, uuid_1.v4)()}${fileExtension}`;
        const filePath = path_1.default.join(this.uploadDir, fileName);
        await promises_1.default.writeFile(filePath, file.buffer);
        const attachment = await prisma_1.default.taskAttachment.create({
            data: {
                taskId,
                uploadedById: userId,
                fileName,
                originalName: file.originalname,
                filePath,
                mimeType: file.mimetype,
                fileSize: file.size,
            },
            include: {
                uploadedBy: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
        });
        return attachment;
    }
    async getTaskAttachments(taskId) {
        const attachments = await prisma_1.default.taskAttachment.findMany({
            where: { taskId },
            include: {
                uploadedBy: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
            orderBy: { createdAt: "desc" },
        });
        return attachments;
    }
    async getAttachmentById(attachmentId) {
        const attachment = await prisma_1.default.taskAttachment.findUnique({
            where: { id: attachmentId },
            include: {
                uploadedBy: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                task: {
                    select: {
                        id: true,
                        title: true,
                    },
                },
            },
        });
        if (!attachment) {
            throw new Error("Attachment not found");
        }
        return attachment;
    }
    async downloadAttachment(attachmentId) {
        const attachment = await this.getAttachmentById(attachmentId);
        try {
            await promises_1.default.access(attachment.filePath);
        }
        catch {
            throw new Error("File not found on disk");
        }
        const fileBuffer = await promises_1.default.readFile(attachment.filePath);
        return {
            buffer: fileBuffer,
            filename: attachment.originalName,
            mimeType: attachment.mimeType,
        };
    }
    async deleteAttachment(attachmentId, userId, userRole) {
        const attachment = await this.getAttachmentById(attachmentId);
        const task = await prisma_1.default.task.findUnique({
            where: { id: attachment.taskId },
            select: {
                creatorId: true,
                assigneeId: true,
            },
        });
        const canDelete = attachment.uploadedById === userId ||
            task?.creatorId === userId ||
            task?.assigneeId === userId ||
            ["CEO", "HOO", "HR", "ADMIN"].includes(userRole);
        if (!canDelete) {
            throw new Error("Not authorized to delete this attachment");
        }
        try {
            await promises_1.default.unlink(attachment.filePath);
        }
        catch (error) {
            console.error("Failed to delete file from disk:", error);
        }
        await prisma_1.default.taskAttachment.delete({
            where: { id: attachmentId },
        });
        return { message: "Attachment deleted successfully" };
    }
    async getTaskAttachmentStats(taskId) {
        const attachments = await prisma_1.default.taskAttachment.findMany({
            where: { taskId },
            select: {
                fileSize: true,
                mimeType: true,
            },
        });
        const totalSize = attachments.reduce((sum, att) => sum + att.fileSize, 0);
        const fileTypes = [...new Set(attachments.map((att) => att.mimeType))];
        return {
            count: attachments.length,
            totalSize,
            totalSizeMB: (totalSize / (1024 * 1024)).toFixed(2),
            fileTypes,
        };
    }
    async getUserAttachments(userId) {
        const attachments = await prisma_1.default.taskAttachment.findMany({
            where: { uploadedById: userId },
            include: {
                task: {
                    select: {
                        id: true,
                        title: true,
                        status: true,
                    },
                },
            },
            orderBy: { createdAt: "desc" },
        });
        return attachments;
    }
    validateFile(file, maxSizeMB = 10) {
        const maxSize = maxSizeMB * 1024 * 1024;
        if (file.size > maxSize) {
            throw new Error(`File size exceeds ${maxSizeMB}MB limit`);
        }
        const dangerousExtensions = [".exe", ".bat", ".cmd", ".sh", ".ps1"];
        const fileExtension = path_1.default.extname(file.originalname).toLowerCase();
        if (dangerousExtensions.includes(fileExtension)) {
            throw new Error("File type not allowed");
        }
        return true;
    }
}
exports.default = new TaskAttachmentService();

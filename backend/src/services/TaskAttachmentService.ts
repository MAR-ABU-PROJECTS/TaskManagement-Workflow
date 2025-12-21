import prisma from "../db/prisma";
import fs from "fs/promises";
import path from "path";
import { v4 as uuidv4 } from "uuid";

export interface UploadedFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  buffer: Buffer;
  size: number;
}

class TaskAttachmentService {
  private uploadDir = path.join(process.cwd(), "uploads", "attachments");

  constructor() {
    this.ensureUploadDir();
  }

  private async ensureUploadDir() {
    try {
      await fs.mkdir(this.uploadDir, { recursive: true });
    } catch (error) {
      console.error("Failed to create upload directory:", error);
    }
  }

  /**
   * Upload a file attachment for a task
   */
  async uploadAttachment(taskId: string, userId: string, file: UploadedFile) {
    // Verify task exists
    const task = await prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      throw new Error("Task not found");
    }

    // Generate unique filename
    const fileExtension = path.extname(file.originalname);
    const fileName = `${uuidv4()}${fileExtension}`;
    const filePath = path.join(this.uploadDir, fileName);

    // Save file to disk
    await fs.writeFile(filePath, file.buffer);

    // Create attachment record
    const attachment = await prisma.taskAttachment.create({
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

  /**
   * Get all attachments for a task
   */
  async getTaskAttachments(taskId: string) {
    const attachments = await prisma.taskAttachment.findMany({
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

  /**
   * Get attachment by ID
   */
  async getAttachmentById(attachmentId: string) {
    const attachment = await prisma.taskAttachment.findUnique({
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

  /**
   * Download attachment file
   */
  async downloadAttachment(attachmentId: string) {
    const attachment = await this.getAttachmentById(attachmentId);

    // Check if file exists
    try {
      await fs.access(attachment.filePath);
    } catch {
      throw new Error("File not found on disk");
    }

    const fileBuffer = await fs.readFile(attachment.filePath);

    return {
      buffer: fileBuffer,
      filename: attachment.originalName,
      mimeType: attachment.mimeType,
    };
  }

  /**
   * Delete an attachment
   */
  async deleteAttachment(
    attachmentId: string,
    userId: string,
    userRole: string
  ) {
    const attachment = await this.getAttachmentById(attachmentId);

    // Only the uploader, task creator, assignee, or admins can delete
    const task = await prisma.task.findUnique({
      where: { id: attachment.taskId },
      select: {
        creatorId: true,
        assignees: { select: { userId: true } },
      },
    });

    const isAssignee = task?.assignees.some((a) => a.userId === userId);
    const canDelete =
      attachment.uploadedById === userId ||
      task?.creatorId === userId ||
      isAssignee ||
      ["CEO", "HOO", "HR", "ADMIN"].includes(userRole);

    if (!canDelete) {
      throw new Error("Not authorized to delete this attachment");
    }

    // Delete file from disk
    try {
      await fs.unlink(attachment.filePath);
    } catch (error) {
      console.error("Failed to delete file from disk:", error);
      // Continue with database deletion even if file deletion fails
    }

    // Delete from database
    await prisma.taskAttachment.delete({
      where: { id: attachmentId },
    });

    return { message: "Attachment deleted successfully" };
  }

  /**
   * Get attachment statistics for a task
   */
  async getTaskAttachmentStats(taskId: string) {
    const attachments = await prisma.taskAttachment.findMany({
      where: { taskId },
      select: {
        fileSize: true,
        mimeType: true,
      },
    });

    const totalSize = attachments.reduce(
      (sum: number, att: any) => sum + att.fileSize,
      0
    );
    const fileTypes = [...new Set(attachments.map((att: any) => att.mimeType))];

    return {
      count: attachments.length,
      totalSize,
      totalSizeMB: (totalSize / (1024 * 1024)).toFixed(2),
      fileTypes,
    };
  }

  /**
   * Get all attachments uploaded by a user
   */
  async getUserAttachments(userId: string) {
    const attachments = await prisma.taskAttachment.findMany({
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

  /**
   * Validate file before upload
   */
  validateFile(file: UploadedFile, maxSizeMB: number = 10) {
    const maxSize = maxSizeMB * 1024 * 1024;

    if (file.size > maxSize) {
      throw new Error(`File size exceeds ${maxSizeMB}MB limit`);
    }

    // Block potentially dangerous file types
    const dangerousExtensions = [".exe", ".bat", ".cmd", ".sh", ".ps1"];
    const fileExtension = path.extname(file.originalname).toLowerCase();

    if (dangerousExtensions.includes(fileExtension)) {
      throw new Error("File type not allowed");
    }

    return true;
  }
}

export default new TaskAttachmentService();

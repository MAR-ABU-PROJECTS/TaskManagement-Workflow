import prisma from "../db/prisma";
import fs from "fs/promises";
import { createReadStream } from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import cloudinaryService, {
  CloudinaryResourceType,
} from "./CloudinaryService";

export interface UploadedFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  buffer?: Buffer;
  size: number;
  path?: string;
}

class TaskAttachmentService {
  private uploadDir = path.join(process.cwd(), "uploads", "attachments");

  constructor() {
    this.ensureUploadDir();
  }

  private getMaxUploadBytes(maxSizeMB?: number) {
    const maxSizeConfig =
      maxSizeMB ?? Number(process.env.UPLOAD_MAX_MB || "1024");
    return {
      maxSizeConfig,
      maxBytes: maxSizeConfig * 1024 * 1024,
    };
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

    const fileExtension = path.extname(file.originalname);
    const fileName = `${uuidv4()}${fileExtension}`;

    let attachment;
    const tempPath = file.path;

    if (cloudinaryService.isConfigured()) {
      const folder = `task-attachments/${taskId}`;
      if (!tempPath && !file.buffer) {
        throw new Error("Uploaded file is empty");
      }

      const uploadResult = tempPath
        ? await cloudinaryService.uploadStream(
            createReadStream(tempPath),
            {
              folder,
              resourceType: "auto",
              filename: file.originalname,
            },
          )
        : await cloudinaryService.uploadBuffer(file.buffer as Buffer, {
            folder,
            resourceType: "auto",
            filename: file.originalname,
          });

      attachment = await prisma.taskAttachment.create({
        data: {
          taskId,
          uploadedById: userId,
          fileName,
          originalName: file.originalname,
          filePath: uploadResult.secure_url,
          mimeType: file.mimetype,
          fileSize: file.size,
          storageProvider: "CLOUDINARY",
          cloudinaryPublicId: uploadResult.public_id,
          cloudinaryAssetId: uploadResult.asset_id,
          cloudinaryUrl: uploadResult.secure_url,
          cloudinaryResourceType: uploadResult.resource_type,
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
      if (tempPath) {
        await fs.unlink(tempPath).catch(() => undefined);
      }
    } else {
      const filePath = path.join(this.uploadDir, fileName);

      if (tempPath) {
        await fs.rename(tempPath, filePath);
      } else if (file.buffer) {
        await fs.writeFile(filePath, file.buffer);
      } else {
        throw new Error("Uploaded file is empty");
      }

      // Create attachment record
      attachment = await prisma.taskAttachment.create({
        data: {
          taskId,
          uploadedById: userId,
          fileName,
          originalName: file.originalname,
          filePath,
          mimeType: file.mimetype,
          fileSize: file.size,
          storageProvider: "LOCAL",
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
    }

    return attachment;
  }

  async createCloudinaryAttachments(
    taskId: string,
    userId: string,
    uploads: Array<{
      publicId: string;
      assetId?: string;
      secureUrl: string;
      originalFilename: string;
      bytes: number;
      resourceType?: CloudinaryResourceType;
      mimeType?: string;
    }>,
  ) {
    if (!cloudinaryService.isConfigured()) {
      throw new Error("Cloudinary is not configured");
    }

    if (!uploads || uploads.length === 0) {
      throw new Error("No uploads provided");
    }

    // Verify task exists
    const task = await prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      throw new Error("Task not found");
    }

    const { maxBytes, maxSizeConfig } = this.getMaxUploadBytes();
    const created = [];

    for (const upload of uploads) {
      if (!upload.publicId || !upload.secureUrl || !upload.originalFilename) {
        throw new Error("Invalid Cloudinary upload payload");
      }

      if (upload.bytes > maxBytes) {
        throw new Error(`File size exceeds ${maxSizeConfig}MB limit`);
      }

      const fileExtension = path.extname(upload.originalFilename);
      const fileName = `${uuidv4()}${fileExtension}`;

      const attachment = await prisma.taskAttachment.create({
        data: {
          taskId,
          uploadedById: userId,
          fileName,
          originalName: upload.originalFilename,
          filePath: upload.secureUrl,
          mimeType: upload.mimeType || "application/octet-stream",
          fileSize: upload.bytes,
          storageProvider: "CLOUDINARY",
          cloudinaryPublicId: upload.publicId,
          cloudinaryAssetId: upload.assetId || null,
          cloudinaryUrl: upload.secureUrl,
          cloudinaryResourceType: upload.resourceType || "raw",
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

      created.push(attachment);
    }

    return created;
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

    if (
      attachment.storageProvider === "CLOUDINARY" &&
      attachment.cloudinaryUrl
    ) {
      return {
        type: "redirect" as const,
        url: attachment.cloudinaryUrl,
      };
    }

    // Check if file exists
    if (!attachment.filePath) {
      throw new Error("File not found on disk");
    }

    try {
      await fs.access(attachment.filePath);
    } catch {
      throw new Error("File not found on disk");
    }

    const fileBuffer = await fs.readFile(attachment.filePath);

    return {
      type: "buffer" as const,
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

    if (attachment.storageProvider === "CLOUDINARY") {
      if (attachment.cloudinaryPublicId) {
        try {
          await cloudinaryService.deleteAsset(
            attachment.cloudinaryPublicId,
            (attachment.cloudinaryResourceType ||
              "raw") as CloudinaryResourceType,
          );
        } catch (error) {
          console.error("Failed to delete Cloudinary asset:", error);
        }
      }
    } else if (attachment.filePath) {
      // Delete file from disk
      try {
        await fs.unlink(attachment.filePath);
      } catch (error) {
        console.error("Failed to delete file from disk:", error);
        // Continue with database deletion even if file deletion fails
      }
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
  validateFile(file: UploadedFile, maxSizeMB?: number) {
    const { maxBytes, maxSizeConfig } = this.getMaxUploadBytes(maxSizeMB);

    if (file.size > maxBytes) {
      throw new Error(`File size exceeds ${maxSizeConfig}MB limit`);
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

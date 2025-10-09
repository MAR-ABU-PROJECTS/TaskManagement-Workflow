import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';
import { TaskAttachment } from '../types/task.types';
import * as fs from 'fs/promises';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

export interface UploadAttachmentRequest {
  taskId: string;
  uploadedBy: string;
  file: {
    originalName: string;
    mimeType: string;
    size: number;
    buffer: Buffer;
  };
}

export interface AttachmentFilters {
  taskId?: string;
  uploadedBy?: string;
  mimeType?: string;
}

export class TaskAttachmentService {
  private uploadPath: string;
  private maxFileSize: number;
  private allowedMimeTypes: string[];

  constructor() {
    this.uploadPath = process.env.UPLOAD_PATH || './uploads/attachments';
    this.maxFileSize = parseInt(process.env.MAX_FILE_SIZE || '10485760'); // 10MB default
    this.allowedMimeTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/plain',
      'text/csv',
      'application/zip',
      'application/x-zip-compressed',
      'application/json',
      'application/xml',
      'text/xml'
    ];

    // Ensure upload directory exists
    this.ensureUploadDirectory();
  }

  /**
   * Upload an attachment to a task
   */
  async uploadAttachment(uploadData: UploadAttachmentRequest): Promise<TaskAttachment> {
    try {
      // Validate task exists
      const task = await prisma.task.findUnique({
        where: { id: uploadData.taskId },
        select: { id: true, key: true, projectId: true }
      });

      if (!task) {
        throw new Error('Task not found');
      }

      // Validate file
      this.validateFile(uploadData.file);

      // Generate unique filename
      const fileExtension = path.extname(uploadData.file.originalName);
      const filename = `${uuidv4()}${fileExtension}`;
      const filePath = path.join(this.uploadPath, filename);

      // Save file to disk
      await fs.writeFile(filePath, uploadData.file.buffer);

      // Create attachment record
      const attachment = await prisma.attachment.create({
        data: {
          taskId: uploadData.taskId,
          filename,
          originalName: uploadData.file.originalName,
          mimeType: uploadData.file.mimeType,
          size: uploadData.file.size,
          path: filePath,
          uploadedBy: uploadData.uploadedBy,
          createdAt: new Date()
        }
      });

      // Log activity
      await this.logAttachmentActivity(
        uploadData.taskId,
        uploadData.uploadedBy,
        'ATTACHMENT_UPLOADED',
        attachment.id
      );

      logger.info(`Attachment uploaded to task ${task.key}: ${uploadData.file.originalName}`);
      return this.mapAttachmentFromDb(attachment);
    } catch (error) {
      logger.error('Error uploading attachment:', error);
      throw error;
    }
  }

  /**
   * Get attachments for a task
   */
  async getTaskAttachments(taskId: string): Promise<TaskAttachment[]> {
    try {
      const attachments = await prisma.attachment.findMany({
        where: { taskId },
        orderBy: { createdAt: 'desc' }
      });

      return attachments.map(attachment => this.mapAttachmentFromDb(attachment));
    } catch (error) {
      logger.error('Error getting task attachments:', error);
      throw error;
    }
  }

  /**
   * Get a specific attachment by ID
   */
  async getAttachment(attachmentId: string): Promise<TaskAttachment | null> {
    try {
      const attachment = await prisma.attachment.findUnique({
        where: { id: attachmentId }
      });

      if (!attachment) {
        return null;
      }

      return this.mapAttachmentFromDb(attachment);
    } catch (error) {
      logger.error('Error getting attachment:', error);
      throw error;
    }
  }

  /**
   * Download an attachment
   */
  async downloadAttachment(attachmentId: string, userId: string): Promise<{
    filename: string;
    originalName: string;
    mimeType: string;
    buffer: Buffer;
  }> {
    try {
      const attachment = await prisma.attachment.findUnique({
        where: { id: attachmentId },
        include: {
          task: {
            include: {
              project: {
                include: {
                  members: {
                    where: { userId },
                    select: { id: true }
                  }
                }
              }
            }
          }
        }
      });

      if (!attachment) {
        throw new Error('Attachment not found');
      }

      // Check if user has access to the task
      if (!attachment.task?.project?.members || attachment.task.project.members.length === 0) {
        throw new Error('Access denied');
      }

      // Check if file exists
      try {
        await fs.access(attachment.path);
      } catch {
        throw new Error('File not found on disk');
      }

      // Read file
      const buffer = await fs.readFile(attachment.path);

      // Log download activity
      await this.logAttachmentActivity(
        attachment.taskId!,
        userId,
        'ATTACHMENT_DOWNLOADED',
        attachmentId
      );

      return {
        filename: attachment.filename,
        originalName: attachment.originalName,
        mimeType: attachment.mimeType,
        buffer
      };
    } catch (error) {
      logger.error('Error downloading attachment:', error);
      throw error;
    }
  }

  /**
   * Delete an attachment
   */
  async deleteAttachment(attachmentId: string, userId: string): Promise<void> {
    try {
      const attachment = await prisma.attachment.findUnique({
        where: { id: attachmentId },
        include: {
          task: {
            include: {
              project: {
                include: {
                  members: {
                    where: { userId },
                    select: { role: true }
                  }
                }
              }
            }
          }
        }
      });

      if (!attachment) {
        throw new Error('Attachment not found');
      }

      // Check if user can delete this attachment
      const canDelete = attachment.uploadedBy === userId || 
                       attachment.task?.project?.members?.some(member => 
                         ['OWNER', 'ADMIN', 'MANAGER'].includes(member.role)
                       );

      if (!canDelete) {
        throw new Error('You can only delete your own attachments or you need admin privileges');
      }

      // Delete file from disk
      try {
        await fs.unlink(attachment.path);
      } catch (error) {
        logger.warn(`Failed to delete file from disk: ${attachment.path}`, error);
        // Continue with database deletion even if file deletion fails
      }

      // Delete attachment record
      await prisma.attachment.delete({
        where: { id: attachmentId }
      });

      // Log activity
      await this.logAttachmentActivity(
        attachment.taskId!,
        userId,
        'ATTACHMENT_DELETED',
        attachmentId
      );

      logger.info(`Attachment ${attachmentId} deleted by user ${userId}`);
    } catch (error) {
      logger.error('Error deleting attachment:', error);
      throw error;
    }
  }

  /**
   * Search attachments
   */
  async searchAttachments(
    filters: AttachmentFilters,
    options: {
      page?: number;
      limit?: number;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
    } = {}
  ): Promise<{
    attachments: TaskAttachment[];
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
  }> {
    try {
      const page = options.page || 1;
      const limit = options.limit || 50;
      const skip = (page - 1) * limit;

      // Build where clause
      const whereClause: any = {};

      if (filters.taskId) {
        whereClause.taskId = filters.taskId;
      }

      if (filters.uploadedBy) {
        whereClause.uploadedBy = filters.uploadedBy;
      }

      if (filters.mimeType) {
        whereClause.mimeType = filters.mimeType;
      }

      // Build order by clause
      const orderBy: any = {};
      if (options.sortBy) {
        orderBy[options.sortBy] = options.sortOrder || 'asc';
      } else {
        orderBy.createdAt = 'desc';
      }

      // Get attachments
      const [attachments, total] = await Promise.all([
        prisma.attachment.findMany({
          where: whereClause,
          orderBy,
          skip,
          take: limit
        }),
        prisma.attachment.count({ where: whereClause })
      ]);

      return {
        attachments: attachments.map(attachment => this.mapAttachmentFromDb(attachment)),
        total,
        page,
        limit,
        hasMore: skip + attachments.length < total
      };
    } catch (error) {
      logger.error('Error searching attachments:', error);
      throw error;
    }
  }

  /**
   * Get attachment statistics
   */
  async getAttachmentStatistics(taskId?: string): Promise<{
    totalAttachments: number;
    totalSize: number;
    byMimeType: Record<string, number>;
    byUploader: Record<string, number>;
  }> {
    try {
      const whereClause: any = {};
      if (taskId) {
        whereClause.taskId = taskId;
      }

      const [
        totalAttachments,
        totalSizeResult,
        mimeTypeCounts,
        uploaderCounts
      ] = await Promise.all([
        prisma.attachment.count({ where: whereClause }),
        prisma.attachment.aggregate({
          where: whereClause,
          _sum: { size: true }
        }),
        prisma.attachment.groupBy({
          by: ['mimeType'],
          where: whereClause,
          _count: true
        }),
        prisma.attachment.groupBy({
          by: ['uploadedBy'],
          where: whereClause,
          _count: true
        })
      ]);

      return {
        totalAttachments,
        totalSize: totalSizeResult._sum.size || 0,
        byMimeType: mimeTypeCounts.reduce((acc, item) => {
          acc[item.mimeType] = item._count;
          return acc;
        }, {} as Record<string, number>),
        byUploader: uploaderCounts.reduce((acc, item) => {
          acc[item.uploadedBy] = item._count;
          return acc;
        }, {} as Record<string, number>)
      };
    } catch (error) {
      logger.error('Error getting attachment statistics:', error);
      throw error;
    }
  }

  // Private helper methods

  /**
   * Validate uploaded file
   */
  private validateFile(file: { originalName: string; mimeType: string; size: number }): void {
    // Check file size
    if (file.size > this.maxFileSize) {
      throw new Error(`File size exceeds maximum allowed size of ${this.maxFileSize} bytes`);
    }

    // Check mime type
    if (!this.allowedMimeTypes.includes(file.mimeType)) {
      throw new Error(`File type ${file.mimeType} is not allowed`);
    }

    // Check filename
    if (!file.originalName || file.originalName.trim().length === 0) {
      throw new Error('Filename is required');
    }

    // Check for potentially dangerous file extensions
    const dangerousExtensions = ['.exe', '.bat', '.cmd', '.scr', '.pif', '.com', '.vbs', '.js', '.jar'];
    const fileExtension = path.extname(file.originalName).toLowerCase();
    
    if (dangerousExtensions.includes(fileExtension)) {
      throw new Error(`File extension ${fileExtension} is not allowed for security reasons`);
    }
  }

  /**
   * Ensure upload directory exists
   */
  private async ensureUploadDirectory(): Promise<void> {
    try {
      await fs.access(this.uploadPath);
    } catch {
      try {
        await fs.mkdir(this.uploadPath, { recursive: true });
        logger.info(`Created upload directory: ${this.uploadPath}`);
      } catch (error) {
        logger.error('Error creating upload directory:', error);
        throw new Error('Failed to create upload directory');
      }
    }
  }

  /**
   * Log attachment activity
   */
  private async logAttachmentActivity(
    taskId: string,
    userId: string,
    action: string,
    attachmentId: string
  ): Promise<void> {
    try {
      await prisma.auditLog.create({
        data: {
          userId,
          action,
          resource: 'ATTACHMENT',
          resourceId: attachmentId,
          newValues: { taskId },
          createdAt: new Date()
        }
      });
    } catch (error) {
      logger.error('Error logging attachment activity:', error);
      // Don't throw error for logging failures
    }
  }

  /**
   * Map attachment from database to domain model
   */
  private mapAttachmentFromDb(dbAttachment: any): TaskAttachment {
    return {
      id: dbAttachment.id,
      taskId: dbAttachment.taskId,
      filename: dbAttachment.filename,
      originalName: dbAttachment.originalName,
      mimeType: dbAttachment.mimeType,
      size: dbAttachment.size,
      path: dbAttachment.path,
      uploadedBy: dbAttachment.uploadedBy,
      createdAt: dbAttachment.createdAt,
      uploader: dbAttachment.uploader ? {
        id: dbAttachment.uploader.id,
        firstName: dbAttachment.uploader.firstName,
        lastName: dbAttachment.uploader.lastName
      } : undefined
    };
  }
}
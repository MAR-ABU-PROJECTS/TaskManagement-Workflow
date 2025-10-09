import { Request, Response } from 'express';
import { TaskAttachmentService, UploadAttachmentRequest } from '../services/TaskAttachmentService';
import { logger } from '../utils/logger';
import { AuthenticatedRequest } from '../middleware/auth';
import multer from 'multer';

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760') // 10MB default
  }
});

export class TaskAttachmentController {
  private attachmentService: TaskAttachmentService;
  public upload: multer.Multer;

  constructor() {
    this.attachmentService = new TaskAttachmentService();
    this.upload = upload;
  }

  /**
   * Upload an attachment to a task
   * POST /api/tasks/:taskId/attachments
   */
  async uploadAttachment(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { taskId } = req.params;
      const userId = req.user!.id;
      const file = req.file;

      if (!file) {
        res.status(400).json({
          error: {
            code: 'NO_FILE',
            message: 'No file provided'
          }
        });
        return;
      }

      const uploadData: UploadAttachmentRequest = {
        taskId,
        uploadedBy: userId,
        file: {
          originalName: file.originalname,
          mimeType: file.mimetype,
          size: file.size,
          buffer: file.buffer
        }
      };

      const attachment = await this.attachmentService.uploadAttachment(uploadData);

      res.status(201).json({
        success: true,
        data: attachment
      });
    } catch (error) {
      logger.error('Error uploading attachment:', error);
      
      if (error.message === 'Task not found') {
        res.status(404).json({
          error: {
            code: 'TASK_NOT_FOUND',
            message: 'Task not found'
          }
        });
        return;
      }

      if (error.message.includes('File size exceeds')) {
        res.status(400).json({
          error: {
            code: 'FILE_TOO_LARGE',
            message: error.message
          }
        });
        return;
      }

      if (error.message.includes('File type') && error.message.includes('not allowed')) {
        res.status(400).json({
          error: {
            code: 'INVALID_FILE_TYPE',
            message: error.message
          }
        });
        return;
      }

      if (error.message.includes('not allowed for security reasons')) {
        res.status(400).json({
          error: {
            code: 'SECURITY_VIOLATION',
            message: error.message
          }
        });
        return;
      }

      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to upload attachment'
        }
      });
    }
  }

  /**
   * Get attachments for a task
   * GET /api/tasks/:taskId/attachments
   */
  async getTaskAttachments(req: Request, res: Response): Promise<void> {
    try {
      const { taskId } = req.params;

      const attachments = await this.attachmentService.getTaskAttachments(taskId);

      res.json({
        success: true,
        data: attachments
      });
    } catch (error) {
      logger.error('Error getting task attachments:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to get task attachments'
        }
      });
    }
  }

  /**
   * Get a specific attachment
   * GET /api/attachments/:attachmentId
   */
  async getAttachment(req: Request, res: Response): Promise<void> {
    try {
      const { attachmentId } = req.params;

      const attachment = await this.attachmentService.getAttachment(attachmentId);

      if (!attachment) {
        res.status(404).json({
          error: {
            code: 'ATTACHMENT_NOT_FOUND',
            message: 'Attachment not found'
          }
        });
        return;
      }

      res.json({
        success: true,
        data: attachment
      });
    } catch (error) {
      logger.error('Error getting attachment:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to get attachment'
        }
      });
    }
  }

  /**
   * Download an attachment
   * GET /api/attachments/:attachmentId/download
   */
  async downloadAttachment(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { attachmentId } = req.params;
      const userId = req.user!.id;

      const fileData = await this.attachmentService.downloadAttachment(attachmentId, userId);

      // Set appropriate headers
      res.setHeader('Content-Type', fileData.mimeType);
      res.setHeader('Content-Disposition', `attachment; filename="${fileData.originalName}"`);
      res.setHeader('Content-Length', fileData.buffer.length);

      // Send file
      res.send(fileData.buffer);
    } catch (error) {
      logger.error('Error downloading attachment:', error);
      
      if (error.message === 'Attachment not found') {
        res.status(404).json({
          error: {
            code: 'ATTACHMENT_NOT_FOUND',
            message: 'Attachment not found'
          }
        });
        return;
      }

      if (error.message === 'Access denied') {
        res.status(403).json({
          error: {
            code: 'ACCESS_DENIED',
            message: 'You do not have permission to download this attachment'
          }
        });
        return;
      }

      if (error.message === 'File not found on disk') {
        res.status(404).json({
          error: {
            code: 'FILE_NOT_FOUND',
            message: 'File not found on server'
          }
        });
        return;
      }

      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to download attachment'
        }
      });
    }
  }

  /**
   * Delete an attachment
   * DELETE /api/attachments/:attachmentId
   */
  async deleteAttachment(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { attachmentId } = req.params;
      const userId = req.user!.id;

      await this.attachmentService.deleteAttachment(attachmentId, userId);

      res.json({
        success: true,
        message: 'Attachment deleted successfully'
      });
    } catch (error) {
      logger.error('Error deleting attachment:', error);
      
      if (error.message === 'Attachment not found') {
        res.status(404).json({
          error: {
            code: 'ATTACHMENT_NOT_FOUND',
            message: 'Attachment not found'
          }
        });
        return;
      }

      if (error.message.includes('You can only delete your own attachments')) {
        res.status(403).json({
          error: {
            code: 'ACCESS_DENIED',
            message: 'You can only delete your own attachments or you need admin privileges'
          }
        });
        return;
      }

      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to delete attachment'
        }
      });
    }
  }

  /**
   * Search attachments
   * GET /api/attachments/search
   */
  async searchAttachments(req: Request, res: Response): Promise<void> {
    try {
      const {
        taskId,
        uploadedBy,
        mimeType,
        page = '1',
        limit = '50',
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = req.query;

      const filters = {
        taskId: taskId as string,
        uploadedBy: uploadedBy as string,
        mimeType: mimeType as string
      };

      const options = {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        sortBy: sortBy as string,
        sortOrder: sortOrder as 'asc' | 'desc'
      };

      const result = await this.attachmentService.searchAttachments(filters, options);

      res.json({
        success: true,
        data: result.attachments,
        pagination: {
          total: result.total,
          page: result.page,
          limit: result.limit,
          hasMore: result.hasMore
        }
      });
    } catch (error) {
      logger.error('Error searching attachments:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to search attachments'
        }
      });
    }
  }

  /**
   * Get attachment statistics
   * GET /api/attachments/statistics
   */
  async getAttachmentStatistics(req: Request, res: Response): Promise<void> {
    try {
      const { taskId } = req.query;

      const statistics = await this.attachmentService.getAttachmentStatistics(taskId as string);

      res.json({
        success: true,
        data: statistics
      });
    } catch (error) {
      logger.error('Error getting attachment statistics:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to get attachment statistics'
        }
      });
    }
  }

  /**
   * Get upload middleware for single file
   */
  getUploadMiddleware() {
    return this.upload.single('file');
  }

  /**
   * Get upload middleware for multiple files
   */
  getMultipleUploadMiddleware(maxCount: number = 10) {
    return this.upload.array('files', maxCount);
  }
}
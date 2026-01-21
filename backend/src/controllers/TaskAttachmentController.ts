import { Request, Response } from "express";
import TaskAttachmentService from "../services/TaskAttachmentService";

class TaskAttachmentController {
  /**
   * Upload attachment to a task
   * POST /api/tasks/:taskId/attachments
   */
  async uploadAttachment(req: Request, res: Response) {
    try {
      const { taskId } = req.params;
      const userId = req.user?.id;

      if (!taskId) {
        res.status(400).json({ message: "Task ID is required" });
        return;
      }

      const files: any[] = [];

      if (req.file) {
        files.push(req.file as any);
      }

      if (req.files) {
        if (Array.isArray(req.files)) {
          files.push(...req.files);
        } else {
          const fileGroups = req.files as Record<string, Express.Multer.File[]>;
          Object.values(fileGroups).forEach((group) => {
            if (Array.isArray(group)) {
              files.push(...group);
            }
          });
        }
      }

      if (files.length === 0) {
        res.status(400).json({ message: "No file uploaded" });
        return;
      }

      const attachments = [];
      for (const file of files) {
        TaskAttachmentService.validateFile(file);
        const attachment = await TaskAttachmentService.uploadAttachment(
          taskId,
          userId!,
          file
        );
        attachments.push(attachment);
      }

      res.status(201).json({
        message: "Attachment uploaded successfully",
        data: attachments.length === 1 ? attachments[0] : attachments,
        uploadedCount: attachments.length,
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }

  /**
   * Get all attachments for a task
   * GET /api/tasks/:taskId/attachments
   */
  async getTaskAttachments(req: Request, res: Response) {
    try {
      const { taskId } = req.params;

      if (!taskId) {
        res.status(400).json({ message: "Task ID is required" });
        return;
      }

      const attachments = await TaskAttachmentService.getTaskAttachments(
        taskId
      );

      res.json({
        message: "Attachments retrieved successfully",
        data: attachments,
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }

  /**
   * Download attachment
   * GET /api/attachments/:id/download
   */
  async downloadAttachment(req: Request, res: Response) {
    try {
      const { attachmentId } = req.params;

      if (!attachmentId) {
        res.status(400).json({ message: "Attachment ID is required" });
        return;
      }

      const { buffer, filename, mimeType } =
        await TaskAttachmentService.downloadAttachment(attachmentId);

      res.setHeader("Content-Type", mimeType);
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${filename}"`
      );
      res.send(buffer);
    } catch (error: any) {
      res.status(404).json({ message: error.message });
    }
  }

  /**
   * Get attachment metadata
   * GET /api/attachments/:id
   */
  async getAttachment(req: Request, res: Response) {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({ message: "Attachment ID is required" });
        return;
      }

      const attachment = await TaskAttachmentService.getAttachmentById(id);

      res.json({
        message: "Attachment retrieved successfully",
        data: attachment,
      });
    } catch (error: any) {
      res.status(404).json({ message: error.message });
    }
  }

  /**
   * Delete attachment
   * DELETE /api/attachments/:id
   */
  async deleteAttachment(req: Request, res: Response) {
    try {
      const { attachmentId } = req.params;
      const userId = req.user?.id;
      const userRole = req.user?.role;

      if (!attachmentId) {
        res.status(400).json({ message: "Attachment ID is required" });
        return;
      }

      const result = await TaskAttachmentService.deleteAttachment(
        attachmentId,
        userId!,
        userRole!
      );

      res.json(result);
    } catch (error: any) {
      res.status(403).json({ message: error.message });
    }
  }

  /**
   * Get attachment statistics for a task
   * GET /api/tasks/:taskId/attachments/stats
   */
  async getTaskAttachmentStats(req: Request, res: Response) {
    try {
      const { taskId } = req.params;

      if (!taskId) {
        res.status(400).json({ message: "Task ID is required" });
        return;
      }

      const stats = await TaskAttachmentService.getTaskAttachmentStats(taskId);

      res.json({
        message: "Attachment statistics retrieved successfully",
        data: stats,
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }

  /**
   * Get user's uploaded attachments
   * GET /api/users/me/attachments
   */
  async getUserAttachments(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const attachments = await TaskAttachmentService.getUserAttachments(
        userId!
      );

      res.json({
        message: "User attachments retrieved successfully",
        data: attachments,
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }
}

export default new TaskAttachmentController();

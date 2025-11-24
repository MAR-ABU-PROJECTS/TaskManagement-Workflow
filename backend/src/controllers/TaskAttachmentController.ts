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
        res.status(400).json({ error: "Task ID is required" });
        return;
      }

      if (!req.file) {
        res.status(400).json({ error: "No file uploaded" });
        return;
      }

      // Validate file
      TaskAttachmentService.validateFile(req.file as any);

      const attachment = await TaskAttachmentService.uploadAttachment(
        taskId,
        userId!,
        req.file as any
      );

      res.status(201).json({
        message: "Attachment uploaded successfully",
        data: attachment,
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
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
        res.status(400).json({ error: "Task ID is required" });
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
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * Download attachment
   * GET /api/attachments/:id/download
   */
  async downloadAttachment(req: Request, res: Response) {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({ error: "Attachment ID is required" });
        return;
      }

      const { buffer, filename, mimeType } =
        await TaskAttachmentService.downloadAttachment(id);

      res.setHeader("Content-Type", mimeType);
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${filename}"`
      );
      res.send(buffer);
    } catch (error: any) {
      res.status(404).json({ error: error.message });
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
        res.status(400).json({ error: "Attachment ID is required" });
        return;
      }

      const attachment = await TaskAttachmentService.getAttachmentById(id);

      res.json({
        message: "Attachment retrieved successfully",
        data: attachment,
      });
    } catch (error: any) {
      res.status(404).json({ error: error.message });
    }
  }

  /**
   * Delete attachment
   * DELETE /api/attachments/:id
   */
  async deleteAttachment(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;
      const userRole = req.user?.role;

      if (!id) {
        res.status(400).json({ error: "Attachment ID is required" });
        return;
      }

      const result = await TaskAttachmentService.deleteAttachment(
        id,
        userId!,
        userRole!
      );

      res.json(result);
    } catch (error: any) {
      res.status(403).json({ error: error.message });
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
        res.status(400).json({ error: "Task ID is required" });
        return;
      }

      const stats = await TaskAttachmentService.getTaskAttachmentStats(taskId);

      res.json({
        message: "Attachment statistics retrieved successfully",
        data: stats,
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
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
      res.status(400).json({ error: error.message });
    }
  }
}

export default new TaskAttachmentController();

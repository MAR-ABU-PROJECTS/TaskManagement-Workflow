import { Request, Response } from "express";
import TimeTrackingService from "../services/TimeTrackingService";
import { UserRole } from "../types/enums";

export class TimeTrackingController {
  /**
   * POST /api/tasks/:taskId/time - Log time for a task
   */
  async logTime(req: Request, res: Response): Promise<Response> {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { taskId } = req.params;
      if (!taskId) {
        return res.status(400).json({ message: "Task ID is required" });
      }

      const { hours, description, date } = req.body;

      if (!hours) {
        return res.status(400).json({ message: "Hours is required" });
      }

      const timeEntry = await TimeTrackingService.logTime(
        taskId,
        req.user.id,
        hours,
        description,
        date ? new Date(date) : undefined
      );

      return res.status(201).json({
        message: "Time logged successfully",
        data: timeEntry,
      });
    } catch (error: any) {
      if (
        error.message.includes("not found") ||
        error.message.includes("must be")
      ) {
        return res.status(400).json({ message: error.message });
      }
      return res.status(500).json({
        message: "Failed to log time",
        error: error.message,
      });
    }
  }

  /**
   * GET /api/tasks/:taskId/time - Get time entries for a task
   */
  async getTaskTimeEntries(req: Request, res: Response): Promise<Response> {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { taskId } = req.params;
      if (!taskId) {
        return res.status(400).json({ message: "Task ID is required" });
      }

      const entries = await TimeTrackingService.getTaskTimeEntries(taskId);
      const totalHours = await TimeTrackingService.getTaskTotalHours(taskId);

      return res.status(200).json({
        message: "Time entries retrieved successfully",
        data: entries,
        totalHours,
        count: entries.length,
      });
    } catch (error: any) {
      return res.status(500).json({
        message: "Failed to retrieve time entries",
        error: error.message,
      });
    }
  }

  /**
   * GET /api/time-entries - Get user's time entries
   */
  async getUserTimeEntries(req: Request, res: Response): Promise<Response> {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { startDate, endDate, taskId, projectId } = req.query;

      const entries = await TimeTrackingService.getUserTimeEntries(
        req.user.id,
        {
          startDate: startDate ? new Date(startDate as string) : undefined,
          endDate: endDate ? new Date(endDate as string) : undefined,
          taskId: taskId as string,
          projectId: projectId as string,
        }
      );

      return res.status(200).json({
        message: "Time entries retrieved successfully",
        data: entries,
        count: entries.length,
      });
    } catch (error: any) {
      return res.status(500).json({
        message: "Failed to retrieve time entries",
        error: error.message,
      });
    }
  }

  /**
   * PUT /api/time-entries/:id - Update time entry
   */
  async updateTimeEntry(req: Request, res: Response): Promise<Response> {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { id } = req.params;
      if (!id) {
        return res.status(400).json({ message: "Time entry ID is required" });
      }

      const { hours, description, date } = req.body;

      const updated = await TimeTrackingService.updateTimeEntry(
        id,
        req.user.id,
        req.user.role as UserRole,
        {
          hours,
          description,
          date: date ? new Date(date) : undefined,
        }
      );

      return res.status(200).json({
        message: "Time entry updated successfully",
        data: updated,
      });
    } catch (error: any) {
      if (
        error.message.includes("not found") ||
        error.message.includes("Forbidden") ||
        error.message.includes("must be")
      ) {
        return res.status(400).json({ message: error.message });
      }
      return res.status(500).json({
        message: "Failed to update time entry",
        error: error.message,
      });
    }
  }

  /**
   * DELETE /api/time-entries/:id - Delete time entry
   */
  async deleteTimeEntry(req: Request, res: Response): Promise<Response> {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { id } = req.params;
      if (!id) {
        return res.status(400).json({ message: "Time entry ID is required" });
      }

      const deleted = await TimeTrackingService.deleteTimeEntry(
        id,
        req.user.id,
        req.user.role as UserRole
      );

      if (!deleted) {
        return res.status(404).json({ message: "Time entry not found" });
      }

      return res.status(200).json({
        message: "Time entry deleted successfully",
      });
    } catch (error: any) {
      if (error.message.includes("Forbidden")) {
        return res.status(403).json({ message: error.message });
      }
      return res.status(500).json({
        message: "Failed to delete time entry",
        error: error.message,
      });
    }
  }

  /**
   * POST /api/time/start - Start timer
   */
  async startTimer(req: Request, res: Response): Promise<Response> {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { taskId, description } = req.body;

      if (!taskId) {
        return res.status(400).json({ message: "Task ID is required" });
      }

      const timer = await TimeTrackingService.startTimer(
        taskId,
        req.user.id,
        description
      );

      return res.status(201).json({
        message: "Timer started successfully",
        data: timer,
      });
    } catch (error: any) {
      if (
        error.message.includes("already have") ||
        error.message.includes("not found")
      ) {
        return res.status(400).json({ message: error.message });
      }
      return res.status(500).json({
        message: "Failed to start timer",
        error: error.message,
      });
    }
  }

  /**
   * POST /api/time/stop - Stop timer
   */
  async stopTimer(req: Request, res: Response): Promise<Response> {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const timeEntry = await TimeTrackingService.stopTimer(req.user.id);

      return res.status(200).json({
        message: "Timer stopped and time logged successfully",
        data: timeEntry,
      });
    } catch (error: any) {
      if (error.message.includes("No active timer")) {
        return res.status(400).json({ message: error.message });
      }
      return res.status(500).json({
        message: "Failed to stop timer",
        error: error.message,
      });
    }
  }

  /**
   * GET /api/time/active - Get active timer
   */
  async getActiveTimer(req: Request, res: Response): Promise<Response> {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const timer = await TimeTrackingService.getActiveTimer(req.user.id);

      return res.status(200).json({
        message: timer
          ? "Active timer retrieved successfully"
          : "No active timer",
        data: timer,
      });
    } catch (error: any) {
      return res.status(500).json({
        message: "Failed to retrieve active timer",
        error: error.message,
      });
    }
  }

  /**
   * GET /api/projects/:projectId/time-summary - Get project time summary
   */
  async getProjectTimeSummary(req: Request, res: Response): Promise<Response> {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { projectId } = req.params;
      if (!projectId) {
        return res.status(400).json({ message: "Project ID is required" });
      }

      const summary = await TimeTrackingService.getProjectTimeSummary(
        projectId
      );

      return res.status(200).json({
        message: "Project time summary retrieved successfully",
        data: summary,
      });
    } catch (error: any) {
      return res.status(500).json({
        message: "Failed to retrieve project time summary",
        error: error.message,
      });
    }
  }

  /**
   * GET /api/time/summary - Get user's time summary
   */
  async getUserTimeSummary(req: Request, res: Response): Promise<Response> {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { startDate, endDate } = req.query;

      if (!startDate || !endDate) {
        return res
          .status(400)
          .json({ message: "startDate and endDate are required" });
      }

      const summary = await TimeTrackingService.getUserTimeSummary(
        req.user.id,
        new Date(startDate as string),
        new Date(endDate as string)
      );

      return res.status(200).json({
        message: "User time summary retrieved successfully",
        data: summary,
      });
    } catch (error: any) {
      return res.status(500).json({
        message: "Failed to retrieve user time summary",
        error: error.message,
      });
    }
  }
}

export default new TimeTrackingController();

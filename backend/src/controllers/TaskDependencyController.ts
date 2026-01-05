import { Request, Response } from "express";
import TaskDependencyService, {
  DependencyType,
} from "../services/TaskDependencyService";

export class TaskDependencyController {
  /**
   * POST /api/task-dependencies - Create task dependency
   */
  async createDependency(req: Request, res: Response): Promise<Response> {
    try {
      if (!req.user) {
        return res.status(403).json({ message: "Forbidden: Authentication required" });
      }

      const { dependentTaskId, blockingTaskId, type } = req.body;

      if (!dependentTaskId || !blockingTaskId) {
        return res.status(400).json({
          message: "dependentTaskId and blockingTaskId are required",
        });
      }

      const dependency = await TaskDependencyService.createDependency(
        dependentTaskId,
        blockingTaskId,
        type || DependencyType.BLOCKS
      );

      return res.status(201).json({
        message: "Dependency created successfully",
        data: dependency,
      });
    } catch (error: any) {
      if (
        error.message.includes("not found") ||
        error.message.includes("circular") ||
        error.message.includes("already exists") ||
        error.message.includes("cannot depend")
      ) {
        return res.status(400).json({ message: error.message });
      }
      return res.status(500).json({
        message: "Failed to create dependency",
        error: error.message,
      });
    }
  }

  /**
   * GET /api/task-dependencies - Get all dependencies
   */
  async getAllDependencies(req: Request, res: Response): Promise<Response> {
    try {
      if (!req.user) {
        return res.status(403).json({ message: "Forbidden: Authentication required" });
      }

      const { projectId, type } = req.query;

      const dependencies = await TaskDependencyService.getAllDependencies({
        projectId: projectId as string,
        type: type as DependencyType,
      });

      return res.status(200).json({
        message: "Dependencies retrieved successfully",
        data: dependencies,
        count: dependencies.length,
      });
    } catch (error: any) {
      return res.status(500).json({
        message: "Failed to retrieve dependencies",
        error: error.message,
      });
    }
  }

  /**
   * GET /api/task-dependencies/tasks/:taskId - Get task dependencies
   */
  async getTaskDependencies(req: Request, res: Response): Promise<Response> {
    try {
      if (!req.user) {
        return res.status(403).json({ message: "Forbidden: Authentication required" });
      }

      const { taskId } = req.params;
      if (!taskId) {
        return res.status(400).json({ message: "Task ID is required" });
      }

      const dependencies = await TaskDependencyService.getTaskDependencies(
        taskId
      );

      return res.status(200).json({
        message: "Task dependencies retrieved successfully",
        data: dependencies,
      });
    } catch (error: any) {
      return res.status(500).json({
        message: "Failed to retrieve task dependencies",
        error: error.message,
      });
    }
  }

  /**
   * GET /api/task-dependencies/tasks/:taskId/blocking-info - Get blocking info
   */
  async getBlockingInfo(req: Request, res: Response): Promise<Response> {
    try {
      if (!req.user) {
        return res.status(403).json({ message: "Forbidden: Authentication required" });
      }

      const { taskId } = req.params;
      if (!taskId) {
        return res.status(400).json({ message: "Task ID is required" });
      }

      const blockingInfo = await TaskDependencyService.getBlockingInfo(taskId);

      return res.status(200).json({
        message: "Blocking info retrieved successfully",
        data: blockingInfo,
      });
    } catch (error: any) {
      return res.status(500).json({
        message: "Failed to retrieve blocking info",
        error: error.message,
      });
    }
  }

  /**
   * GET /api/task-dependencies/tasks/:taskId/subtask-summary - Get subtask summary
   */
  async getSubtaskSummary(req: Request, res: Response): Promise<Response> {
    try {
      if (!req.user) {
        return res.status(403).json({ message: "Forbidden: Authentication required" });
      }

      const { taskId } = req.params;
      if (!taskId) {
        return res.status(400).json({ message: "Task ID is required" });
      }

      const summary = await TaskDependencyService.getSubtaskSummary(taskId);

      return res.status(200).json({
        message: "Subtask summary retrieved successfully",
        data: summary,
      });
    } catch (error: any) {
      return res.status(500).json({
        message: "Failed to retrieve subtask summary",
        error: error.message,
      });
    }
  }

  /**
   * DELETE /api/task-dependencies/:id - Delete dependency
   */
  async deleteDependency(req: Request, res: Response): Promise<Response> {
    try {
      if (!req.user) {
        return res.status(403).json({ message: "Forbidden: Authentication required" });
      }

      const { id } = req.params;
      if (!id) {
        return res.status(400).json({ message: "Dependency ID is required" });
      }

      const deleted = await TaskDependencyService.deleteDependency(id);

      if (!deleted) {
        return res.status(404).json({ message: "Dependency not found" });
      }

      return res.status(200).json({
        message: "Dependency deleted successfully",
      });
    } catch (error: any) {
      return res.status(500).json({
        message: "Failed to delete dependency",
        error: error.message,
      });
    }
  }
}

export default new TaskDependencyController();

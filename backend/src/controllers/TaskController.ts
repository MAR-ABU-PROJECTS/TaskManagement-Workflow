import { Request, Response } from "express";
import TaskService from "../services/TaskService";
import {
  CreateTaskDTO,
  UpdateTaskDTO,
  CreatePersonalTaskDTO,
} from "../types/interfaces";
import { UserRole, TaskStatus } from "../types/enums";

export class TaskController {
  /**
   * POST /tasks/personal - Create a personal task
   */
  async createPersonalTask(req: Request, res: Response): Promise<Response> {
    try {
      if (!req.user) {
        return res
          .status(403)
          .json({ message: "Forbidden: Authentication required" });
      }

      const data: CreatePersonalTaskDTO = req.body;

      if (!data.title) {
        return res.status(400).json({ message: "Task title is required" });
      }

      const task = await TaskService.createPersonalTask(data, req.user.id);

      return res.status(201).json({
        message: "Personal task created successfully",
        data: task,
      });
    } catch (error: any) {
      return res.status(500).json({
        message: "Failed to create personal task",
        error: error.message,
      });
    }
  }

  /**
   * POST /tasks - Create a new task
   */
  async createTask(req: Request, res: Response): Promise<Response> {
    try {
      if (!req.user) {
        return res
          .status(403)
          .json({ message: "Forbidden: Authentication required" });
      }

      const data: CreateTaskDTO = req.body;

      if (!data.title) {
        return res.status(400).json({ message: "Task title is required" });
      }

      const task = await TaskService.createTask(
        data,
        req.user.id,
        req.user.role as UserRole
      );

      return res.status(201).json({
        message: "Task created successfully",
        data: task,
      });
    } catch (error: any) {
      return res.status(500).json({
        message: "Failed to create task",
        error: error.message,
      });
    }
  }

  /**
   * GET /tasks - List all tasks
   */
  async getAllTasks(req: Request, res: Response): Promise<Response> {
    try {
      if (!req.user) {
        return res
          .status(403)
          .json({ message: "Forbidden: Authentication required" });
      }

      const filters = {
        projectId: req.query.projectId as string,
        status: req.query.status as TaskStatus,
        assigneeId: req.query.assigneeId as string,
        creatorId: req.query.creatorId as string,
      };

      const tasks = await TaskService.getAllTasks(
        req.user.id,
        req.user.role as UserRole,
        filters
      );

      return res.status(200).json({
        message: "Tasks retrieved successfully",
        data: tasks,
        count: tasks.length,
      });
    } catch (error: any) {
      return res.status(500).json({
        message: "Failed to retrieve tasks",
        error: error.message,
      });
    }
  }

  /**
   * GET /tasks/:id - Get task by ID
   */
  async getTaskById(req: Request, res: Response): Promise<Response> {
    try {
      if (!req.user) {
        return res
          .status(403)
          .json({ message: "Forbidden: Authentication required" });
      }

      const { id } = req.params;
      if (!id) {
        return res.status(400).json({ message: "Task ID is required" });
      }

      const task = await TaskService.getTaskById(
        id,
        req.user.id,
        req.user.role as UserRole
      );

      if (!task) {
        return res
          .status(404)
          .json({ message: "Task not found or access denied" });
      }

      return res.status(200).json({
        message: "Task retrieved successfully",
        data: task,
      });
    } catch (error: any) {
      return res.status(500).json({
        message: "Failed to retrieve task",
        error: error.message,
      });
    }
  }

  /**
   * PATCH /tasks/:id - Update task
   */
  async updateTask(req: Request, res: Response): Promise<Response> {
    try {
      if (!req.user) {
        return res
          .status(403)
          .json({ message: "Forbidden: Authentication required" });
      }

      const { id } = req.params;
      if (!id) {
        return res.status(400).json({ message: "Task ID is required" });
      }

      const data: UpdateTaskDTO = req.body;

      const task = await TaskService.updateTask(
        id,
        data,
        req.user.id,
        req.user.role as UserRole
      );

      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }

      return res.status(200).json({
        message: "Task updated successfully",
        data: task,
      });
    } catch (error: any) {
      if (error.message.includes("Forbidden")) {
        return res.status(403).json({ message: error.message });
      }
      return res.status(500).json({
        message: "Failed to update task",
        error: error.message,
      });
    }
  }

  /**
   * PATCH /tasks/:id/status - Change task status
   */
  async changeStatus(req: Request, res: Response): Promise<Response> {
    try {
      if (!req.user) {
        return res
          .status(403)
          .json({ message: "Forbidden: Authentication required" });
      }

      const { id } = req.params;
      if (!id) {
        return res.status(400).json({ message: "Task ID is required" });
      }

      const { status } = req.body;

      if (!status) {
        return res.status(400).json({ message: "Status is required" });
      }

      const task = await TaskService.changeStatus(
        id,
        status as TaskStatus,
        req.user.id,
        req.user.role as UserRole
      );

      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }

      return res.status(200).json({
        message: "Task status updated successfully",
        data: task,
      });
    } catch (error: any) {
      if (
        error.message.includes("Forbidden") ||
        error.message.includes("Invalid")
      ) {
        return res.status(403).json({ message: error.message });
      }
      return res.status(500).json({
        message: "Failed to change task status",
        error: error.message,
      });
    }
  }

  /**
   * POST /tasks/:id/assign - Assign task to user
   */
  async assignTask(req: Request, res: Response): Promise<Response> {
    try {
      if (!req.user) {
        return res
          .status(403)
          .json({ message: "Forbidden: Authentication required" });
      }

      const { id } = req.params;
      if (!id) {
        return res.status(400).json({ message: "Task ID is required" });
      }

      const { assigneeId } = req.body;

      if (!assigneeId) {
        return res.status(400).json({ message: "Assignee ID is required" });
      }

      const task = await TaskService.assignTask(
        id,
        assigneeId,
        req.user.id,
        req.user.role as UserRole
      );

      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }

      return res.status(200).json({
        message: "Task assigned successfully",
        data: task,
      });
    } catch (error: any) {
      if (
        error.message.includes("Forbidden") ||
        error.message.includes("not found")
      ) {
        return res.status(403).json({ message: error.message });
      }
      return res.status(500).json({
        message: "Failed to assign task",
        error: error.message,
      });
    }
  }

  /**
   * POST /tasks/:id/approve - Approve task
   */
  async approveTask(req: Request, res: Response): Promise<Response> {
    try {
      if (!req.user) {
        return res
          .status(403)
          .json({ message: "Forbidden: Authentication required" });
      }

      const { id } = req.params;
      if (!id) {
        return res.status(400).json({ message: "Task ID is required" });
      }

      const task = await TaskService.approveTask(
        id,
        req.user.id,
        req.user.role as UserRole
      );

      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }

      return res.status(200).json({
        message: "Task approved successfully",
        data: task,
      });
    } catch (error: any) {
      if (
        error.message.includes("Forbidden") ||
        error.message.includes("already")
      ) {
        return res.status(403).json({ message: error.message });
      }
      return res.status(500).json({
        message: "Failed to approve task",
        error: error.message,
      });
    }
  }

  /**
   * POST /tasks/:id/reject - Reject task
   */
  async rejectTask(req: Request, res: Response): Promise<Response> {
    try {
      if (!req.user) {
        return res
          .status(403)
          .json({ message: "Forbidden: Authentication required" });
      }

      const { id } = req.params;
      if (!id) {
        return res.status(400).json({ message: "Task ID is required" });
      }

      const { rejectionReason } = req.body;

      if (!rejectionReason) {
        return res
          .status(400)
          .json({ message: "Rejection reason is required" });
      }

      const task = await TaskService.rejectTask(
        id,
        rejectionReason,
        req.user.id,
        req.user.role as UserRole
      );

      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }

      return res.status(200).json({
        message: "Task rejected successfully",
        data: task,
      });
    } catch (error: any) {
      if (error.message.includes("Forbidden")) {
        return res.status(403).json({ message: error.message });
      }
      return res.status(500).json({
        message: "Failed to reject task",
        error: error.message,
      });
    }
  }

  /**
   * GET /tasks/board/:projectId - Get Kanban board view
   */
  async getKanbanBoard(req: Request, res: Response): Promise<Response> {
    try {
      if (!req.user) {
        return res
          .status(403)
          .json({ message: "Forbidden: Authentication required" });
      }

      const { projectId } = req.params;
      if (!projectId) {
        return res.status(400).json({ message: "Project ID is required" });
      }

      const board = await TaskService.getKanbanBoard(projectId);

      return res.status(200).json({
        message: "Board retrieved successfully",
        data: board,
      });
    } catch (error: any) {
      if (error.message.includes("not found")) {
        return res.status(404).json({ message: error.message });
      }
      return res.status(500).json({
        message: "Failed to retrieve board",
        error: error.message,
      });
    }
  }

  /**
   * POST /tasks/:id/move - Move task to different column/status
   */
  async moveTask(req: Request, res: Response): Promise<Response> {
    try {
      if (!req.user) {
        return res
          .status(403)
          .json({ message: "Forbidden: Authentication required" });
      }

      const { id } = req.params;
      if (!id) {
        return res.status(400).json({ message: "Task ID is required" });
      }

      const { status, position } = req.body;

      if (!status) {
        return res.status(400).json({ message: "Status is required" });
      }

      if (position === undefined || position === null) {
        return res.status(400).json({ message: "Position is required" });
      }

      const task = await TaskService.moveTask(
        id,
        status as TaskStatus,
        position,
        req.user.id,
        req.user.role as UserRole
      );

      return res.status(200).json({
        message: "Task moved successfully",
        data: task,
      });
    } catch (error: any) {
      if (
        error.message.includes("Forbidden") ||
        error.message.includes("Invalid") ||
        error.message.includes("not found")
      ) {
        return res.status(403).json({ message: error.message });
      }
      return res.status(500).json({
        message: "Failed to move task",
        error: error.message,
      });
    }
  }

  /**
   * GET /tasks/:id/transitions - Get available workflow transitions for a task
   */
  async getAvailableTransitions(
    req: Request,
    res: Response
  ): Promise<Response> {
    try {
      if (!req.user) {
        return res
          .status(403)
          .json({ message: "Forbidden: Authentication required" });
      }

      const { id } = req.params;
      if (!id) {
        return res.status(400).json({ message: "Task ID is required" });
      }

      const transitions = await TaskService.getAvailableTransitions(
        id,
        req.user.id
      );

      return res.status(200).json({
        message: "Available transitions retrieved successfully",
        data: transitions,
      });
    } catch (error: any) {
      if (error.message.includes("not found")) {
        return res.status(404).json({ message: error.message });
      }
      return res.status(500).json({
        message: "Failed to get available transitions",
        error: error.message,
      });
    }
  }

  /**
   * GET /projects/:projectId/workflow - Get workflow configuration for a project
   */
  async getProjectWorkflow(req: Request, res: Response): Promise<Response> {
    try {
      if (!req.user) {
        return res
          .status(403)
          .json({ message: "Forbidden: Authentication required" });
      }

      const { projectId } = req.params;
      if (!projectId) {
        return res.status(400).json({ message: "Project ID is required" });
      }

      const workflow = await TaskService.getProjectWorkflow(projectId);

      return res.status(200).json({
        message: "Workflow configuration retrieved successfully",
        data: workflow,
      });
    } catch (error: any) {
      if (error.message.includes("not found")) {
        return res.status(404).json({ message: error.message });
      }
      return res.status(500).json({
        message: "Failed to get workflow configuration",
        error: error.message,
      });
    }
  }
}

export default new TaskController();

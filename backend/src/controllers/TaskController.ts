import { Request, Response } from "express";
import TaskService from "../services/TaskService";
import {
  CreateTaskDTO,
  UpdateTaskDTO,
  CreatePersonalTaskDTO,
} from "../types/interfaces";
import { UserRole, TaskStatus } from "../types/enums";
import { normalizeTaskStatus } from "../utils/taskStatus";

const hasOwn = (obj: Record<string, unknown>, key: string) =>
  Object.prototype.hasOwnProperty.call(obj, key);

const parseDateValue = (
  value: unknown,
): { value: Date | null; invalid: boolean } => {
  if (value === null || value === "") {
    return { value: null, invalid: false };
  }

  if (value instanceof Date) {
    return { value, invalid: false };
  }

  if (typeof value === "number" || typeof value === "string") {
    const date = new Date(value);
    return Number.isNaN(date.getTime())
      ? { value: null, invalid: true }
      : { value: date, invalid: false };
  }

  if (
    value &&
    typeof value === "object" &&
    "toISOString" in value &&
    typeof (value as { toISOString?: () => string }).toISOString === "function"
  ) {
    const date = new Date(
      (value as { toISOString: () => string }).toISOString(),
    );
    return Number.isNaN(date.getTime())
      ? { value: null, invalid: true }
      : { value: date, invalid: false };
  }

  return { value: null, invalid: true };
};

const getDueDateField = (
  raw: Record<string, unknown>,
): { value?: Date | null; invalid: boolean } => {
  const hasDueDate = hasOwn(raw, "dueDate") || hasOwn(raw, "due_date");
  if (!hasDueDate) {
    return { value: undefined, invalid: false };
  }

  const rawValue = hasOwn(raw, "dueDate") ? raw.dueDate : raw.due_date;
  const parsed = parseDateValue(rawValue);
  return parsed.invalid
    ? { value: undefined, invalid: true }
    : { value: parsed.value, invalid: false };
};

const normalizeAssigneeIds = (raw: Record<string, unknown>) => {
  if (Array.isArray(raw.assigneeIds)) {
    return raw.assigneeIds.filter(
      (id) => typeof id === "string" && id.trim() !== "",
    );
  }

  if (typeof raw.assigneeId === "string" && raw.assigneeId.trim() !== "") {
    return [raw.assigneeId];
  }

  return undefined;
};

const normalizeTaskPayload = (raw: Record<string, unknown>) => {
  const { value: dueDate, invalid: dueDateInvalid } = getDueDateField(raw);

  const payload = {
    title: (raw.title as string) ?? (raw.summary as string),
    description: raw.description as string | undefined,
    priority: raw.priority,
    issueType: (raw.issueType as string) ?? (raw.type as string),
    assigneeIds: normalizeAssigneeIds(raw),
    parentTaskId: (raw.parentTaskId as string) ?? (raw.parentId as string),
    labels: raw.labels as string[] | undefined,
    dueDate,
    estimatedHours: raw.estimatedHours as number | undefined,
    storyPoints: raw.storyPoints as number | undefined,
  };

  return { payload, dueDateInvalid };
};

export class TaskController {
  /**
   * GET /tasks/personal - Get all personal tasks
   */
  async getPersonalTasks(req: Request, res: Response): Promise<Response> {
    try {
      if (!req.user) {
        return res
          .status(403)
          .json({ message: "Forbidden: Authentication required" });
      }

      const tasks = await TaskService.getPersonalTasks(
        req.user.id,
        req.user.role as UserRole,
      );

      return res.status(200).json({
        message: "Personal tasks retrieved successfully",
        data: tasks,
        count: tasks.length,
      });
    } catch (error: any) {
      console.error("Error fetching personal tasks:", error);
      return res.status(500).json({
        message: "Failed to retrieve personal tasks",
        error: error.message,
      });
    }
  }

  /**
   */
  async createPersonalTask(req: Request, res: Response): Promise<Response> {
    try {
      if (!req.user) {
        return res
          .status(403)
          .json({ message: "Forbidden: Authentication required" });
      }

      const raw = req.body as Record<string, unknown>;
      const { payload, dueDateInvalid } = normalizeTaskPayload(raw);

      if (dueDateInvalid) {
        return res.status(400).json({ message: "Invalid dueDate value" });
      }

      const data: CreatePersonalTaskDTO = {
        title: payload.title as string,
        description: payload.description,
        priority: payload.priority as any,
        issueType: payload.issueType as any,
        labels: payload.labels,
        dueDate: payload.dueDate || undefined,
        estimatedHours: payload.estimatedHours,
        storyPoints: payload.storyPoints,
      };

      if (!data.title) {
        return res.status(400).json({ message: "Task title is required" });
      }

      const task = await TaskService.createPersonalTask(data, req.user.id);

      return res.status(201).json({
        message: "Personal task created successfully",
        data: task,
      });
    } catch (error: any) {
      console.error("Error creating personal task:", error);

      // Handle specific error cases
      if (error.message.includes("SUPER_ADMIN")) {
        return res.status(403).json({
          message: error.message,
        });
      }

      if (error.message.includes("not found")) {
        return res.status(404).json({
          message: error.message,
        });
      }

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

      const raw = req.body as Record<string, unknown>;
      const { payload, dueDateInvalid } = normalizeTaskPayload(raw);

      if (dueDateInvalid) {
        return res.status(400).json({ message: "Invalid dueDate value" });
      }

      const data: CreateTaskDTO = {
        projectId: raw.projectId as string | undefined,
        title: payload.title as string,
        description: payload.description,
        priority: payload.priority as any,
        issueType: payload.issueType as any,
        assigneeIds: payload.assigneeIds,
        parentTaskId: payload.parentTaskId,
        labels: payload.labels,
        dueDate: payload.dueDate || undefined,
      };

      if (!data.title) {
        return res.status(400).json({ message: "Task title is required" });
      }

      const task = await TaskService.createTask(
        data,
        req.user.id,
        req.user.role as UserRole,
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

      const rawStatus = req.query.status as string | undefined;
      const normalizedStatus = rawStatus
        ? normalizeTaskStatus(rawStatus)
        : undefined;

      if (rawStatus && !normalizedStatus) {
        return res.status(400).json({
          message: "Invalid status",
          validStatuses: Object.values(TaskStatus),
        });
      }

      const filters = {
        projectId: req.query.projectId as string,
        status: normalizedStatus as TaskStatus | undefined,
        assigneeId: req.query.assigneeId as string,
        creatorId: req.query.creatorId as string,
      };

      const tasks = await TaskService.getAllTasks(
        req.user.id,
        req.user.role as UserRole,
        filters,
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
        req.user.role as UserRole,
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

      const raw = req.body as Record<string, unknown>;
      const { payload, dueDateInvalid } = normalizeTaskPayload(raw);

      if (dueDateInvalid) {
        return res.status(400).json({ message: "Invalid dueDate value" });
      }

      const data: UpdateTaskDTO = {
        title: payload.title,
        description: payload.description,
        priority: payload.priority as any,
        issueType: payload.issueType as any,
        labels: payload.labels,
        dueDate: payload.dueDate,
        assigneeIds: payload.assigneeIds,
      };

      const task = await TaskService.updateTask(
        id,
        data,
        req.user.id,
        req.user.role as UserRole,
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

      const rawStatus = (req.body?.status ?? req.body?.toStatus) as
        | string
        | undefined;
      if (!rawStatus) {
        return res.status(400).json({ message: "Status is required" });
      }

      const normalizedStatus = normalizeTaskStatus(rawStatus);
      if (!normalizedStatus) {
        return res.status(400).json({
          message: "Invalid status",
          validStatuses: Object.values(TaskStatus),
        });
      }

      const task = await TaskService.changeStatus(
        id,
        normalizedStatus,
        req.user.id,
        req.user.role as UserRole,
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
   * POST /tasks/:id/assign - Assign task to multiple users
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

      const { assigneeIds } = req.body;

      if (
        !assigneeIds ||
        !Array.isArray(assigneeIds) ||
        assigneeIds.length === 0
      ) {
        return res
          .status(400)
          .json({ message: "At least one assignee ID is required" });
      }

      const task = await TaskService.assignTask(
        id,
        assigneeIds,
        req.user.id,
        req.user.role as UserRole,
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
   * DELETE /tasks/:id/assign/:userId - Unassign user(s) from task
   */
  async unassignTask(req: Request, res: Response): Promise<Response> {
    try {
      if (!req.user) {
        return res
          .status(403)
          .json({ message: "Forbidden: Authentication required" });
      }

      const { id, userId } = req.params;
      const { userIds } = req.body; // Optional: bulk unassignment via body

      if (!id) {
        return res.status(400).json({ message: "Task ID is required" });
      }

      // Determine if single or bulk unassignment
      const idsToUnassign =
        userIds && Array.isArray(userIds) && userIds.length > 0
          ? userIds
          : userId
            ? [userId]
            : [];

      if (idsToUnassign.length === 0) {
        return res.status(400).json({
          message: "At least one User ID is required (via path or body)",
        });
      }

      // Unassign each user
      const results = await Promise.allSettled(
        idsToUnassign.map((uid: string) =>
          TaskService.unassignTask(
            id,
            uid,
            req.user!.id,
            req.user!.role as UserRole,
          ),
        ),
      );

      const successful = results.filter((r) => r.status === "fulfilled").length;
      const failed = results.filter((r) => r.status === "rejected");

      if (failed.length === 0) {
        return res.status(200).json({
          message: `${successful} user(s) unassigned from task successfully`,
          unassigned: idsToUnassign,
        });
      } else {
        return res.status(207).json({
          message: `${successful} of ${idsToUnassign.length} users unassigned`,
          successful,
          failed: failed.map((f: any) => ({
            userId: idsToUnassign[results.findIndex((r) => r === f)],
            reason: f.reason?.message || "Unknown error",
          })),
        });
      }
    } catch (error: any) {
      return res.status(500).json({
        message: "Failed to unassign user(s) from task",
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
        req.user.role as UserRole,
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
        req.user.role as UserRole,
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

      const rawStatus = (req.body?.status ?? req.body?.toStatus) as
        | string
        | undefined;
      const { position } = req.body;

      if (!rawStatus) {
        return res.status(400).json({ message: "Status is required" });
      }

      const normalizedStatus = normalizeTaskStatus(rawStatus);
      if (!normalizedStatus) {
        return res.status(400).json({
          message: "Invalid status",
          validStatuses: Object.values(TaskStatus),
        });
      }

      if (position === undefined || position === null) {
        return res.status(400).json({ message: "Position is required" });
      }

      const task = await TaskService.moveTask(
        id,
        normalizedStatus,
        position,
        req.user.id,
        req.user.role as UserRole,
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
    res: Response,
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
        req.user.id,
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

  /**
   * DELETE /tasks/:id - Delete task
   */
  async deleteTask(req: Request, res: Response): Promise<Response> {
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

      const deleted = await TaskService.deleteTask(
        id,
        req.user.id,
        req.user.role as UserRole,
      );

      if (!deleted) {
        return res.status(404).json({ message: "Task not found" });
      }

      return res.status(200).json({
        message: "Task deleted successfully",
      });
    } catch (error: any) {
      if (error.message.includes("Forbidden")) {
        return res.status(403).json({ message: error.message });
      }
      return res.status(500).json({
        message: "Failed to delete task",
        error: error.message,
      });
    }
  }
}

export default new TaskController();

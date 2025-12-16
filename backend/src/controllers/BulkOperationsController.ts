import { Request, Response } from "express";
import prisma from "../db/prisma";
import { TaskStatus, TaskPriority, UserRole } from "../types/enums";
import ActivityLogService from "../services/ActivityLogService";
import NotificationService from "../services/NotificationService";
import TaskService from "../services/TaskService";

class BulkOperationsController {
  /**
   * Bulk edit tasks
   */
  static async bulkEdit(req: Request, res: Response): Promise<Response> {
    try {
      const { taskIds, updates } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      if (!taskIds || !Array.isArray(taskIds) || taskIds.length === 0) {
        return res.status(400).json({ message: "Task IDs are required" });
      }

      if (!updates || Object.keys(updates).length === 0) {
        return res.status(400).json({ message: "Updates are required" });
      }

      // Validate allowed fields
      const allowedFields = [
        "priority",
        "assigneeId",
        "labels",
        "storyPoints",
        "dueDate",
        "sprintId",
        "epicId",
      ];
      const updateFields = Object.keys(updates);
      const invalidFields = updateFields.filter(
        (f) => !allowedFields.includes(f)
      );

      if (invalidFields.length > 0) {
        return res.status(400).json({
          message: `Invalid fields: ${invalidFields.join(", ")}`,
          allowedFields,
        });
      }

      // Update tasks
      const result = await prisma.task.updateMany({
        where: {
          id: { in: taskIds },
        },
        data: updates,
      });

      // Log activity for each task
      for (const taskId of taskIds) {
        await ActivityLogService.logActivity({
          taskId,
          userId,
          action: "UPDATED" as any,
        });
      }

      return res.status(200).json({
        message: `${result.count} tasks updated successfully`,
        updated: result.count,
      });
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }

  /**
   * Bulk transition tasks to a new status
   */
  static async bulkTransition(req: Request, res: Response): Promise<Response> {
    try {
      const { taskIds, status } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      if (!taskIds || !Array.isArray(taskIds) || taskIds.length === 0) {
        return res.status(400).json({ message: "Task IDs are required" });
      }

      if (!status) {
        return res.status(400).json({ message: "Status is required" });
      }

      // Validate status
      if (!Object.values(TaskStatus).includes(status as TaskStatus)) {
        return res.status(400).json({
          message: "Invalid status",
          validStatuses: Object.values(TaskStatus),
        });
      }

      // Use workflow-validated bulk transition
      const result = await TaskService.bulkTransitionTasks(
        taskIds,
        status as TaskStatus,
        userId,
        req.user?.role as UserRole
      );

      // Return detailed results
      return res.status(200).json({
        message: `${result.successful.length} of ${taskIds.length} tasks transitioned to ${status}`,
        successful: result.successful,
        failed: result.failed,
        totalRequested: taskIds.length,
        totalSuccessful: result.successful.length,
        totalFailed: result.failed.length,
      });
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }

  /**
   * Bulk assign tasks to a user
   */
  static async bulkAssign(req: Request, res: Response): Promise<Response> {
    try {
      const { taskIds, assigneeId } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      if (!taskIds || !Array.isArray(taskIds) || taskIds.length === 0) {
        return res.status(400).json({ message: "Task IDs are required" });
      }

      if (!assigneeId) {
        return res.status(400).json({ message: "Assignee ID is required" });
      }

      // Verify assignee exists
      const assignee = await prisma.user.findUnique({
        where: { id: assigneeId },
      });

      if (!assignee) {
        return res.status(404).json({ message: "Assignee not found" });
      }

      // Update tasks
      const result = await prisma.task.updateMany({
        where: {
          id: { in: taskIds },
        },
        data: {
          assigneeId,
        },
      });

      // Log activity and send notifications
      for (const taskId of taskIds) {
        await ActivityLogService.logActivity({
          taskId,
          userId,
          action: "ASSIGNED" as any,
        });

        const task = await prisma.task.findUnique({
          where: { id: taskId },
        });

        if (task) {
          await NotificationService.createNotification(
            assigneeId,
            "TASK_ASSIGNED" as any,
            {
              title: "Task Assigned",
              message: `You have been assigned to task "${task.title}"`,
              taskId,
            }
          );
        }
      }

      return res.status(200).json({
        message: `${result.count} tasks assigned to ${assignee.name}`,
        updated: result.count,
      });
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }

  /**
   * Bulk delete tasks
   */
  static async bulkDelete(req: Request, res: Response): Promise<Response> {
    try {
      const { taskIds } = req.body;
      const userId = req.user?.id;
      const userRole = req.user?.role;

      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      if (!taskIds || !Array.isArray(taskIds) || taskIds.length === 0) {
        return res.status(400).json({ message: "Task IDs are required" });
      }

      // Only certain roles can bulk delete
      const allowedRoles = ["CEO", "HOO", "HR", "ADMIN"];
      if (!allowedRoles.includes(userRole || "")) {
        return res.status(403).json({
          message: "Insufficient permissions for bulk delete",
        });
      }

      // Soft delete (update status to archived/deleted)
      const result = await prisma.task.updateMany({
        where: {
          id: { in: taskIds },
        },
        data: {
          status: "CANCELLED" as TaskStatus,
        },
      });

      // Log activity
      for (const taskId of taskIds) {
        await ActivityLogService.logActivity({
          taskId,
          userId,
          action: "DELETED" as any,
        });
      }

      return res.status(200).json({
        message: `${result.count} tasks deleted successfully`,
        deleted: result.count,
      });
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }

  /**
   * Bulk move tasks to sprint
   */
  static async bulkMoveToSprint(
    req: Request,
    res: Response
  ): Promise<Response> {
    try {
      const { taskIds, sprintId } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      if (!taskIds || !Array.isArray(taskIds) || taskIds.length === 0) {
        return res.status(400).json({ message: "Task IDs are required" });
      }

      // Allow null to remove from sprint (move to backlog)
      if (sprintId !== null) {
        // Verify sprint exists
        const sprint = await prisma.sprint.findUnique({
          where: { id: sprintId },
        });

        if (!sprint) {
          return res.status(404).json({ message: "Sprint not found" });
        }
      }

      // Update tasks
      const result = await prisma.task.updateMany({
        where: {
          id: { in: taskIds },
        },
        data: {
          sprintId: sprintId || null,
        },
      });

      // Log activity
      for (const taskId of taskIds) {
        await ActivityLogService.logActivity({
          taskId,
          userId,
          action: "UPDATED" as any,
        });
      }

      return res.status(200).json({
        message: `${result.count} tasks moved ${
          sprintId ? "to sprint" : "to backlog"
        }`,
        updated: result.count,
      });
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }

  /**
   * Bulk update priority
   */
  static async bulkUpdatePriority(
    req: Request,
    res: Response
  ): Promise<Response> {
    try {
      const { taskIds, priority } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      if (!taskIds || !Array.isArray(taskIds) || taskIds.length === 0) {
        return res.status(400).json({ message: "Task IDs are required" });
      }

      if (!priority) {
        return res.status(400).json({ message: "Priority is required" });
      }

      // Validate priority
      if (!Object.values(TaskPriority).includes(priority as TaskPriority)) {
        return res.status(400).json({
          message: "Invalid priority",
          validPriorities: Object.values(TaskPriority),
        });
      }

      // Update tasks
      const result = await prisma.task.updateMany({
        where: {
          id: { in: taskIds },
        },
        data: {
          priority: priority as TaskPriority,
        },
      });

      // Log activity
      for (const taskId of taskIds) {
        await ActivityLogService.logActivity({
          taskId,
          userId,
          action: "UPDATED" as any,
        });
      }

      return res.status(200).json({
        message: `${result.count} tasks priority updated to ${priority}`,
        updated: result.count,
      });
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }
}

export default BulkOperationsController;

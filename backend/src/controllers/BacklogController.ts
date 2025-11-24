import { Request, Response } from "express";
import BacklogService from "../services/BacklogService";

class BacklogController {
  async getProjectBacklog(req: Request, res: Response) {
    try {
      const { projectId } = req.params;
      if (!projectId) {
        return res.status(400).json({ error: "Project ID is required" });
      }
      const { epicId, priority, assigneeId } = req.query;

      const tasks = await BacklogService.getProjectBacklog(projectId, {
        epicId: epicId as string,
        priority: priority as string,
        assigneeId: assigneeId as string,
      });

      return res.json(tasks);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }

  async getBacklogByEpic(req: Request, res: Response) {
    try {
      const { projectId } = req.params;
      if (!projectId) {
        return res.status(400).json({ error: "Project ID is required" });
      }
      const result = await BacklogService.getBacklogByEpic(projectId);
      return res.json(result);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }

  async updateBacklogPriority(req: Request, res: Response) {
    try {
      const { taskId } = req.params;
      if (!taskId) {
        return res.status(400).json({ error: "Task ID is required" });
      }
      const { priority } = req.body;

      const task = await BacklogService.updateBacklogPriority(taskId, priority);
      return res.json(task);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }

  async estimateTask(req: Request, res: Response) {
    try {
      const { taskId } = req.params;
      if (!taskId) {
        return res.status(400).json({ error: "Task ID is required" });
      }
      const { storyPoints } = req.body;

      const task = await BacklogService.estimateTask(taskId, storyPoints);
      return res.json(task);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }

  async bulkEstimate(req: Request, res: Response) {
    try {
      const { estimates } = req.body;
      const result = await BacklogService.bulkEstimate(estimates);
      return res.json(result);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }

  async getBacklogStats(req: Request, res: Response) {
    try {
      const { projectId } = req.params;
      if (!projectId) {
        return res.status(400).json({ error: "Project ID is required" });
      }
      const stats = await BacklogService.getBacklogStats(projectId);
      return res.json(stats);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }

  async getReadyTasks(req: Request, res: Response) {
    try {
      const { projectId } = req.params;
      if (!projectId) {
        return res.status(400).json({ error: "Project ID is required" });
      }
      const tasks = await BacklogService.getReadyTasks(projectId);
      return res.json(tasks);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }

  async moveTasksToSprint(req: Request, res: Response) {
    try {
      const { taskIds, sprintId } = req.body;
      const result = await BacklogService.moveTasksToSprint(taskIds, sprintId);
      return res.json(result);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }
}

export default new BacklogController();

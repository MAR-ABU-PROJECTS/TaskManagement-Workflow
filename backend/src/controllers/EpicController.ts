import { Request, Response } from "express";
import EpicService from "../services/EpicService";

class EpicController {
  async createEpic(req: Request, res: Response) {
    try {
      const { projectId } = req.params;
      if (!projectId) {
        return res.status(400).json({ error: "Project ID is required" });
      }
      const epic = await EpicService.createEpic(projectId, req.body);
      return res.status(201).json(epic);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }

  async getProjectEpics(req: Request, res: Response) {
    try {
      const { projectId } = req.params;
      if (!projectId) {
        return res.status(400).json({ error: "Project ID is required" });
      }
      const epics = await EpicService.getProjectEpics(projectId);
      return res.json(epics);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }

  async getEpicById(req: Request, res: Response) {
    try {
      const { epicId } = req.params;
      if (!epicId) {
        return res.status(400).json({ error: "Epic ID is required" });
      }
      const epic = await EpicService.getEpicById(epicId);
      return res.json(epic);
    } catch (error: any) {
      return res.status(404).json({ error: error.message });
    }
  }

  async updateEpic(req: Request, res: Response) {
    try {
      const { epicId } = req.params;
      if (!epicId) {
        return res.status(400).json({ error: "Epic ID is required" });
      }
      const epic = await EpicService.updateEpic(epicId, req.body);
      return res.json(epic);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }

  async deleteEpic(req: Request, res: Response) {
    try {
      const { epicId } = req.params;
      if (!epicId) {
        return res.status(400).json({ error: "Epic ID is required" });
      }
      const result = await EpicService.deleteEpic(epicId);
      return res.json(result);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }

  async addTaskToEpic(req: Request, res: Response) {
    try {
      const { epicId, taskId } = req.params;
      if (!epicId || !taskId) {
        return res
          .status(400)
          .json({ error: "Epic ID and Task ID are required" });
      }
      const task = await EpicService.addTaskToEpic(epicId, taskId);
      return res.json(task);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }

  async removeTaskFromEpic(req: Request, res: Response) {
    try {
      const { taskId } = req.params;
      if (!taskId) {
        return res.status(400).json({ error: "Task ID is required" });
      }
      const task = await EpicService.removeTaskFromEpic(taskId);
      return res.json(task);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }
}

export default new EpicController();

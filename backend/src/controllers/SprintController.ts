import { Request, Response } from "express";
import SprintService from "../services/SprintService";

class SprintController {
  async createSprint(req: Request, res: Response) {
    try {
      const { projectId } = req.params;
      if (!projectId) {
        return res.status(400).json({ error: "Project ID is required" });
      }
      const sprint = await SprintService.createSprint(projectId, req.body);
      return res.status(201).json(sprint);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }

  async getProjectSprints(req: Request, res: Response) {
    try {
      const { projectId } = req.params;
      if (!projectId) {
        return res.status(400).json({ error: "Project ID is required" });
      }
      const { includeCompleted } = req.query;

      const sprints = await SprintService.getProjectSprints(
        projectId,
        includeCompleted !== "false"
      );
      return res.json(sprints);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }

  async getSprintById(req: Request, res: Response) {
    try {
      const { sprintId } = req.params;
      if (!sprintId) {
        return res.status(400).json({ error: "Sprint ID is required" });
      }
      const sprint = await SprintService.getSprintById(sprintId);
      return res.json(sprint);
    } catch (error: any) {
      return res.status(404).json({ error: error.message });
    }
  }

  async updateSprint(req: Request, res: Response) {
    try {
      const { sprintId } = req.params;
      if (!sprintId) {
        return res.status(400).json({ error: "Sprint ID is required" });
      }
      const sprint = await SprintService.updateSprint(sprintId, req.body);
      return res.json(sprint);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }

  async startSprint(req: Request, res: Response) {
    try {
      const { sprintId } = req.params;
      if (!sprintId) {
        return res.status(400).json({ error: "Sprint ID is required" });
      }
      const sprint = await SprintService.startSprint(sprintId);
      return res.json(sprint);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }

  async completeSprint(req: Request, res: Response) {
    try {
      const { sprintId } = req.params;
      if (!sprintId) {
        return res.status(400).json({ error: "Sprint ID is required" });
      }
      const { moveIncompleteTo } = req.body;

      const sprint = await SprintService.completeSprint(
        sprintId,
        moveIncompleteTo
      );
      return res.json(sprint);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }

  async cancelSprint(req: Request, res: Response) {
    try {
      const { sprintId } = req.params;
      if (!sprintId) {
        return res.status(400).json({ error: "Sprint ID is required" });
      }
      const sprint = await SprintService.cancelSprint(sprintId);
      return res.json(sprint);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }

  async addTasksToSprint(req: Request, res: Response) {
    try {
      const { sprintId } = req.params;
      if (!sprintId) {
        return res.status(400).json({ error: "Sprint ID is required" });
      }
      const { taskIds } = req.body;

      const result = await SprintService.addTasksToSprint(sprintId, taskIds);
      return res.json(result);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }

  async removeTasksFromSprint(req: Request, res: Response) {
    try {
      const { taskIds } = req.body;
      const result = await SprintService.removeTasksFromSprint(taskIds);
      return res.json(result);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }

  async getBurndownData(req: Request, res: Response) {
    try {
      const { sprintId } = req.params;
      if (!sprintId) {
        return res.status(400).json({ error: "Sprint ID is required" });
      }
      const data = await SprintService.getBurndownData(sprintId);
      return res.json(data);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }

  async getVelocity(req: Request, res: Response) {
    try {
      const { sprintId } = req.params;
      if (!sprintId) {
        return res.status(400).json({ error: "Sprint ID is required" });
      }
      const data = await SprintService.calculateVelocity(sprintId);
      return res.json(data);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }

  async getTeamVelocity(req: Request, res: Response) {
    try {
      const { projectId } = req.params;
      if (!projectId) {
        return res.status(400).json({ error: "Project ID is required" });
      }
      const { lastNSprints } = req.query;

      const data = await SprintService.getTeamVelocity(
        projectId,
        lastNSprints ? parseInt(lastNSprints as string) : 3
      );
      return res.json(data);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }
}

export default new SprintController();

import { Request, Response } from "express";
import ReportService from "../services/ReportService";

class ReportController {
  async getVelocityReport(req: Request, res: Response) {
    try {
      const { projectId } = req.params;
      const { lastNSprints } = req.query;

      if (!projectId) {
        return res.status(400).json({ error: "Project ID is required" });
      }

      const report = await ReportService.getVelocityReport(
        projectId,
        lastNSprints ? parseInt(lastNSprints as string) : 5
      );
      return res.json(report);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }

  async getTeamProductivity(req: Request, res: Response) {
    try {
      const { projectId } = req.params;
      const { startDate, endDate } = req.query;

      if (!projectId) {
        return res.status(400).json({ error: "Project ID is required" });
      }

      const report = await ReportService.getTeamProductivity(
        projectId,
        startDate ? new Date(startDate as string) : undefined,
        endDate ? new Date(endDate as string) : undefined
      );
      return res.json(report);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }

  async getProjectHealth(req: Request, res: Response) {
    try {
      const { projectId } = req.params;

      if (!projectId) {
        return res.status(400).json({ error: "Project ID is required" });
      }

      const health = await ReportService.getProjectHealth(projectId);
      return res.json(health);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }

  async getCycleTimeReport(req: Request, res: Response) {
    try {
      const { projectId } = req.params;

      if (!projectId) {
        return res.status(400).json({ error: "Project ID is required" });
      }

      const report = await ReportService.getCycleTimeReport(projectId);
      return res.json(report);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }

  async getBurnupData(req: Request, res: Response) {
    try {
      const { projectId } = req.params;

      if (!projectId) {
        return res.status(400).json({ error: "Project ID is required" });
      }

      const data = await ReportService.getBurnupData(projectId);
      return res.json(data);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }
}

export default new ReportController();

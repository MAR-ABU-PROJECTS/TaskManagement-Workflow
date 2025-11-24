import { Request, Response } from "express";
import JQLParserService from "../services/JQLParserService";
import TaskService from "../services/TaskService";

class JQLController {
  /**
   * Search tasks using JQL query
   */
  static async searchWithJQL(req: Request, res: Response): Promise<Response> {
    try {
      const { jql } = req.query;
      const userId = req.user?.id;

      if (!jql || typeof jql !== "string") {
        return res.status(400).json({
          message: "JQL query is required",
          example: 'project = "PROJ-1" AND status IN ("TODO", "IN_PROGRESS")',
        });
      }

      // Parse JQL to Prisma where clause
      const whereClause = JQLParserService.parseJQL(jql, userId);

      // Execute search
      const tasks = await TaskService.searchTasks(whereClause);

      return res.status(200).json({
        jql,
        count: tasks.length,
        tasks,
      });
    } catch (error: any) {
      return res.status(400).json({
        message: error.message || "JQL search failed",
        jql: req.query.jql,
      });
    }
  }

  /**
   * Validate JQL syntax
   */
  static async validateJQL(req: Request, res: Response): Promise<Response> {
    try {
      const { jql } = req.body;

      if (!jql || typeof jql !== "string") {
        return res.status(400).json({ message: "JQL query is required" });
      }

      const validation = JQLParserService.validateJQL(jql);

      return res.status(200).json(validation);
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }

  /**
   * Get autocomplete suggestions for JQL
   */
  static async getJQLSuggestions(
    req: Request,
    res: Response
  ): Promise<Response> {
    try {
      const { partial } = req.query;

      if (typeof partial !== "string") {
        return res
          .status(400)
          .json({ message: "Partial JQL query is required" });
      }

      const suggestions = JQLParserService.getSuggestions(partial);

      return res.status(200).json({
        partial,
        suggestions,
      });
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }
}

export default JQLController;

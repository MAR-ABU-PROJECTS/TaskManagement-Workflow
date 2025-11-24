import { Request, Response } from "express";
import SavedFilterService from "../services/SavedFilterService";
import JQLParserService from "../services/JQLParserService";

class SavedFilterController {
  /**
   * Create a new saved filter
   */
  static async createFilter(req: Request, res: Response): Promise<Response> {
    try {
      const { name, description, jql, projectId, isPublic } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      if (!name || !jql) {
        return res.status(400).json({ message: "Name and JQL are required" });
      }

      // Validate JQL syntax
      const validation = JQLParserService.validateJQL(jql);
      if (!validation.valid) {
        return res.status(400).json({
          message: "Invalid JQL syntax",
          error: validation.error,
        });
      }

      const filter = await SavedFilterService.createFilter({
        name,
        description,
        jql,
        projectId,
        isPublic: isPublic || false,
        userId,
      });

      return res.status(201).json(filter);
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }

  /**
   * Get all filters for current user
   */
  static async getUserFilters(req: Request, res: Response): Promise<Response> {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const filters = await SavedFilterService.getUserFilters(userId);

      return res.status(200).json(filters);
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }

  /**
   * Get filter by ID
   */
  static async getFilterById(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      if (!id) {
        return res.status(400).json({ message: "Filter ID is required" });
      }

      const filter = await SavedFilterService.getFilterById(id, userId);

      return res.status(200).json(filter);
    } catch (error: any) {
      if (error.message === "Filter not found") {
        return res.status(404).json({ message: error.message });
      }
      if (error.message === "Access denied to this filter") {
        return res.status(403).json({ message: error.message });
      }
      return res.status(500).json({ message: error.message });
    }
  }

  /**
   * Update a filter
   */
  static async updateFilter(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const { name, description, jql, isPublic } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      if (!id) {
        return res.status(400).json({ message: "Filter ID is required" });
      }

      // Validate JQL if provided
      if (jql) {
        const validation = JQLParserService.validateJQL(jql);
        if (!validation.valid) {
          return res.status(400).json({
            message: "Invalid JQL syntax",
            error: validation.error,
          });
        }
      }

      const filter = await SavedFilterService.updateFilter(id, userId, {
        name,
        description,
        jql,
        isPublic,
      });

      return res.status(200).json(filter);
    } catch (error: any) {
      if (error.message === "Filter not found") {
        return res.status(404).json({ message: error.message });
      }
      if (error.message === "Only the owner can update this filter") {
        return res.status(403).json({ message: error.message });
      }
      return res.status(500).json({ message: error.message });
    }
  }

  /**
   * Delete a filter
   */
  static async deleteFilter(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      if (!id) {
        return res.status(400).json({ message: "Filter ID is required" });
      }

      const result = await SavedFilterService.deleteFilter(id, userId);

      return res.status(200).json(result);
    } catch (error: any) {
      if (error.message === "Filter not found") {
        return res.status(404).json({ message: error.message });
      }
      if (error.message === "Only the owner can delete this filter") {
        return res.status(403).json({ message: error.message });
      }
      return res.status(500).json({ message: error.message });
    }
  }

  /**
   * Share a filter (make public)
   */
  static async shareFilter(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      if (!id) {
        return res.status(400).json({ message: "Filter ID is required" });
      }

      const filter = await SavedFilterService.shareFilter(id, userId);

      return res.status(200).json(filter);
    } catch (error: any) {
      if (error.message === "Filter not found") {
        return res.status(404).json({ message: error.message });
      }
      if (error.message === "Only the owner can share this filter") {
        return res.status(403).json({ message: error.message });
      }
      return res.status(500).json({ message: error.message });
    }
  }

  /**
   * Clone a filter
   */
  static async cloneFilter(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const { name } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      if (!id) {
        return res.status(400).json({ message: "Filter ID is required" });
      }

      const filter = await SavedFilterService.cloneFilter(id, userId, name);

      return res.status(201).json(filter);
    } catch (error: any) {
      if (error.message === "Filter not found") {
        return res.status(404).json({ message: error.message });
      }
      return res.status(500).json({ message: error.message });
    }
  }
}

export default SavedFilterController;

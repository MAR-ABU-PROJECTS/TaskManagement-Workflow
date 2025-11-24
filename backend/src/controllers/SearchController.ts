import { Request, Response } from "express";
import AdvancedSearchService from "../services/AdvancedSearchService";

class SearchController {
  async advancedSearch(req: Request, res: Response) {
    try {
      const query = req.body;
      const result = await AdvancedSearchService.searchTasks(query);
      return res.json(result);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }

  async jqlSearch(req: Request, res: Response) {
    try {
      const { jql } = req.body;

      if (!jql) {
        return res.status(400).json({ error: "JQL query is required" });
      }

      const parsedQuery = AdvancedSearchService.parseJQL(jql);
      const result = await AdvancedSearchService.searchTasks(parsedQuery);

      return res.json(result);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }
}

export default new SearchController();

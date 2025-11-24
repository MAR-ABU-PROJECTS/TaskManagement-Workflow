"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const AdvancedSearchService_1 = __importDefault(require("../services/AdvancedSearchService"));
class SearchController {
    async advancedSearch(req, res) {
        try {
            const query = req.body;
            const result = await AdvancedSearchService_1.default.searchTasks(query);
            return res.json(result);
        }
        catch (error) {
            return res.status(400).json({ error: error.message });
        }
    }
    async jqlSearch(req, res) {
        try {
            const { jql } = req.body;
            if (!jql) {
                return res.status(400).json({ error: "JQL query is required" });
            }
            const parsedQuery = AdvancedSearchService_1.default.parseJQL(jql);
            const result = await AdvancedSearchService_1.default.searchTasks(parsedQuery);
            return res.json(result);
        }
        catch (error) {
            return res.status(400).json({ error: error.message });
        }
    }
}
exports.default = new SearchController();

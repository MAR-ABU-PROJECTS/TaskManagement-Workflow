import express from "express";
import { authenticate } from "../middleware/auth";
import { hasProjectPermission } from "../middleware/rbac";
import { Permission } from "../types/enums";
import JQLController from "../controllers/JQLController";
import SavedFilterController from "../controllers/SavedFilterController";

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// ==================== JQL SEARCH ====================

/**
 * @swagger
 * /api/search:
 *   get:
 *     summary: Search tasks using JQL (Jira Query Language)
 *     tags: [Search]
 */
router.get(
  "/",
  hasProjectPermission(Permission.BROWSE_PROJECT),
  JQLController.searchWithJQL
);

/**
 * @swagger
 * /api/search/validate:
 *   post:
 *     summary: Validate JQL syntax without executing
 *     tags: [Search]
 */
router.post("/validate", JQLController.validateJQL);

/**
 * @swagger
 * /api/search/autocomplete:
 *   get:
 *     summary: Get JQL autocomplete suggestions
 *     tags: [Search]
 */
router.get("/autocomplete", JQLController.getJQLSuggestions);

// ==================== SAVED FILTERS ====================

/**
 * @swagger
 * /api/search/filters:
 *   get:
 *     summary: Get all saved filters accessible by user
 *     tags: [Search]
 */
router.get("/filters", SavedFilterController.getUserFilters);

/**
 * @swagger
 * /api/search/filters:
 *   post:
 *     summary: Create a new saved filter
 *     tags: [Search]
 */
router.post("/filters", SavedFilterController.createFilter);

/**
 * @swagger
 * /api/search/filters/{id}:
 *   get:
 *     summary: Get saved filter by ID
 *     tags: [Search]
 */
router.get("/filters/:id", SavedFilterController.getFilterById);

/**
 * @swagger
 * /api/search/filters/{id}:
 *   patch:
 *     summary: Update saved filter
 *     tags: [Search]
 */
router.patch("/filters/:id", SavedFilterController.updateFilter);

/**
 * @swagger
 * /api/search/filters/{id}:
 *   delete:
 *     summary: Delete saved filter
 *     tags: [Search]
 */
router.delete("/filters/:id", SavedFilterController.deleteFilter);

export default router;

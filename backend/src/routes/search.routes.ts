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
 *     description: |
 *       Search for tasks using JQL syntax.
 *
 *       **Example Queries:**
 *       - `assignee = currentUser()` - Tasks assigned to you
 *       - `project = "WEB" AND status = "IN_PROGRESS"` - In-progress tasks in WEB project
 *       - `priority = HIGH AND dueDate <= endOfWeek()` - High priority tasks due this week
 *       - `labels = "urgent" OR priority = CRITICAL` - Urgent or critical tasks
 *
 *       **Supported Fields:** project, assignee, reporter, status, priority, issueType,
 *       created, updated, dueDate, labels, sprint, epic, storyPoints
 *
 *       **Operators:** =, !=, >, <, >=, <=, IN, NOT IN, ~, IS EMPTY, IS NOT EMPTY
 *
 *       **Functions:** currentUser(), now(), startOfDay(), endOfDay(), startOfWeek(),
 *       endOfWeek(), startOfMonth(), endOfMonth()
 *     tags: [Search]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: jql
 *         required: true
 *         schema:
 *           type: string
 *         description: JQL query string
 *         example: "project = WEB AND status = IN_PROGRESS ORDER BY priority DESC"
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *           maximum: 100
 *         description: Results per page
 *     responses:
 *       200:
 *         description: Search results
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 tasks:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Task'
 *                 total:
 *                   type: integer
 *                 page:
 *                   type: integer
 *                 totalPages:
 *                   type: integer
 *       400:
 *         description: Invalid JQL syntax
 *       403:
 *         description: Insufficient permissions
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
 *     description: |
 *       Validate JQL query syntax without executing the search.
 *       Useful for checking query validity before saving filters.
 *     tags: [Search]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - jql
 *             properties:
 *               jql:
 *                 type: string
 *                 description: JQL query to validate
 *                 example: "project = WEB AND assignee = currentUser()"
 *     responses:
 *       200:
 *         description: JQL is valid
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 valid:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "JQL syntax is valid"
 *       400:
 *         description: JQL syntax error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 valid:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "Unexpected token at position 15"
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
 *     description: |
 *       Save a JQL query as a reusable filter.
 *       Filters can be private (only you), team (project members), or public (everyone).
 *     tags: [Search]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - jql
 *             properties:
 *               name:
 *                 type: string
 *                 description: Filter name
 *                 example: "My High Priority Tasks"
 *               description:
 *                 type: string
 *                 description: Filter description
 *                 example: "All high priority tasks assigned to me"
 *               jql:
 *                 type: string
 *                 description: JQL query
 *                 example: "assignee = currentUser() AND priority = HIGH"
 *               visibility:
 *                 type: string
 *                 enum: [PRIVATE, TEAM, PUBLIC]
 *                 default: PRIVATE
 *                 description: Who can see this filter
 *               projectId:
 *                 type: string
 *                 format: uuid
 *                 description: Optional project to associate filter with
 *     responses:
 *       201:
 *         description: Filter created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   format: uuid
 *                 name:
 *                   type: string
 *                 jql:
 *                   type: string
 *                 visibility:
 *                   type: string
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: Invalid input or JQL syntax
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
 *     description: Update a saved filter. Only the owner can update private filters.
 *     tags: [Search]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               jql:
 *                 type: string
 *               visibility:
 *                 type: string
 *                 enum: [PRIVATE, TEAM, PUBLIC]
 *     responses:
 *       200:
 *         description: Filter updated successfully
 *       403:
 *         description: Cannot edit others' filters
 *       404:
 *         description: Filter not found
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

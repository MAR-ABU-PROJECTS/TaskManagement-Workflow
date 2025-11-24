import express from "express";
import JQLController from "../controllers/JQLController";
import { authenticate } from "../middleware/auth";
import { hasProjectPermission } from "../middleware/rbac";
import { Permission } from "../types/enums";

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /api/jql/search:
 *   get:
 *     summary: Search tasks using JQL (Jira Query Language)
 *     tags: [JQL]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: jql
 *         required: true
 *         schema:
 *           type: string
 *         description: JQL query string
 *         example: project = "PROJ-1" AND status IN ("TODO", "IN_PROGRESS")
 *     responses:
 *       200:
 *         description: Search results
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 jql:
 *                   type: string
 *                 count:
 *                   type: integer
 *                 tasks:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Task'
 *       400:
 *         description: Invalid JQL syntax
 */
router.get(
  "/search",
  hasProjectPermission(Permission.BROWSE_PROJECT),
  JQLController.searchWithJQL
);

/**
 * @swagger
 * /api/jql/validate:
 *   post:
 *     summary: Validate JQL syntax without executing
 *     tags: [JQL]
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
 *                 example: status = "TODO" AND assignee = currentUser()
 *     responses:
 *       200:
 *         description: Validation result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 valid:
 *                   type: boolean
 *                 error:
 *                   type: string
 */
router.post("/validate", JQLController.validateJQL);

/**
 * @swagger
 * /api/jql/suggestions:
 *   get:
 *     summary: Get autocomplete suggestions for JQL
 *     tags: [JQL]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: partial
 *         required: true
 *         schema:
 *           type: string
 *         description: Partial JQL query for autocomplete
 *         example: status =
 *     responses:
 *       200:
 *         description: Autocomplete suggestions
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 partial:
 *                   type: string
 *                 suggestions:
 *                   type: array
 *                   items:
 *                     type: string
 */
router.get("/suggestions", JQLController.getJQLSuggestions);

export default router;

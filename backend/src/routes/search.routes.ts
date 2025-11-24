import express from "express";
import SearchController from "../controllers/SearchController";
import { authenticate } from "../middleware/auth";

const router = express.Router();

router.use(authenticate);

/**
 * @swagger
 * /api/search/advanced:
 *   post:
 *     summary: Advanced multi-criteria task search
 *     tags: [Search]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               projectId:
 *                 type: string
 *                 description: Filter by project ID
 *               assigneeId:
 *                 type: string
 *                 description: Filter by assignee ID
 *               reporterId:
 *                 type: string
 *                 description: Filter by reporter/creator ID
 *               status:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [PENDING, IN_PROGRESS, COMPLETED, REJECTED]
 *                 description: Filter by task status (multiple values)
 *               priority:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [LOW, MEDIUM, HIGH, CRITICAL]
 *                 description: Filter by priority (multiple values)
 *               labels:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Filter by labels
 *               searchText:
 *                 type: string
 *                 description: Search in title and description
 *               createdAfter:
 *                 type: string
 *                 format: date-time
 *                 description: Created after this date
 *               createdBefore:
 *                 type: string
 *                 format: date-time
 *                 description: Created before this date
 *               updatedAfter:
 *                 type: string
 *                 format: date-time
 *               updatedBefore:
 *                 type: string
 *                 format: date-time
 *               dueAfter:
 *                 type: string
 *                 format: date-time
 *               dueBefore:
 *                 type: string
 *                 format: date-time
 *               storyPointsMin:
 *                 type: integer
 *                 minimum: 1
 *               storyPointsMax:
 *                 type: integer
 *                 maximum: 100
 *               page:
 *                 type: integer
 *                 default: 1
 *               limit:
 *                 type: integer
 *                 default: 20
 *               sortBy:
 *                 type: string
 *                 enum: [createdAt, updatedAt, priority, dueDate]
 *                 default: createdAt
 *               sortOrder:
 *                 type: string
 *                 enum: [asc, desc]
 *                 default: desc
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
 *         description: Invalid search criteria
 *       401:
 *         description: Unauthorized
 */
router.post("/search/advanced", SearchController.advancedSearch);

/**
 * @swagger
 * /api/search/jql:
 *   post:
 *     summary: JQL-style query search (Jira Query Language)
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
 *               - query
 *             properties:
 *               query:
 *                 type: string
 *                 description: JQL query string
 *                 example: 'project=PROJECT-123 AND status IN (IN_PROGRESS,PENDING) AND priority=HIGH'
 *               page:
 *                 type: integer
 *                 default: 1
 *               limit:
 *                 type: integer
 *                 default: 20
 *     responses:
 *       200:
 *         description: Search results from JQL query
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
 *       401:
 *         description: Unauthorized
 */
router.post("/search/jql", SearchController.jqlSearch);

export default router;

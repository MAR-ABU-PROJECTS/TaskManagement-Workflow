import express from "express";
import BacklogController from "../controllers/BacklogController";
import { authenticate } from "../middleware/auth";
import { hasProjectPermission } from "../middleware/rbac";
import { Permission } from "../types/enums";

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /api/projects/{projectId}/backlog:
 *   get:
 *     summary: Get project backlog (all unassigned tasks)
 *     tags: [Backlog]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *           enum: [LOW, MEDIUM, HIGH, CRITICAL]
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Backlog items
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Task'
 */
router.get(
  "/projects/:projectId/backlog",
  hasProjectPermission(Permission.VIEW_SPRINTS),
  BacklogController.getProjectBacklog
);
/**
 * @swagger
 * /api/projects/{projectId}/backlog/by-epic:
 *   get:
 *     summary: Get backlog grouped by epic
 *     tags: [Backlog]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Backlog grouped by epics
 */
router.get(
  "/projects/:projectId/backlog/by-epic",
  hasProjectPermission(Permission.VIEW_SPRINTS),
  BacklogController.getBacklogByEpic
);
router.get(
  "/projects/:projectId/backlog/ready",
  hasProjectPermission(Permission.VIEW_SPRINTS),
  BacklogController.getReadyTasks
);
router.get(
  "/projects/:projectId/backlog/stats",
  hasProjectPermission(Permission.VIEW_SPRINTS),
  BacklogController.getBacklogStats
);

/**
 * @swagger
 * /api/tasks/{taskId}/estimate:
 *   put:
 *     summary: Estimate story points for a task
 *     tags: [Backlog]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - storyPoints
 *             properties:
 *               storyPoints:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 100
 *     responses:
 *       200:
 *         description: Task estimated successfully
 */
router.put(
  "/tasks/:taskId/estimate",
  hasProjectPermission(Permission.MANAGE_SPRINTS),
  BacklogController.estimateTask
);
router.post(
  "/tasks/bulk-estimate",
  hasProjectPermission(Permission.MANAGE_SPRINTS),
  BacklogController.bulkEstimate
);

// Backlog management
router.put(
  "/tasks/:taskId/priority",
  hasProjectPermission(Permission.MANAGE_SPRINTS),
  BacklogController.updateBacklogPriority
);
router.post(
  "/backlog/move-to-sprint",
  hasProjectPermission(Permission.MANAGE_SPRINTS),
  BacklogController.moveTasksToSprint
);

export default router;

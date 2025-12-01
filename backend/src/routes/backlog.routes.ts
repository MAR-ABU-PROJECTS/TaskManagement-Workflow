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

/**
 * @swagger
 * /api/projects/{projectId}/backlog/ready:
 *   get:
 *     summary: Get tasks ready for sprint planning
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
 *         description: Tasks ready for sprint
 */
router.get(
  "/projects/:projectId/backlog/ready",
  hasProjectPermission(Permission.VIEW_SPRINTS),
  BacklogController.getReadyTasks
);

/**
 * @swagger
 * /api/projects/{projectId}/backlog/stats:
 *   get:
 *     summary: Get backlog statistics
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
 *         description: Backlog statistics (total tasks, estimated points, etc.)
 */
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

/**
 * @swagger
 * /api/tasks/bulk-estimate:
 *   post:
 *     summary: Bulk estimate story points for multiple tasks
 *     tags: [Backlog]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - estimates
 *             properties:
 *               estimates:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     taskId:
 *                       type: string
 *                     storyPoints:
 *                       type: integer
 *     responses:
 *       200:
 *         description: Tasks estimated successfully
 */
router.post(
  "/tasks/bulk-estimate",
  hasProjectPermission(Permission.MANAGE_SPRINTS),
  BacklogController.bulkEstimate
);

// Backlog management
/**
 * @swagger
 * /api/tasks/{taskId}/priority:
 *   put:
 *     summary: Update task priority in backlog
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
 *             properties:
 *               priority:
 *                 type: string
 *                 enum: [LOW, MEDIUM, HIGH, CRITICAL]
 *     responses:
 *       200:
 *         description: Priority updated successfully
 */
router.put(
  "/tasks/:taskId/priority",
  hasProjectPermission(Permission.MANAGE_SPRINTS),
  BacklogController.updateBacklogPriority
);

/**
 * @swagger
 * /api/backlog/move-to-sprint:
 *   post:
 *     summary: Move tasks from backlog to sprint
 *     tags: [Backlog]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - taskIds
 *               - sprintId
 *             properties:
 *               taskIds:
 *                 type: array
 *                 items:
 *                   type: string
 *               sprintId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Tasks moved to sprint successfully
 */
router.post(
  "/backlog/move-to-sprint",
  hasProjectPermission(Permission.MANAGE_SPRINTS),
  BacklogController.moveTasksToSprint
);

export default router;

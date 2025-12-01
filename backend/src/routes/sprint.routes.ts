import express from "express";
import SprintController from "../controllers/SprintController";
import { authenticate } from "../middleware/auth";
import { hasProjectPermission } from "../middleware/rbac";
import { Permission } from "../types/enums";

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /api/projects/{projectId}/sprints:
 *   post:
 *     summary: Create a new sprint for a project
 *     tags: [Sprints]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
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
 *               - name
 *               - startDate
 *               - endDate
 *             properties:
 *               name:
 *                 type: string
 *                 example: Sprint 1
 *               goal:
 *                 type: string
 *                 example: Complete user authentication feature
 *               startDate:
 *                 type: string
 *                 format: date-time
 *               endDate:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: Sprint created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Sprint'
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *   get:
 *     summary: Get all sprints for a project
 *     tags: [Sprints]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PLANNING, ACTIVE, COMPLETED, CANCELLED]
 *     responses:
 *       200:
 *         description: List of sprints
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Sprint'
 */
router.post(
  "/projects/:projectId/sprints",
  hasProjectPermission(Permission.MANAGE_SPRINTS),
  SprintController.createSprint
);

/**
 * @swagger
 * /api/projects/{projectId}/sprints:
 *   get:
 *     summary: Get all sprints for a project
 *     tags: [Sprints]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PLANNING, ACTIVE, COMPLETED, CANCELLED]
 *     responses:
 *       200:
 *         description: List of sprints
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Sprint'
 */
router.get(
  "/projects/:projectId/sprints",
  hasProjectPermission(Permission.VIEW_SPRINTS),
  SprintController.getProjectSprints
);

/**
 * @swagger
 * /api/sprints/{sprintId}:
 *   get:
 *     summary: Get sprint details by ID
 *     tags: [Sprints]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sprintId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Sprint details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Sprint'
 *       404:
 *         description: Sprint not found
 *   put:
 *     summary: Update sprint details
 *     tags: [Sprints]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sprintId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               goal:
 *                 type: string
 *               startDate:
 *                 type: string
 *                 format: date-time
 *               endDate:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: Sprint updated successfully
 *       404:
 *         description: Sprint not found
 */
router.get(
  "/sprints/:sprintId",
  hasProjectPermission(Permission.VIEW_SPRINTS),
  SprintController.getSprintById
);

/**
 * @swagger
 * /api/sprints/{sprintId}:
 *   put:
 *     summary: Update sprint details
 *     tags: [Sprints]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sprintId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               goal:
 *                 type: string
 *               startDate:
 *                 type: string
 *                 format: date-time
 *               endDate:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: Sprint updated successfully
 *       404:
 *         description: Sprint not found
 */
router.put(
  "/sprints/:sprintId",
  hasProjectPermission(Permission.MANAGE_SPRINTS),
  SprintController.updateSprint
);

/**
 * @swagger
 * /api/sprints/{sprintId}/start:
 *   post:
 *     summary: Start a sprint (changes status from PLANNING to ACTIVE)
 *     tags: [Sprints]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sprintId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Sprint started successfully
 *       400:
 *         description: Sprint cannot be started (invalid state)
 */
router.post(
  "/sprints/:sprintId/start",
  hasProjectPermission(Permission.MANAGE_SPRINTS),
  SprintController.startSprint
);

/**
 * @swagger
 * /api/sprints/{sprintId}/complete:
 *   post:
 *     summary: Complete a sprint (changes status to COMPLETED)
 *     tags: [Sprints]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sprintId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Sprint completed successfully
 *       400:
 *         description: Sprint cannot be completed
 */
router.post(
  "/sprints/:sprintId/complete",
  hasProjectPermission(Permission.MANAGE_SPRINTS),
  SprintController.completeSprint
);

/**
 * @swagger
 * /api/sprints/{sprintId}/cancel:
 *   post:
 *     summary: Cancel a sprint
 *     tags: [Sprints]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sprintId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Sprint cancelled successfully
 */
router.post(
  "/sprints/:sprintId/cancel",
  hasProjectPermission(Permission.MANAGE_SPRINTS),
  SprintController.cancelSprint
);

/**
 * @swagger
 * /api/sprints/{sprintId}/tasks:
 *   post:
 *     summary: Add tasks to a sprint
 *     tags: [Sprints]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sprintId
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
 *               - taskIds
 *             properties:
 *               taskIds:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Tasks added to sprint
 *       400:
 *         description: Invalid task IDs
 */
router.post(
  "/sprints/:sprintId/tasks",
  hasProjectPermission(Permission.MANAGE_SPRINTS),
  SprintController.addTasksToSprint
);

/**
 * @swagger
 * /api/sprints/tasks:
 *   delete:
 *     summary: Remove tasks from a sprint
 *     tags: [Sprints]
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
 *             properties:
 *               taskIds:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Tasks removed from sprint
 */
router.delete(
  "/sprints/tasks",
  hasProjectPermission(Permission.MANAGE_SPRINTS),
  SprintController.removeTasksFromSprint
);

/**
 * @swagger
 * /api/sprints/{sprintId}/burndown:
 *   get:
 *     summary: Get burndown chart data for a sprint
 *     tags: [Sprints]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sprintId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Burndown chart data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 dates:
 *                   type: array
 *                   items:
 *                     type: string
 *                     format: date
 *                 remainingPoints:
 *                   type: array
 *                   items:
 *                     type: number
 *                 idealBurndown:
 *                   type: array
 *                   items:
 *                     type: number
 */
router.get(
  "/sprints/:sprintId/burndown",
  hasProjectPermission(Permission.VIEW_SPRINTS),
  SprintController.getBurndownData
);

/**
 * @swagger
 * /api/sprints/{sprintId}/velocity:
 *   get:
 *     summary: Get velocity metrics for a sprint
 *     tags: [Sprints]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sprintId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Sprint velocity data
 */
router.get(
  "/sprints/:sprintId/velocity",
  hasProjectPermission(Permission.VIEW_SPRINTS),
  SprintController.getVelocity
);

/**
 * @swagger
 * /api/projects/{projectId}/velocity:
 *   get:
 *     summary: Get team velocity across multiple sprints
 *     tags: [Sprints]
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
 *         description: Team velocity data
 */
router.get(
  "/projects/:projectId/velocity",
  hasProjectPermission(Permission.VIEW_SPRINTS),
  SprintController.getTeamVelocity
);

export default router;

import express from "express";
import EpicController from "../controllers/EpicController";
import { authenticate } from "../middleware/auth";

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /api/projects/{projectId}/epics:
 *   post:
 *     summary: Create a new epic for a project
 *     tags: [Epics]
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
 *               - title
 *             properties:
 *               title:
 *                 type: string
 *                 example: User Management Feature
 *               description:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [PLANNING, IN_PROGRESS, COMPLETED]
 *               startDate:
 *                 type: string
 *                 format: date
 *               endDate:
 *                 type: string
 *                 format: date
 *     responses:
 *       201:
 *         description: Epic created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Epic'
 *   get:
 *     summary: Get all epics for a project
 *     tags: [Epics]
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
 *           enum: [PLANNING, IN_PROGRESS, COMPLETED]
 *     responses:
 *       200:
 *         description: List of epics
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Epic'
 */
router.post("/projects/:projectId/epics", EpicController.createEpic);

/**
 * @swagger
 * /api/projects/{projectId}/epics:
 *   get:
 *     summary: Get all epics for a project
 *     tags: [Epics]
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
 *           enum: [PLANNING, IN_PROGRESS, COMPLETED]
 *     responses:
 *       200:
 *         description: List of epics
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Epic'
 */
router.get("/projects/:projectId/epics", EpicController.getProjectEpics);
/**
 * @swagger
 * /api/epics/{epicId}:
 *   get:
 *     summary: Get epic details by ID
 *     tags: [Epics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: epicId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Epic details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Epic'
 *       404:
 *         description: Epic not found
 *   put:
 *     summary: Update epic details
 *     tags: [Epics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: epicId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               status:
 *                 type: string
 *               startDate:
 *                 type: string
 *                 format: date
 *               endDate:
 *                 type: string
 *                 format: date
 *     responses:
 *       200:
 *         description: Epic updated successfully
 *   delete:
 *     summary: Delete an epic
 *     tags: [Epics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: epicId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Epic deleted successfully
 *       404:
 *         description: Epic not found
 */
router.get("/epics/:epicId", EpicController.getEpicById);

/**
 * @swagger
 * /api/epics/{epicId}:
 *   put:
 *     summary: Update epic details
 *     tags: [Epics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: epicId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               status:
 *                 type: string
 *               startDate:
 *                 type: string
 *                 format: date
 *               endDate:
 *                 type: string
 *                 format: date
 *     responses:
 *       200:
 *         description: Epic updated successfully
 */
router.put("/epics/:epicId", EpicController.updateEpic);

/**
 * @swagger
 * /api/epics/{epicId}:
 *   delete:
 *     summary: Delete an epic
 *     tags: [Epics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: epicId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Epic deleted successfully
 *       404:
 *         description: Epic not found
 */
router.delete("/epics/:epicId", EpicController.deleteEpic);

// Task-epic association
/**
 * @swagger
 * /api/epics/{epicId}/tasks/{taskId}:
 *   post:
 *     summary: Add a task to an epic
 *     tags: [Epics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: epicId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Task added to epic successfully
 *       404:
 *         description: Epic or task not found
 */
router.post("/epics/:epicId/tasks/:taskId", EpicController.addTaskToEpic);

/**
 * @swagger
 * /api/tasks/{taskId}/epic:
 *   delete:
 *     summary: Remove task from its epic
 *     tags: [Epics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Task removed from epic successfully
 */
router.delete("/tasks/:taskId/epic", EpicController.removeTaskFromEpic);

export default router;

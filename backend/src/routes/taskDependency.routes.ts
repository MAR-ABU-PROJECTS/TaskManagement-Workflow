import express from "express";
import { authenticate } from "../middleware/auth";
import TaskDependencyController from "../controllers/TaskDependencyController";

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /api/task-dependencies:
 *   post:
 *     summary: Create a task dependency
 *     tags: [Task Dependencies]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - taskId
 *               - dependsOnTaskId
 *             properties:
 *               taskId:
 *                 type: string
 *                 description: The task that has the dependency
 *               dependsOnTaskId:
 *                 type: string
 *                 description: The task that must be completed first
 *               type:
 *                 type: string
 *                 enum: [BLOCKS, IS_BLOCKED_BY, RELATES_TO]
 *                 default: BLOCKS
 *     responses:
 *       201:
 *         description: Dependency created successfully
 *       400:
 *         description: Invalid dependency (circular dependency detected)
 *       404:
 *         description: Task not found
 *   get:
 *     summary: Get all task dependencies
 *     tags: [Task Dependencies]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: projectId
 *         schema:
 *           type: string
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [BLOCKS, IS_BLOCKED_BY, RELATES_TO]
 *     responses:
 *       200:
 *         description: List of dependencies
 */
router.post("/", (req, res) =>
  TaskDependencyController.createDependency(req, res)
);

/**
 * @swagger
 * /api/task-dependencies:
 *   get:
 *     summary: Get all task dependencies
 *     tags: [Task Dependencies]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: projectId
 *         schema:
 *           type: string
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [BLOCKS, IS_BLOCKED_BY, RELATES_TO]
 *     responses:
 *       200:
 *         description: List of dependencies
 */
router.get("/", (req, res) =>
  TaskDependencyController.getAllDependencies(req, res)
);

/**
 * @swagger
 * /api/task-dependencies/tasks/{taskId}:
 *   get:
 *     summary: Get all dependencies for a specific task
 *     tags: [Task Dependencies]
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
 *         description: Task dependencies
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 blocking:
 *                   type: array
 *                   items:
 *                     type: object
 *                 blockedBy:
 *                   type: array
 *                   items:
 *                     type: object
 *                 relatedTo:
 *                   type: array
 *                   items:
 *                     type: object
 */
router.get("/tasks/:taskId", (req, res) =>
  TaskDependencyController.getTaskDependencies(req, res)
);

/**
 * @swagger
 * /api/task-dependencies/tasks/{taskId}/blocking-info:
 *   get:
 *     summary: Get blocking information for a task
 *     tags: [Task Dependencies]
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
 *         description: Blocking status and details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 isBlocked:
 *                   type: boolean
 *                 blockingTasks:
 *                   type: array
 *                   items:
 *                     type: object
 */
router.get("/tasks/:taskId/blocking-info", (req, res) =>
  TaskDependencyController.getBlockingInfo(req, res)
);

/**
 * @swagger
 * /api/task-dependencies/tasks/{taskId}/subtask-summary:
 *   get:
 *     summary: Get subtask summary for a parent task
 *     tags: [Task Dependencies]
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
 *         description: Subtask summary
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalSubtasks:
 *                   type: integer
 *                 completedSubtasks:
 *                   type: integer
 *                 inProgressSubtasks:
 *                   type: integer
 *                 pendingSubtasks:
 *                   type: integer
 */
router.get("/tasks/:taskId/subtask-summary", (req, res) =>
  TaskDependencyController.getSubtaskSummary(req, res)
);

/**
 * @swagger
 * /api/task-dependencies/{id}:
 *   delete:
 *     summary: Delete a task dependency
 *     tags: [Task Dependencies]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Dependency deleted successfully
 *       404:
 *         description: Dependency not found
 */
router.delete("/:id", (req, res) =>
  TaskDependencyController.deleteDependency(req, res)
);

export default router;

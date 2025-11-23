import express from "express";
import { authenticate } from "../middleware/auth";
import TaskDependencyController from "../controllers/TaskDependencyController";

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   POST /api/task-dependencies
 * @desc    Create task dependency
 * @access  Authenticated users
 */
router.post("/", (req, res) =>
  TaskDependencyController.createDependency(req, res)
);

/**
 * @route   GET /api/task-dependencies
 * @desc    Get all dependencies (with optional filters)
 * @query   projectId, type
 * @access  Authenticated users
 */
router.get("/", (req, res) =>
  TaskDependencyController.getAllDependencies(req, res)
);

/**
 * @route   GET /api/task-dependencies/tasks/:taskId
 * @desc    Get dependencies for a specific task
 * @access  Authenticated users
 */
router.get("/tasks/:taskId", (req, res) =>
  TaskDependencyController.getTaskDependencies(req, res)
);

/**
 * @route   GET /api/task-dependencies/tasks/:taskId/blocking-info
 * @desc    Get blocking information for a task
 * @access  Authenticated users
 */
router.get("/tasks/:taskId/blocking-info", (req, res) =>
  TaskDependencyController.getBlockingInfo(req, res)
);

/**
 * @route   GET /api/task-dependencies/tasks/:taskId/subtask-summary
 * @desc    Get subtask summary for a parent task
 * @access  Authenticated users
 */
router.get("/tasks/:taskId/subtask-summary", (req, res) =>
  TaskDependencyController.getSubtaskSummary(req, res)
);

/**
 * @route   DELETE /api/task-dependencies/:id
 * @desc    Delete task dependency
 * @access  Authenticated users
 */
router.delete("/:id", (req, res) =>
  TaskDependencyController.deleteDependency(req, res)
);

export default router;

import express from "express";
import { authenticate } from "../middleware/auth";
import { canApproveTask } from "../middleware/rbac";
import TaskController from "../controllers/TaskController";

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   POST /api/tasks
 * @desc    Create a new task
 * @access  Authenticated users
 */
router.post("/", (req, res) => TaskController.createTask(req, res));

/**
 * @route   GET /api/tasks
 * @desc    Get all tasks (filtered by role)
 * @access  Authenticated users
 */
router.get("/", (req, res) => TaskController.getAllTasks(req, res));

/**
 * @route   GET /api/tasks/:id
 * @desc    Get task by ID
 * @access  Authenticated users with access
 */
router.get("/:id", (req, res) => TaskController.getTaskById(req, res));

/**
 * @route   PATCH /api/tasks/:id
 * @desc    Update task
 * @access  Creator, Assignee, or Management
 */
router.patch("/:id", (req, res) => TaskController.updateTask(req, res));

/**
 * @route   PATCH /api/tasks/:id/status
 * @desc    Change task status
 * @access  Creator, Assignee, or Management
 */
router.patch("/:id/status", (req, res) =>
  TaskController.changeStatus(req, res)
);

/**
 * @route   POST /api/tasks/:id/assign
 * @desc    Assign task to user
 * @access  Creator, Admin, or Management
 */
router.post("/:id/assign", (req, res) => TaskController.assignTask(req, res));

/**
 * @route   POST /api/tasks/:id/approve
 * @desc    Approve task
 * @access  CEO, HOO, HR
 */
router.post("/:id/approve", canApproveTask, (req, res) =>
  TaskController.approveTask(req, res)
);

/**
 * @route   POST /api/tasks/:id/reject
 * @desc    Reject task
 * @access  CEO, HOO, HR
 */
router.post("/:id/reject", canApproveTask, (req, res) =>
  TaskController.rejectTask(req, res)
);

export default router;

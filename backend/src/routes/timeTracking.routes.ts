import express from "express";
import { authenticate } from "../middleware/auth";
import TimeTrackingController from "../controllers/TimeTrackingController";

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   POST /api/tasks/:taskId/time
 * @desc    Log time for a task
 * @access  Authenticated users
 */
router.post("/tasks/:taskId/time", (req, res) =>
  TimeTrackingController.logTime(req, res)
);

/**
 * @route   GET /api/tasks/:taskId/time
 * @desc    Get time entries for a task
 * @access  Authenticated users
 */
router.get("/tasks/:taskId/time", (req, res) =>
  TimeTrackingController.getTaskTimeEntries(req, res)
);

/**
 * @route   GET /api/time-entries
 * @desc    Get user's time entries (with optional filters)
 * @query   startDate, endDate, taskId, projectId
 * @access  Authenticated users
 */
router.get("/time-entries", (req, res) =>
  TimeTrackingController.getUserTimeEntries(req, res)
);

/**
 * @route   PUT /api/time-entries/:id
 * @desc    Update time entry
 * @access  Entry creator or management
 */
router.put("/time-entries/:id", (req, res) =>
  TimeTrackingController.updateTimeEntry(req, res)
);

/**
 * @route   DELETE /api/time-entries/:id
 * @desc    Delete time entry
 * @access  Entry creator or management
 */
router.delete("/time-entries/:id", (req, res) =>
  TimeTrackingController.deleteTimeEntry(req, res)
);

/**
 * @route   POST /api/time/start
 * @desc    Start timer for a task
 * @access  Authenticated users
 */
router.post("/time/start", (req, res) =>
  TimeTrackingController.startTimer(req, res)
);

/**
 * @route   POST /api/time/stop
 * @desc    Stop active timer and log time
 * @access  Authenticated users
 */
router.post("/time/stop", (req, res) =>
  TimeTrackingController.stopTimer(req, res)
);

/**
 * @route   GET /api/time/active
 * @desc    Get active timer for current user
 * @access  Authenticated users
 */
router.get("/time/active", (req, res) =>
  TimeTrackingController.getActiveTimer(req, res)
);

/**
 * @route   GET /api/time/summary
 * @desc    Get user's time summary for a date range
 * @query   startDate, endDate (required)
 * @access  Authenticated users
 */
router.get("/time/summary", (req, res) =>
  TimeTrackingController.getUserTimeSummary(req, res)
);

/**
 * @route   GET /api/projects/:projectId/time-summary
 * @desc    Get project time summary
 * @access  Authenticated users
 */
router.get("/projects/:projectId/time-summary", (req, res) =>
  TimeTrackingController.getProjectTimeSummary(req, res)
);

export default router;

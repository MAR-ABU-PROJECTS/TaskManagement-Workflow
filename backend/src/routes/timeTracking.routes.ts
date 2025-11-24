import express from "express";
import { authenticate } from "../middleware/auth";
import TimeTrackingController from "../controllers/TimeTrackingController";

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /api/tasks/{taskId}/time:
 *   post:
 *     summary: Log time for a task
 *     tags: [Time Tracking]
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
 *               - hours
 *             properties:
 *               hours:
 *                 type: number
 *                 minimum: 0.1
 *                 example: 2.5
 *               description:
 *                 type: string
 *                 example: Worked on user authentication
 *               date:
 *                 type: string
 *                 format: date
 *     responses:
 *       201:
 *         description: Time logged successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *   get:
 *     summary: Get all time entries for a task
 *     tags: [Time Tracking]
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
 *         description: List of time entries
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   hours:
 *                     type: number
 *                   description:
 *                     type: string
 *                   userId:
 *                     type: string
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 */
router.post("/tasks/:taskId/time", (req, res) =>
  TimeTrackingController.logTime(req, res)
);

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
 * @swagger
 * /api/time/start:
 *   post:
 *     summary: Start a timer for a task
 *     tags: [Time Tracking]
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
 *             properties:
 *               taskId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Timer started
 *       400:
 *         description: Timer already running
 */
router.post("/time/start", (req, res) =>
  TimeTrackingController.startTimer(req, res)
);

/**
 * @swagger
 * /api/time/stop:
 *   post:
 *     summary: Stop the active timer and log time
 *     tags: [Time Tracking]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Timer stopped and time logged
 *       400:
 *         description: No active timer
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

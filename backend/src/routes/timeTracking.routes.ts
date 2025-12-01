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

/**
 * @swagger
 * /api/tasks/{taskId}/time:
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
router.get("/tasks/:taskId/time", (req, res) =>
  TimeTrackingController.getTaskTimeEntries(req, res)
);

/**
 * @swagger
 * /api/time-entries:
 *   get:
 *     summary: Get user's time entries with optional filters
 *     tags: [Time Tracking]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: taskId
 *         schema:
 *           type: string
 *       - in: query
 *         name: projectId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of time entries
 */
router.get("/time-entries", (req, res) =>
  TimeTrackingController.getUserTimeEntries(req, res)
);

/**
 * @swagger
 * /api/time-entries/{id}:
 *   put:
 *     summary: Update a time entry
 *     tags: [Time Tracking]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               hours:
 *                 type: number
 *               description:
 *                 type: string
 *               date:
 *                 type: string
 *                 format: date
 *     responses:
 *       200:
 *         description: Time entry updated
 *       403:
 *         description: Forbidden - not your entry
 *       404:
 *         description: Time entry not found
 */
router.put("/time-entries/:id", (req, res) =>
  TimeTrackingController.updateTimeEntry(req, res)
);

/**
 * @swagger
 * /api/time-entries/{id}:
 *   delete:
 *     summary: Delete a time entry
 *     tags: [Time Tracking]
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
 *         description: Time entry deleted
 *       403:
 *         description: Forbidden - not your entry
 *       404:
 *         description: Time entry not found
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
 * @swagger
 * /api/time/active:
 *   get:
 *     summary: Get active timer for current user
 *     tags: [Time Tracking]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Active timer details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 taskId:
 *                   type: string
 *                 startTime:
 *                   type: string
 *                   format: date-time
 *       404:
 *         description: No active timer
 */
router.get("/time/active", (req, res) =>
  TimeTrackingController.getActiveTimer(req, res)
);

/**
 * @swagger
 * /api/time/summary:
 *   get:
 *     summary: Get user's time summary for a date range
 *     tags: [Time Tracking]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Time summary
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalHours:
 *                   type: number
 *                 entries:
 *                   type: array
 *                   items:
 *                     type: object
 */
router.get("/time/summary", (req, res) =>
  TimeTrackingController.getUserTimeSummary(req, res)
);

/**
 * @swagger
 * /api/projects/{projectId}/time-summary:
 *   get:
 *     summary: Get project time summary
 *     tags: [Time Tracking]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Project time summary
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalHours:
 *                   type: number
 *                 userBreakdown:
 *                   type: array
 *                   items:
 *                     type: object
 */
router.get("/projects/:projectId/time-summary", (req, res) =>
  TimeTrackingController.getProjectTimeSummary(req, res)
);

export default router;

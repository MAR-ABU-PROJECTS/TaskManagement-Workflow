import express from "express";
import ReportController from "../controllers/ReportController";
import { authenticate } from "../middleware/auth";

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /api/projects/{projectId}/reports/velocity:
 *   get:
 *     summary: Get team velocity report
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: sprintCount
 *         schema:
 *           type: integer
 *           default: 5
 *         description: Number of recent sprints to analyze
 *     responses:
 *       200:
 *         description: Velocity report data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 averageVelocity:
 *                   type: number
 *                 sprintVelocities:
 *                   type: array
 *                   items:
 *                     type: object
 */
router.get(
  "/projects/:projectId/reports/velocity",
  ReportController.getVelocityReport
);
/**
 * @swagger
 * /api/projects/{projectId}/reports/productivity:
 *   get:
 *     summary: Get team productivity metrics
 *     tags: [Reports]
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
 *         description: Team productivity data
 */
router.get(
  "/projects/:projectId/reports/productivity",
  ReportController.getTeamProductivity
);
/**
 * @swagger
 * /api/projects/{projectId}/reports/health:
 *   get:
 *     summary: Get project health metrics
 *     tags: [Reports]
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
 *         description: Project health indicators
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 completionRate:
 *                   type: number
 *                 overdueTasks:
 *                   type: integer
 *                 activeSprints:
 *                   type: integer
 *                 teamUtilization:
 *                   type: number
 */
router.get(
  "/projects/:projectId/reports/health",
  ReportController.getProjectHealth
);
router.get(
  "/projects/:projectId/reports/cycle-time",
  ReportController.getCycleTimeReport
);
router.get(
  "/projects/:projectId/reports/burnup",
  ReportController.getBurnupData
);

export default router;

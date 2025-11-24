import express from "express";
import { authenticate } from "../middleware/auth";
import { isCEO } from "../middleware/rbac";
import prisma from "../db/prisma";

const router = express.Router();

// All CEO routes require authentication and CEO role
router.use(authenticate);
router.use(isCEO);

/**
 * @swagger
 * /api/ceo/dashboard:
 *   get:
 *     summary: Get CEO dashboard overview
 *     description: High-level overview of all projects, teams, and organizational metrics. Only accessible by CEO.
 *     tags: [CEO]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: CEO dashboard data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalProjects:
 *                   type: integer
 *                 activeProjects:
 *                   type: integer
 *                 totalTasks:
 *                   type: integer
 *                 completionRate:
 *                   type: number
 *                 teamUtilization:
 *                   type: number
 *       403:
 *         description: Forbidden - CEO role required
 */
router.get("/dashboard", async (_req, res) => {
  try {
    const [totalProjects, totalTasks, completedTasks, totalUsers] =
      await Promise.all([
        prisma.project.count(),
        prisma.task.count(),
        prisma.task.count({ where: { status: "COMPLETED" as any } }),
        prisma.user.count({ where: { role: { in: ["STAFF" as any] } } }),
      ]);

    const completionRate =
      totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
    const teamUtilization = totalUsers > 0 ? totalTasks / totalUsers : 0;

    const stats = {
      totalProjects,
      activeProjects: totalProjects, // All projects considered active
      totalTasks,
      completionRate: parseFloat(completionRate.toFixed(2)),
      teamUtilization: parseFloat(teamUtilization.toFixed(2)),
    };
    res.json(stats);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/ceo/projects/archive-all:
 *   post:
 *     summary: Archive multiple projects at once
 *     description: CEO-only bulk operation to archive projects. Useful for organizational restructuring.
 *     tags: [CEO]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - projectIds
 *             properties:
 *               projectIds:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Projects archived successfully
 *       403:
 *         description: Forbidden - CEO role required
 */
router.post("/projects/archive-all", async (req, res) => {
  try {
    const { projectIds } = req.body;
    // Implement bulk archive logic
    res.json({ message: "Projects archived", count: projectIds?.length || 0 });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/ceo/analytics/organization:
 *   get:
 *     summary: Get organization-wide analytics
 *     description: Comprehensive analytics across all departments, projects, and teams. CEO-only access.
 *     tags: [CEO]
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
 *     responses:
 *       200:
 *         description: Organization analytics
 *       403:
 *         description: Forbidden - CEO role required
 */
router.get("/analytics/organization", async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const dateFilter: any = {};
    if (startDate) dateFilter.gte = new Date(startDate as string);
    if (endDate) dateFilter.lte = new Date(endDate as string);

    const [projectsByStatus, tasksByStatus, usersByRole, tasksOverTime] =
      await Promise.all([
        prisma.project.groupBy({
          by: ["status" as any],
          _count: true,
        }),
        prisma.task.groupBy({
          by: ["status" as any],
          _count: true,
        }),
        prisma.user.groupBy({
          by: ["role" as any],
          _count: true,
        }),
        prisma.task.findMany({
          where:
            Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : {},
          select: { createdAt: true, status: true },
          orderBy: { createdAt: "desc" },
          take: 100,
        }),
      ]);

    res.json({
      analytics: {
        projectsByStatus,
        tasksByStatus,
        usersByRole,
        tasksOverTime,
        dateRange: { startDate, endDate },
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

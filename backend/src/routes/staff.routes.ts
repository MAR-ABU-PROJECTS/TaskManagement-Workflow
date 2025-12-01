import express from "express";
import { authenticate } from "../middleware/auth";
import prisma from "../db/prisma";

const router = express.Router();

// All staff routes require authentication (any authenticated user)
router.use(authenticate);

/**
 * @swagger
 * /api/staff/my-tasks:
 *   get:
 *     summary: Get my assigned tasks
 *     description: List of tasks assigned to the current user. Available to all authenticated users.
 *     tags: [Staff]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, IN_PROGRESS, COMPLETED, REJECTED]
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *           enum: [LOW, MEDIUM, HIGH, CRITICAL]
 *     responses:
 *       200:
 *         description: List of user's tasks
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Task'
 *       401:
 *         description: Unauthorized
 */
router.get("/my-tasks", async (req, res) => {
  try {
    const userId = req.user?.id;
    const { status, priority } = req.query;

    const tasks = await prisma.task.findMany({
      where: {
        assigneeId: userId,
        ...(status && { status: status as any }),
        ...(priority && { priority: priority as any }),
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: [{ priority: "desc" }, { dueDate: "asc" }],
    });

    res.json(tasks);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/staff/my-workload:
 *   get:
 *     summary: Get my workload summary
 *     description: Summary of current user's task load, story points, and time tracking.
 *     tags: [Staff]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Workload summary
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalTasks:
 *                   type: integer
 *                 inProgress:
 *                   type: integer
 *                 completed:
 *                   type: integer
 *                 totalStoryPoints:
 *                   type: integer
 *                 hoursLogged:
 *                   type: number
 *       401:
 *         description: Unauthorized
 */
router.get("/my-workload", async (req, res) => {
  try {
    const userId = req.user?.id;

    const totalTasks = await prisma.task.count({
      where: { assigneeId: userId },
    });

    const inProgress = await prisma.task.count({
      where: {
        assigneeId: userId,
        status: "IN_PROGRESS",
      },
    });

    const completed = await prisma.task.count({
      where: {
        assigneeId: userId,
        status: "COMPLETED",
      },
    });

    const tasksWithPoints = await prisma.task.findMany({
      where: { assigneeId: userId },
      select: { storyPoints: true },
    });

    const totalStoryPoints = tasksWithPoints.reduce(
      (sum, task) => sum + (task.storyPoints || 0),
      0
    );

    res.json({
      totalTasks,
      inProgress,
      completed,
      totalStoryPoints,
      hoursLogged: 0, // TODO: Calculate from time entries
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/staff/my-notifications:
 *   get:
 *     summary: Get my recent notifications
 *     description: Recent notifications for the current user with read/unread status.
 *     tags: [Staff]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: unread
 *         schema:
 *           type: boolean
 *         description: Filter for unread notifications only
 *     responses:
 *       200:
 *         description: List of notifications
 *       401:
 *         description: Unauthorized
 */
router.get("/my-notifications", async (req, res) => {
  try {
    const userId = req.user?.id;
    const { unread } = req.query;

    const notifications = await prisma.notification.findMany({
      where: {
        userId,
        ...(unread === "true" && { isRead: false }),
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    res.json(notifications);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/staff/my-profile:
 *   get:
 *     summary: Get my profile
 *     description: Current user's profile information.
 *     tags: [Staff]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *   put:
 *     summary: Update my profile
 *     description: Update current user's profile (name only, role/email require admin).
 *     tags: [Staff]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *     responses:
 *       200:
 *         description: Profile updated
 *       401:
 *         description: Unauthorized
 */
router.get("/my-profile", async (req, res) => {
  try {
    const userId = req.user?.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        department: true,
        isActive: true,
        createdAt: true,
      },
    });

    res.json(user);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/staff/my-profile:
 *   put:
 *     summary: Update my profile
 *     description: Update current user's profile (name only, role/email require admin).
 *     tags: [Staff]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *     responses:
 *       200:
 *         description: Profile updated
 *       401:
 *         description: Unauthorized
 */
router.put("/my-profile", async (req, res) => {
  try {
    const userId = req.user?.id;
    const { name } = req.body;

    const user = await prisma.user.update({
      where: { id: userId },
      data: { name },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        department: true,
      },
    });

    res.json(user);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

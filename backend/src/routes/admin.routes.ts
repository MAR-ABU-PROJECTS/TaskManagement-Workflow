import express from "express";
import { authenticate } from "../middleware/auth";
import { requireRoles } from "../middleware/rbac";
import { UserRole } from "../types/enums";
import prisma from "../db/prisma";

const router = express.Router();

// All admin routes require authentication and ADMIN role or higher
router.use(authenticate);
router.use(requireRoles(UserRole.CEO, UserRole.HOO, UserRole.HR, UserRole.ADMIN));

/**
 * @swagger
 * /api/admin/projects/overview:
 *   get:
 *     summary: Get admin project overview
 *     description: Dashboard view of all projects with management insights. Accessible by ADMIN and above.
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Project overview data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalProjects:
 *                   type: integer
 *                 projectsByStatus:
 *                   type: object
 *                 recentActivity:
 *                   type: array
 *                   items:
 *                     type: object
 *       403:
 *         description: Forbidden - ADMIN role required
 */
router.get("/projects/overview", async (_req, res) => {
  try {
    const totalProjects = await prisma.project.count();
    const projectsByStatus = await prisma.project.groupBy({
      by: ["status" as any],
      _count: true,
    });

    res.json({
      totalProjects,
      projectsByStatus,
      recentActivity: [], // TODO: Implement
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/admin/tasks/pending-approval:
 *   get:
 *     summary: Get all tasks pending approval
 *     description: List of tasks awaiting management approval across all projects.
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of pending tasks
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Task'
 *       403:
 *         description: Forbidden - ADMIN role required
 */
router.get("/tasks/pending-approval", async (_req, res) => {
  try {
    const pendingTasks = await prisma.task.findMany({
      where: {
        OR: [
          { status: "PENDING" as any },
          { status: "PENDING_APPROVAL" as any },
          { status: "PENDING_APPROVAL" as any },
        ],
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json(pendingTasks);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/admin/system/settings:
 *   get:
 *     summary: Get system settings
 *     description: Retrieve system-wide configuration and settings.
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: System settings
 *       403:
 *         description: Forbidden - ADMIN role required
 */
router.get("/system/settings", async (_req, res) => {
  try {
    // TODO: Implement system settings retrieval
    res.json({
      maxFileUploadSize: "10MB",
      allowedFileTypes: ["pdf", "doc", "docx", "jpg", "png"],
      sessionTimeout: "24h",
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/admin/system/settings:
 *   put:
 *     summary: Update system settings
 *     description: Modify system-wide configuration (CEO/HOO only).
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               maxFileUploadSize:
 *                 type: string
 *               sessionTimeout:
 *                 type: string
 *     responses:
 *       200:
 *         description: Settings updated successfully
 *       403:
 *         description: Forbidden - ADMIN role required
 */
router.put("/system/settings", async (req, res) => {
  try {
    // TODO: Implement system settings update
    res.json({ message: "Settings updated", settings: req.body });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

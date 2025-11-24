import express from "express";
import { authenticate } from "../middleware/auth";
import { requireRoles } from "../middleware/rbac";
import { UserRole } from "../types/enums";
import prisma from "../db/prisma";

const router = express.Router();

// All HR routes require authentication and HR role
router.use(authenticate);
router.use(requireRoles(UserRole.CEO, UserRole.HOO, UserRole.HR));

/**
 * @swagger
 * /api/hr/users:
 *   get:
 *     summary: Get all users in the organization
 *     description: List all users with their roles, departments, and status. Accessible by CEO, HOO, and HR.
 *     tags: [HR]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: department
 *         schema:
 *           $ref: '#/components/schemas/Department'
 *       - in: query
 *         name: role
 *         schema:
 *           $ref: '#/components/schemas/UserRole'
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: List of users
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 *       403:
 *         description: Forbidden - HR role required
 */
router.get("/users", async (req, res) => {
  try {
    const { department, role, isActive } = req.query;

    const users = await prisma.user.findMany({
      where: {
        ...(department && { department: department as any }),
        ...(role && { role: role as UserRole }),
        ...(isActive !== undefined && { isActive: isActive === "true" }),
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        department: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    res.json(users);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/hr/users/{userId}/deactivate:
 *   post:
 *     summary: Deactivate a user account
 *     description: Deactivate user account (soft delete). User cannot login but data is preserved.
 *     tags: [HR]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User deactivated successfully
 *       403:
 *         description: Forbidden - HR role required
 *       404:
 *         description: User not found
 */
router.post("/users/:userId/deactivate", async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await prisma.user.update({
      where: { id: userId },
      data: { isActive: false },
      select: {
        id: true,
        email: true,
        name: true,
        isActive: true,
      },
    });

    res.json({ message: "User deactivated", user });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/hr/users/{userId}/activate:
 *   post:
 *     summary: Activate a user account
 *     description: Reactivate a previously deactivated user account.
 *     tags: [HR]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User activated successfully
 *       403:
 *         description: Forbidden - HR role required
 */
router.post("/users/:userId/activate", async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await prisma.user.update({
      where: { id: userId },
      data: { isActive: true },
      select: {
        id: true,
        email: true,
        name: true,
        isActive: true,
      },
    });

    res.json({ message: "User activated", user });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/hr/users/{userId}/change-role:
 *   put:
 *     summary: Change user's role
 *     description: Update a user's role in the system. Only CEO, HOO, and HR can change roles.
 *     tags: [HR]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
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
 *               - role
 *             properties:
 *               role:
 *                 $ref: '#/components/schemas/UserRole'
 *     responses:
 *       200:
 *         description: Role changed successfully
 *       403:
 *         description: Forbidden - HR role required
 */
router.put("/users/:userId/change-role", async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    if (!Object.values(UserRole).includes(role)) {
      return res.status(400).json({ error: "Invalid role" });
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: { role },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });

    return res.json({ message: "Role updated", user });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/hr/users/{userId}/change-department:
 *   put:
 *     summary: Change user's department
 *     description: Update a user's department assignment.
 *     tags: [HR]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
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
 *               - department
 *             properties:
 *               department:
 *                 $ref: '#/components/schemas/Department'
 *     responses:
 *       200:
 *         description: Department changed successfully
 *       403:
 *         description: Forbidden - HR role required
 */
router.put("/users/:userId/change-department", async (req, res) => {
  try {
    const { userId } = req.params;
    const { department } = req.body;

    const user = await prisma.user.update({
      where: { id: userId },
      data: { department },
      select: {
        id: true,
        email: true,
        name: true,
        department: true,
      },
    });

    res.json({ message: "Department updated", user });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/hr/analytics/team-performance:
 *   get:
 *     summary: Get team performance metrics
 *     description: Analytics on team productivity, task completion rates, and resource utilization.
 *     tags: [HR]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: department
 *         schema:
 *           $ref: '#/components/schemas/Department'
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
 *         description: Team performance metrics
 *       403:
 *         description: Forbidden - HR role required
 */
router.get("/analytics/team-performance", async (req, res) => {
  try {
    const { startDate, endDate, department } = req.query;

    const dateFilter: any = {};
    if (startDate) dateFilter.gte = new Date(startDate as string);
    if (endDate) dateFilter.lte = new Date(endDate as string);

    const departmentFilter = department
      ? { department: department as any }
      : {};

    // Get team statistics
    const [totalUsers, activeUsers, tasksByUser, completedTasksByUser] =
      await Promise.all([
        prisma.user.count({
          where: { role: "STAFF" as any, ...departmentFilter },
        }),
        prisma.user.count({
          where: {
            role: "STAFF" as any,
            ...departmentFilter,
            assignedTasks: { some: {} },
          },
        }),
        prisma.task.groupBy({
          by: ["assigneeId" as any],
          _count: true,
          where:
            Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : {},
        }),
        prisma.task.groupBy({
          by: ["assigneeId" as any],
          _count: true,
          where: {
            status: "COMPLETED" as any,
            ...(Object.keys(dateFilter).length > 0
              ? { updatedAt: dateFilter }
              : {}),
          },
        }),
      ]);

    const avgTasksPerUser =
      totalUsers > 0
        ? tasksByUser.reduce((sum, t) => sum + t._count, 0) / totalUsers
        : 0;
    const avgCompletedPerUser =
      totalUsers > 0
        ? completedTasksByUser.reduce((sum, t) => sum + t._count, 0) /
          totalUsers
        : 0;

    res.json({
      analytics: {
        totalUsers,
        activeUsers,
        utilization: totalUsers > 0 ? (activeUsers / totalUsers) * 100 : 0,
        avgTasksPerUser: parseFloat(avgTasksPerUser.toFixed(2)),
        avgCompletedTasksPerUser: parseFloat(avgCompletedPerUser.toFixed(2)),
        taskDistribution: tasksByUser,
        completionDistribution: completedTasksByUser,
        dateRange: { startDate, endDate },
        department,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

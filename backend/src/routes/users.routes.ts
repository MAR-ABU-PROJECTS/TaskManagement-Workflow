import express from "express";
import { authenticate } from "../middleware/auth";
import { requireRoles, isCEO } from "../middleware/rbac";
import { UserRole } from "../types/enums";
import prisma from "../db/prisma";
import hierarchyController from "../controllers/UserHierarchyController";

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /api/users/me:
 *   get:
 *     summary: Get current user profile
 *     description: Get the authenticated user's profile information
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current user profile
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 */
router.get("/me", async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        department: true,
        isActive: true,
        isSuperAdmin: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json(user);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/users/me:
 *   patch:
 *     summary: Update current user profile
 *     description: Update the authenticated user's own profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: Profile updated successfully
 */
router.patch("/me", async (req, res) => {
  try {
    const { name, email } = req.body;
    const updateData: any = {};

    if (name) updateData.name = name;
    if (email) updateData.email = email;

    const user = await prisma.user.update({
      where: { id: req.user!.id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        department: true,
        isActive: true,
      },
    });

    res.json({ message: "Profile updated", user });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: List all users (role-based filtering)
 *     description: Get all users. Admins and above see all users, staff see limited info.
 *     tags: [Users]
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
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by name or email
 *     responses:
 *       200:
 *         description: List of users
 */
router.get("/", async (req, res) => {
  try {
    const { department, role, isActive, search } = req.query;
    const userRole = req.user!.role as UserRole;

    // Build where clause based on filters
    const where: any = {
      isSuperAdmin: false, // Exclude Super Admins from organization listings
      ...(department && { department: department as any }),
      ...(role && { role: role as UserRole }),
      ...(isActive !== undefined && { isActive: isActive === "true" }),
    };

    // Add search filter
    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: "insensitive" } },
        { email: { contains: search as string, mode: "insensitive" } },
      ];
    }

    // Determine what fields to return based on role
    const isAdmin = [
      UserRole.CEO,
      UserRole.HOO,
      UserRole.HR,
      UserRole.ADMIN,
    ].includes(userRole);

    const select = isAdmin
      ? {
          id: true,
          email: true,
          name: true,
          role: true,
          department: true,
          isActive: true,
          isSuperAdmin: true,
          createdAt: true,
          updatedAt: true,
          promotedAt: true,
          promotedBy: {
            select: { id: true, name: true, email: true },
          },
        }
      : {
          id: true,
          name: true,
          role: true,
          department: true,
        };

    const users = await prisma.user.findMany({
      where,
      select,
      orderBy: { createdAt: "desc" },
    });

    res.json({ users, count: users.length });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Get user by ID
 *     description: Get detailed information about a specific user
 *     tags: [Users]
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
 *         description: User details
 *       404:
 *         description: User not found
 */
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const userRole = req.user!.role as UserRole;

    const isAdmin = [
      UserRole.CEO,
      UserRole.HOO,
      UserRole.HR,
      UserRole.ADMIN,
    ].includes(userRole);

    const select = isAdmin
      ? {
          id: true,
          email: true,
          name: true,
          role: true,
          department: true,
          isActive: true,
          isSuperAdmin: true,
          createdAt: true,
          updatedAt: true,
          promotedAt: true,
          promotedBy: {
            select: { id: true, name: true, email: true, role: true },
          },
        }
      : {
          id: true,
          name: true,
          role: true,
          department: true,
        };

    const user = await prisma.user.findUnique({
      where: { id },
      select,
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json(user);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/users/{id}:
 *   patch:
 *     summary: Update user (admin only)
 *     description: Update user information. Requires admin privileges.
 *     tags: [Users]
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
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               department:
 *                 $ref: '#/components/schemas/Department'
 *     responses:
 *       200:
 *         description: User updated successfully
 */
router.patch(
  "/:id",
  requireRoles(UserRole.CEO, UserRole.HOO, UserRole.HR, UserRole.ADMIN),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { name, email, department } = req.body;

      const updateData: any = {};
      if (name) updateData.name = name;
      if (email) updateData.email = email;
      if (department !== undefined) updateData.department = department || null;

      const user = await prisma.user.update({
        where: { id },
        data: updateData,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          department: true,
          isActive: true,
        },
      });

      return res.json({ message: "User updated", user });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }
);

/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     summary: Delete user (admin only)
 *     description: Permanently delete a user. Requires admin privileges.
 *     tags: [Users]
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
 *         description: User deleted successfully
 */
router.delete(
  "/:id",
  requireRoles(UserRole.CEO, UserRole.HOO, UserRole.HR),
  async (req, res) => {
    try {
      const { id } = req.params;

      // Check if target user is SUPER_ADMIN
      const targetUser = await prisma.user.findUnique({
        where: { id },
        select: { isSuperAdmin: true },
      });

      if (targetUser?.isSuperAdmin) {
        return res.status(403).json({
          message: "Super Admin accounts cannot be deleted",
        });
      }

      await prisma.user.delete({ where: { id } });

      return res.json({ message: "User deleted successfully" });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }
);

/**
 * @swagger
 * /api/users/{id}/promote:
 *   post:
 *     summary: Promote user to higher role
 *     description: Promote user with role hierarchy validation
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
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
 *               - newRole
 *             properties:
 *               newRole:
 *                 $ref: '#/components/schemas/UserRole'
 *     responses:
 *       200:
 *         description: User promoted successfully
 */
router.post("/:userId/promote", (req, res) =>
  hierarchyController.promoteUser(req, res)
);

/**
 * @swagger
 * /api/users/{id}/demote:
 *   post:
 *     summary: Demote user to lower role
 *     description: Demote user with role hierarchy validation
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
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
 *               - newRole
 *             properties:
 *               newRole:
 *                 $ref: '#/components/schemas/UserRole'
 *     responses:
 *       200:
 *         description: User demoted successfully
 */
router.post("/:userId/demote", (req, res) =>
  hierarchyController.demoteUser(req, res)
);

/**
 * @swagger
 * /api/users/{id}/deactivate:
 *   post:
 *     summary: Deactivate user account
 *     description: Deactivate user (soft delete). Requires HR or above.
 *     tags: [Users]
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
 *         description: User deactivated successfully
 */
router.post(
  "/:id/deactivate",
  requireRoles(UserRole.CEO, UserRole.HOO, UserRole.HR),
  async (req, res) => {
    try {
      const { id } = req.params;

      // Check if target user is SUPER_ADMIN
      const targetUser = await prisma.user.findUnique({
        where: { id },
        select: { isSuperAdmin: true },
      });

      if (targetUser?.isSuperAdmin) {
        return res.status(403).json({
          message: "Super Admin accounts cannot be deactivated",
        });
      }

      const user = await prisma.user.update({
        where: { id },
        data: { isActive: false },
        select: {
          id: true,
          email: true,
          name: true,
          isActive: true,
        },
      });

      return res.json({ message: "User deactivated", user });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }
);

/**
 * @swagger
 * /api/users/{id}/activate:
 *   post:
 *     summary: Activate user account
 *     description: Reactivate a deactivated user. Requires HR or above.
 *     tags: [Users]
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
 *         description: User activated successfully
 */
router.post(
  "/:id/activate",
  requireRoles(UserRole.CEO, UserRole.HOO, UserRole.HR),
  async (req, res) => {
    try {
      const { id } = req.params;

      // Check if target user is SUPER_ADMIN
      const targetUser = await prisma.user.findUnique({
        where: { id },
        select: { isSuperAdmin: true },
      });

      if (targetUser?.isSuperAdmin) {
        return res.status(403).json({
          message: "Super Admin accounts cannot be modified",
        });
      }

      const user = await prisma.user.update({
        where: { id },
        data: { isActive: true },
        select: {
          id: true,
          email: true,
          name: true,
          isActive: true,
        },
      });

      return res.json({ message: "User activated", user });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }
);

/**
 * @swagger
 * /api/users/{id}/change-department:
 *   patch:
 *     summary: Change user department
 *     description: Update user's department. Requires HR or above.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               department:
 *                 $ref: '#/components/schemas/Department'
 *                 nullable: true
 *     responses:
 *       200:
 *         description: Department updated successfully
 */
router.patch(
  "/:id/change-department",
  requireRoles(UserRole.CEO, UserRole.HOO, UserRole.HR),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { department } = req.body;

      // Check if target user is SUPER_ADMIN
      const targetUser = await prisma.user.findUnique({
        where: { id },
        select: { isSuperAdmin: true },
      });

      if (targetUser?.isSuperAdmin) {
        return res.status(403).json({
          message: "Super Admin accounts cannot be modified",
        });
      }

      const user = await prisma.user.update({
        where: { id },
        data: { department: department || null },
        select: {
          id: true,
          email: true,
          name: true,
          department: true,
        },
      });

      return res.json({ message: "Department updated", user });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }
);

/**
 * @swagger
 * /api/users/dashboard/overview:
 *   get:
 *     summary: Get user management dashboard
 *     description: Dashboard with user statistics and metrics. CEO, HOO, HR, ADMIN only.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard overview
 */
router.get(
  "/dashboard/overview",
  requireRoles(UserRole.CEO, UserRole.HOO, UserRole.HR, UserRole.ADMIN),
  async (_req, res) => {
    try {
      const [
        totalUsers,
        activeUsers,
        usersByRole,
        usersByDepartment,
        recentUsers,
      ] = await Promise.all([
        prisma.user.count({ where: { isSuperAdmin: false } }),
        prisma.user.count({ where: { isActive: true, isSuperAdmin: false } }),
        prisma.user.groupBy({
          by: ["role"],
          where: { isSuperAdmin: false },
          _count: true,
        }),
        prisma.user.groupBy({
          by: ["department"],
          where: { isSuperAdmin: false },
          _count: true,
        }),
        prisma.user.findMany({
          where: { isSuperAdmin: false },
          take: 10,
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            department: true,
            createdAt: true,
          },
        }),
      ]);

      res.json({
        totalUsers,
        activeUsers,
        inactiveUsers: totalUsers - activeUsers,
        usersByRole,
        usersByDepartment,
        recentUsers,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

/**
 * @swagger
 * /api/users/bulk/deactivate:
 *   post:
 *     summary: Bulk deactivate users
 *     description: Deactivate multiple users at once. CEO only.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userIds
 *             properties:
 *               userIds:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Users deactivated successfully
 */
router.post("/bulk/deactivate", isCEO, async (req, res) => {
  try {
    const { userIds } = req.body;

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ message: "userIds array is required" });
    }

    // Exclude SUPER_ADMIN accounts from bulk operations
    const result = await prisma.user.updateMany({
      where: {
        id: { in: userIds },
        isSuperAdmin: false, // Cannot deactivate Super Admins
      },
      data: { isActive: false },
    });

    return res.json({ message: "Users deactivated", count: result.count });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

export default router;

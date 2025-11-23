import express from "express";
import { authenticate } from "../middleware/auth";
import { hasProjectPermission, requireProjectRole } from "../middleware/rbac";
import { Permission, ProjectRole } from "../types/enums";
import prisma from "../db/prisma";

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /api/projects/{projectId}/members:
 *   get:
 *     summary: Get project members
 *     description: List all members of a project with their roles
 *     tags: [Project Members]
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
 *         description: Project members list
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   userId:
 *                     type: string
 *                   role:
 *                     type: string
 *                     enum: [PROJECT_ADMIN, PROJECT_LEAD, DEVELOPER, REPORTER, VIEWER]
 *                   user:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       name:
 *                         type: string
 *                       email:
 *                         type: string
 *                   addedAt:
 *                     type: string
 *                     format: date-time
 */
router.get(
  "/:projectId/members",
  hasProjectPermission(Permission.BROWSE_PROJECT),
  async (req, res) => {
    try {
      const { projectId } = req.params;

      const members = await prisma.projectMember.findMany({
        where: { projectId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              department: true,
            },
          },
          addedBy: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { addedAt: "asc" },
      });

      return res.json(members);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }
);

/**
 * @swagger
 * /api/projects/{projectId}/members:
 *   post:
 *     summary: Add member to project
 *     description: Add a user to the project with a specific role. Requires PROJECT_ADMIN role.
 *     tags: [Project Members]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
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
 *               - userId
 *               - role
 *             properties:
 *               userId:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [PROJECT_ADMIN, PROJECT_LEAD, DEVELOPER, REPORTER, VIEWER]
 *     responses:
 *       201:
 *         description: Member added successfully
 *       403:
 *         description: Forbidden - PROJECT_ADMIN role required
 */
router.post(
  "/:projectId/members",
  requireProjectRole(ProjectRole.PROJECT_ADMIN),
  async (req, res) => {
    try {
      const { projectId } = req.params;
      const { userId, role } = req.body;

      if (!projectId) {
        return res.status(400).json({ error: "projectId is required" });
      }

      if (!userId || !role) {
        return res.status(400).json({ error: "userId and role are required" });
      }

      // Validate role
      if (!Object.values(ProjectRole).includes(role)) {
        return res.status(400).json({ error: "Invalid role" });
      }

      // Check if user exists
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Check if already a member
      const existing = await prisma.projectMember.findUnique({
        where: {
          projectId_userId: {
            projectId,
            userId,
          },
        },
      });

      if (existing) {
        return res
          .status(409)
          .json({ error: "User is already a project member" });
      }

      const member = await prisma.projectMember.create({
        data: {
          projectId,
          userId,
          role,
          addedById: req.user!.id,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      return res.status(201).json(member);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }
);

/**
 * @swagger
 * /api/projects/{projectId}/members/{memberId}:
 *   put:
 *     summary: Update member role
 *     description: Change a member's role in the project. Requires PROJECT_ADMIN role.
 *     tags: [Project Members]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: memberId
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
 *                 type: string
 *                 enum: [PROJECT_ADMIN, PROJECT_LEAD, DEVELOPER, REPORTER, VIEWER]
 *     responses:
 *       200:
 *         description: Member role updated
 *       403:
 *         description: Forbidden - PROJECT_ADMIN role required
 */
router.put(
  "/:projectId/members/:memberId",
  requireProjectRole(ProjectRole.PROJECT_ADMIN),
  async (req, res) => {
    try {
      const { memberId } = req.params;
      const { role } = req.body;

      if (!role) {
        return res.status(400).json({ error: "role is required" });
      }

      // Validate role
      if (!Object.values(ProjectRole).includes(role)) {
        return res.status(400).json({ error: "Invalid role" });
      }

      const member = await prisma.projectMember.update({
        where: { id: memberId },
        data: { role },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      return res.json(member);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }
);

/**
 * @swagger
 * /api/projects/{projectId}/members/{memberId}:
 *   delete:
 *     summary: Remove member from project
 *     description: Remove a user from the project. Requires PROJECT_ADMIN role.
 *     tags: [Project Members]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: memberId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Member removed successfully
 *       403:
 *         description: Forbidden - PROJECT_ADMIN role required
 */
router.delete(
  "/:projectId/members/:memberId",
  requireProjectRole(ProjectRole.PROJECT_ADMIN),
  async (req, res) => {
    try {
      const { memberId } = req.params;

      await prisma.projectMember.delete({
        where: { id: memberId },
      });

      return res.json({ message: "Member removed successfully" });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }
);

/**
 * @swagger
 * /api/projects/{projectId}/assignable-users:
 *   get:
 *     summary: Get assignable users
 *     description: Get list of users who can be assigned to issues in this project
 *     tags: [Project Members]
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
 *         description: List of assignable users
 */
router.get(
  "/:projectId/assignable-users",
  hasProjectPermission(Permission.BROWSE_PROJECT),
  async (req, res) => {
    try {
      const { projectId } = req.params;

      const members = await prisma.projectMember.findMany({
        where: {
          projectId,
          role: {
            in: [
              ProjectRole.PROJECT_ADMIN,
              ProjectRole.PROJECT_LEAD,
              ProjectRole.DEVELOPER,
            ],
          },
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
        },
      });

      const users = members.map((m: any) => m.user);

      return res.json(users);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }
);

export default router;

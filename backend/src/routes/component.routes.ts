import { Router } from "express";
import { authenticate } from "../middleware/auth";
import { hasProjectPermission } from "../middleware/rbac";
import { Permission } from "../types/enums";
import PermissionService from "../services/PermissionService";
import prisma from "../db/prisma";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Components
 *   description: Project component management
 */

/**
 * @swagger
 * /api/projects/{projectId}/components:
 *   get:
 *     summary: Get all components for a project
 *     tags: [Components]
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
 *         description: List of project components
 */
router.get(
  "/projects/:projectId/components",
  authenticate,
  hasProjectPermission(Permission.BROWSE_PROJECT),
  async (req, res) => {
    try {
      const { projectId } = req.params;

      const components = await prisma.projectComponent.findMany({
        where: { projectId },
        include: {
          _count: {
            select: {
              tasks: true,
            },
          },
        },
        orderBy: { name: "asc" },
      });

      return res.json(components);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }
);

/**
 * @swagger
 * /api/projects/{projectId}/components:
 *   post:
 *     summary: Create a new component
 *     tags: [Components]
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
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               leadId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Component created
 */
router.post(
  "/projects/:projectId/components",
  authenticate,
  hasProjectPermission(Permission.ADMINISTER_PROJECT),
  async (req, res) => {
    try {
      const { projectId } = req.params;
      const { name, description, leadId } = req.body;

      if (!projectId) {
        return res.status(400).json({ error: "projectId is required" });
      }

      if (!name) {
        return res.status(400).json({ error: "name is required" });
      }

      // Check if component with same name exists
      const existing = await prisma.projectComponent.findUnique({
        where: {
          projectId_name: {
            projectId,
            name,
          },
        },
      });

      if (existing) {
        return res
          .status(409)
          .json({ error: "Component with this name already exists" });
      }

      const component = await prisma.projectComponent.create({
        data: {
          projectId,
          name,
          description,
          leadId,
        },
        include: {
          _count: {
            select: {
              tasks: true,
            },
          },
        },
      });

      return res.status(201).json(component);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }
);

/**
 * @swagger
 * /api/components/{id}:
 *   get:
 *     summary: Get component by ID
 *     tags: [Components]
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
 *         description: Component details
 *       404:
 *         description: Component not found
 */
router.get("/components/:id", authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const component = await prisma.projectComponent.findUnique({
      where: { id },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            key: true,
          },
        },
        tasks: {
          select: {
            id: true,
            title: true,
            status: true,
            priority: true,
          },
          take: 10,
        },
        _count: {
          select: {
            tasks: true,
          },
        },
      },
    });

    if (!component) {
      return res.status(404).json({ error: "Component not found" });
    }

    return res.json(component);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/components/{id}:
 *   put:
 *     summary: Update component
 *     tags: [Components]
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
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               leadId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Component updated
 */
router.put("/components/:id", authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, leadId } = req.body;

    // Get component to check project permissions
    const component = await prisma.projectComponent.findUnique({
      where: { id },
      select: { projectId: true },
    });

    if (!component) {
      return res.status(404).json({ error: "Component not found" });
    }

    // Check ADMINISTER_PROJECT permission
    const hasPermission = await PermissionService.hasProjectPermission(
      req.user!.id,
      component.projectId,
      Permission.ADMINISTER_PROJECT
    );

    if (!hasPermission) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }

    const updated = await prisma.projectComponent.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(leadId !== undefined && { leadId }),
      },
      include: {
        _count: {
          select: {
            tasks: true,
          },
        },
      },
    });

    return res.json(updated);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/components/{id}:
 *   delete:
 *     summary: Delete component
 *     tags: [Components]
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
 *         description: Component deleted
 *       400:
 *         description: Component has tasks
 */
router.delete("/components/:id", authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if component has tasks
    const component = await prisma.projectComponent.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            tasks: true,
          },
        },
      },
    });

    if (!component) {
      return res.status(404).json({ error: "Component not found" });
    }

    if (component._count.tasks > 0) {
      return res
        .status(400)
        .json({ error: "Cannot delete component with tasks" });
    }

    // Check ADMINISTER_PROJECT permission
    const hasPermission = await PermissionService.hasProjectPermission(
      req.user!.id,
      component.projectId,
      Permission.ADMINISTER_PROJECT
    );

    if (!hasPermission) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }

    await prisma.projectComponent.delete({
      where: { id },
    });

    return res.json({ message: "Component deleted successfully" });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

export default router;

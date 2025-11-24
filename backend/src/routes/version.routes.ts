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
 *   name: Versions
 *   description: Project version/release management
 */

/**
 * @swagger
 * /api/projects/{projectId}/versions:
 *   get:
 *     summary: Get all versions for a project
 *     tags: [Versions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: includeArchived
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: List of project versions
 */
router.get(
  "/projects/:projectId/versions",
  authenticate,
  hasProjectPermission(Permission.BROWSE_PROJECT),
  async (req, res) => {
    try {
      const { projectId } = req.params;
      const { includeArchived } = req.query;

      const versions = await prisma.projectVersion.findMany({
        where: {
          projectId,
          ...(includeArchived !== "true" && { isArchived: false }),
        },
        include: {
          _count: {
            select: {
              tasks: true,
            },
          },
        },
        orderBy: [{ isReleased: "asc" }, { releaseDate: "desc" }],
      });

      return res.json(versions);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }
);

/**
 * @swagger
 * /api/projects/{projectId}/versions:
 *   post:
 *     summary: Create a new version
 *     tags: [Versions]
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
 *               releaseDate:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: Version created
 */
router.post(
  "/projects/:projectId/versions",
  authenticate,
  hasProjectPermission(Permission.ADMINISTER_PROJECT),
  async (req, res) => {
    try {
      const { projectId } = req.params;
      const { name, description, releaseDate } = req.body;

      if (!projectId) {
        return res.status(400).json({ error: "projectId is required" });
      }

      if (!name) {
        return res.status(400).json({ error: "name is required" });
      }

      // Check if version with same name exists
      const existing = await prisma.projectVersion.findUnique({
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
          .json({ error: "Version with this name already exists" });
      }

      const version = await prisma.projectVersion.create({
        data: {
          projectId,
          name,
          description,
          releaseDate: releaseDate ? new Date(releaseDate) : null,
        },
        include: {
          _count: {
            select: {
              tasks: true,
            },
          },
        },
      });

      return res.status(201).json(version);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }
);

/**
 * @swagger
 * /api/versions/{id}:
 *   get:
 *     summary: Get version by ID
 *     tags: [Versions]
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
 *         description: Version details
 *       404:
 *         description: Version not found
 */
router.get("/versions/:id", authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const version = await prisma.projectVersion.findUnique({
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

    if (!version) {
      return res.status(404).json({ error: "Version not found" });
    }

    return res.json(version);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/versions/{id}:
 *   put:
 *     summary: Update version
 *     tags: [Versions]
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
 *               releaseDate:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: Version updated
 */
router.put("/versions/:id", authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, releaseDate } = req.body;

    // Get version to check project permissions
    const version = await prisma.projectVersion.findUnique({
      where: { id },
      select: { projectId: true },
    });

    if (!version) {
      return res.status(404).json({ error: "Version not found" });
    }

    // Check ADMINISTER_PROJECT permission
    const hasPermission = await PermissionService.hasProjectPermission(
      req.user!.id,
      version.projectId,
      Permission.ADMINISTER_PROJECT
    );

    if (!hasPermission) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }

    const updated = await prisma.projectVersion.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(releaseDate !== undefined && {
          releaseDate: releaseDate ? new Date(releaseDate) : null,
        }),
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
 * /api/versions/{id}/release:
 *   post:
 *     summary: Mark version as released
 *     tags: [Versions]
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
 *         description: Version released
 */
router.post("/versions/:id/release", authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    // Get version to check project permissions
    const version = await prisma.projectVersion.findUnique({
      where: { id },
      select: { projectId: true, isReleased: true },
    });

    if (!version) {
      return res.status(404).json({ error: "Version not found" });
    }

    if (version.isReleased) {
      return res.status(400).json({ error: "Version already released" });
    }

    // Check ADMINISTER_PROJECT permission
    const hasPermission = await PermissionService.hasProjectPermission(
      req.user!.id,
      version.projectId,
      Permission.ADMINISTER_PROJECT
    );

    if (!hasPermission) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }

    const updated = await prisma.projectVersion.update({
      where: { id },
      data: {
        isReleased: true,
        releaseDate: new Date(),
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
 * /api/versions/{id}/archive:
 *   post:
 *     summary: Archive version
 *     tags: [Versions]
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
 *         description: Version archived
 */
router.post("/versions/:id/archive", authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    // Get version to check project permissions
    const version = await prisma.projectVersion.findUnique({
      where: { id },
      select: { projectId: true },
    });

    if (!version) {
      return res.status(404).json({ error: "Version not found" });
    }

    // Check ADMINISTER_PROJECT permission
    const hasPermission = await PermissionService.hasProjectPermission(
      req.user!.id,
      version.projectId,
      Permission.ADMINISTER_PROJECT
    );

    if (!hasPermission) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }

    const updated = await prisma.projectVersion.update({
      where: { id },
      data: {
        isArchived: true,
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
 * /api/versions/{id}/unarchive:
 *   post:
 *     summary: Unarchive version
 *     tags: [Versions]
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
 *         description: Version unarchived
 */
router.post("/versions/:id/unarchive", authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const updated = await prisma.projectVersion.update({
      where: { id },
      data: {
        isArchived: false,
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
 * /api/versions/{id}:
 *   delete:
 *     summary: Delete version
 *     tags: [Versions]
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
 *         description: Version deleted
 *       400:
 *         description: Version has tasks
 */
router.delete("/versions/:id", authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if version has tasks
    const version = await prisma.projectVersion.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            tasks: true,
          },
        },
      },
    });

    if (!version) {
      return res.status(404).json({ error: "Version not found" });
    }

    if (version._count.tasks > 0) {
      return res
        .status(400)
        .json({ error: "Cannot delete version with tasks" });
    }

    // Check ADMINISTER_PROJECT permission
    const hasPermission = await PermissionService.hasProjectPermission(
      req.user!.id,
      version.projectId,
      Permission.ADMINISTER_PROJECT
    );

    if (!hasPermission) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }

    await prisma.projectVersion.delete({
      where: { id },
    });

    return res.json({ message: "Version deleted successfully" });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

export default router;

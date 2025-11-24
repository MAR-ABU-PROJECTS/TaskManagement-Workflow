import { Router } from "express";
import { authenticate } from "../middleware/auth";
import { requireRoles } from "../middleware/rbac";
import { UserRole } from "../types/enums";
import PermissionSchemeService from "../services/PermissionSchemeService";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Permission Schemes
 *   description: Permission scheme management
 */

/**
 * @swagger
 * /api/permission-schemes:
 *   get:
 *     summary: Get all permission schemes
 *     tags: [Permission Schemes]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of permission schemes
 */
router.get("/", authenticate, async (_req, res) => {
  try {
    const schemes = await PermissionSchemeService.getAllPermissionSchemes();
    return res.json(schemes);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/permission-schemes:
 *   post:
 *     summary: Create a new permission scheme
 *     tags: [Permission Schemes]
 *     security:
 *       - bearerAuth: []
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
 *               isDefault:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Permission scheme created
 */
router.post(
  "/",
  authenticate,
  requireRoles(UserRole.ADMIN),
  async (req, res) => {
    try {
      const { name, description, isDefault } = req.body;

      if (!name) {
        return res.status(400).json({ error: "name is required" });
      }

      const scheme = await PermissionSchemeService.createPermissionScheme({
        name,
        description,
        isDefault,
      });

      return res.status(201).json(scheme);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }
);

/**
 * @swagger
 * /api/permission-schemes/{id}:
 *   get:
 *     summary: Get permission scheme by ID
 *     tags: [Permission Schemes]
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
 *         description: Permission scheme details
 *       404:
 *         description: Permission scheme not found
 */
router.get("/:id", authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: "id is required" });
    }

    const scheme = await PermissionSchemeService.getPermissionSchemeById(id);

    if (!scheme) {
      return res.status(404).json({ error: "Permission scheme not found" });
    }

    return res.json(scheme);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/permission-schemes/{id}:
 *   put:
 *     summary: Update permission scheme
 *     tags: [Permission Schemes]
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
 *               isDefault:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Permission scheme updated
 */
router.put(
  "/:id",
  authenticate,
  requireRoles(UserRole.ADMIN),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { name, description, isDefault } = req.body;

      if (!id) {
        return res.status(400).json({ error: "id is required" });
      }

      const scheme = await PermissionSchemeService.updatePermissionScheme(id, {
        name,
        description,
        isDefault,
      });

      return res.json(scheme);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }
);

/**
 * @swagger
 * /api/permission-schemes/{id}:
 *   delete:
 *     summary: Delete permission scheme
 *     tags: [Permission Schemes]
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
 *         description: Permission scheme deleted
 *       400:
 *         description: Scheme is assigned to projects
 */
router.delete(
  "/:id",
  authenticate,
  requireRoles(UserRole.ADMIN),
  async (req, res) => {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({ error: "id is required" });
      }

      await PermissionSchemeService.deletePermissionScheme(id);
      return res.json({ message: "Permission scheme deleted successfully" });
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }
);

/**
 * @swagger
 * /api/permission-schemes/{id}/grants:
 *   post:
 *     summary: Add permission grant to scheme
 *     tags: [Permission Schemes]
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
 *               - permission
 *             properties:
 *               permission:
 *                 type: string
 *               grantedToRole:
 *                 type: string
 *               grantedToUserRole:
 *                 type: string
 *     responses:
 *       201:
 *         description: Grant added
 */
router.post(
  "/:id/grants",
  authenticate,
  requireRoles(UserRole.ADMIN),
  async (req, res) => {
    try {
      const { id: schemeId } = req.params;
      const { permission, grantedToRole, grantedToUserRole } = req.body;

      if (!schemeId) {
        return res.status(400).json({ error: "schemeId is required" });
      }

      if (!permission) {
        return res.status(400).json({ error: "permission is required" });
      }

      const grant = await PermissionSchemeService.addGrant({
        schemeId,
        permission,
        grantedToRole,
        grantedToUserRole,
      });

      return res.status(201).json(grant);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }
);

/**
 * @swagger
 * /api/permission-schemes/{id}/grants:
 *   get:
 *     summary: Get grants for permission scheme
 *     tags: [Permission Schemes]
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
 *         description: List of grants
 */
router.get("/:id/grants", authenticate, async (req, res) => {
  try {
    const { id: schemeId } = req.params;

    if (!schemeId) {
      return res.status(400).json({ error: "schemeId is required" });
    }

    const grants = await PermissionSchemeService.getGrants(schemeId);
    return res.json(grants);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/permission-schemes/{id}/grants/bulk:
 *   put:
 *     summary: Bulk update grants (replace all)
 *     tags: [Permission Schemes]
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
 *               - grants
 *             properties:
 *               grants:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     permission:
 *                       type: string
 *                     grantedToRole:
 *                       type: string
 *                     grantedToUserRole:
 *                       type: string
 *     responses:
 *       200:
 *         description: Grants updated
 */
router.put(
  "/:id/grants/bulk",
  authenticate,
  requireRoles(UserRole.ADMIN),
  async (req, res) => {
    try {
      const { id: schemeId } = req.params;
      const { grants } = req.body;

      if (!schemeId) {
        return res.status(400).json({ error: "schemeId is required" });
      }

      if (!Array.isArray(grants)) {
        return res.status(400).json({ error: "grants must be an array" });
      }

      const updatedGrants = await PermissionSchemeService.bulkUpdateGrants(
        schemeId,
        grants
      );

      return res.json(updatedGrants);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }
);

/**
 * @swagger
 * /api/permission-schemes/grants/{grantId}:
 *   delete:
 *     summary: Remove permission grant
 *     tags: [Permission Schemes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: grantId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Grant removed
 */
router.delete(
  "/grants/:grantId",
  authenticate,
  requireRoles(UserRole.ADMIN),
  async (req, res) => {
    try {
      const { grantId } = req.params;

      if (!grantId) {
        return res.status(400).json({ error: "grantId is required" });
      }

      await PermissionSchemeService.removeGrant(grantId);
      return res.json({ message: "Grant removed successfully" });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }
);

/**
 * @swagger
 * /api/permission-schemes/{id}/assign-project:
 *   post:
 *     summary: Assign permission scheme to project
 *     tags: [Permission Schemes]
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
 *               - projectId
 *             properties:
 *               projectId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Permission scheme assigned to project
 */
router.post(
  "/:id/assign-project",
  authenticate,
  requireRoles(UserRole.ADMIN),
  async (req, res) => {
    try {
      const { id: schemeId } = req.params;
      const { projectId } = req.body;

      if (!schemeId) {
        return res.status(400).json({ error: "schemeId is required" });
      }

      if (!projectId) {
        return res.status(400).json({ error: "projectId is required" });
      }

      const project = await PermissionSchemeService.assignToProject(
        projectId,
        schemeId
      );

      return res.json(project);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }
);

/**
 * @swagger
 * /api/permission-schemes/default/create:
 *   post:
 *     summary: Create default permission scheme
 *     tags: [Permission Schemes]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Default permission scheme created
 */
router.post(
  "/default/create",
  authenticate,
  requireRoles(UserRole.ADMIN),
  async (_req, res) => {
    try {
      const scheme = await PermissionSchemeService.createDefaultScheme();
      return res.status(201).json(scheme);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }
);

export default router;

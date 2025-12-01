import { Router } from "express";
import { authenticate } from "../middleware/auth";
import { requireRoles } from "../middleware/rbac";
import { UserRole } from "../types/enums";
import WorkflowService from "../services/WorkflowService";
import PermissionSchemeService from "../services/PermissionSchemeService";

const router = Router();

// All routes require authentication
router.use(authenticate);

// ==================== WORKFLOWS ====================

/**
 * @swagger
 * /api/config/workflows:
 *   get:
 *     summary: Get all workflow schemes
 *     tags: [Configuration]
 */
router.get("/workflows", async (_req, res) => {
  try {
    const schemes = await WorkflowService.getAllWorkflowSchemes();
    return res.json(schemes);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/config/workflows:
 *   post:
 *     summary: Create a new workflow scheme
 *     tags: [Configuration]
 */
router.post("/workflows", requireRoles(UserRole.ADMIN), async (req, res) => {
  try {
    const { name, description, isDefault } = req.body;

    if (!name) {
      return res.status(400).json({ error: "name is required" });
    }

    const scheme = await WorkflowService.createWorkflowScheme({
      name,
      description,
      isDefault,
    });

    return res.status(201).json(scheme);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/config/workflows/{id}:
 *   get:
 *     summary: Get workflow scheme by ID
 *     tags: [Configuration]
 */
router.get("/workflows/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ error: "Workflow scheme ID is required" });
    }
    const scheme = await WorkflowService.getWorkflowSchemeById(id);

    if (!scheme) {
      return res.status(404).json({ error: "Workflow scheme not found" });
    }

    return res.json(scheme);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/config/workflows/{id}:
 *   patch:
 *     summary: Update workflow scheme
 *     tags: [Configuration]
 */
router.patch(
  "/workflows/:id",
  requireRoles(UserRole.ADMIN),
  async (req, res) => {
    try {
      const { id } = req.params;
      if (!id) {
        return res
          .status(400)
          .json({ error: "Workflow scheme ID is required" });
      }
      const updates = req.body;

      const scheme = await WorkflowService.updateWorkflowScheme(id, updates);
      return res.json(scheme);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }
);

/**
 * @swagger
 * /api/config/workflows/{id}:
 *   delete:
 *     summary: Delete workflow scheme
 *     tags: [Configuration]
 */
router.delete(
  "/workflows/:id",
  requireRoles(UserRole.ADMIN),
  async (req, res) => {
    try {
      const { id } = req.params;
      if (!id) {
        return res
          .status(400)
          .json({ error: "Workflow scheme ID is required" });
      }
      await WorkflowService.deleteWorkflowScheme(id);
      return res.json({ message: "Workflow scheme deleted" });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }
);

// ==================== PERMISSIONS ====================

/**
 * @swagger
 * /api/config/permissions:
 *   get:
 *     summary: Get all permission schemes
 *     tags: [Configuration]
 */
router.get("/permissions", async (_req, res) => {
  try {
    const schemes = await PermissionSchemeService.getAllPermissionSchemes();
    return res.json(schemes);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/config/permissions:
 *   post:
 *     summary: Create a new permission scheme
 *     tags: [Configuration]
 */
router.post("/permissions", requireRoles(UserRole.ADMIN), async (req, res) => {
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
});

/**
 * @swagger
 * /api/config/permissions/{id}:
 *   get:
 *     summary: Get permission scheme by ID
 *     tags: [Configuration]
 */
router.get("/permissions/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res
        .status(400)
        .json({ error: "Permission scheme ID is required" });
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
 * /api/config/permissions/{id}:
 *   patch:
 *     summary: Update permission scheme
 *     tags: [Configuration]
 */
router.patch(
  "/permissions/:id",
  requireRoles(UserRole.ADMIN),
  async (req, res) => {
    try {
      const { id } = req.params;
      if (!id) {
        return res
          .status(400)
          .json({ error: "Permission scheme ID is required" });
      }
      const updates = req.body;

      const scheme = await PermissionSchemeService.updatePermissionScheme(
        id,
        updates
      );
      return res.json(scheme);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }
);

/**
 * @swagger
 * /api/config/permissions/{id}:
 *   delete:
 *     summary: Delete permission scheme
 *     tags: [Configuration]
 */
router.delete(
  "/permissions/:id",
  requireRoles(UserRole.ADMIN),
  async (req, res) => {
    try {
      const { id } = req.params;
      if (!id) {
        return res
          .status(400)
          .json({ error: "Permission scheme ID is required" });
      }
      await PermissionSchemeService.deletePermissionScheme(id);
      return res.json({ message: "Permission scheme deleted" });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }
);

export default router;

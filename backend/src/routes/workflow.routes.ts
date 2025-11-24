import { Router } from "express";
import { authenticate } from "../middleware/auth";
import { requireRoles } from "../middleware/rbac";
import { UserRole } from "../types/enums";
import WorkflowService from "../services/WorkflowService";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Workflows
 *   description: Workflow scheme management
 */

/**
 * @swagger
 * /api/workflows:
 *   get:
 *     summary: Get all workflow schemes
 *     tags: [Workflows]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of workflow schemes
 */
router.get("/", authenticate, async (_req, res) => {
  try {
    const schemes = await WorkflowService.getAllWorkflowSchemes();
    return res.json(schemes);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/workflows:
 *   post:
 *     summary: Create a new workflow scheme
 *     tags: [Workflows]
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
 *         description: Workflow scheme created
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

      const scheme = await WorkflowService.createWorkflowScheme({
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
 * /api/workflows/{id}:
 *   get:
 *     summary: Get workflow scheme by ID
 *     tags: [Workflows]
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
 *         description: Workflow scheme details
 *       404:
 *         description: Workflow scheme not found
 */
router.get("/:id", authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: "id is required" });
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
 * /api/workflows/{id}:
 *   put:
 *     summary: Update workflow scheme
 *     tags: [Workflows]
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
 *         description: Workflow scheme updated
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

      const scheme = await WorkflowService.updateWorkflowScheme(id, {
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
 * /api/workflows/{id}:
 *   delete:
 *     summary: Delete workflow scheme
 *     tags: [Workflows]
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
 *         description: Workflow scheme deleted
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

      await WorkflowService.deleteWorkflowScheme(id);
      return res.json({ message: "Workflow scheme deleted successfully" });
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }
);

/**
 * @swagger
 * /api/workflows/{id}/transitions:
 *   post:
 *     summary: Add transition to workflow scheme
 *     tags: [Workflows]
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
 *               - name
 *               - fromStatus
 *               - toStatus
 *             properties:
 *               name:
 *                 type: string
 *               fromStatus:
 *                 type: string
 *               toStatus:
 *                 type: string
 *               issueType:
 *                 type: string
 *               requiredRole:
 *                 type: string
 *     responses:
 *       201:
 *         description: Transition added
 */
router.post(
  "/:id/transitions",
  authenticate,
  requireRoles(UserRole.ADMIN),
  async (req, res) => {
    try {
      const { id: schemeId } = req.params;
      const { name, fromStatus, toStatus, issueType, requiredRole } = req.body;

      if (!schemeId) {
        return res.status(400).json({ error: "schemeId is required" });
      }

      if (!name || !fromStatus || !toStatus) {
        return res
          .status(400)
          .json({ error: "name, fromStatus, and toStatus are required" });
      }

      const transition = await WorkflowService.addTransition({
        schemeId,
        name,
        fromStatus,
        toStatus,
        issueType,
        requiredRole,
      });

      return res.status(201).json(transition);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }
);

/**
 * @swagger
 * /api/workflows/{id}/transitions:
 *   get:
 *     summary: Get transitions for workflow scheme
 *     tags: [Workflows]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: issueType
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of transitions
 */
router.get("/:id/transitions", authenticate, async (req, res) => {
  try {
    const { id: schemeId } = req.params;
    const { issueType } = req.query;

    if (!schemeId) {
      return res.status(400).json({ error: "schemeId is required" });
    }

    const transitions = await WorkflowService.getTransitions(
      schemeId,
      issueType as any
    );

    return res.json(transitions);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/workflows/transitions/{transitionId}:
 *   delete:
 *     summary: Delete transition
 *     tags: [Workflows]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: transitionId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Transition deleted
 */
router.delete(
  "/transitions/:transitionId",
  authenticate,
  requireRoles(UserRole.ADMIN),
  async (req, res) => {
    try {
      const { transitionId } = req.params;

      if (!transitionId) {
        return res.status(400).json({ error: "transitionId is required" });
      }

      await WorkflowService.deleteTransition(transitionId);
      return res.json({ message: "Transition deleted successfully" });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }
);

/**
 * @swagger
 * /api/workflows/{id}/assign-project:
 *   post:
 *     summary: Assign workflow scheme to project
 *     tags: [Workflows]
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
 *         description: Workflow scheme assigned to project
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

      const project = await WorkflowService.assignToProject(
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
 * /api/workflows/default/create:
 *   post:
 *     summary: Create default workflow scheme
 *     tags: [Workflows]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Default workflow scheme created
 */
router.post(
  "/default/create",
  authenticate,
  requireRoles(UserRole.ADMIN),
  async (_req, res) => {
    try {
      const scheme = await WorkflowService.createDefaultScheme();
      return res.status(201).json(scheme);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }
);

export default router;

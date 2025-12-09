import { Router } from "express";
import { authenticate } from "../middleware/auth";
import { requireRoles } from "../middleware/rbac";
import { UserRole } from "../types/enums";
import WorkflowService from "../services/WorkflowService";

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
 *     description: |
 *       Create a custom workflow scheme for projects.
 *       Workflow schemes define the status transitions tasks can follow.
 *       Requires ADMIN, HOO, HR, CEO, or SUPER_ADMIN role.
 *     tags: [Configuration]
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
 *                 description: Workflow scheme name
 *                 example: "Development Workflow"
 *               description:
 *                 type: string
 *                 description: Workflow description
 *                 example: "Standard development workflow with code review"
 *               isDefault:
 *                 type: boolean
 *                 default: false
 *                 description: Set as default workflow for new projects
 *               statuses:
 *                 type: array
 *                 description: List of workflow statuses
 *                 items:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                       example: "Code Review"
 *                     order:
 *                       type: integer
 *                       example: 3
 *               transitions:
 *                 type: array
 *                 description: Allowed status transitions
 *                 items:
 *                   type: object
 *                   properties:
 *                     from:
 *                       type: string
 *                       example: "In Progress"
 *                     to:
 *                       type: string
 *                       example: "Code Review"
 *     responses:
 *       201:
 *         description: Workflow scheme created successfully
 *       400:
 *         description: Name is required
 *       403:
 *         description: Insufficient permissions (requires ADMIN role)
 *       500:
 *         description: Server error
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
 *     description: |
 *       Update an existing workflow scheme.
 *       Cannot update default system workflows.
 *       Requires ADMIN role.
 *     tags: [Configuration]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Workflow scheme ID
 *     requestBody:
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
 *               statuses:
 *                 type: array
 *                 items:
 *                   type: object
 *               transitions:
 *                 type: array
 *                 items:
 *                   type: object
 *     responses:
 *       200:
 *         description: Workflow scheme updated successfully
 *       400:
 *         description: Invalid workflow scheme ID
 *       403:
 *         description: Insufficient permissions or system workflow
 *       404:
 *         description: Workflow scheme not found
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

export default router;

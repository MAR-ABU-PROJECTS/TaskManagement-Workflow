import express from "express";
import { authenticate } from "../middleware/auth";
import { canCreateProject, hasProjectPermission } from "../middleware/rbac";
import { Permission } from "../types/enums";
import ProjectController from "../controllers/ProjectController";

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /api/projects:
 *   post:
 *     summary: Create a new project
 *     tags: [Projects]
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
 *               - key
 *             properties:
 *               name:
 *                 type: string
 *                 example: Task Management System
 *               key:
 *                 type: string
 *                 description: Project identifier/prefix (e.g., "PROJ", "DEV", "TMS")
 *                 example: TMS
 *               description:
 *                 type: string
 *                 example: A comprehensive task management application
 *               department:
 *                 type: string
 *                 enum: [OPS, HR]
 *                 example: OPS
 *     responses:
 *       201:
 *         description: Project created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 name:
 *                   type: string
 *                 description:
 *                   type: string
 *                 status:
 *                   type: string
 *                 createdBy:
 *                   type: string
 *       400:
 *         description: Invalid input
 *       403:
 *         description: Forbidden - requires CEO, HOO, HR, or ADMIN role
 *   get:
 *     summary: Get all projects (filtered by user role)
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PLANNING, ACTIVE, COMPLETED, ON_HOLD]
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in project name/description
 *     responses:
 *       200:
 *         description: List of projects
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   name:
 *                     type: string
 *                   description:
 *                     type: string
 *                   status:
 *                     type: string
 */
router.post("/", canCreateProject, (req, res) =>
  ProjectController.createProject(req, res)
);

/**
 * @swagger
 * /api/projects:
 *   get:
 *     summary: Get all projects (filtered by user role)
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PLANNING, ACTIVE, COMPLETED, ON_HOLD]
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in project name/description
 *     responses:
 *       200:
 *         description: List of projects
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   name:
 *                     type: string
 *                   description:
 *                     type: string
 *                   status:
 *                     type: string
 */
router.get("/", hasProjectPermission(Permission.BROWSE_PROJECT), (req, res) =>
  ProjectController.getAllProjects(req, res)
);

/**
 * @swagger
 * /api/projects/{id}:
 *   get:
 *     summary: Get project details by ID
 *     tags: [Projects]
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
 *         description: Project details
 *       404:
 *         description: Project not found
 *       403:
 *         description: Forbidden - no access to this project
 *   patch:
 *     summary: Update project details
 *     tags: [Projects]
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
 *               description:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [PLANNING, ACTIVE, COMPLETED, ON_HOLD]
 *               startDate:
 *                 type: string
 *                 format: date
 *               endDate:
 *                 type: string
 *                 format: date
 *     responses:
 *       200:
 *         description: Project updated successfully
 *       403:
 *         description: Forbidden - requires CEO, HOO, HR, or creator role
 *   delete:
 *     summary: Archive a project
 *     tags: [Projects]
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
 *         description: Project archived successfully
 *       403:
 *         description: Forbidden
 */
router.get(
  "/:id",
  hasProjectPermission(Permission.BROWSE_PROJECT),
  (req, res) => ProjectController.getProjectById(req, res)
);

/**
 * @swagger
 * /api/projects/{id}:
 *   patch:
 *     summary: Update project details
 *     tags: [Projects]
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
 *               description:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [PLANNING, ACTIVE, COMPLETED, ON_HOLD]
 *               startDate:
 *                 type: string
 *                 format: date
 *               endDate:
 *                 type: string
 *                 format: date
 *     responses:
 *       200:
 *         description: Project updated successfully
 *       403:
 *         description: Forbidden - requires CEO, HOO, HR, or creator role
 */
router.patch(
  "/:id",
  hasProjectPermission(Permission.EDIT_PROJECT),
  (req, res) => ProjectController.updateProject(req, res)
);

/**
 * @swagger
 * /api/projects/{id}:
 *   delete:
 *     summary: Archive a project
 *     tags: [Projects]
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
 *         description: Project archived successfully
 *       403:
 *         description: Forbidden
 */
router.delete(
  "/:id",
  hasProjectPermission(Permission.ADMINISTER_PROJECT),
  (req, res) => ProjectController.archiveProject(req, res)
);

export default router;

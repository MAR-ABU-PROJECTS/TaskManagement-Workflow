import express from "express";
import { authenticate } from "../middleware/auth";
import { canCreateProject } from "../middleware/rbac";
import ProjectController from "../controllers/ProjectController";

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   POST /api/projects
 * @desc    Create a new project
 * @access  CEO, HOO, HR, ADMIN
 */
router.post("/", canCreateProject, (req, res) =>
  ProjectController.createProject(req, res)
);

/**
 * @route   GET /api/projects
 * @desc    Get all projects (filtered by role)
 * @access  Authenticated users
 */
router.get("/", (req, res) => ProjectController.getAllProjects(req, res));

/**
 * @route   GET /api/projects/:id
 * @desc    Get project by ID
 * @access  Authenticated users with access
 */
router.get("/:id", (req, res) => ProjectController.getProjectById(req, res));

/**
 * @route   PATCH /api/projects/:id
 * @desc    Update project
 * @access  CEO, HOO, HR, or creator
 */
router.patch("/:id", (req, res) => ProjectController.updateProject(req, res));

/**
 * @route   DELETE /api/projects/:id
 * @desc    Archive project
 * @access  CEO, HOO, HR, or creator
 */
router.delete("/:id", (req, res) => ProjectController.archiveProject(req, res));

export default router;

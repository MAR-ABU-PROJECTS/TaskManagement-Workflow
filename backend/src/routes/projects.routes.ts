import express from "express";
import { authenticate } from "../middleware/auth";
import { canCreateProject, hasProjectPermission } from "../middleware/rbac";
import { Permission } from "../types/enums";
import ProjectController from "../controllers/ProjectController";
import SprintController from "../controllers/SprintController";
import EpicController from "../controllers/EpicController";
import BacklogController from "../controllers/BacklogController";
import ReportController from "../controllers/ReportController";
import prisma from "../db/prisma";

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// ==================== PROJECT CRUD ====================

/**
 * @swagger
 * /api/projects:
 *   post:
 *     summary: Create a new project
 *     tags: [Projects]
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
 */
router.get("/", hasProjectPermission(Permission.BROWSE_PROJECT), (req, res) =>
  ProjectController.getAllProjects(req, res)
);

/**
 * @swagger
 * /api/projects/{id}:
 *   get:
 *     summary: Get project by ID
 *     tags: [Projects]
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
 *     summary: Update project
 *     tags: [Projects]
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
 *     summary: Archive project
 *     tags: [Projects]
 */
router.delete(
  "/:id",
  hasProjectPermission(Permission.ADMINISTER_PROJECT),
  (req, res) => ProjectController.archiveProject(req, res)
);

// ==================== PROJECT MEMBERS ====================

/**
 * @swagger
 * /api/projects/{id}/members:
 *   get:
 *     summary: Get project members
 *     tags: [Projects]
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
        },
        orderBy: { addedAt: "desc" },
      });

      return res.json(members);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }
);

/**
 * @swagger
 * /api/projects/{id}/members:
 *   post:
 *     summary: Add member to project
 *     tags: [Projects]
 */
router.post(
  "/:projectId/members",
  hasProjectPermission(Permission.ADMINISTER_PROJECT),
  async (req, res) => {
    try {
      const { projectId } = req.params;
      const { userId, projectRole } = req.body;

      if (!userId || !projectRole) {
        return res
          .status(400)
          .json({ message: "userId and projectRole are required" });
      }

      const member = await prisma.projectMember.create({
        data: {
          project: { connect: { id: projectId } },
          user: { connect: { id: userId } },
          addedBy: { connect: { id: req.user!.id } },
          role: projectRole,
        },
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
        },
      });
      return res.status(201).json({ message: "Member added", member });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }
);

/**
 * @swagger
 * /api/projects/{id}/members/{userId}:
 *   patch:
 *     summary: Update member role
 *     tags: [Projects]
 */
router.patch(
  "/:projectId/members/:userId",
  hasProjectPermission(Permission.ADMINISTER_PROJECT),
  async (req, res) => {
    try {
      const { projectId, userId } = req.params;
      const { projectRole } = req.body;

      const member = await prisma.projectMember.updateMany({
        where: { projectId, userId },
        data: { role: projectRole },
      });

      return res.json({ message: "Member role updated", count: member.count });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }
);

/**
 * @swagger
 * /api/projects/{id}/members/{userId}:
 *   delete:
 *     summary: Remove member from project
 *     tags: [Projects]
 */
router.delete(
  "/:projectId/members/:userId",
  hasProjectPermission(Permission.ADMINISTER_PROJECT),
  async (req, res) => {
    try {
      const { projectId, userId } = req.params;

      await prisma.projectMember.deleteMany({
        where: { projectId, userId },
      });

      return res.json({ message: "Member removed" });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }
);

// ==================== SPRINTS ====================

/**
 * @swagger
 * /api/projects/{id}/sprints:
 *   get:
 *     summary: Get all sprints for a project
 *     tags: [Projects]
 */
router.get(
  "/:projectId/sprints",
  hasProjectPermission(Permission.VIEW_SPRINTS),
  (req, res) => SprintController.getProjectSprints(req, res)
);

/**
 * @swagger
 * /api/projects/{id}/sprints:
 *   post:
 *     summary: Create a new sprint
 *     tags: [Projects]
 */
router.post(
  "/:projectId/sprints",
  hasProjectPermission(Permission.MANAGE_SPRINTS),
  (req, res) => SprintController.createSprint(req, res)
);

/**
 * @swagger
 * /api/projects/{projectId}/sprints/{sprintId}:
 *   get:
 *     summary: Get sprint by ID
 *     tags: [Projects]
 */
router.get(
  "/:projectId/sprints/:sprintId",
  hasProjectPermission(Permission.VIEW_SPRINTS),
  (req, res) => SprintController.getSprintById(req, res)
);

/**
 * @swagger
 * /api/projects/{projectId}/sprints/{sprintId}:
 *   patch:
 *     summary: Update sprint
 *     tags: [Projects]
 */
router.patch(
  "/:projectId/sprints/:sprintId",
  hasProjectPermission(Permission.MANAGE_SPRINTS),
  (req, res) => SprintController.updateSprint(req, res)
);

/**
 * @swagger
 * /api/projects/{projectId}/sprints/{sprintId}/start:
 *   post:
 *     summary: Start a sprint
 *     tags: [Projects]
 */
router.post(
  "/:projectId/sprints/:sprintId/start",
  hasProjectPermission(Permission.MANAGE_SPRINTS),
  (req, res) => SprintController.startSprint(req, res)
);

/**
 * @swagger
 * /api/projects/{projectId}/sprints/{sprintId}/complete:
 *   post:
 *     summary: Complete a sprint
 *     tags: [Projects]
 */
router.post(
  "/:projectId/sprints/:sprintId/complete",
  hasProjectPermission(Permission.MANAGE_SPRINTS),
  (req, res) => SprintController.completeSprint(req, res)
);

// ==================== EPICS ====================

/**
 * @swagger
 * /api/projects/{id}/epics:
 *   get:
 *     summary: Get all epics for a project
 *     tags: [Projects]
 */
router.get(
  "/:projectId/epics",
  hasProjectPermission(Permission.BROWSE_PROJECT),
  (req, res) => EpicController.getProjectEpics(req, res)
);

/**
 * @swagger
 * /api/projects/{id}/epics:
 *   post:
 *     summary: Create a new epic
 *     tags: [Projects]
 */
router.post(
  "/:projectId/epics",
  hasProjectPermission(Permission.CREATE_ISSUES),
  (req, res) => EpicController.createEpic(req, res)
);

/**
 * @swagger
 * /api/projects/{projectId}/epics/{epicId}:
 *   get:
 *     summary: Get epic by ID
 *     tags: [Projects]
 */
router.get(
  "/:projectId/epics/:epicId",
  hasProjectPermission(Permission.BROWSE_PROJECT),
  (req, res) => EpicController.getEpicById(req, res)
);

/**
 * @swagger
 * /api/projects/{projectId}/epics/{epicId}:
 *   patch:
 *     summary: Update epic
 *     tags: [Projects]
 */
router.patch(
  "/:projectId/epics/:epicId",
  hasProjectPermission(Permission.EDIT_ISSUES),
  (req, res) => EpicController.updateEpic(req, res)
);

// ==================== BACKLOG ====================

/**
 * @swagger
 * /api/projects/{id}/backlog:
 *   get:
 *     summary: Get project backlog
 *     tags: [Projects]
 */
router.get(
  "/:projectId/backlog",
  hasProjectPermission(Permission.VIEW_SPRINTS),
  (req, res) => BacklogController.getProjectBacklog(req, res)
);

/**
 * @swagger
 * /api/projects/{id}/backlog/by-epic:
 *   get:
 *     summary: Get backlog grouped by epic
 *     tags: [Projects]
 */
router.get(
  "/:projectId/backlog/by-epic",
  hasProjectPermission(Permission.VIEW_SPRINTS),
  (req, res) => BacklogController.getBacklogByEpic(req, res)
);

// ==================== PROJECT REPORTS ====================

/**
 * @swagger
 * /api/projects/{projectId}/reports/velocity:
 *   get:
 *     summary: Get team velocity report
 *     tags: [Projects, Reports]
 */
router.get(
  "/:projectId/reports/velocity",
  hasProjectPermission(Permission.BROWSE_PROJECT),
  ReportController.getVelocityReport
);

/**
 * @swagger
 * /api/projects/{projectId}/reports/productivity:
 *   get:
 *     summary: Get team productivity metrics
 *     tags: [Projects, Reports]
 */
router.get(
  "/:projectId/reports/productivity",
  hasProjectPermission(Permission.BROWSE_PROJECT),
  ReportController.getTeamProductivity
);

/**
 * @swagger
 * /api/projects/{projectId}/reports/health:
 *   get:
 *     summary: Get project health metrics
 *     tags: [Projects, Reports]
 */
router.get(
  "/:projectId/reports/health",
  hasProjectPermission(Permission.BROWSE_PROJECT),
  ReportController.getProjectHealth
);

/**
 * @swagger
 * /api/projects/{projectId}/reports/cycle-time:
 *   get:
 *     summary: Get cycle time report for tasks
 *     tags: [Projects, Reports]
 */
router.get(
  "/:projectId/reports/cycle-time",
  hasProjectPermission(Permission.BROWSE_PROJECT),
  ReportController.getCycleTimeReport
);

/**
 * @swagger
 * /api/projects/{projectId}/reports/burnup:
 *   get:
 *     summary: Get burnup chart data for project
 *     tags: [Projects, Reports]
 */
router.get(
  "/:projectId/reports/burnup",
  hasProjectPermission(Permission.BROWSE_PROJECT),
  ReportController.getBurnupData
);

export default router;

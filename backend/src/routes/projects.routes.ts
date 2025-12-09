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
 *     description: |
 *       Create a new project in the system. Requires ADMIN, HOO, HR, CEO, or SUPER_ADMIN role.
 *       The creator automatically becomes PROJECT_ADMIN with full project permissions.
 *
 *       **Workflow Types:**
 *       - BASIC: Simple linear workflow (Draft → Assigned → In Progress → Completed)
 *       - AGILE: Scrum/Kanban workflow with backlog and review stages
 *       - BUG_TRACKING: Bug lifecycle with confirmation and testing stages
 *       - CUSTOM: Use custom workflow scheme from database (requires workflowSchemeId)
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
 *                 description: Project name
 *                 example: Website Redesign
 *               key:
 *                 type: string
 *                 description: Unique project key (2-10 uppercase letters, used for task prefixes)
 *                 pattern: '^[A-Z]{2,10}$'
 *                 example: WEB
 *               description:
 *                 type: string
 *                 description: Project description
 *                 example: Complete redesign of company website with modern UI/UX
 *               workflowType:
 *                 type: string
 *                 enum: [BASIC, AGILE, BUG_TRACKING, CUSTOM]
 *                 default: BASIC
 *                 description: Built-in workflow type (defaults to BASIC)
 *                 example: AGILE
 *               workflowSchemeId:
 *                 type: string
 *                 format: uuid
 *                 description: Custom workflow scheme ID (only used when workflowType=CUSTOM)
 *                 example: 550e8400-e29b-41d4-a716-446655440000
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
 *                   format: uuid
 *                 name:
 *                   type: string
 *                 key:
 *                   type: string
 *                 description:
 *                   type: string
 *                 workflowType:
 *                   type: string
 *                   enum: [BASIC, AGILE, BUG_TRACKING, CUSTOM]
 *                 workflowSchemeId:
 *                   type: string
 *                   nullable: true
 *                 isArchived:
 *                   type: boolean
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                 updatedAt:
 *                   type: string
 *                   format: date-time
 *             example:
 *               id: 550e8400-e29b-41d4-a716-446655440000
 *               name: Website Redesign
 *               key: WEB
 *               description: Complete redesign of company website
 *               workflowType: AGILE
 *               workflowSchemeId: null
 *               isArchived: false
 *               createdAt: 2025-12-09T10:30:00.000Z
 *               updatedAt: 2025-12-09T10:30:00.000Z
 *       400:
 *         description: Missing required fields or invalid project key
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *             examples:
 *               missingFields:
 *                 value:
 *                   error: "Missing required fields: name, key"
 *               invalidKey:
 *                 value:
 *                   error: "Project key must be 2-10 uppercase letters"
 *       403:
 *         description: Insufficient permissions to create project
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *             example:
 *               error: "Only ADMIN, HOO, HR, CEO, or SUPER_ADMIN can create projects"
 *       409:
 *         description: Project key already exists
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *             example:
 *               error: "Project key 'WEB' already exists"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
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
 *     description: Update project settings. Requires EDIT_PROJECT permission.
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Project ID
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
 *               workflowId:
 *                 type: string
 *                 format: uuid
 *               permissionSchemeId:
 *                 type: string
 *                 format: uuid
 *               defaultAssigneeId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       200:
 *         description: Project updated successfully
 *       403:
 *         description: Insufficient permissions
 *       404:
 *         description: Project not found
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
 *     description: |
 *       Add a user to the project team with a specific project role.
 *       Requires ADMINISTER_PROJECT permission.
 *
 *       **Project Roles:**
 *       - PROJECT_ADMIN - Full project control
 *       - PROJECT_LEAD - Manage sprints, assign tasks
 *       - DEVELOPER - Create and edit tasks
 *       - REPORTER - Create tasks only
 *       - VIEWER - Read-only access
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Project ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - projectRole
 *             properties:
 *               userId:
 *                 type: string
 *                 format: uuid
 *                 description: User ID to add
 *               projectRole:
 *                 type: string
 *                 enum: [PROJECT_ADMIN, PROJECT_LEAD, DEVELOPER, REPORTER, VIEWER]
 *                 description: Role in this project
 *                 example: DEVELOPER
 *     responses:
 *       201:
 *         description: Member added successfully
 *       400:
 *         description: userId and projectRole are required
 *       403:
 *         description: Insufficient permissions
 *       404:
 *         description: User or project not found
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
 *     description: |
 *       Create a sprint for agile project management.
 *       Sprints are time-boxed iterations (typically 1-4 weeks).
 *       Requires MANAGE_SPRINTS permission.
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Project ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - startDate
 *               - endDate
 *             properties:
 *               name:
 *                 type: string
 *                 description: Sprint name
 *                 example: "Sprint 1"
 *               goal:
 *                 type: string
 *                 description: Sprint goal/objective
 *                 example: "Implement user authentication system"
 *               startDate:
 *                 type: string
 *                 format: date
 *                 description: Sprint start date
 *                 example: "2025-12-10"
 *               endDate:
 *                 type: string
 *                 format: date
 *                 description: Sprint end date
 *                 example: "2025-12-24"
 *               capacityHours:
 *                 type: number
 *                 description: Team capacity in hours
 *                 example: 160
 *     responses:
 *       201:
 *         description: Sprint created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Sprint'
 *       400:
 *         description: Invalid dates or missing required fields
 *       403:
 *         description: Insufficient permissions
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
 *     description: |
 *       Activate a sprint and begin tracking.
 *       Only one sprint can be active per project at a time.
 *       Requires MANAGE_SPRINTS permission.
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: path
 *         name: sprintId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Sprint started successfully
 *       400:
 *         description: Another sprint is already active
 *       403:
 *         description: Insufficient permissions
 *       404:
 *         description: Sprint not found
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
 *     description: |
 *       Mark a sprint as complete.
 *       Incomplete tasks can be moved to backlog or next sprint.
 *       Generates sprint report automatically.
 *       Requires MANAGE_SPRINTS permission.
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: path
 *         name: sprintId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               moveIncompleteTo:
 *                 type: string
 *                 enum: [BACKLOG, NEXT_SPRINT]
 *                 default: BACKLOG
 *                 description: Where to move incomplete tasks
 *     responses:
 *       200:
 *         description: Sprint completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 completedTasks:
 *                   type: integer
 *                 incompleteTasks:
 *                   type: integer
 *       400:
 *         description: Sprint is not active
 *       403:
 *         description: Insufficient permissions
 *       404:
 *         description: Sprint not found
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
 *     description: |
 *       Create an epic to group related tasks into a large feature.
 *       Epics span multiple sprints and track high-level progress.
 *       Requires CREATE_ISSUES permission.
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Project ID
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
 *                 description: Epic name
 *                 example: "User Authentication System"
 *               description:
 *                 type: string
 *                 description: Epic description
 *                 example: "Implement complete authentication with OAuth, JWT, and 2FA"
 *               color:
 *                 type: string
 *                 description: Epic color for visual identification
 *                 example: "#4A90E2"
 *               startDate:
 *                 type: string
 *                 format: date
 *                 description: Epic start date
 *               endDate:
 *                 type: string
 *                 format: date
 *                 description: Epic target completion date
 *     responses:
 *       201:
 *         description: Epic created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Epic'
 *       400:
 *         description: Missing required fields
 *       403:
 *         description: Insufficient permissions
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

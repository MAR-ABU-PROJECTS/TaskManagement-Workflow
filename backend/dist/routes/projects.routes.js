"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const rbac_1 = require("../middleware/rbac");
const enums_1 = require("../types/enums");
const ProjectController_1 = __importDefault(require("../controllers/ProjectController"));
const SprintController_1 = __importDefault(require("../controllers/SprintController"));
const EpicController_1 = __importDefault(require("../controllers/EpicController"));
const BacklogController_1 = __importDefault(require("../controllers/BacklogController"));
const ReportController_1 = __importDefault(require("../controllers/ReportController"));
const prisma_1 = __importDefault(require("../db/prisma"));
const router = express_1.default.Router();
router.use(auth_1.authenticate);
router.post("/", rbac_1.canCreateProject, (req, res) => ProjectController_1.default.createProject(req, res));
router.get("/", (0, rbac_1.hasProjectPermission)(enums_1.Permission.BROWSE_PROJECT), (req, res) => ProjectController_1.default.getAllProjects(req, res));
router.get("/:id", (0, rbac_1.hasProjectPermission)(enums_1.Permission.BROWSE_PROJECT), (req, res) => ProjectController_1.default.getProjectById(req, res));
router.patch("/:id", (0, rbac_1.hasProjectPermission)(enums_1.Permission.EDIT_PROJECT), (req, res) => ProjectController_1.default.updateProject(req, res));
router.delete("/:id", (0, rbac_1.hasProjectPermission)(enums_1.Permission.ADMINISTER_PROJECT), (req, res) => ProjectController_1.default.archiveProject(req, res));
router.get("/:projectId/members", (0, rbac_1.hasProjectPermission)(enums_1.Permission.BROWSE_PROJECT), async (req, res) => {
    try {
        const { projectId } = req.params;
        const members = await prisma_1.default.projectMember.findMany({
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
    }
    catch (error) {
        return res.status(500).json({ error: error.message });
    }
});
router.post("/:projectId/members", (0, rbac_1.hasProjectPermission)(enums_1.Permission.ADMINISTER_PROJECT), async (req, res) => {
    try {
        const { projectId } = req.params;
        const { userId, projectRole } = req.body;
        if (!userId || !projectRole) {
            return res
                .status(400)
                .json({ message: "userId and projectRole are required" });
        }
        const member = await prisma_1.default.projectMember.create({
            data: {
                project: { connect: { id: projectId } },
                user: { connect: { id: userId } },
                addedBy: { connect: { id: req.user.id } },
                role: projectRole,
            },
            include: {
                user: {
                    select: { id: true, name: true, email: true },
                },
            },
        });
        return res.status(201).json({ message: "Member added", member });
    }
    catch (error) {
        return res.status(500).json({ error: error.message });
    }
});
router.patch("/:projectId/members/:userId", (0, rbac_1.hasProjectPermission)(enums_1.Permission.ADMINISTER_PROJECT), async (req, res) => {
    try {
        const { projectId, userId } = req.params;
        const { projectRole } = req.body;
        const member = await prisma_1.default.projectMember.updateMany({
            where: { projectId, userId },
            data: { role: projectRole },
        });
        return res.json({ message: "Member role updated", count: member.count });
    }
    catch (error) {
        return res.status(500).json({ error: error.message });
    }
});
router.delete("/:projectId/members/:userId", (0, rbac_1.hasProjectPermission)(enums_1.Permission.ADMINISTER_PROJECT), async (req, res) => {
    try {
        const { projectId, userId } = req.params;
        await prisma_1.default.projectMember.deleteMany({
            where: { projectId, userId },
        });
        return res.json({ message: "Member removed" });
    }
    catch (error) {
        return res.status(500).json({ error: error.message });
    }
});
router.get("/:projectId/sprints", (0, rbac_1.hasProjectPermission)(enums_1.Permission.VIEW_SPRINTS), (req, res) => SprintController_1.default.getProjectSprints(req, res));
router.post("/:projectId/sprints", (0, rbac_1.hasProjectPermission)(enums_1.Permission.MANAGE_SPRINTS), (req, res) => SprintController_1.default.createSprint(req, res));
router.get("/:projectId/sprints/:sprintId", (0, rbac_1.hasProjectPermission)(enums_1.Permission.VIEW_SPRINTS), (req, res) => SprintController_1.default.getSprintById(req, res));
router.patch("/:projectId/sprints/:sprintId", (0, rbac_1.hasProjectPermission)(enums_1.Permission.MANAGE_SPRINTS), (req, res) => SprintController_1.default.updateSprint(req, res));
router.post("/:projectId/sprints/:sprintId/start", (0, rbac_1.hasProjectPermission)(enums_1.Permission.MANAGE_SPRINTS), (req, res) => SprintController_1.default.startSprint(req, res));
router.post("/:projectId/sprints/:sprintId/complete", (0, rbac_1.hasProjectPermission)(enums_1.Permission.MANAGE_SPRINTS), (req, res) => SprintController_1.default.completeSprint(req, res));
router.get("/:projectId/epics", (0, rbac_1.hasProjectPermission)(enums_1.Permission.BROWSE_PROJECT), (req, res) => EpicController_1.default.getProjectEpics(req, res));
router.post("/:projectId/epics", (0, rbac_1.hasProjectPermission)(enums_1.Permission.CREATE_ISSUES), (req, res) => EpicController_1.default.createEpic(req, res));
router.get("/:projectId/epics/:epicId", (0, rbac_1.hasProjectPermission)(enums_1.Permission.BROWSE_PROJECT), (req, res) => EpicController_1.default.getEpicById(req, res));
router.patch("/:projectId/epics/:epicId", (0, rbac_1.hasProjectPermission)(enums_1.Permission.EDIT_ISSUES), (req, res) => EpicController_1.default.updateEpic(req, res));
router.get("/:projectId/backlog", (0, rbac_1.hasProjectPermission)(enums_1.Permission.VIEW_SPRINTS), (req, res) => BacklogController_1.default.getProjectBacklog(req, res));
router.get("/:projectId/backlog/by-epic", (0, rbac_1.hasProjectPermission)(enums_1.Permission.VIEW_SPRINTS), (req, res) => BacklogController_1.default.getBacklogByEpic(req, res));
router.get("/:projectId/reports/velocity", (0, rbac_1.hasProjectPermission)(enums_1.Permission.BROWSE_PROJECT), ReportController_1.default.getVelocityReport);
router.get("/:projectId/reports/productivity", (0, rbac_1.hasProjectPermission)(enums_1.Permission.BROWSE_PROJECT), ReportController_1.default.getTeamProductivity);
router.get("/:projectId/reports/health", (0, rbac_1.hasProjectPermission)(enums_1.Permission.BROWSE_PROJECT), ReportController_1.default.getProjectHealth);
router.get("/:projectId/reports/cycle-time", (0, rbac_1.hasProjectPermission)(enums_1.Permission.BROWSE_PROJECT), ReportController_1.default.getCycleTimeReport);
router.get("/:projectId/reports/burnup", (0, rbac_1.hasProjectPermission)(enums_1.Permission.BROWSE_PROJECT), ReportController_1.default.getBurnupData);
exports.default = router;

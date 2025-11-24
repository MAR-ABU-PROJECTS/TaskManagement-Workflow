"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const data_1 = require("../data");
const router = express_1.default.Router();
router.get("/", auth_1.authenticate, (_req, res) => {
    res.json(data_1.projects);
});
router.post("/", auth_1.authenticate, (req, res) => {
    const { teamId, name, key, description } = req.body;
    if (!teamId || !name || !key) {
        return res
            .status(400)
            .json({ message: "teamId, name and key are required" });
    }
    const team = data_1.teams.find((t) => t.id === teamId);
    if (!team) {
        return res.status(404).json({ message: "Team not found" });
    }
    const membership = team.members.find((m) => m.userId === req.user.id);
    if (!membership) {
        return res
            .status(403)
            .json({ message: "You are not a member of this team" });
    }
    if (data_1.projects.some((p) => p.teamId === teamId && p.key === key)) {
        return res
            .status(409)
            .json({ message: "Project key already exists in this team" });
    }
    const newProject = {
        id: (0, data_1.generateId)(),
        teamId,
        name,
        key,
        description,
        status: "ACTIVE",
        createdAt: new Date(),
    };
    data_1.projects.push(newProject);
    return res.status(201).json(newProject);
});
router.get("/:id", auth_1.authenticate, (req, res) => {
    const project = data_1.projects.find((p) => p.id === req.params.id);
    if (!project) {
        return res.status(404).json({ message: "Project not found" });
    }
    return res.json(project);
});
router.put("/:id", auth_1.authenticate, (req, res) => {
    const project = data_1.projects.find((p) => p.id === req.params.id);
    if (!project) {
        return res.status(404).json({ message: "Project not found" });
    }
    const team = data_1.teams.find((t) => t.id === project.teamId);
    if (!team) {
        return res.status(404).json({ message: "Team not found" });
    }
    const membership = team.members.find((m) => m.userId === req.user.id);
    if (!membership ||
        (membership.role !== "OWNER" && membership.role !== "ADMIN")) {
        return res.status(403).json({ message: "Forbidden" });
    }
    const { name, description, status } = req.body;
    if (name)
        project.name = name;
    if (description !== undefined)
        project.description = description;
    if (status && (status === "ACTIVE" || status === "ARCHIVED"))
        project.status = status;
    return res.json(project);
});
router.delete("/:id", auth_1.authenticate, (req, res) => {
    const projectIndex = data_1.projects.findIndex((p) => p.id === req.params.id);
    if (projectIndex === -1) {
        return res.status(404).json({ message: "Project not found" });
    }
    const project = data_1.projects[projectIndex];
    if (!project) {
        return res.status(404).json({ message: "Project not found" });
    }
    const team = data_1.teams.find((t) => t.id === project.teamId);
    if (!team) {
        return res.status(404).json({ message: "Team not found" });
    }
    const membership = team.members.find((m) => m.userId === req.user.id);
    if (!membership ||
        (membership.role !== "OWNER" && membership.role !== "ADMIN")) {
        return res.status(403).json({ message: "Forbidden" });
    }
    data_1.projects.splice(projectIndex, 1);
    return res.status(204).send();
});
router.get("/:id/tasks", auth_1.authenticate, (req, res) => {
    const project = data_1.projects.find((p) => p.id === req.params.id);
    if (!project) {
        return res.status(404).json({ message: "Project not found" });
    }
    const projectTasks = data_1.tasks.filter((t) => t.projectId === project.id);
    return res.json(projectTasks);
});
router.get("/:id/board", auth_1.authenticate, (req, res) => {
    const project = data_1.projects.find((p) => p.id === req.params.id);
    if (!project) {
        return res.status(404).json({ message: "Project not found" });
    }
    const projectTasks = data_1.tasks.filter((t) => t.projectId === project.id);
    const board = {};
    for (const t of projectTasks) {
        if (!board[t.status])
            board[t.status] = [];
        board[t.status]?.push(t);
    }
    return res.json(board);
});
exports.default = router;
//# sourceMappingURL=projects.js.map
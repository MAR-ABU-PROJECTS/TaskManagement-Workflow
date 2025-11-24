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
    res.json(data_1.issues);
});
router.post("/", auth_1.authenticate, (req, res) => {
    const { projectId, taskId, title, description, severity } = req.body;
    if (!title || !description || !severity) {
        return res
            .status(400)
            .json({ message: "title, description, severity are required" });
    }
    if (!projectId && !taskId) {
        return res
            .status(400)
            .json({ message: "Either projectId or taskId must be provided" });
    }
    if (taskId) {
        const task = data_1.tasks.find((t) => t.id === taskId);
        if (!task) {
            return res.status(404).json({ message: "Task not found" });
        }
        const project = data_1.projects.find((p) => p.id === task.projectId);
        if (!project) {
            return res.status(404).json({ message: "Project not found" });
        }
        const team = data_1.teams.find((t) => t.id === project.teamId);
        const membership = team?.members.find((m) => m.userId === req.user.id);
        if (!membership) {
            return res
                .status(403)
                .json({ message: "You are not a member of this project team" });
        }
    }
    if (projectId) {
        const project = data_1.projects.find((p) => p.id === projectId);
        if (!project) {
            return res.status(404).json({ message: "Project not found" });
        }
        const team = data_1.teams.find((t) => t.id === project.teamId);
        const membership = team?.members.find((m) => m.userId === req.user.id);
        if (!membership) {
            return res
                .status(403)
                .json({ message: "You are not a member of this project team" });
        }
    }
    const newIssue = {
        id: (0, data_1.generateId)(),
        projectId,
        taskId,
        title,
        description,
        severity,
        status: "OPEN",
        createdAt: new Date(),
    };
    data_1.issues.push(newIssue);
    return res.status(201).json(newIssue);
});
router.get("/:id", auth_1.authenticate, (req, res) => {
    const issue = data_1.issues.find((i) => i.id === req.params.id);
    if (!issue) {
        return res.status(404).json({ message: "Issue not found" });
    }
    return res.json(issue);
});
router.put("/:id", auth_1.authenticate, (req, res) => {
    const issue = data_1.issues.find((i) => i.id === req.params.id);
    if (!issue) {
        return res.status(404).json({ message: "Issue not found" });
    }
    const { title, description, severity, status } = req.body;
    if (title)
        issue.title = title;
    if (description)
        issue.description = description;
    if (severity)
        issue.severity = severity;
    if (status)
        issue.status = status;
    return res.json(issue);
});
router.delete("/:id", auth_1.authenticate, (req, res) => {
    const index = data_1.issues.findIndex((i) => i.id === req.params.id);
    if (index === -1) {
        return res.status(404).json({ message: "Issue not found" });
    }
    data_1.issues.splice(index, 1);
    return res.status(204).send();
});
exports.default = router;
//# sourceMappingURL=issues.js.map
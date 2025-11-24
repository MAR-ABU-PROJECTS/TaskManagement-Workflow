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
    res.json(data_1.tasks);
});
router.post("/", auth_1.authenticate, (req, res) => {
    const { projectId, title, description, priority, assignees } = req.body;
    if (!projectId || !title) {
        return res
            .status(400)
            .json({ message: "projectId and title are required" });
    }
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
    const newTask = {
        id: (0, data_1.generateId)(),
        projectId,
        title,
        description,
        status: "TODO",
        priority: priority || "MEDIUM",
        assignees: Array.isArray(assignees) ? assignees : [],
        createdBy: req.user.id,
        createdAt: new Date(),
    };
    for (const uid of newTask.assignees) {
        if (!data_1.users.find((u) => u.id === uid)) {
            return res
                .status(404)
                .json({ message: `Assignee with id ${uid} not found` });
        }
    }
    data_1.tasks.push(newTask);
    return res.status(201).json(newTask);
});
router.get("/:id", auth_1.authenticate, (req, res) => {
    const task = data_1.tasks.find((t) => t.id === req.params.id);
    if (!task) {
        return res.status(404).json({ message: "Task not found" });
    }
    return res.json(task);
});
router.put("/:id", auth_1.authenticate, (req, res) => {
    const task = data_1.tasks.find((t) => t.id === req.params.id);
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
    const canEdit = task.createdBy === req.user.id || task.assignees.includes(req.user.id);
    if (!canEdit) {
        return res
            .status(403)
            .json({ message: "You are not permitted to edit this task" });
    }
    const { title, description, status, priority, assignees } = req.body;
    if (title)
        task.title = title;
    if (description)
        task.description = description;
    if (status)
        task.status = status;
    if (priority)
        task.priority = priority;
    if (Array.isArray(assignees)) {
        for (const uid of assignees) {
            if (!data_1.users.find((u) => u.id === uid)) {
                return res.status(404).json({ message: `User ${uid} not found` });
            }
        }
        task.assignees = assignees;
    }
    return res.json(task);
});
router.delete("/:id", auth_1.authenticate, (req, res) => {
    const taskIndex = data_1.tasks.findIndex((t) => t.id === req.params.id);
    if (taskIndex === -1) {
        return res.status(404).json({ message: "Task not found" });
    }
    const task = data_1.tasks[taskIndex];
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
    const canDelete = task.createdBy === req.user.id ||
        membership.role === "OWNER" ||
        membership.role === "ADMIN";
    if (!canDelete) {
        return res.status(403).json({ message: "Forbidden" });
    }
    data_1.tasks.splice(taskIndex, 1);
    return res.status(204).send();
});
exports.default = router;
//# sourceMappingURL=tasks.js.map
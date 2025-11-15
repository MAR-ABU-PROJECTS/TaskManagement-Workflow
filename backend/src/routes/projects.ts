import express from "express";
import { authenticate } from "../middleware/auth";
import { teams, projects, tasks, Project, generateId } from "../data";

const router = express.Router();

// List all projects
router.get("/", authenticate, (_req, res) => {
  res.json(projects);
});

// Create a new project
router.post("/", authenticate, (req, res) => {
  const { teamId, name, key, description } = req.body;
  if (!teamId || !name || !key) {
    return res
      .status(400)
      .json({ message: "teamId, name and key are required" });
  }
  const team = teams.find((t) => t.id === teamId);
  if (!team) {
    return res.status(404).json({ message: "Team not found" });
  }
  const membership = team.members.find((m) => m.userId === req.user!.id);
  if (!membership) {
    return res
      .status(403)
      .json({ message: "You are not a member of this team" });
  }
  if (projects.some((p) => p.teamId === teamId && p.key === key)) {
    return res
      .status(409)
      .json({ message: "Project key already exists in this team" });
  }
  const newProject: Project = {
    id: generateId(),
    teamId,
    name,
    key,
    description,
    status: "ACTIVE",
    createdAt: new Date(),
  };
  projects.push(newProject);
  return res.status(201).json(newProject);
});

// Get project by ID
router.get("/:id", authenticate, (req, res) => {
  const project = projects.find((p) => p.id === req.params.id);
  if (!project) {
    return res.status(404).json({ message: "Project not found" });
  }
  return res.json(project);
});

// Update a project
router.put("/:id", authenticate, (req, res) => {
  const project = projects.find((p) => p.id === req.params.id);
  if (!project) {
    return res.status(404).json({ message: "Project not found" });
  }
  const team = teams.find((t) => t.id === project.teamId);
  if (!team) {
    return res.status(404).json({ message: "Team not found" });
  }
  const membership = team.members.find((m) => m.userId === req.user!.id);
  if (
    !membership ||
    (membership.role !== "OWNER" && membership.role !== "ADMIN")
  ) {
    return res.status(403).json({ message: "Forbidden" });
  }
  const { name, description, status } = req.body;
  if (name) project.name = name;
  if (description !== undefined) project.description = description;
  if (status && (status === "ACTIVE" || status === "ARCHIVED"))
    project.status = status;
  return res.json(project);
});

// Delete a project
router.delete("/:id", authenticate, (req, res) => {
  const projectIndex = projects.findIndex((p) => p.id === req.params.id);
  if (projectIndex === -1) {
    return res.status(404).json({ message: "Project not found" });
  }
  const project = projects[projectIndex];
  if (!project) {
    return res.status(404).json({ message: "Project not found" });
  }
  const team = teams.find((t) => t.id === project.teamId);
  if (!team) {
    return res.status(404).json({ message: "Team not found" });
  }
  const membership = team.members.find((m) => m.userId === req.user!.id);
  if (
    !membership ||
    (membership.role !== "OWNER" && membership.role !== "ADMIN")
  ) {
    return res.status(403).json({ message: "Forbidden" });
  }
  projects.splice(projectIndex, 1);
  // Optionally remove related tasks
  return res.status(204).send();
});

// Get tasks of a project
router.get("/:id/tasks", authenticate, (req, res) => {
  const project = projects.find((p) => p.id === req.params.id);
  if (!project) {
    return res.status(404).json({ message: "Project not found" });
  }
  const projectTasks = tasks.filter((t) => t.projectId === project.id);
  return res.json(projectTasks);
});

// Get board view for a project (tasks grouped by status)
router.get("/:id/board", authenticate, (req, res) => {
  const project = projects.find((p) => p.id === req.params.id);
  if (!project) {
    return res.status(404).json({ message: "Project not found" });
  }
  const projectTasks = tasks.filter((t) => t.projectId === project.id);
  const board: { [status: string]: any[] } = {};
  for (const t of projectTasks) {
    if (!board[t.status]) board[t.status] = [];
    board[t.status]?.push(t);
  }
  return res.json(board);
});

export default router;

import express from 'express';
import { authenticate } from '../middleware/auth';
import { tasks, projects, teams, users, Task, generateId } from '../data';

const router = express.Router();

// List all tasks
router.get('/', authenticate, (_req, res) => {
  res.json(tasks);
});

// Create a new task
router.post('/', authenticate, (req, res) => {
  const { projectId, title, description, priority, assignees } = req.body;
  if (!projectId || !title) {
    return res.status(400).json({ message: 'projectId and title are required' });
  }
  const project = projects.find(p => p.id === projectId);
  if (!project) {
    return res.status(404).json({ message: 'Project not found' });
  }
  // Check membership
  const team = teams.find(t => t.id === project.teamId);
  const membership = team?.members.find(m => m.userId === req.user!.id);
  if (!membership) {
    return res.status(403).json({ message: 'You are not a member of this project team' });
  }
  const newTask: Task = {
    id: generateId(),
    projectId,
    title,
    description,
    status: 'TODO',
    priority: priority || 'MEDIUM',
    assignees: Array.isArray(assignees) ? assignees : [],
    createdBy: req.user!.id,
    createdAt: new Date(),
  };
  // Validate assignee IDs
  for (const uid of newTask.assignees) {
    if (!users.find(u => u.id === uid)) {
      return res.status(404).json({ message: `Assignee with id ${uid} not found` });
    }
  }
  tasks.push(newTask);
  return res.status(201).json(newTask);
});

// Get task by ID
router.get('/:id', authenticate, (req, res) => {
  const task = tasks.find(t => t.id === req.params.id);
  if (!task) {
    return res.status(404).json({ message: 'Task not found' });
  }
  return res.json(task);
});

// Update a task
router.put('/:id', authenticate, (req, res) => {
  const task = tasks.find(t => t.id === req.params.id);
  if (!task) {
    return res.status(404).json({ message: 'Task not found' });
  }
  const project = projects.find(p => p.id === task.projectId);
  if (!project) {
    return res.status(404).json({ message: 'Project not found' });
  }
  const team = teams.find(t => t.id === project.teamId);
  const membership = team?.members.find(m => m.userId === req.user!.id);
  if (!membership) {
    return res.status(403).json({ message: 'You are not a member of this project team' });
  }
  // Only allow creator or assigned members to update
  const canEdit = task.createdBy === req.user!.id || task.assignees.includes(req.user!.id);
  if (!canEdit) {
    return res.status(403).json({ message: 'You are not permitted to edit this task' });
  }
  const { title, description, status, priority, assignees } = req.body;
  if (title) task.title = title;
  if (description) task.description = description;
  if (status) task.status = status;
  if (priority) task.priority = priority;
  if (Array.isArray(assignees)) {
    // Validate user IDs
    for (const uid of assignees) {
      if (!users.find(u => u.id === uid)) {
        return res.status(404).json({ message: `User ${uid} not found` });
      }
    }
    task.assignees = assignees;
  }
  return res.json(task);
});

// Delete a task
router.delete('/:id', authenticate, (req, res) => {
  const taskIndex = tasks.findIndex(t => t.id === req.params.id);
  if (taskIndex === -1) {
    return res.status(404).json({ message: 'Task not found' });
  }
  const task = tasks[taskIndex];
  if (!task) {
    return res.status(404).json({ message: 'Task not found' });
  }
  const project = projects.find(p => p.id === task.projectId);
  if (!project) {
    return res.status(404).json({ message: 'Project not found' });
  }
  const team = teams.find(t => t.id === project.teamId);
  const membership = team?.members.find(m => m.userId === req.user!.id);
  if (!membership) {
    return res.status(403).json({ message: 'You are not a member of this project team' });
  }
  // Only creator or project admin/owner can delete
  const canDelete = task.createdBy === req.user!.id || membership.role === 'OWNER' || membership.role === 'ADMIN';
  if (!canDelete) {
    return res.status(403).json({ message: 'Forbidden' });
  }
  tasks.splice(taskIndex, 1);
  return res.status(204).send();
});

export default router;
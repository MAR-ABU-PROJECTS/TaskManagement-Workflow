import express from 'express';
import { authenticate } from '../middleware/auth';
import { issues, tasks, projects, teams, Issue, generateId } from '../data';

const router = express.Router();

// List all issues
router.get('/', authenticate, (_req, res) => {
  res.json(issues);
});

// Create a new issue
router.post('/', authenticate, (req, res) => {
  const { projectId, taskId, title, description, severity } = req.body;
  if (!title || !description || !severity) {
    return res.status(400).json({ message: 'title, description, severity are required' });
  }
  if (!projectId && !taskId) {
    return res.status(400).json({ message: 'Either projectId or taskId must be provided' });
  }
  // Validate project/task membership
  if (taskId) {
    const task = tasks.find(t => t.id === taskId);
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
  }
  if (projectId) {
    const project = projects.find(p => p.id === projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    const team = teams.find(t => t.id === project.teamId);
    const membership = team?.members.find(m => m.userId === req.user!.id);
    if (!membership) {
      return res.status(403).json({ message: 'You are not a member of this project team' });
    }
  }
  const newIssue: Issue = {
    id: generateId(),
    projectId,
    taskId,
    title,
    description,
    severity,
    status: 'OPEN',
    createdAt: new Date(),
  };
  issues.push(newIssue);
  return res.status(201).json(newIssue);
});

// Get issue by ID
router.get('/:id', authenticate, (req, res) => {
  const issue = issues.find(i => i.id === req.params.id);
  if (!issue) {
    return res.status(404).json({ message: 'Issue not found' });
  }
  return res.json(issue);
});

// Update an issue
router.put('/:id', authenticate, (req, res) => {
  const issue = issues.find(i => i.id === req.params.id);
  if (!issue) {
    return res.status(404).json({ message: 'Issue not found' });
  }
  const { title, description, severity, status } = req.body;
  if (title) issue.title = title;
  if (description) issue.description = description;
  if (severity) issue.severity = severity;
  if (status) issue.status = status;
  return res.json(issue);
});

// Delete an issue
router.delete('/:id', authenticate, (req, res) => {
  const index = issues.findIndex(i => i.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ message: 'Issue not found' });
  }
  issues.splice(index, 1);
  return res.status(204).send();
});

export default router;
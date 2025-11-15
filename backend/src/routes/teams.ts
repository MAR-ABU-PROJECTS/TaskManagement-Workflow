import express from 'express';
import { authenticate } from '../middleware/auth';
import { teams, users, Team, TeamMember, generateId } from '../data';

const router = express.Router();

// List all teams
router.get('/', authenticate, (_req, res) => {
  res.json(teams);
});

// Create a new team
router.post('/', authenticate, (req, res) => {
  const { name, description } = req.body;
  if (!name) {
    return res.status(400).json({ message: 'Name is required' });
  }
  const newTeam: Team = {
    id: generateId(),
    name,
    description,
    members: [
      { userId: req.user!.id, role: 'OWNER' }
    ],
    createdAt: new Date(),
  };
  teams.push(newTeam);
  return res.status(201).json(newTeam);
});

// Get a team by ID
router.get('/:id', authenticate, (req, res) => {
  const team = teams.find(t => t.id === req.params.id);
  if (!team) {
    return res.status(404).json({ message: 'Team not found' });
  }
  return res.json(team);
});

// Update a team
router.put('/:id', authenticate, (req, res) => {
  const team = teams.find(t => t.id === req.params.id);
  if (!team) {
    return res.status(404).json({ message: 'Team not found' });
  }
  // Only team owner or admin can update
  const membership = team.members.find(m => m.userId === req.user!.id);
  if (!membership || (membership.role !== 'OWNER' && membership.role !== 'ADMIN')) {
    return res.status(403).json({ message: 'Forbidden' });
  }
  const { name, description } = req.body;
  if (name) team.name = name;
  if (description !== undefined) team.description = description;
  return res.json(team);
});

// Delete a team
router.delete('/:id', authenticate, (req, res) => {
  const teamIndex = teams.findIndex(t => t.id === req.params.id);
  if (teamIndex === -1) {
    return res.status(404).json({ message: 'Team not found' });
  }
  const team = teams[teamIndex];
  if (!team) {
    return res.status(404).json({ message: 'Team not found' });
  }
  const membership = team.members.find(m => m.userId === req.user!.id);
  if (!membership || membership.role !== 'OWNER') {
    return res.status(403).json({ message: 'Only owners can delete teams' });
  }
  teams.splice(teamIndex, 1);
  return res.status(204).send();
});

// Add a member to a team
router.post('/:id/members', authenticate, (req, res) => {
  const team = teams.find(t => t.id === req.params.id);
  if (!team) {
    return res.status(404).json({ message: 'Team not found' });
  }
  const membership = team.members.find(m => m.userId === req.user!.id);
  if (!membership || (membership.role !== 'OWNER' && membership.role !== 'ADMIN')) {
    return res.status(403).json({ message: 'Forbidden' });
  }
  const { userId, role } = req.body;
  const user = users.find(u => u.id === userId);
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }
  if (team.members.some(m => m.userId === userId)) {
    return res.status(409).json({ message: 'User already in team' });
  }
  const newMember: TeamMember = {
    userId,
    role: role || 'MEMBER',
  };
  team.members.push(newMember);
  return res.status(201).json(team);
});

// Remove a member from a team
router.delete('/:id/members/:userId', authenticate, (req, res) => {
  const team = teams.find(t => t.id === req.params.id);
  if (!team) {
    return res.status(404).json({ message: 'Team not found' });
  }
  const membership = team.members.find(m => m.userId === req.user!.id);
  if (!membership || (membership.role !== 'OWNER' && membership.role !== 'ADMIN')) {
    return res.status(403).json({ message: 'Forbidden' });
  }
  const memberIndex = team.members.findIndex(m => m.userId === req.params.userId);
  if (memberIndex === -1) {
    return res.status(404).json({ message: 'Member not found' });
  }
  team.members.splice(memberIndex, 1);
  return res.status(204).send();
});

export default router;
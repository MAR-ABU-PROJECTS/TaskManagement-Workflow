import express from 'express';
import bcrypt from 'bcryptjs';
import { generateId, users, User } from '../data';
import { generateToken } from '../utils/token';

const router = express.Router();

// User registration
router.post('/register', async (req, res) => {
  const { email, password, firstName, lastName } = req.body;
  if (!email || !password || !firstName || !lastName) {
    return res.status(400).json({ message: 'Missing required fields' });
  }
  const existing = users.find(u => u.email === email);
  if (existing) {
    return res.status(409).json({ message: 'Email already exists' });
  }
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);
  const newUser: User = {
    id: generateId(),
    email,
    passwordHash,
    firstName,
    lastName,
    role: 'MEMBER',
    isActive: true,
    createdAt: new Date(),
  };
  users.push(newUser);
  const token = generateToken({ id: newUser.id, role: newUser.role });
  return res.status(201).json({ token, user: { id: newUser.id, email, firstName, lastName, role: newUser.role } });
});

// User login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = users.find(u => u.email === email);
  if (!user) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }
  const token = generateToken({ id: user.id, role: user.role });
  return res.json({ token, user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, role: user.role } });
});

export default router;
import express from "express";
import bcrypt from "bcryptjs";
import prisma from "../db/prisma";
import { generateToken } from "../utils/token";
import { UserRole, Department } from "../types/enums";

const router = express.Router();

// User registration
router.post("/register", async (req, res) => {
  try {
    const { email, password, name, role, department } = req.body;

    if (!email || !password || !name) {
      return res
        .status(400)
        .json({ message: "Missing required fields: email, password, name" });
    }

    // Check if user already exists
    const existing = await prisma.user.findUnique({
      where: { email },
    });

    if (existing) {
      return res.status(409).json({ message: "Email already exists" });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create new user
    const newUser = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name,
        role: role || UserRole.STAFF,
        department: department || null,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        department: true,
      },
    });

    const token = generateToken({ id: newUser.id, role: newUser.role });

    return res.status(201).json({
      token,
      user: newUser,
    });
  } catch (error: any) {
    console.error("Registration error:", error);
    return res
      .status(500)
      .json({ message: "Registration failed", error: error.message });
  }
});

// User login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(403).json({ message: "Account is deactivated" });
    }

    // Verify password
    const valid = await bcrypt.compare(password, user.passwordHash);

    if (!valid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = generateToken({ id: user.id, role: user.role });

    return res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        department: user.department,
      },
    });
  } catch (error: any) {
    console.error("Login error:", error);
    return res
      .status(500)
      .json({ message: "Login failed", error: error.message });
  }
});

export default router;

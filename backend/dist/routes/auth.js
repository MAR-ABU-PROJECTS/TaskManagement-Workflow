"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma_1 = __importDefault(require("../db/prisma"));
const token_1 = require("../utils/token");
const enums_1 = require("../types/enums");
const router = express_1.default.Router();
router.post("/register", async (req, res) => {
    try {
        const { email, password, name, role, department } = req.body;
        if (!email || !password || !name) {
            return res
                .status(400)
                .json({ message: "Missing required fields: email, password, name" });
        }
        const existing = await prisma_1.default.user.findUnique({
            where: { email },
        });
        if (existing) {
            return res.status(409).json({ message: "Email already exists" });
        }
        const salt = await bcryptjs_1.default.genSalt(10);
        const passwordHash = await bcryptjs_1.default.hash(password, salt);
        const newUser = await prisma_1.default.user.create({
            data: {
                email,
                passwordHash,
                name,
                role: role || enums_1.UserRole.STAFF,
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
        const token = (0, token_1.generateToken)({ id: newUser.id, role: newUser.role });
        return res.status(201).json({
            token,
            user: newUser,
        });
    }
    catch (error) {
        console.error("Registration error:", error);
        return res
            .status(500)
            .json({ message: "Registration failed", error: error.message });
    }
});
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res
                .status(400)
                .json({ message: "Email and password are required" });
        }
        const user = await prisma_1.default.user.findUnique({
            where: { email },
        });
        if (!user) {
            return res.status(401).json({ message: "Invalid credentials" });
        }
        if (!user.isActive) {
            return res.status(403).json({ message: "Account is deactivated" });
        }
        const valid = await bcryptjs_1.default.compare(password, user.passwordHash);
        if (!valid) {
            return res.status(401).json({ message: "Invalid credentials" });
        }
        const token = (0, token_1.generateToken)({ id: user.id, role: user.role });
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
    }
    catch (error) {
        console.error("Login error:", error);
        return res
            .status(500)
            .json({ message: "Login failed", error: error.message });
    }
});
exports.default = router;

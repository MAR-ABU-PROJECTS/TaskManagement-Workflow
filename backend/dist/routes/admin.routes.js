"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const rbac_1 = require("../middleware/rbac");
const enums_1 = require("../types/enums");
const prisma_1 = __importDefault(require("../db/prisma"));
const router = express_1.default.Router();
router.use(auth_1.authenticate);
router.use((0, rbac_1.requireRoles)(enums_1.UserRole.CEO, enums_1.UserRole.HOO, enums_1.UserRole.HR, enums_1.UserRole.ADMIN));
router.get("/projects/overview", async (_req, res) => {
    try {
        const totalProjects = await prisma_1.default.project.count();
        const projectsByStatus = await prisma_1.default.project.groupBy({
            by: ["status"],
            _count: true,
        });
        const recentActivity = await prisma_1.default.taskActivityLog.findMany({
            take: 10,
            orderBy: { timestamp: "desc" },
            include: {
                user: {
                    select: { id: true, name: true, email: true },
                },
                task: {
                    select: {
                        id: true,
                        title: true,
                        project: { select: { id: true, name: true } },
                    },
                },
            },
        });
        res.json({
            totalProjects,
            projectsByStatus,
            recentActivity,
        });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
router.get("/tasks/pending-approval", async (_req, res) => {
    try {
        const pendingTasks = await prisma_1.default.task.findMany({
            where: {
                OR: [
                    { status: "PENDING" },
                    { status: "PENDING_APPROVAL" },
                    { status: "PENDING_APPROVAL" },
                ],
            },
            include: {
                project: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                assignee: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                creator: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
            orderBy: { createdAt: "desc" },
        });
        res.json(pendingTasks);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
router.get("/system/settings", async (_req, res) => {
    try {
        const settings = {
            maxFileUploadSize: process.env.MAX_FILE_SIZE || "10MB",
            allowedFileTypes: [
                "pdf",
                "doc",
                "docx",
                "xls",
                "xlsx",
                "jpg",
                "png",
                "gif",
            ],
            sessionTimeout: process.env.SESSION_TIMEOUT || "24h",
            emailNotifications: process.env.EMAIL_NOTIFICATIONS_ENABLED === "true",
            twoFactorAuth: process.env.TWO_FACTOR_AUTH_ENABLED === "true",
            passwordMinLength: parseInt(process.env.PASSWORD_MIN_LENGTH || "8"),
        };
        res.json(settings);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
router.put("/system/settings", async (req, res) => {
    try {
        const { maxFileUploadSize, sessionTimeout, emailNotifications, twoFactorAuth, } = req.body;
        const updatedSettings = {
            maxFileUploadSize: maxFileUploadSize || "10MB",
            sessionTimeout: sessionTimeout || "24h",
            emailNotifications: emailNotifications ?? true,
            twoFactorAuth: twoFactorAuth ?? false,
            updatedAt: new Date().toISOString(),
        };
        res.json({
            message: "Settings updated successfully",
            settings: updatedSettings,
        });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
exports.default = router;

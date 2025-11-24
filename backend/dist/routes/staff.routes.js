"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const prisma_1 = __importDefault(require("../db/prisma"));
const router = express_1.default.Router();
router.use(auth_1.authenticate);
router.get("/my-tasks", async (req, res) => {
    try {
        const userId = req.user?.id;
        const { status, priority } = req.query;
        const tasks = await prisma_1.default.task.findMany({
            where: {
                assigneeId: userId,
                ...(status && { status: status }),
                ...(priority && { priority: priority }),
            },
            include: {
                project: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
            orderBy: [{ priority: "desc" }, { dueDate: "asc" }],
        });
        res.json(tasks);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
router.get("/my-workload", async (req, res) => {
    try {
        const userId = req.user?.id;
        const totalTasks = await prisma_1.default.task.count({
            where: { assigneeId: userId },
        });
        const inProgress = await prisma_1.default.task.count({
            where: {
                assigneeId: userId,
                status: "IN_PROGRESS",
            },
        });
        const completed = await prisma_1.default.task.count({
            where: {
                assigneeId: userId,
                status: "COMPLETED",
            },
        });
        const tasksWithPoints = await prisma_1.default.task.findMany({
            where: { assigneeId: userId },
            select: { storyPoints: true },
        });
        const totalStoryPoints = tasksWithPoints.reduce((sum, task) => sum + (task.storyPoints || 0), 0);
        res.json({
            totalTasks,
            inProgress,
            completed,
            totalStoryPoints,
            hoursLogged: 0,
        });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
router.get("/my-notifications", async (req, res) => {
    try {
        const userId = req.user?.id;
        const { unread } = req.query;
        const notifications = await prisma_1.default.notification.findMany({
            where: {
                userId,
                ...(unread === "true" && { isRead: false }),
            },
            orderBy: { createdAt: "desc" },
            take: 50,
        });
        res.json(notifications);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
router.get("/my-profile", async (req, res) => {
    try {
        const userId = req.user?.id;
        const user = await prisma_1.default.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                department: true,
                isActive: true,
                createdAt: true,
            },
        });
        res.json(user);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
router.put("/my-profile", async (req, res) => {
    try {
        const userId = req.user?.id;
        const { name } = req.body;
        const user = await prisma_1.default.user.update({
            where: { id: userId },
            data: { name },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                department: true,
            },
        });
        res.json(user);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
exports.default = router;

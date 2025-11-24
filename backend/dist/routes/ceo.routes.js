"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const rbac_1 = require("../middleware/rbac");
const prisma_1 = __importDefault(require("../db/prisma"));
const router = express_1.default.Router();
router.use(auth_1.authenticate);
router.use(rbac_1.isCEO);
router.get("/dashboard", async (_req, res) => {
    try {
        const [totalProjects, totalTasks, completedTasks, totalUsers] = await Promise.all([
            prisma_1.default.project.count(),
            prisma_1.default.task.count(),
            prisma_1.default.task.count({ where: { status: "COMPLETED" } }),
            prisma_1.default.user.count({ where: { role: { in: ["STAFF"] } } }),
        ]);
        const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
        const teamUtilization = totalUsers > 0 ? totalTasks / totalUsers : 0;
        const stats = {
            totalProjects,
            activeProjects: totalProjects,
            totalTasks,
            completionRate: parseFloat(completionRate.toFixed(2)),
            teamUtilization: parseFloat(teamUtilization.toFixed(2)),
        };
        res.json(stats);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
router.post("/projects/archive-all", async (req, res) => {
    try {
        const { projectIds } = req.body;
        res.json({ message: "Projects archived", count: projectIds?.length || 0 });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
router.get("/analytics/organization", async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const dateFilter = {};
        if (startDate)
            dateFilter.gte = new Date(startDate);
        if (endDate)
            dateFilter.lte = new Date(endDate);
        const [projectsByStatus, tasksByStatus, usersByRole, tasksOverTime] = await Promise.all([
            prisma_1.default.project.groupBy({
                by: ["status"],
                _count: true,
            }),
            prisma_1.default.task.groupBy({
                by: ["status"],
                _count: true,
            }),
            prisma_1.default.user.groupBy({
                by: ["role"],
                _count: true,
            }),
            prisma_1.default.task.findMany({
                where: Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : {},
                select: { createdAt: true, status: true },
                orderBy: { createdAt: "desc" },
                take: 100,
            }),
        ]);
        res.json({
            analytics: {
                projectsByStatus,
                tasksByStatus,
                usersByRole,
                tasksOverTime,
                dateRange: { startDate, endDate },
            },
        });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
exports.default = router;

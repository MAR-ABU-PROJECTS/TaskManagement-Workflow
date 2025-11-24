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
router.use((0, rbac_1.requireRoles)(enums_1.UserRole.CEO, enums_1.UserRole.HOO, enums_1.UserRole.HR));
router.get("/users", async (req, res) => {
    try {
        const { department, role, isActive } = req.query;
        const users = await prisma_1.default.user.findMany({
            where: {
                ...(department && { department: department }),
                ...(role && { role: role }),
                ...(isActive !== undefined && { isActive: isActive === "true" }),
            },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                department: true,
                isActive: true,
                createdAt: true,
            },
            orderBy: { createdAt: "desc" },
        });
        res.json(users);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
router.post("/users/:userId/deactivate", async (req, res) => {
    try {
        const { userId } = req.params;
        const user = await prisma_1.default.user.update({
            where: { id: userId },
            data: { isActive: false },
            select: {
                id: true,
                email: true,
                name: true,
                isActive: true,
            },
        });
        res.json({ message: "User deactivated", user });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
router.post("/users/:userId/activate", async (req, res) => {
    try {
        const { userId } = req.params;
        const user = await prisma_1.default.user.update({
            where: { id: userId },
            data: { isActive: true },
            select: {
                id: true,
                email: true,
                name: true,
                isActive: true,
            },
        });
        res.json({ message: "User activated", user });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
router.put("/users/:userId/change-role", async (req, res) => {
    try {
        const { userId } = req.params;
        const { role } = req.body;
        if (!Object.values(enums_1.UserRole).includes(role)) {
            return res.status(400).json({ error: "Invalid role" });
        }
        const user = await prisma_1.default.user.update({
            where: { id: userId },
            data: { role },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
            },
        });
        return res.json({ message: "Role updated", user });
    }
    catch (error) {
        return res.status(500).json({ error: error.message });
    }
});
router.put("/users/:userId/change-department", async (req, res) => {
    try {
        const { userId } = req.params;
        const { department } = req.body;
        const user = await prisma_1.default.user.update({
            where: { id: userId },
            data: { department },
            select: {
                id: true,
                email: true,
                name: true,
                department: true,
            },
        });
        res.json({ message: "Department updated", user });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
router.get("/analytics/team-performance", async (req, res) => {
    try {
        const { startDate, endDate, department } = req.query;
        const dateFilter = {};
        if (startDate)
            dateFilter.gte = new Date(startDate);
        if (endDate)
            dateFilter.lte = new Date(endDate);
        const departmentFilter = department ? { department: department } : {};
        const [totalUsers, activeUsers, tasksByUser, completedTasksByUser] = await Promise.all([
            prisma_1.default.user.count({ where: { role: "STAFF", ...departmentFilter } }),
            prisma_1.default.user.count({
                where: {
                    role: "STAFF",
                    ...departmentFilter,
                    assignedTasks: { some: {} }
                }
            }),
            prisma_1.default.task.groupBy({
                by: ["assigneeId"],
                _count: true,
                where: Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : {},
            }),
            prisma_1.default.task.groupBy({
                by: ["assigneeId"],
                _count: true,
                where: {
                    status: "COMPLETED",
                    ...(Object.keys(dateFilter).length > 0 ? { updatedAt: dateFilter } : {}),
                },
            }),
        ]);
        const avgTasksPerUser = totalUsers > 0 ? tasksByUser.reduce((sum, t) => sum + t._count, 0) / totalUsers : 0;
        const avgCompletedPerUser = totalUsers > 0 ? completedTasksByUser.reduce((sum, t) => sum + t._count, 0) / totalUsers : 0;
        res.json({
            analytics: {
                totalUsers,
                activeUsers,
                utilization: totalUsers > 0 ? (activeUsers / totalUsers) * 100 : 0,
                avgTasksPerUser: parseFloat(avgTasksPerUser.toFixed(2)),
                avgCompletedTasksPerUser: parseFloat(avgCompletedPerUser.toFixed(2)),
                taskDistribution: tasksByUser,
                completionDistribution: completedTasksByUser,
                dateRange: { startDate, endDate },
                department,
            },
        });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
exports.default = router;

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
const UserHierarchyController_1 = __importDefault(require("../controllers/UserHierarchyController"));
const router = express_1.default.Router();
router.use(auth_1.authenticate);
router.get("/me", async (req, res) => {
    try {
        const user = await prisma_1.default.user.findUnique({
            where: { id: req.user.id },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                department: true,
                isActive: true,
                isSuperAdmin: true,
                createdAt: true,
                updatedAt: true,
            },
        });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        return res.json(user);
    }
    catch (error) {
        return res.status(500).json({ error: error.message });
    }
});
router.patch("/me", async (req, res) => {
    try {
        const { name, email } = req.body;
        const updateData = {};
        if (name)
            updateData.name = name;
        if (email)
            updateData.email = email;
        const user = await prisma_1.default.user.update({
            where: { id: req.user.id },
            data: updateData,
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                department: true,
                isActive: true,
            },
        });
        res.json({ message: "Profile updated", user });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
router.get("/", async (req, res) => {
    try {
        const { department, role, isActive, search } = req.query;
        const userRole = req.user.role;
        const where = {
            isSuperAdmin: false,
            ...(department && { department: department }),
            ...(role && { role: role }),
            ...(isActive !== undefined && { isActive: isActive === "true" }),
        };
        if (search) {
            where.OR = [
                { name: { contains: search, mode: "insensitive" } },
                { email: { contains: search, mode: "insensitive" } },
            ];
        }
        const isAdmin = [
            enums_1.UserRole.CEO,
            enums_1.UserRole.HOO,
            enums_1.UserRole.HR,
            enums_1.UserRole.ADMIN,
        ].includes(userRole);
        const select = isAdmin
            ? {
                id: true,
                email: true,
                name: true,
                role: true,
                department: true,
                isActive: true,
                isSuperAdmin: true,
                createdAt: true,
                updatedAt: true,
                promotedAt: true,
                promotedBy: {
                    select: { id: true, name: true, email: true },
                },
            }
            : {
                id: true,
                name: true,
                role: true,
                department: true,
            };
        const users = await prisma_1.default.user.findMany({
            where,
            select,
            orderBy: { createdAt: "desc" },
        });
        res.json({ users, count: users.length });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
router.get("/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const userRole = req.user.role;
        const isAdmin = [
            enums_1.UserRole.CEO,
            enums_1.UserRole.HOO,
            enums_1.UserRole.HR,
            enums_1.UserRole.ADMIN,
        ].includes(userRole);
        const select = isAdmin
            ? {
                id: true,
                email: true,
                name: true,
                role: true,
                department: true,
                isActive: true,
                isSuperAdmin: true,
                createdAt: true,
                updatedAt: true,
                promotedAt: true,
                promotedBy: {
                    select: { id: true, name: true, email: true, role: true },
                },
            }
            : {
                id: true,
                name: true,
                role: true,
                department: true,
            };
        const user = await prisma_1.default.user.findUnique({
            where: { id },
            select,
        });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        return res.json(user);
    }
    catch (error) {
        return res.status(500).json({ error: error.message });
    }
});
router.patch("/:id", (0, rbac_1.requireRoles)(enums_1.UserRole.CEO, enums_1.UserRole.HOO, enums_1.UserRole.HR, enums_1.UserRole.ADMIN), async (req, res) => {
    try {
        const { id } = req.params;
        const { name, email, department } = req.body;
        const updateData = {};
        if (name)
            updateData.name = name;
        if (email)
            updateData.email = email;
        if (department !== undefined)
            updateData.department = department || null;
        const user = await prisma_1.default.user.update({
            where: { id },
            data: updateData,
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                department: true,
                isActive: true,
            },
        });
        return res.json({ message: "User updated", user });
    }
    catch (error) {
        return res.status(500).json({ error: error.message });
    }
});
router.delete("/:id", (0, rbac_1.requireRoles)(enums_1.UserRole.CEO, enums_1.UserRole.HOO, enums_1.UserRole.HR), async (req, res) => {
    try {
        const { id } = req.params;
        const targetUser = await prisma_1.default.user.findUnique({
            where: { id },
            select: { isSuperAdmin: true },
        });
        if (targetUser?.isSuperAdmin) {
            return res.status(403).json({
                message: "Super Admin accounts cannot be deleted",
            });
        }
        await prisma_1.default.user.delete({ where: { id } });
        return res.json({ message: "User deleted successfully" });
    }
    catch (error) {
        return res.status(500).json({ error: error.message });
    }
});
router.post("/:userId/promote", (req, res) => UserHierarchyController_1.default.promoteUser(req, res));
router.post("/:userId/demote", (req, res) => UserHierarchyController_1.default.demoteUser(req, res));
router.post("/:id/deactivate", (0, rbac_1.requireRoles)(enums_1.UserRole.CEO, enums_1.UserRole.HOO, enums_1.UserRole.HR), async (req, res) => {
    try {
        const { id } = req.params;
        const targetUser = await prisma_1.default.user.findUnique({
            where: { id },
            select: { isSuperAdmin: true },
        });
        if (targetUser?.isSuperAdmin) {
            return res.status(403).json({
                message: "Super Admin accounts cannot be deactivated",
            });
        }
        const user = await prisma_1.default.user.update({
            where: { id },
            data: { isActive: false },
            select: {
                id: true,
                email: true,
                name: true,
                isActive: true,
            },
        });
        return res.json({ message: "User deactivated", user });
    }
    catch (error) {
        return res.status(500).json({ error: error.message });
    }
});
router.post("/:id/activate", (0, rbac_1.requireRoles)(enums_1.UserRole.CEO, enums_1.UserRole.HOO, enums_1.UserRole.HR), async (req, res) => {
    try {
        const { id } = req.params;
        const targetUser = await prisma_1.default.user.findUnique({
            where: { id },
            select: { isSuperAdmin: true },
        });
        if (targetUser?.isSuperAdmin) {
            return res.status(403).json({
                message: "Super Admin accounts cannot be modified",
            });
        }
        const user = await prisma_1.default.user.update({
            where: { id },
            data: { isActive: true },
            select: {
                id: true,
                email: true,
                name: true,
                isActive: true,
            },
        });
        return res.json({ message: "User activated", user });
    }
    catch (error) {
        return res.status(500).json({ error: error.message });
    }
});
router.patch("/:id/change-department", (0, rbac_1.requireRoles)(enums_1.UserRole.CEO, enums_1.UserRole.HOO, enums_1.UserRole.HR), async (req, res) => {
    try {
        const { id } = req.params;
        const { department } = req.body;
        const targetUser = await prisma_1.default.user.findUnique({
            where: { id },
            select: { isSuperAdmin: true },
        });
        if (targetUser?.isSuperAdmin) {
            return res.status(403).json({
                message: "Super Admin accounts cannot be modified",
            });
        }
        const user = await prisma_1.default.user.update({
            where: { id },
            data: { department: department || null },
            select: {
                id: true,
                email: true,
                name: true,
                department: true,
            },
        });
        return res.json({ message: "Department updated", user });
    }
    catch (error) {
        return res.status(500).json({ error: error.message });
    }
});
router.get("/dashboard/overview", (0, rbac_1.requireRoles)(enums_1.UserRole.CEO, enums_1.UserRole.HOO, enums_1.UserRole.HR, enums_1.UserRole.ADMIN), async (_req, res) => {
    try {
        const [totalUsers, activeUsers, usersByRole, usersByDepartment, recentUsers,] = await Promise.all([
            prisma_1.default.user.count({ where: { isSuperAdmin: false } }),
            prisma_1.default.user.count({ where: { isActive: true, isSuperAdmin: false } }),
            prisma_1.default.user.groupBy({
                by: ["role"],
                where: { isSuperAdmin: false },
                _count: true,
            }),
            prisma_1.default.user.groupBy({
                by: ["department"],
                where: { isSuperAdmin: false },
                _count: true,
            }),
            prisma_1.default.user.findMany({
                where: { isSuperAdmin: false },
                take: 10,
                orderBy: { createdAt: "desc" },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                    department: true,
                    createdAt: true,
                },
            }),
        ]);
        res.json({
            totalUsers,
            activeUsers,
            inactiveUsers: totalUsers - activeUsers,
            usersByRole,
            usersByDepartment,
            recentUsers,
        });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
router.post("/bulk/deactivate", rbac_1.isCEO, async (req, res) => {
    try {
        const { userIds } = req.body;
        if (!Array.isArray(userIds) || userIds.length === 0) {
            return res.status(400).json({ message: "userIds array is required" });
        }
        const result = await prisma_1.default.user.updateMany({
            where: {
                id: { in: userIds },
                isSuperAdmin: false,
            },
            data: { isActive: false },
        });
        return res.json({ message: "Users deactivated", count: result.count });
    }
    catch (error) {
        return res.status(500).json({ error: error.message });
    }
});
exports.default = router;

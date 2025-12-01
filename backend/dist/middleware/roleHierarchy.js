"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.hasDepartmentAuthority = exports.hasRoleAuthority = exports.protectSuperAdmin = exports.canManageUsers = exports.requireSuperAdmin = void 0;
const prisma_1 = __importDefault(require("../db/prisma"));
const enums_1 = require("../types/enums");
const requireSuperAdmin = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }
        const user = await prisma_1.default.user.findUnique({
            where: { id: userId },
            select: { isSuperAdmin: true, role: true },
        });
        if (!user || !user.isSuperAdmin) {
            res.status(403).json({
                message: "Access denied. Super Admin privileges required.",
            });
            return;
        }
        next();
    }
    catch (error) {
        console.error("Super Admin verification error:", error);
        res.status(500).json({
            message: "Failed to verify Super Admin status",
            error: error.message,
        });
    }
};
exports.requireSuperAdmin = requireSuperAdmin;
const canManageUsers = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }
        const user = await prisma_1.default.user.findUnique({
            where: { id: userId },
            select: { isSuperAdmin: true, role: true },
        });
        if (!user) {
            res.status(401).json({ message: "User not found" });
            return;
        }
        const allowedRoles = [enums_1.UserRole.CEO, enums_1.UserRole.HOO, enums_1.UserRole.HR];
        if (!user.isSuperAdmin && !allowedRoles.includes(user.role)) {
            res.status(403).json({
                message: "Access denied. User management privileges required.",
            });
            return;
        }
        next();
    }
    catch (error) {
        console.error("User management verification error:", error);
        res.status(500).json({
            message: "Failed to verify user management permissions",
            error: error.message,
        });
    }
};
exports.canManageUsers = canManageUsers;
const protectSuperAdmin = async (req, res, next) => {
    try {
        const { userId } = req.params;
        if (!userId) {
            return next();
        }
        const targetUser = await prisma_1.default.user.findUnique({
            where: { id: userId },
            select: { isSuperAdmin: true, name: true },
        });
        if (!targetUser) {
            return res.status(404).json({ message: "User not found" });
        }
        if (targetUser.isSuperAdmin) {
            const requester = await prisma_1.default.user.findUnique({
                where: { id: req.user?.id },
                select: { isSuperAdmin: true },
            });
            if (!requester?.isSuperAdmin) {
                return res.status(403).json({
                    message: "Super Admin accounts are protected and cannot be modified.",
                });
            }
        }
        next();
    }
    catch (error) {
        console.error("Super Admin protection error:", error);
        return res.status(500).json({
            message: "Failed to verify Super Admin protection",
            error: error.message,
        });
    }
};
exports.protectSuperAdmin = protectSuperAdmin;
const hasRoleAuthority = (minimumRole) => {
    return async (req, res, next) => {
        try {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ message: "Unauthorized" });
            }
            const user = await prisma_1.default.user.findUnique({
                where: { id: userId },
                select: { isSuperAdmin: true, role: true },
            });
            if (!user) {
                return res.status(401).json({ message: "User not found" });
            }
            if (user.isSuperAdmin) {
                return next();
            }
            const roleLevel = {
                [enums_1.UserRole.SUPER_ADMIN]: 100,
                [enums_1.UserRole.CEO]: 80,
                [enums_1.UserRole.HOO]: 60,
                [enums_1.UserRole.HR]: 60,
                [enums_1.UserRole.ADMIN]: 40,
                [enums_1.UserRole.STAFF]: 20,
            };
            if (roleLevel[user.role] < roleLevel[minimumRole]) {
                return res.status(403).json({
                    message: `Access denied. ${minimumRole} role or higher required.`,
                });
            }
            next();
        }
        catch (error) {
            console.error("Role authority verification error:", error);
            return res.status(500).json({
                message: "Failed to verify role authority",
                error: error.message,
            });
        }
    };
};
exports.hasRoleAuthority = hasRoleAuthority;
const hasDepartmentAuthority = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const user = await prisma_1.default.user.findUnique({
            where: { id: userId },
            select: { isSuperAdmin: true, role: true, department: true },
        });
        if (!user) {
            return res.status(401).json({ message: "User not found" });
        }
        if (user.isSuperAdmin || user.role === enums_1.UserRole.CEO) {
            return next();
        }
        if (!user.department) {
            return res.status(403).json({
                message: "Department authority required",
            });
        }
        req.body.requesterDepartment = user.department;
        next();
    }
    catch (error) {
        console.error("Department authority verification error:", error);
        return res.status(500).json({
            message: "Failed to verify department authority",
            error: error.message,
        });
    }
};
exports.hasDepartmentAuthority = hasDepartmentAuthority;

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const prisma_1 = __importDefault(require("../db/prisma"));
const enums_1 = require("../types/enums");
const RoleHierarchyService_1 = require("../services/RoleHierarchyService");
const EmailService_1 = __importDefault(require("../services/EmailService"));
class UserHierarchyController {
    async promoteUser(req, res) {
        try {
            const { userId } = req.params;
            const { newRole } = req.body;
            const promoterId = req.user?.id;
            if (!promoterId) {
                return res.status(401).json({ message: "Unauthorized" });
            }
            const promoter = await prisma_1.default.user.findUnique({
                where: { id: promoterId },
                select: {
                    isSuperAdmin: true,
                    role: true,
                    department: true,
                },
            });
            if (!promoter) {
                return res.status(404).json({ message: "Promoter not found" });
            }
            const targetUser = await prisma_1.default.user.findUnique({
                where: { id: userId },
                select: {
                    id: true,
                    email: true,
                    name: true,
                    role: true,
                    department: true,
                    isSuperAdmin: true,
                },
            });
            if (!targetUser) {
                return res.status(404).json({ message: "User not found" });
            }
            const validation = RoleHierarchyService_1.RoleHierarchyService.canPromoteToRole(promoter.role, promoter.isSuperAdmin, targetUser.role, newRole);
            if (!validation.allowed) {
                return res.status(403).json({ message: validation.reason });
            }
            const assignedDepartment = targetUser.department;
            const updatedUser = await prisma_1.default.user.update({
                where: { id: userId },
                data: {
                    role: newRole,
                    department: assignedDepartment,
                    promotedById: promoterId,
                    promotedAt: new Date(),
                },
                select: {
                    id: true,
                    email: true,
                    name: true,
                    role: true,
                    department: true,
                    promotedAt: true,
                    promotedBy: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            role: true,
                        },
                    },
                },
            });
            EmailService_1.default
                .sendPromotionEmail(updatedUser.email, {
                userName: updatedUser.name,
                oldRole: targetUser.role,
                newRole: newRole,
                promotedBy: updatedUser.promotedBy?.name || "Administrator",
            })
                .catch((error) => console.error("Failed to send promotion email:", error));
            return res.json({
                message: `User promoted to ${newRole}`,
                user: updatedUser,
            });
        }
        catch (error) {
            console.error("Promotion error:", error);
            return res.status(500).json({
                message: "Failed to promote user",
                error: error.message,
            });
        }
    }
    async demoteUser(req, res) {
        try {
            const { userId } = req.params;
            const { newRole } = req.body;
            const promoterId = req.user?.id;
            if (!promoterId) {
                return res.status(401).json({ message: "Unauthorized" });
            }
            const promoter = await prisma_1.default.user.findUnique({
                where: { id: promoterId },
                select: {
                    isSuperAdmin: true,
                    role: true,
                },
            });
            if (!promoter) {
                return res.status(404).json({ message: "Promoter not found" });
            }
            const targetUser = await prisma_1.default.user.findUnique({
                where: { id: userId },
                select: {
                    id: true,
                    email: true,
                    name: true,
                    role: true,
                    department: true,
                    isSuperAdmin: true,
                },
            });
            if (!targetUser) {
                return res.status(404).json({ message: "User not found" });
            }
            const validation = RoleHierarchyService_1.RoleHierarchyService.canDemoteToRole(promoter.role, promoter.isSuperAdmin, targetUser.role, newRole);
            if (!validation.allowed) {
                return res.status(403).json({ message: validation.reason });
            }
            let newDepartment = targetUser.department;
            if ((targetUser.role === enums_1.UserRole.HOO || targetUser.role === enums_1.UserRole.HR) &&
                newRole === enums_1.UserRole.STAFF) {
                newDepartment = null;
            }
            const updatedUser = await prisma_1.default.user.update({
                where: { id: userId },
                data: {
                    role: newRole,
                    department: newDepartment,
                    promotedById: promoterId,
                    promotedAt: new Date(),
                },
                select: {
                    id: true,
                    email: true,
                    name: true,
                    role: true,
                    department: true,
                    promotedAt: true,
                    promotedBy: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            role: true,
                        },
                    },
                },
            });
            EmailService_1.default
                .sendDemotionEmail(updatedUser.email, {
                userName: updatedUser.name,
                oldRole: targetUser.role,
                newRole: newRole,
                demotedBy: updatedUser.promotedBy?.name || "Administrator",
            })
                .catch((error) => console.error("Failed to send demotion email:", error));
            return res.json({
                message: `User demoted to ${newRole}`,
                user: updatedUser,
            });
        }
        catch (error) {
            console.error("Demotion error:", error);
            return res.status(500).json({
                message: "Failed to demote user",
                error: error.message,
            });
        }
    }
    async getPromotableUsers(req, res) {
        try {
            const promoterId = req.user?.id;
            if (!promoterId) {
                return res.status(401).json({ message: "Unauthorized" });
            }
            const users = await RoleHierarchyService_1.RoleHierarchyService.getPromotableUsers(promoterId);
            return res.json({ users });
        }
        catch (error) {
            console.error("Get promotable users error:", error);
            return res.status(500).json({
                message: "Failed to get promotable users",
                error: error.message,
            });
        }
    }
    async getAvailableRoles(req, res) {
        try {
            const userRole = req.user?.role;
            const promoter = await prisma_1.default.user.findUnique({
                where: { id: req.user?.id },
                select: { isSuperAdmin: true },
            });
            if (!promoter) {
                return res.status(401).json({ message: "Unauthorized" });
            }
            const roles = RoleHierarchyService_1.RoleHierarchyService.getAvailablePromotionRoles(userRole, promoter.isSuperAdmin);
            return res.json({ roles });
        }
        catch (error) {
            console.error("Get available roles error:", error);
            return res.status(500).json({
                message: "Failed to get available roles",
                error: error.message,
            });
        }
    }
    async removeUser(req, res) {
        try {
            const { userId } = req.params;
            const { reassignToUserId } = req.body;
            const promoterId = req.user?.id;
            if (!promoterId) {
                return res.status(401).json({ message: "Unauthorized" });
            }
            const promoter = await prisma_1.default.user.findUnique({
                where: { id: promoterId },
                select: {
                    isSuperAdmin: true,
                    role: true,
                },
            });
            if (!promoter) {
                return res.status(404).json({ message: "Promoter not found" });
            }
            const targetUser = await prisma_1.default.user.findUnique({
                where: { id: userId },
                select: {
                    id: true,
                    email: true,
                    name: true,
                    role: true,
                    isSuperAdmin: true,
                },
            });
            if (!targetUser) {
                return res.status(404).json({ message: "User not found" });
            }
            const validation = RoleHierarchyService_1.RoleHierarchyService.canModifyUser(promoter.role, promoter.isSuperAdmin, targetUser.role, targetUser.isSuperAdmin);
            if (!validation.allowed) {
                return res.status(403).json({ message: validation.reason });
            }
            const taskCheck = await RoleHierarchyService_1.RoleHierarchyService.hasAssignedTasks(userId);
            if (taskCheck.hasTasks) {
                if (!reassignToUserId) {
                    return res.status(400).json({
                        message: `User has ${taskCheck.taskCount} assigned tasks. Please provide reassignToUserId to reassign them before removal.`,
                        taskCount: taskCheck.taskCount,
                        taskIds: taskCheck.taskIds,
                    });
                }
                const reassignTarget = await prisma_1.default.user.findUnique({
                    where: { id: reassignToUserId },
                    select: { id: true, name: true },
                });
                if (!reassignTarget) {
                    return res.status(404).json({
                        message: "Reassignment target user not found",
                    });
                }
                await RoleHierarchyService_1.RoleHierarchyService.reassignUserTasks(userId, reassignToUserId);
            }
            await prisma_1.default.user.delete({
                where: { id: userId },
            });
            return res.json({
                message: `User ${targetUser.name} (${targetUser.email}) removed successfully`,
                tasksReassigned: taskCheck.hasTasks,
                taskCount: taskCheck.taskCount,
            });
        }
        catch (error) {
            console.error("Remove user error:", error);
            return res.status(500).json({
                message: "Failed to remove user",
                error: error.message,
            });
        }
    }
    async getUserHierarchy(req, res) {
        try {
            const currentUserId = req.user?.id;
            const currentUser = await prisma_1.default.user.findUnique({
                where: { id: currentUserId },
                select: {
                    role: true,
                    isSuperAdmin: true,
                    department: true,
                },
            });
            if (!currentUser) {
                return res.status(401).json({ message: "Unauthorized" });
            }
            let whereClause = {};
            if (!currentUser.isSuperAdmin) {
                if (currentUser.role === enums_1.UserRole.CEO) {
                    whereClause.isSuperAdmin = false;
                }
                else if (currentUser.role === enums_1.UserRole.HOO ||
                    currentUser.role === enums_1.UserRole.HR) {
                    whereClause.department = currentUser.department;
                    whereClause.isSuperAdmin = false;
                }
                else {
                    whereClause.id = currentUserId;
                }
            }
            const users = await prisma_1.default.user.findMany({
                where: whereClause,
                select: {
                    id: true,
                    email: true,
                    name: true,
                    role: true,
                    department: true,
                    isSuperAdmin: true,
                    isActive: true,
                    promotedAt: true,
                    createdAt: true,
                    promotedBy: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            role: true,
                        },
                    },
                },
                orderBy: [{ role: "asc" }, { name: "asc" }],
            });
            return res.json({ users });
        }
        catch (error) {
            console.error("Get user hierarchy error:", error);
            return res.status(500).json({
                message: "Failed to get user hierarchy",
                error: error.message,
            });
        }
    }
    async verifySuperAdminCount(req, res) {
        try {
            const currentUser = await prisma_1.default.user.findUnique({
                where: { id: req.user?.id },
                select: { isSuperAdmin: true },
            });
            if (!currentUser?.isSuperAdmin) {
                return res
                    .status(403)
                    .json({ message: "Only Super Admins can verify Super Admin count" });
            }
            const verification = await RoleHierarchyService_1.RoleHierarchyService.verifySuperAdminCount();
            return res.json(verification);
        }
        catch (error) {
            console.error("Verify Super Admin count error:", error);
            return res.status(500).json({
                message: "Failed to verify Super Admin count",
                error: error.message,
            });
        }
    }
}
exports.default = new UserHierarchyController();

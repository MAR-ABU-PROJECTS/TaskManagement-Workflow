"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoleHierarchyService = void 0;
const enums_1 = require("../types/enums");
const prisma_1 = __importDefault(require("../db/prisma"));
class RoleHierarchyService {
    static canModifyUser(promoterRole, promoterIsSuperAdmin, targetRole, targetIsSuperAdmin) {
        if (targetIsSuperAdmin) {
            return {
                allowed: false,
                reason: "Super Admins are immutable and cannot be modified",
            };
        }
        if (promoterIsSuperAdmin) {
            return { allowed: true };
        }
        if (targetRole === enums_1.UserRole.SUPER_ADMIN) {
            return {
                allowed: false,
                reason: "Super Admin role cannot be assigned. Only 2 permanent accounts exist.",
            };
        }
        if (promoterRole === enums_1.UserRole.CEO) {
            if (targetRole === enums_1.UserRole.CEO) {
                return {
                    allowed: false,
                    reason: "Only Super Admin can modify another CEO",
                };
            }
            return { allowed: true };
        }
        if (promoterRole === enums_1.UserRole.HOO) {
            if (targetRole === enums_1.UserRole.ADMIN) {
                return { allowed: true };
            }
            return {
                allowed: false,
                reason: "HOO can only promote/demote Admins",
            };
        }
        if (promoterRole === enums_1.UserRole.HR) {
            if (targetRole === enums_1.UserRole.ADMIN) {
                return { allowed: true };
            }
            return {
                allowed: false,
                reason: "HR can only promote/demote Admins",
            };
        }
        return {
            allowed: false,
            reason: "You do not have permission to modify user roles",
        };
    }
    static canPromoteToRole(promoterRole, promoterIsSuperAdmin, currentRole, targetRole) {
        if (targetRole === enums_1.UserRole.SUPER_ADMIN) {
            return {
                allowed: false,
                reason: "Cannot promote to Super Admin role",
            };
        }
        const canModify = this.canModifyUser(promoterRole, promoterIsSuperAdmin, targetRole, false);
        if (!canModify.allowed) {
            return canModify;
        }
        if (promoterIsSuperAdmin) {
            return { allowed: true };
        }
        if (promoterRole === enums_1.UserRole.CEO) {
            if (targetRole === enums_1.UserRole.CEO) {
                return {
                    allowed: false,
                    reason: "Only Super Admin can promote to CEO",
                };
            }
            return { allowed: true };
        }
        if (promoterRole === enums_1.UserRole.HOO) {
            if (currentRole === enums_1.UserRole.STAFF && targetRole === enums_1.UserRole.ADMIN) {
                return { allowed: true };
            }
            return {
                allowed: false,
                reason: "HOO can only promote Staff to Admin",
            };
        }
        if (promoterRole === enums_1.UserRole.HR) {
            if (currentRole === enums_1.UserRole.STAFF && targetRole === enums_1.UserRole.ADMIN) {
                return { allowed: true };
            }
            return {
                allowed: false,
                reason: "HR can only promote Staff to Admin",
            };
        }
        return {
            allowed: false,
            reason: "Invalid promotion path",
        };
    }
    static canDemoteToRole(promoterRole, promoterIsSuperAdmin, currentRole, targetRole) {
        if (targetRole === enums_1.UserRole.SUPER_ADMIN) {
            return {
                allowed: false,
                reason: "Cannot demote to Super Admin role",
            };
        }
        const canModify = this.canModifyUser(promoterRole, promoterIsSuperAdmin, currentRole, false);
        if (!canModify.allowed) {
            return canModify;
        }
        if (this.ROLE_LEVELS[targetRole] >= this.ROLE_LEVELS[currentRole]) {
            return {
                allowed: false,
                reason: "Target role must be lower than current role",
            };
        }
        return { allowed: true };
    }
    static async verifySuperAdminCount() {
        const count = await prisma_1.default.user.count({
            where: { isSuperAdmin: true },
        });
        if (count > 2) {
            return {
                valid: false,
                count,
                reason: "More than 2 Super Admins exist in the system",
            };
        }
        return { valid: true, count };
    }
    static async getPromotableUsers(promoterId) {
        const promoter = await prisma_1.default.user.findUnique({
            where: { id: promoterId },
            select: {
                role: true,
                isSuperAdmin: true,
                department: true,
            },
        });
        if (!promoter) {
            return [];
        }
        let whereClause = {
            id: { not: promoterId },
            isSuperAdmin: false,
        };
        if (promoter.isSuperAdmin) {
        }
        else if (promoter.role === enums_1.UserRole.CEO) {
            whereClause.role = {
                in: [enums_1.UserRole.HOO, enums_1.UserRole.HR, enums_1.UserRole.ADMIN, enums_1.UserRole.STAFF],
            };
        }
        else if (promoter.role === enums_1.UserRole.HOO) {
            whereClause.role = { in: [enums_1.UserRole.ADMIN, enums_1.UserRole.STAFF] };
            whereClause.department = enums_1.Department.OPS;
        }
        else if (promoter.role === enums_1.UserRole.HR) {
            whereClause.role = { in: [enums_1.UserRole.ADMIN, enums_1.UserRole.STAFF] };
            whereClause.department = enums_1.Department.HR;
        }
        else {
            return [];
        }
        return await prisma_1.default.user.findMany({
            where: whereClause,
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                department: true,
            },
        });
    }
    static getAvailablePromotionRoles(promoterRole, promoterIsSuperAdmin) {
        if (promoterIsSuperAdmin) {
            return [
                enums_1.UserRole.CEO,
                enums_1.UserRole.HOO,
                enums_1.UserRole.HR,
                enums_1.UserRole.ADMIN,
                enums_1.UserRole.STAFF,
            ];
        }
        switch (promoterRole) {
            case enums_1.UserRole.CEO:
                return [enums_1.UserRole.HOO, enums_1.UserRole.HR, enums_1.UserRole.ADMIN, enums_1.UserRole.STAFF];
            case enums_1.UserRole.HOO:
            case enums_1.UserRole.HR:
                return [enums_1.UserRole.ADMIN, enums_1.UserRole.STAFF];
            default:
                return [];
        }
    }
    static async hasAssignedTasks(userId) {
        const tasks = await prisma_1.default.task.findMany({
            where: {
                OR: [
                    { assigneeId: userId },
                    { creatorId: userId },
                    { approvedById: userId },
                ],
            },
            select: { id: true },
        });
        return {
            hasTasks: tasks.length > 0,
            taskCount: tasks.length,
            taskIds: tasks.map((t) => t.id),
        };
    }
    static async reassignUserTasks(fromUserId, toUserId) {
        const assignedUpdate = await prisma_1.default.task.updateMany({
            where: { assigneeId: fromUserId },
            data: { assigneeId: toUserId },
        });
        const createdUpdate = await prisma_1.default.task.updateMany({
            where: { creatorId: fromUserId },
            data: { creatorId: toUserId },
        });
        const approvedUpdate = await prisma_1.default.task.updateMany({
            where: { approvedById: fromUserId },
            data: { approvedById: toUserId },
        });
        return {
            reassignedCount: assignedUpdate.count + createdUpdate.count + approvedUpdate.count,
        };
    }
}
exports.RoleHierarchyService = RoleHierarchyService;
RoleHierarchyService.ROLE_LEVELS = {
    [enums_1.UserRole.SUPER_ADMIN]: 100,
    [enums_1.UserRole.CEO]: 80,
    [enums_1.UserRole.HOO]: 60,
    [enums_1.UserRole.HR]: 60,
    [enums_1.UserRole.ADMIN]: 40,
    [enums_1.UserRole.STAFF]: 20,
};

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isAdminOrHigher = exports.isManagement = exports.isCEO = void 0;
exports.requireRoles = requireRoles;
exports.requireMinRole = requireMinRole;
exports.canCreateProject = canCreateProject;
exports.canApproveTask = canApproveTask;
exports.hasProjectPermission = hasProjectPermission;
exports.canEditIssue = canEditIssue;
exports.canDeleteIssue = canDeleteIssue;
exports.requireProjectRole = requireProjectRole;
exports.isProjectMember = isProjectMember;
const enums_1 = require("../types/enums");
const PermissionService_1 = __importDefault(require("../services/PermissionService"));
function requireRoles(...roles) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const userRole = req.user.role;
        if (!roles.includes(userRole)) {
            return res.status(403).json({
                message: "Forbidden: Insufficient permissions",
                required: roles,
                current: userRole,
            });
        }
        return next();
    };
}
function requireMinRole(minRole) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const userRole = req.user.role;
        const userLevel = enums_1.ROLE_HIERARCHY[userRole];
        const minLevel = enums_1.ROLE_HIERARCHY[minRole];
        if (userLevel < minLevel) {
            return res.status(403).json({
                message: "Forbidden: Insufficient permissions",
                required: minRole,
                current: userRole,
            });
        }
        return next();
    };
}
function canCreateProject(req, res, next) {
    if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
    }
    const userRole = req.user.role;
    const allowedRoles = [
        enums_1.UserRole.CEO,
        enums_1.UserRole.HOO,
        enums_1.UserRole.HR,
        enums_1.UserRole.ADMIN,
    ];
    if (!allowedRoles.includes(userRole)) {
        return res.status(403).json({
            message: "Forbidden: Only CEO, HOO, HR, and ADMIN can create projects",
        });
    }
    return next();
}
function canApproveTask(req, res, next) {
    if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
    }
    const userRole = req.user.role;
    const allowedRoles = [enums_1.UserRole.CEO, enums_1.UserRole.HOO, enums_1.UserRole.HR];
    if (!allowedRoles.includes(userRole)) {
        return res.status(403).json({
            message: "Forbidden: Only CEO, HOO, and HR can approve tasks",
        });
    }
    return next();
}
exports.isCEO = requireRoles(enums_1.UserRole.CEO);
exports.isManagement = requireRoles(enums_1.UserRole.CEO, enums_1.UserRole.HOO, enums_1.UserRole.HR);
exports.isAdminOrHigher = requireMinRole(enums_1.UserRole.ADMIN);
function hasProjectPermission(permission) {
    return async (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const projectId = req.params.projectId || req.body.projectId;
        if (!projectId) {
            return res.status(400).json({ message: "Project ID required" });
        }
        try {
            const hasPermission = await PermissionService_1.default.hasProjectPermission(req.user.id, projectId, permission);
            if (!hasPermission) {
                return res.status(403).json({
                    message: `Forbidden: ${permission} permission required`,
                });
            }
            return next();
        }
        catch (error) {
            return res.status(500).json({ message: "Permission check failed" });
        }
    };
}
async function canEditIssue(req, res, next) {
    if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
    }
    const taskId = req.params.id || req.params.taskId;
    if (!taskId) {
        return res.status(400).json({ message: "Task ID required" });
    }
    try {
        const canEdit = await PermissionService_1.default.canEditIssue(req.user.id, taskId);
        if (!canEdit) {
            return res.status(403).json({
                message: "Forbidden: You cannot edit this issue",
            });
        }
        return next();
    }
    catch (error) {
        return res.status(500).json({ message: "Permission check failed" });
    }
}
async function canDeleteIssue(req, res, next) {
    if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
    }
    const taskId = req.params.id || req.params.taskId;
    if (!taskId) {
        return res.status(400).json({ message: "Task ID required" });
    }
    try {
        const canDelete = await PermissionService_1.default.canDeleteIssue(req.user.id, taskId);
        if (!canDelete) {
            return res.status(403).json({
                message: "Forbidden: You cannot delete this issue",
            });
        }
        return next();
    }
    catch (error) {
        return res.status(500).json({ message: "Permission check failed" });
    }
}
function requireProjectRole(minRole) {
    return async (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const projectId = req.params.projectId || req.body.projectId;
        if (!projectId) {
            return res.status(400).json({ message: "Project ID required" });
        }
        try {
            const hasRole = await PermissionService_1.default.hasProjectRole(req.user.id, projectId, minRole);
            if (!hasRole) {
                return res.status(403).json({
                    message: `Forbidden: ${minRole} role required`,
                });
            }
            return next();
        }
        catch (error) {
            return res.status(500).json({ message: "Role check failed" });
        }
    };
}
async function isProjectMember(req, res, next) {
    if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
    }
    const projectId = req.params.projectId || req.body.projectId;
    if (!projectId) {
        return res.status(400).json({ message: "Project ID required" });
    }
    try {
        const isMember = await PermissionService_1.default.isProjectMember(req.user.id, projectId);
        if (!isMember) {
            return res.status(403).json({
                message: "Forbidden: You are not a member of this project",
            });
        }
        return next();
    }
    catch (error) {
        return res.status(500).json({ message: "Membership check failed" });
    }
}

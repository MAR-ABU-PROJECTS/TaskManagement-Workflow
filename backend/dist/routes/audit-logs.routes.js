"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const rbac_1 = require("../middleware/rbac");
const enums_1 = require("../types/enums");
const AuditLogService_1 = __importDefault(require("../services/AuditLogService"));
const router = (0, express_1.Router)();
router.get("/", auth_1.authenticate, (0, rbac_1.requireRoles)(enums_1.UserRole.SUPER_ADMIN, enums_1.UserRole.CEO), async (req, res) => {
    try {
        const { userId, action, entityType, entityId, startDate, endDate, page, limit, } = req.query;
        const result = await AuditLogService_1.default.getLogs({
            userId: userId,
            action: action,
            entityType: entityType,
            entityId: entityId,
            startDate: startDate ? new Date(startDate) : undefined,
            endDate: endDate ? new Date(endDate) : undefined,
            page: page ? parseInt(page) : undefined,
            limit: limit ? parseInt(limit) : undefined,
        });
        return res.json(result);
    }
    catch (error) {
        console.error("Error fetching audit logs:", error);
        return res.status(500).json({ error: error.message });
    }
});
router.get("/user/:userId", auth_1.authenticate, (0, rbac_1.requireRoles)(enums_1.UserRole.SUPER_ADMIN, enums_1.UserRole.CEO, enums_1.UserRole.HOO, enums_1.UserRole.HR), async (req, res) => {
    try {
        const { userId } = req.params;
        const { limit } = req.query;
        const logs = await AuditLogService_1.default.getUserActivity(userId, limit ? parseInt(limit) : undefined);
        return res.json({ logs });
    }
    catch (error) {
        console.error("Error fetching user activity:", error);
        return res.status(500).json({ error: error.message });
    }
});
router.get("/entity/:entityType/:entityId", auth_1.authenticate, async (req, res) => {
    try {
        const { entityType, entityId } = req.params;
        const logs = await AuditLogService_1.default.getEntityHistory(entityType, entityId);
        return res.json({ logs });
    }
    catch (error) {
        console.error("Error fetching entity history:", error);
        return res.status(500).json({ error: error.message });
    }
});
router.get("/recent", auth_1.authenticate, (0, rbac_1.requireRoles)(enums_1.UserRole.SUPER_ADMIN, enums_1.UserRole.CEO), async (req, res) => {
    try {
        const { limit } = req.query;
        const logs = await AuditLogService_1.default.getRecentActivity(limit ? parseInt(limit) : undefined);
        return res.json({ logs });
    }
    catch (error) {
        console.error("Error fetching recent activity:", error);
        return res.status(500).json({ error: error.message });
    }
});
exports.default = router;

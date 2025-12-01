"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logAudit = exports.auditLogMiddleware = void 0;
const AuditLogService_1 = __importDefault(require("../services/AuditLogService"));
const auditLogMiddleware = (options) => {
    return async (req, res, next) => {
        const originalJson = res.json.bind(res);
        res.json = function (body) {
            if (res.statusCode >= 200 && res.statusCode < 300) {
                const user = req.user;
                if (options?.action) {
                    AuditLogService_1.default.createLog({
                        userId: user?.id,
                        action: options.action,
                        entityType: options.entityType || "Unknown",
                        entityId: options.getEntityId
                            ? options.getEntityId(req)
                            : undefined,
                        ipAddress: req.ip || req.connection.remoteAddress,
                        userAgent: req.get("user-agent"),
                        metadata: {
                            method: req.method,
                            path: req.path,
                            query: req.query,
                        },
                    }).catch((err) => console.error("Audit log error:", err));
                }
            }
            return originalJson(body);
        };
        next();
    };
};
exports.auditLogMiddleware = auditLogMiddleware;
const logAudit = (data) => {
    const user = data.req.user;
    return AuditLogService_1.default.createLog({
        userId: user?.id,
        action: data.action,
        entityType: data.entityType,
        entityId: data.entityId,
        changes: data.changes,
        metadata: {
            ...data.metadata,
            method: data.req.method,
            path: data.req.path,
        },
        ipAddress: data.req.ip || data.req.connection.remoteAddress,
        userAgent: data.req.get("user-agent"),
        success: data.success,
        errorMessage: data.errorMessage,
    });
};
exports.logAudit = logAudit;

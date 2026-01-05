import { Request, Response, NextFunction } from "express";
import AuditLogService from "../services/AuditLogService";
import { AuditAction } from "@prisma/client";

/**
 * Middleware to automatically log HTTP requests
 */
export const auditLogMiddleware = (options?: {
  action?: AuditAction;
  entityType?: string;
  getEntityId?: (req: Request) => string | undefined;
}) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Store original json method
    const originalJson = res.json.bind(res);

    // Override res.json to capture response
    res.json = function (body: any) {
      // Only log successful responses (2xx)
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const user = (req as any).user;

        if (options?.action) {
          AuditLogService.createLog({
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

/**
 * Helper to manually log audit events in controllers
 */
export const logAudit = (data: {
  req: Request;
  action: AuditAction;
  entityType: string;
  entityId?: string;
  changes?: Record<string, any>;
  metadata?: Record<string, any>;
  success?: boolean;
  errorMessage?: string;
}) => {
  const user = (data.req as any).user;

  return AuditLogService.createLog({
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

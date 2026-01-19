import express from "express";
import authRoutes from "./auth";
import usersRoutes from "./users.routes";
import projectsRoutes from "./projects.routes";
import tasksRoutes from "./tasks.routes";
import notificationRoutes from "./notifications.routes";
import searchRoutes from "./search.routes";
import auditLogRoutes from "./audit-logs.routes";
import dashboardRoutes from "./dashboard.routes";

// Jira-like Project Management routes
import configRoutes from "./config.routes";
import componentRoutes from "./component.routes";
import versionRoutes from "./version.routes";
import bulkOperationsRoutes from "./bulkOperations.routes";

const router = express.Router();

// Auth routes (public)
router.use("/auth", authRoutes);

// Dashboard (general users)
router.use("/dashboard", dashboardRoutes);

// Consolidated user management
router.use("/users", usersRoutes);

// Audit logs
router.use("/audit-logs", auditLogRoutes);

// Consolidated task management (includes comments, attachments, dependencies, time tracking)
router.use("/tasks", tasksRoutes);

// Consolidated project management (includes sprints, epics, backlog, members, reports)
router.use("/projects", projectsRoutes);

// Consolidated configuration management (workflows, permissions)
router.use("/config", configRoutes);

// Consolidated search (JQL, saved filters)
router.use("/search", searchRoutes);

// Protected routes (require authentication)
router.use("/", componentRoutes);
router.use("/", versionRoutes);
router.use("/bulk", bulkOperationsRoutes);
router.use("/notifications", notificationRoutes);

// Health check
router.get("/health", (_req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    docs: "http://localhost:4000/api-docs",
  });
});

export default router;

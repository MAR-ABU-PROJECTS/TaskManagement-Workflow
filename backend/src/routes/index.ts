import express from "express";
import authRoutes from "./auth";
import projectRoutes from "./projects.routes";
import taskRoutes from "./tasks.routes";
import commentRoutes from "./comments.routes";
import notificationRoutes from "./notifications.routes";
import taskDependencyRoutes from "./taskDependency.routes";
import timeTrackingRoutes from "./timeTracking.routes";
import taskAttachmentRoutes from "./taskAttachment.routes";
import sprintRoutes from "./sprint.routes";
import epicRoutes from "./epic.routes";
import backlogRoutes from "./backlog.routes";
import reportRoutes from "./report.routes";
import searchRoutes from "./search.routes";

// Role-specific routes
import ceoRoutes from "./ceo.routes";
import hrRoutes from "./hr.routes";
import adminRoutes from "./admin.routes";
import staffRoutes from "./staff.routes";

const router = express.Router();

// Auth routes (public)
router.use("/auth", authRoutes);

// Role-specific routes (protected)
router.use("/ceo", ceoRoutes);
router.use("/hr", hrRoutes);
router.use("/admin", adminRoutes);
router.use("/staff", staffRoutes);

// Protected routes (require authentication)
router.use("/projects", projectRoutes);
router.use("/tasks", taskRoutes);
router.use("/tasks", commentRoutes); // Comment and activity log routes
router.use("/notifications", notificationRoutes);
router.use("/task-dependencies", taskDependencyRoutes);
router.use("/", timeTrackingRoutes); // Time tracking routes (includes /tasks/:id/time, /time-entries, /time/*)
router.use("/", taskAttachmentRoutes); // Task attachment routes
router.use("/", sprintRoutes); // Sprint routes
router.use("/", epicRoutes); // Epic routes
router.use("/", backlogRoutes); // Backlog routes
router.use("/", reportRoutes); // Report and analytics routes
router.use("/", searchRoutes); // Advanced search routes

// Health check
router.get("/health", (_req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    docs: "http://localhost:4000/api-docs",
  });
});

export default router;

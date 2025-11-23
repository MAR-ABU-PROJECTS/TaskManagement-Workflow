import express from "express";
import authRoutes from "./auth";
import projectRoutes from "./projects.routes";
import taskRoutes from "./tasks.routes";
import commentRoutes from "./comments.routes";
import notificationRoutes from "./notifications.routes";
import taskDependencyRoutes from "./taskDependency.routes";
import timeTrackingRoutes from "./timeTracking.routes";

const router = express.Router();

// Auth routes (public)
router.use("/auth", authRoutes);

// Protected routes (require authentication)
router.use("/projects", projectRoutes);
router.use("/tasks", taskRoutes);
router.use("/tasks", commentRoutes); // Comment and activity log routes
router.use("/notifications", notificationRoutes);
router.use("/task-dependencies", taskDependencyRoutes);
router.use("/", timeTrackingRoutes); // Time tracking routes (includes /tasks/:id/time, /time-entries, /time/*)

// Health check
router.get("/health", (_req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

export default router;

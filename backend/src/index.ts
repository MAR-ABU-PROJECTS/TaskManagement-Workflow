import express from "express";
import cors from "cors";
import helmet from "helmet";
import config from "./config";
import logger from "./utils/logger";
import { apiLimiter } from "./middleware/rateLimiter";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";

import authRoutes from "./routes/auth";
import teamRoutes from "./routes/teams";
import projectRoutes from "./routes/projects";
import taskRoutes from "./routes/tasks";
import issueRoutes from "./routes/issues";

const app = express();

// Security Middlewares
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
app.use(apiLimiter);

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/teams", teamRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/issues", issueRoutes);

// Health check
app.get("/", (_req, res) => {
  res.json({
    message: "MAR Project Management API is running",
    version: "1.0.0",
    environment: config.NODE_ENV,
  });
});

// 404 handler
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

// Start server
app.listen(config.PORT, () => {
  logger.info(`Server running on ${config.BASE_URL}`);
  logger.info(`Environment: ${config.NODE_ENV}`);
});

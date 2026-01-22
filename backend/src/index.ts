import express from "express";
import cors from "cors";
import helmet from "helmet";
import config from "./config";
import logger from "./utils/logger";
import { apiLimiter } from "./middleware/rateLimiter";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";
import { setupSwagger } from "./config/swagger";
import { startAutomationJobs } from "./jobs/automationJobs";
import { startEmailWorker } from "./jobs/emailWorker";

import routes from "./routes";

const app = express();

// Security Middlewares
app.use(helmet());
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, Postman, etc.)
      if (!origin) return callback(null, true);

      // In development, allow all origins
      if (process.env.NODE_ENV !== "production") {
        return callback(null, true);
      }

      // In production, allow configured origins
      const allowedOrigins = process.env.FRONTEND_URL
        ? process.env.FRONTEND_URL.split(",")
        : [];

      // Always allow the production backend URL (for Swagger UI)
      if (process.env.BASE_URL) {
        allowedOrigins.push(process.env.BASE_URL);
      }

      // Remove protocol and trailing slash for flexible matching
      const normalizeUrl = (url: string) =>
        url.replace(/^https?:\/\//, "").replace(/\/$/, "");

      if (
        allowedOrigins.includes("*") ||
        allowedOrigins.includes(origin) ||
        allowedOrigins.some(
          (allowed) => normalizeUrl(allowed) === normalizeUrl(origin)
        )
      ) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
app.use(apiLimiter);

// Swagger Documentation
setupSwagger(app);

// API Routes
app.use("/api", routes);

// Root health check
app.get("/", (_req, res) => {
  res.json({
    message: "MAR Task Management API - Jira Style",
    version: "2.0.0",
    environment: config.NODE_ENV,
    docs: `${config.BASE_URL}/api-docs`,
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
  logger.info(`Swagger UI: ${config.BASE_URL}/api-docs`);
  logger.info(`Jira-style Task Management System Ready`);

  // Start automation jobs (deadline reminders, overdue labeling)
  startAutomationJobs();
  logger.info(`Automation jobs started`);

  // Start email worker inside the web process
  startEmailWorker({ enableHealthcheck: false }).catch((error) => {
    logger.error(
      `Email worker failed to start: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  });
});

export default app;

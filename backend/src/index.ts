import express from "express";
import cors from "cors";
import helmet from "helmet";
import config from "./config";
import logger from "./utils/logger";
import { apiLimiter } from "./middleware/rateLimiter";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";
import { setupSwagger } from "./config/swagger";

import routes from "./routes";

const app = express();

// Security Middlewares
app.use(helmet());
app.use(cors());
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
});

export default app;

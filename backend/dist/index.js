"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const config_1 = __importDefault(require("./config"));
const logger_1 = __importDefault(require("./utils/logger"));
const rateLimiter_1 = require("./middleware/rateLimiter");
const errorHandler_1 = require("./middleware/errorHandler");
const swagger_1 = require("./config/swagger");
const routes_1 = __importDefault(require("./routes"));
const app = (0, express_1.default)();
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use(rateLimiter_1.apiLimiter);
(0, swagger_1.setupSwagger)(app);
app.use("/api", routes_1.default);
app.get("/", (_req, res) => {
    res.json({
        message: "MAR Task Management API - Jira Style",
        version: "2.0.0",
        environment: config_1.default.NODE_ENV,
        docs: `${config_1.default.BASE_URL}/api-docs`,
    });
});
app.use(errorHandler_1.notFoundHandler);
app.use(errorHandler_1.errorHandler);
app.listen(config_1.default.PORT, () => {
    logger_1.default.info(`Server running on ${config_1.default.BASE_URL}`);
    logger_1.default.info(`Environment: ${config_1.default.NODE_ENV}`);
    logger_1.default.info(`Swagger UI: ${config_1.default.BASE_URL}/api-docs`);
    logger_1.default.info(`Jira-style Task Management System Ready`);
});
exports.default = app;

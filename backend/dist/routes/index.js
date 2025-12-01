"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = __importDefault(require("./auth"));
const users_routes_1 = __importDefault(require("./users.routes"));
const projects_routes_1 = __importDefault(require("./projects.routes"));
const tasks_routes_1 = __importDefault(require("./tasks.routes"));
const notifications_routes_1 = __importDefault(require("./notifications.routes"));
const search_routes_1 = __importDefault(require("./search.routes"));
const audit_logs_routes_1 = __importDefault(require("./audit-logs.routes"));
const config_routes_1 = __importDefault(require("./config.routes"));
const component_routes_1 = __importDefault(require("./component.routes"));
const version_routes_1 = __importDefault(require("./version.routes"));
const bulkOperations_routes_1 = __importDefault(require("./bulkOperations.routes"));
const router = express_1.default.Router();
router.use("/auth", auth_1.default);
router.use("/users", users_routes_1.default);
router.use("/audit-logs", audit_logs_routes_1.default);
router.use("/tasks", tasks_routes_1.default);
router.use("/projects", projects_routes_1.default);
router.use("/config", config_routes_1.default);
router.use("/search", search_routes_1.default);
router.use("/", component_routes_1.default);
router.use("/", version_routes_1.default);
router.use("/bulk", bulkOperations_routes_1.default);
router.use("/notifications", notifications_routes_1.default);
router.get("/health", (_req, res) => {
    res.json({
        status: "OK",
        timestamp: new Date().toISOString(),
        docs: "http://localhost:4000/api-docs",
    });
});
exports.default = router;

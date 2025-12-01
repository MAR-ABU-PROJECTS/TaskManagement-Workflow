"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupSwagger = void 0;
const swagger_jsdoc_1 = __importDefault(require("swagger-jsdoc"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const options = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "Mar-Abu Task Management API",
            version: "1.0.0",
            description: "API documentation for the Mar-Abu Task Management system.",
        },
        servers: [
            {
                url: "http://localhost:4000",
                description: "Development server",
            },
        ],
        tags: [
            {
                name: "Authentication",
                description: "User registration and login endpoints",
            },
            {
                name: "Projects",
                description: "Project management operations",
            },
            {
                name: "Tasks",
                description: "Task CRUD operations, assignments, and approvals",
            },
            {
                name: "Comments",
                description: "Task comments and activity logs",
            },
            {
                name: "Sprints",
                description: "Sprint planning and management",
            },
            {
                name: "Epics",
                description: "Epic creation and task grouping",
            },
            {
                name: "Backlog",
                description: "Backlog management and prioritization",
            },
            {
                name: "Time Tracking",
                description: "Time logging and timer management",
            },
            {
                name: "Notifications",
                description: "User notifications and alerts",
            },
            {
                name: "Search",
                description: "Advanced search and JQL queries",
            },
            {
                name: "Task Dependencies",
                description: "Task relationships and blocking",
            },
            {
                name: "Attachments",
                description: "File upload and download",
            },
            {
                name: "Reports",
                description: "Analytics and reporting endpoints",
            },
            {
                name: "CEO",
                description: "CEO-only endpoints (organization-wide control)",
            },
            {
                name: "HR",
                description: "HR endpoints (user management and team analytics)",
            },
            {
                name: "Admin",
                description: "Admin endpoints (project oversight and system settings)",
            },
            {
                name: "Staff",
                description: "Staff endpoints (personal tasks and profile)",
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: "http",
                    scheme: "bearer",
                    bearerFormat: "JWT",
                },
            },
            schemas: {
                UserRole: {
                    type: "string",
                    enum: ["CEO", "HOO", "HR", "ADMIN", "STAFF"],
                    description: "User role in the system. CEO and HOO have highest privileges, HR manages personnel, ADMIN manages projects, STAFF are regular users.",
                },
                Department: {
                    type: "string",
                    enum: ["OPS", "HR"],
                    nullable: true,
                    description: "Department assignment for users. OPS for operations team, HR for human resources.",
                },
                RegisterRequest: {
                    type: "object",
                    required: ["email", "password", "name"],
                    properties: {
                        email: {
                            type: "string",
                            format: "email",
                            example: "john.doe@example.com",
                            description: "User's email address (must be unique)",
                        },
                        password: {
                            type: "string",
                            format: "password",
                            minLength: 6,
                            example: "SecurePass123",
                            description: "User's password (minimum 6 characters)",
                        },
                        name: {
                            type: "string",
                            example: "John Doe",
                            description: "User's full name",
                        },
                        role: {
                            $ref: "#/components/schemas/UserRole",
                            default: "STAFF",
                            description: "User role (defaults to STAFF if not specified)",
                        },
                        department: {
                            $ref: "#/components/schemas/Department",
                            description: "Optional department assignment",
                        },
                    },
                },
                LoginRequest: {
                    type: "object",
                    required: ["email", "password"],
                    properties: {
                        email: {
                            type: "string",
                            format: "email",
                            example: "john.doe@example.com",
                            description: "User's registered email address",
                        },
                        password: {
                            type: "string",
                            format: "password",
                            example: "SecurePass123",
                            description: "User's password",
                        },
                    },
                },
                AuthResponse: {
                    type: "object",
                    properties: {
                        token: {
                            type: "string",
                            description: "JWT authentication token (valid for 24 hours)",
                            example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                        },
                        user: {
                            $ref: "#/components/schemas/User",
                        },
                    },
                },
                User: {
                    type: "object",
                    properties: {
                        id: { type: "string", format: "uuid" },
                        email: { type: "string", format: "email" },
                        name: { type: "string" },
                        role: {
                            $ref: "#/components/schemas/UserRole",
                        },
                        department: {
                            $ref: "#/components/schemas/Department",
                            nullable: true,
                            description: "Optional department assignment",
                        },
                        isActive: { type: "boolean" },
                        createdAt: { type: "string", format: "date-time" },
                        updatedAt: { type: "string", format: "date-time" },
                    },
                },
                Task: {
                    type: "object",
                    properties: {
                        id: { type: "string", format: "uuid" },
                        title: { type: "string" },
                        description: { type: "string", nullable: true },
                        status: {
                            type: "string",
                            enum: [
                                "DRAFT",
                                "PENDING_APPROVAL",
                                "OPEN",
                                "IN_PROGRESS",
                                "IN_REVIEW",
                                "COMPLETED",
                                "REJECTED",
                            ],
                        },
                        priority: {
                            type: "string",
                            enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
                        },
                        issueType: {
                            type: "string",
                            enum: ["TASK", "BUG", "FEATURE", "IMPROVEMENT"],
                        },
                        storyPoints: { type: "integer", nullable: true },
                        estimatedHours: { type: "number", nullable: true },
                        loggedHours: { type: "number" },
                        dueDate: { type: "string", format: "date-time", nullable: true },
                        labels: { type: "array", items: { type: "string" } },
                        createdAt: { type: "string", format: "date-time" },
                        updatedAt: { type: "string", format: "date-time" },
                    },
                },
                Sprint: {
                    type: "object",
                    properties: {
                        id: { type: "string", format: "uuid" },
                        name: { type: "string" },
                        goal: { type: "string", nullable: true },
                        status: {
                            type: "string",
                            enum: ["PLANNING", "ACTIVE", "COMPLETED", "CANCELLED"],
                        },
                        startDate: { type: "string", format: "date" },
                        endDate: { type: "string", format: "date" },
                        capacityHours: { type: "number", nullable: true },
                        createdAt: { type: "string", format: "date-time" },
                        updatedAt: { type: "string", format: "date-time" },
                    },
                },
                Epic: {
                    type: "object",
                    properties: {
                        id: { type: "string", format: "uuid" },
                        name: { type: "string" },
                        description: { type: "string", nullable: true },
                        color: { type: "string", nullable: true },
                        startDate: { type: "string", format: "date", nullable: true },
                        endDate: { type: "string", format: "date", nullable: true },
                        createdAt: { type: "string", format: "date-time" },
                        updatedAt: { type: "string", format: "date-time" },
                    },
                },
                Error: {
                    type: "object",
                    properties: {
                        error: { type: "string" },
                    },
                },
            },
        },
        security: [
            {
                bearerAuth: [],
            },
        ],
    },
    apis: ["./src/routes/*.ts", "./src/controllers/*.ts"],
};
const specs = (0, swagger_jsdoc_1.default)(options);
const setupSwagger = (app) => {
    app.use("/api-docs", swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(specs));
    console.log("📚 Swagger UI available at http://localhost:4000/api-docs");
};
exports.setupSwagger = setupSwagger;

import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import { Express } from "express";

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
        url: process.env.BASE_URL || "http://localhost:4000",
        description:
          process.env.NODE_ENV === "production"
            ? "Production server"
            : "Development server",
      },
    ],
    tags: [
      {
        name: "Authentication",
        description: "User registration and login endpoints",
      },
      {
        name: "Users",
        description: "User management and profile operations",
      },
      {
        name: "Projects",
        description: "Project management, sprints, epics, backlog, and reports",
      },
      {
        name: "Tasks",
        description:
          "Task CRUD, comments, attachments, dependencies, and time tracking",
      },
      {
        name: "Configuration",
        description: "Workflow and permission scheme management",
      },
      {
        name: "Search",
        description: "JQL search and saved filters",
      },
      {
        name: "Notifications",
        description: "User notifications and alerts",
      },
      {
        name: "Reports",
        description: "Project analytics and reporting endpoints",
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
          description:
            "User role in the system. CEO and HOO have highest privileges, HR manages personnel, ADMIN manages projects, STAFF are regular users.",
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
  apis: [
    "./src/routes/*.ts",
    "./src/routes/**/*.ts",
    "./src/controllers/*.ts",
    "./dist/routes/*.js",
    "./dist/routes/**/*.js",
  ],
};

const specs = swaggerJsdoc(options);

export const setupSwagger = (app: Express) => {
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(specs));
  console.log("📚 Swagger UI available at http://localhost:4000/api-docs");
};

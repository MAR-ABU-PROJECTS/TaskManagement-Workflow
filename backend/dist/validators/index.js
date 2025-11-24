"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.issueFilterSchema = exports.taskFilterSchema = exports.paginationSchema = exports.updateIssueSchema = exports.createIssueSchema = exports.updateTaskSchema = exports.createTaskSchema = exports.updateProjectSchema = exports.createProjectSchema = exports.addTeamMemberSchema = exports.updateTeamSchema = exports.createTeamSchema = exports.loginSchema = exports.registerSchema = void 0;
const zod_1 = require("zod");
exports.registerSchema = zod_1.z.object({
    email: zod_1.z.string().email("Invalid email format"),
    password: zod_1.z
        .string()
        .min(8, "Password must be at least 8 characters")
        .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
        .regex(/[a-z]/, "Password must contain at least one lowercase letter")
        .regex(/[0-9]/, "Password must contain at least one number")
        .regex(/[@$!%*?&#]/, "Password must contain at least one special character"),
    firstName: zod_1.z.string().min(1, "First name is required").max(50),
    lastName: zod_1.z.string().min(1, "Last name is required").max(50),
});
exports.loginSchema = zod_1.z.object({
    email: zod_1.z.string().email("Invalid email format"),
    password: zod_1.z.string().min(1, "Password is required"),
});
exports.createTeamSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, "Team name is required").max(100),
    description: zod_1.z.string().max(500).optional(),
});
exports.updateTeamSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(100).optional(),
    description: zod_1.z.string().max(500).optional(),
});
exports.addTeamMemberSchema = zod_1.z.object({
    userId: zod_1.z.string().uuid("Invalid user ID"),
    role: zod_1.z.enum(["OWNER", "ADMIN", "MEMBER"]).default("MEMBER"),
});
exports.createProjectSchema = zod_1.z.object({
    teamId: zod_1.z.string().uuid("Invalid team ID"),
    name: zod_1.z.string().min(1, "Project name is required").max(100),
    key: zod_1.z
        .string()
        .min(2, "Project key must be at least 2 characters")
        .max(10, "Project key must be at most 10 characters")
        .regex(/^[A-Z0-9]+$/, "Project key must contain only uppercase letters and numbers"),
    description: zod_1.z.string().max(1000).optional(),
});
exports.updateProjectSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(100).optional(),
    description: zod_1.z.string().max(1000).optional(),
    status: zod_1.z.enum(["ACTIVE", "ARCHIVED"]).optional(),
});
exports.createTaskSchema = zod_1.z.object({
    projectId: zod_1.z.string().uuid("Invalid project ID"),
    title: zod_1.z.string().min(1, "Task title is required").max(200),
    description: zod_1.z.string().max(2000).optional(),
    priority: zod_1.z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).default("MEDIUM"),
    assignees: zod_1.z.array(zod_1.z.string().uuid()).optional().default([]),
});
exports.updateTaskSchema = zod_1.z.object({
    title: zod_1.z.string().min(1).max(200).optional(),
    description: zod_1.z.string().max(2000).optional(),
    status: zod_1.z
        .enum(["BACKLOG", "TODO", "IN_PROGRESS", "REVIEW", "DONE", "BLOCKED"])
        .optional(),
    priority: zod_1.z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional(),
    assignees: zod_1.z.array(zod_1.z.string().uuid()).optional(),
});
exports.createIssueSchema = zod_1.z
    .object({
    projectId: zod_1.z.string().uuid("Invalid project ID").optional(),
    taskId: zod_1.z.string().uuid("Invalid task ID").optional(),
    title: zod_1.z.string().min(1, "Issue title is required").max(200),
    description: zod_1.z.string().min(1, "Issue description is required").max(2000),
    severity: zod_1.z.enum(["MINOR", "MAJOR", "CRITICAL", "BLOCKER"]),
})
    .refine((data) => data.projectId || data.taskId, {
    message: "Either projectId or taskId must be provided",
});
exports.updateIssueSchema = zod_1.z.object({
    title: zod_1.z.string().min(1).max(200).optional(),
    description: zod_1.z.string().min(1).max(2000).optional(),
    severity: zod_1.z.enum(["MINOR", "MAJOR", "CRITICAL", "BLOCKER"]).optional(),
    status: zod_1.z
        .enum(["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED", "REOPENED"])
        .optional(),
});
exports.paginationSchema = zod_1.z.object({
    page: zod_1.z.string().regex(/^\d+$/).transform(Number).default("1"),
    limit: zod_1.z.string().regex(/^\d+$/).transform(Number).default("10"),
});
exports.taskFilterSchema = exports.paginationSchema.extend({
    status: zod_1.z
        .enum(["BACKLOG", "TODO", "IN_PROGRESS", "REVIEW", "DONE", "BLOCKED"])
        .optional(),
    priority: zod_1.z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional(),
    assignee: zod_1.z.string().uuid().optional(),
});
exports.issueFilterSchema = exports.paginationSchema.extend({
    status: zod_1.z
        .enum(["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED", "REOPENED"])
        .optional(),
    severity: zod_1.z.enum(["MINOR", "MAJOR", "CRITICAL", "BLOCKER"]).optional(),
});

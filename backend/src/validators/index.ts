import { z } from "zod";

// ============================================================================
// Auth Validation Schemas
// ============================================================================

export const registerSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(
      /[@$!%*?&#]/,
      "Password must contain at least one special character"
    ),
  firstName: z.string().min(1, "First name is required").max(50),
  lastName: z.string().min(1, "Last name is required").max(50),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
});

// ============================================================================
// Team Validation Schemas
// ============================================================================

export const createTeamSchema = z.object({
  name: z.string().min(1, "Team name is required").max(100),
  description: z.string().max(500).optional(),
});

export const updateTeamSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
});

export const addTeamMemberSchema = z.object({
  userId: z.string().uuid("Invalid user ID"),
  role: z.enum(["OWNER", "ADMIN", "MEMBER"]).default("MEMBER"),
});

// ============================================================================
// Project Validation Schemas
// ============================================================================

export const createProjectSchema = z.object({
  teamId: z.string().uuid("Invalid team ID"),
  name: z.string().min(1, "Project name is required").max(100),
  key: z
    .string()
    .min(2, "Project key must be at least 2 characters")
    .max(10, "Project key must be at most 10 characters")
    .regex(
      /^[A-Z0-9]+$/,
      "Project key must contain only uppercase letters and numbers"
    )
    .optional(),
  description: z.string().max(1000).optional(),
  workflowType: z.enum(["BASIC", "AGILE", "BUG_TRACKING", "CUSTOM"]).optional(),
}).superRefine((data, ctx) => {
  if (data.workflowType === "AGILE" && !data.key) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Project key is required for AGILE workflow",
      path: ["key"],
    });
  }
});

export const updateProjectSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(1000).optional(),
  status: z.enum(["ACTIVE", "ARCHIVED"]).optional(),
});

// ============================================================================
// Task Validation Schemas
// ============================================================================

export const createTaskSchema = z.object({
  projectId: z.string().uuid("Invalid project ID"),
  title: z.string().min(1, "Task title is required").max(200),
  description: z.string().max(2000).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).default("MEDIUM"),
  assignees: z.array(z.string().uuid()).optional().default([]),
});

export const updateTaskSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
  status: z
    .enum(["BACKLOG", "TODO", "IN_PROGRESS", "REVIEW", "DONE", "BLOCKED"])
    .optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional(),
  assignees: z.array(z.string().uuid()).optional(),
});

// ============================================================================
// Issue Validation Schemas
// ============================================================================

export const createIssueSchema = z
  .object({
    projectId: z.string().uuid("Invalid project ID").optional(),
    taskId: z.string().uuid("Invalid task ID").optional(),
    title: z.string().min(1, "Issue title is required").max(200),
    description: z.string().min(1, "Issue description is required").max(2000),
    severity: z.enum(["MINOR", "MAJOR", "CRITICAL", "BLOCKER"]),
  })
  .refine((data) => data.projectId || data.taskId, {
    message: "Either projectId or taskId must be provided",
  });

export const updateIssueSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().min(1).max(2000).optional(),
  severity: z.enum(["MINOR", "MAJOR", "CRITICAL", "BLOCKER"]).optional(),
  status: z
    .enum(["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED", "REOPENED"])
    .optional(),
});

// ============================================================================
// Query Validation Schemas
// ============================================================================

export const paginationSchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).default("1"),
  limit: z.string().regex(/^\d+$/).transform(Number).default("10"),
});

export const taskFilterSchema = paginationSchema.extend({
  status: z
    .enum(["BACKLOG", "TODO", "IN_PROGRESS", "REVIEW", "DONE", "BLOCKED"])
    .optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional(),
  assignee: z.string().uuid().optional(),
});

export const issueFilterSchema = paginationSchema.extend({
  status: z
    .enum(["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED", "REOPENED"])
    .optional(),
  severity: z.enum(["MINOR", "MAJOR", "CRITICAL", "BLOCKER"]).optional(),
});

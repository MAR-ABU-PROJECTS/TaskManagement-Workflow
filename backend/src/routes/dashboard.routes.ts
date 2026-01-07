import express from "express";
import { authenticate } from "../middleware/auth";
import { UserRole, TaskStatus } from "../types/enums";
import prisma from "../db/prisma";

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /api/dashboard/overview:
 *   get:
 *     summary: Get user dashboard overview
 *     description: |
 *       Get personalized dashboard data for the logged-in user.
 *       Shows projects, tasks, and metrics based on user's role and permissions.
 *       Available for all roles except SUPER_ADMIN.
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard overview data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 activeProjectsCount:
 *                   type: number
 *                   description: Number of active projects user has access to
 *                 tasksInProgressCount:
 *                   type: number
 *                   description: Number of tasks in progress
 *                 completedTasksCount:
 *                   type: number
 *                   description: Number of completed tasks
 *                 openIssuesCount:
 *                   type: number
 *                   description: Number of open issues (tasks with priority HIGH/CRITICAL)
 *                 recentProjects:
 *                   type: array
 *                   description: List of recently updated projects
 *                 myTasks:
 *                   type: array
 *                   description: Tasks assigned to the user
 *       403:
 *         description: Super Admins cannot access this dashboard
 */
router.get("/overview", async (req, res) => {
  try {
    if (!req.user) {
      return res.status(403).json({ message: "Authentication required" });
    }

    const { id: userId, role } = req.user;

    // Super Admins should use their own dashboard
    if (role === UserRole.SUPER_ADMIN) {
      return res.status(403).json({
        message: "Super Admins should use /api/users/dashboard/overview",
      });
    }

    const userRole = role as UserRole;

    // Determine which projects the user can see based on role
    let projectFilter: any = {};

    if (userRole === UserRole.CEO) {
      // CEO sees all projects
      projectFilter = {};
    } else if (userRole === UserRole.HOO || userRole === UserRole.HR) {
      // HOO and HR see projects created by ADMIN/STAFF or where they're members
      projectFilter = {
        OR: [
          {
            creator: {
              role: {
                in: [UserRole.ADMIN, UserRole.STAFF],
              },
            },
          },
          { members: { some: { userId } } },
        ],
      };
    } else {
      // ADMIN and STAFF see only projects where they are members
      projectFilter = {
        members: { some: { userId } },
      };
    }

    // Calculate date ranges for historical comparison
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const twoMonthsAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    // Get dashboard metrics in parallel
    const [
      activeProjectsCount,
      tasksInProgress,
      completedTasks,
      openIssues,
      recentProjects,
      myTasks,
      // Historical data for deltas
      tasksInProgressLastWeek,
      completedTasksLastMonth,
      openIssuesYesterday,
    ] = await Promise.all([
      // Active projects count
      prisma.project.count({ where: projectFilter }),

      // Tasks in progress count (for user's projects)
      prisma.task.count({
        where: {
          status: TaskStatus.IN_PROGRESS,
          OR: [
            { project: projectFilter },
            { projectId: null, creatorId: userId }, // Personal tasks
          ],
        },
      }),

      // Completed tasks count (from last month)
      prisma.task.count({
        where: {
          status: TaskStatus.COMPLETED,
          updatedAt: {
            gte: oneMonthAgo,
          },
          OR: [
            { project: projectFilter },
            { projectId: null, creatorId: userId },
          ],
        },
      }),

      // Open issues (high priority tasks not completed)
      prisma.task.count({
        where: {
          status: { notIn: [TaskStatus.COMPLETED, TaskStatus.REJECTED] },
          priority: { in: ["HIGH"] },
          OR: [
            { project: projectFilter },
            { projectId: null, creatorId: userId },
          ],
        },
      }),

      // Recent projects (most recently updated)
      prisma.project.findMany({
        where: projectFilter,
        take: 5,
        orderBy: { updatedAt: "desc" },
        include: {
          creator: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          _count: {
            select: {
              tasks: true,
              members: true,
            },
          },
          tasks: {
            where: { status: TaskStatus.COMPLETED },
            select: { id: true },
          },
        },
      }),

      // My tasks (assigned to me)
      prisma.task.findMany({
        where: {
          assignees: {
            some: { userId },
          },
          status: { notIn: [TaskStatus.COMPLETED, TaskStatus.REJECTED] },
        },
        take: 10,
        orderBy: [{ priority: "desc" }, { dueDate: "asc" }],
        include: {
          project: {
            select: {
              id: true,
              name: true,
              key: true,
            },
          },
        },
      }),

      // Historical: Count tasks that transitioned TO in-progress in the last week
      prisma.auditLog.count({
        where: {
          action: "TASK_STATUS_CHANGE",
          entityType: "Task",
          createdAt: {
            gte: oneWeekAgo,
          },
          changes: {
            path: ["to"],
            equals: TaskStatus.IN_PROGRESS,
          },
        },
      }),

      // Historical: Completed tasks from previous month (for delta calculation)
      prisma.task.count({
        where: {
          status: TaskStatus.COMPLETED,
          updatedAt: {
            gte: twoMonthsAgo,
            lt: oneMonthAgo,
          },
          OR: [
            { project: projectFilter },
            { projectId: null, creatorId: userId },
          ],
        },
      }),

      // Historical: Open issues that existed yesterday
      prisma.task.count({
        where: {
          status: { notIn: [TaskStatus.COMPLETED, TaskStatus.REJECTED] },
          priority: { in: ["HIGH"] },
          createdAt: {
            lt: oneDayAgo,
          },
          OR: [
            { project: projectFilter },
            { projectId: null, creatorId: userId },
          ],
        },
      }),
    ]);

    // Calculate project completion percentages
    const projectsWithProgress = recentProjects.map((project) => {
      const totalTasks = project._count.tasks;
      const completedTasks = project.tasks.length;
      const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

      return {
        id: project.id,
        name: project.name,
        key: project.key,
        description: project.description,
        creatorName: project.creator.name,
        progress: Math.round(progress),
        totalTasks,
        completedTasks,
        updatedAt: project.updatedAt,
      };
    });

    // Format my tasks
    const formattedMyTasks = myTasks.map((task) => ({
      id: task.id,
      title: task.title,
      priority: task.priority,
      status: task.status,
      dueDate: task.dueDate,
      projectName: task.project?.name || "Personal Task",
      projectKey: task.project?.key,
    }));

    // Calculate dynamic deltas
    const tasksInProgressDelta = tasksInProgress - tasksInProgressLastWeek;
    const completedTasksDelta =
      completedTasksLastMonth > 0
        ? Math.round(
            ((completedTasks - completedTasksLastMonth) /
              completedTasksLastMonth) *
              100
          )
        : completedTasks > 0
        ? 100
        : 0;
    const openIssuesDelta = openIssues - openIssuesYesterday;

    // Format delta strings
    const formatDelta = (value: number, suffix: string) => {
      if (value > 0) return `+${value} ${suffix}`;
      if (value < 0) return `${value} ${suffix}`;
      return `No change ${suffix}`;
    };

    return res.json({
      activeProjectsCount,
      tasksInProgressCount: tasksInProgress,
      completedTasksCount: completedTasks,
      openIssuesCount: openIssues,
      recentProjects: projectsWithProgress,
      myTasks: formattedMyTasks,
      statistics: {
        tasksInProgressDelta: formatDelta(
          tasksInProgressDelta,
          "from last week"
        ),
        completedTasksDelta: `${
          completedTasksDelta > 0 ? "+" : ""
        }${completedTasksDelta}% from last month`,
        openIssuesDelta: formatDelta(openIssuesDelta, "from yesterday"),
      },
    });
  } catch (error: any) {
    console.error("Dashboard error:", error);
    return res.status(500).json({
      message: "Failed to load dashboard",
      error: error.message,
    });
  }
});

export default router;

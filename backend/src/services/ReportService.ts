import prisma from "../db/prisma";

class ReportService {
  /**
   * Get project velocity report (last N sprints)
   */
  async getVelocityReport(projectId: string, lastNSprints = 5) {
    const sprints = await prisma.sprint.findMany({
      where: {
        projectId,
        status: "COMPLETED",
      },
      include: {
        tasks: {
          select: {
            id: true,
            status: true,
            storyPoints: true,
          },
        },
      },
      orderBy: { endDate: "desc" },
      take: lastNSprints,
    });

    const sprintData = sprints.map((sprint) => {
      const totalPlanned = sprint.tasks.reduce(
        (sum: number, t: any) => sum + (t.storyPoints || 0),
        0
      );
      const completed = sprint.tasks
        .filter((t: any) => t.status === "COMPLETED")
        .reduce((sum: number, t: any) => sum + (t.storyPoints || 0), 0);

      return {
        sprintId: sprint.id,
        sprintName: sprint.name,
        startDate: sprint.startDate,
        endDate: sprint.endDate,
        planned: totalPlanned,
        completed,
        completionRate:
          totalPlanned > 0 ? Math.round((completed / totalPlanned) * 100) : 0,
      };
    });

    const averageVelocity =
      sprintData.length > 0
        ? Math.round(
            sprintData.reduce((sum, s) => sum + s.completed, 0) /
              sprintData.length
          )
        : 0;

    return {
      projectId,
      sprints: sprintData.reverse(), // Oldest to newest
      averageVelocity,
    };
  }

  /**
   * Get team productivity metrics
   */
  async getTeamProductivity(
    projectId: string,
    startDate?: Date,
    endDate?: Date
  ) {
    const where: any = { projectId };

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    const tasks = await prisma.task.findMany({
      where,
      include: {
        assignee: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Group by assignee
    const userMetrics = tasks.reduce((acc: any, task) => {
      if (!task.assignee) return acc;

      const userId = task.assignee.id;
      if (!acc[userId]) {
        acc[userId] = {
          userId,
          userName: task.assignee.name,
          totalTasks: 0,
          completedTasks: 0,
          totalStoryPoints: 0,
          completedStoryPoints: 0,
        };
      }

      acc[userId].totalTasks++;
      acc[userId].totalStoryPoints += task.storyPoints || 0;

      if (task.status === "COMPLETED") {
        acc[userId].completedTasks++;
        acc[userId].completedStoryPoints += task.storyPoints || 0;
      }

      return acc;
    }, {});

    return {
      projectId,
      dateRange: {
        start: startDate || null,
        end: endDate || null,
      },
      teamMembers: Object.values(userMetrics).map((user: any) => ({
        ...user,
        completionRate:
          user.totalTasks > 0
            ? Math.round((user.completedTasks / user.totalTasks) * 100)
            : 0,
      })),
    };
  }

  /**
   * Get project health dashboard
   */
  async getProjectHealth(projectId: string) {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        tasks: {
          include: {
            assignee: true,
          },
        },
        sprints: {
          where: {
            status: { in: ["PLANNING", "ACTIVE"] },
          },
        },
        epics: {
          include: {
            tasks: true,
          },
        },
      },
    });

    if (!project) {
      throw new Error("Project not found");
    }

    const tasks = project.tasks;
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(
      (t: any) => t.status === "COMPLETED"
    ).length;
    const blockedTasks = await this.getBlockedTasksCount(projectId);
    const overdueTasks = tasks.filter(
      (t: any) =>
        t.dueDate &&
        new Date(t.dueDate) < new Date() &&
        t.status !== "COMPLETED"
    ).length;

    // Calculate backlog health
    const backlogTasks = tasks.filter((t: any) => !t.sprintId);
    const estimatedBacklog = backlogTasks.filter(
      (t: any) => t.storyPoints
    ).length;

    // Get active sprint info
    const activeSprint = project.sprints.find(
      (s: any) => s.status === "ACTIVE"
    );
    let sprintHealth = null;

    if (activeSprint) {
      const sprintTasks = tasks.filter(
        (t: any) => t.sprintId === activeSprint.id
      );
      const sprintCompleted = sprintTasks.filter(
        (t: any) => t.status === "COMPLETED"
      ).length;

      if (!activeSprint.startDate || !activeSprint.endDate) {
        sprintHealth = {
          sprintId: activeSprint.id,
          sprintName: activeSprint.name,
          timeProgress: 0,
          workProgress: 0,
          isOnTrack: false,
        };
      } else {
        const now = new Date();
        const start = new Date(activeSprint.startDate);
        const end = new Date(activeSprint.endDate);
        const totalDuration = end.getTime() - start.getTime();
        const elapsed = now.getTime() - start.getTime();
        const timeProgress = Math.min(
          100,
          Math.max(0, Math.round((elapsed / totalDuration) * 100))
        );

        const workProgress =
          sprintTasks.length > 0
            ? Math.round((sprintCompleted / sprintTasks.length) * 100)
            : 0;

        sprintHealth = {
          sprintId: activeSprint.id,
          sprintName: activeSprint.name,
          timeProgress,
          workProgress,
          isOnTrack: workProgress >= timeProgress - 10, // Within 10% tolerance
        };
      }
    }

    return {
      projectId,
      projectName: project.name,
      overview: {
        totalTasks,
        completedTasks,
        completionRate:
          totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
        blockedTasks,
        overdueTasks,
      },
      backlog: {
        totalTasks: backlogTasks.length,
        estimatedTasks: estimatedBacklog,
        estimationRate:
          backlogTasks.length > 0
            ? Math.round((estimatedBacklog / backlogTasks.length) * 100)
            : 0,
      },
      sprint: sprintHealth,
      epics: project.epics.map((epic: any) => ({
        id: epic.id,
        name: epic.name,
        totalTasks: epic.tasks.length,
        completedTasks: epic.tasks.filter((t: any) => t.status === "COMPLETED")
          .length,
      })),
    };
  }

  /**
   * Get task cycle time report
   */
  async getCycleTimeReport(projectId: string) {
    const tasks = await prisma.task.findMany({
      where: {
        projectId,
        status: "COMPLETED",
      },
      include: {
        activityLogs: {
          where: {
            action: "STATUS_UPDATE",
          },
          orderBy: { timestamp: "asc" },
        },
      },
    });

    const cycleTimeData = tasks
      .map((task) => {
        const startedActivity = task.activityLogs.find(
          (a: any) => a.newStatus === "IN_PROGRESS"
        );
        const completedActivity = task.activityLogs.find(
          (a: any) => a.newStatus === "COMPLETED"
        );

        if (startedActivity && completedActivity) {
          const start = new Date(startedActivity.timestamp);
          const end = new Date(completedActivity.timestamp);
          const cycleTimeDays = Math.ceil(
            (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
          );

          return {
            taskId: task.id,
            taskTitle: task.title,
            cycleTimeDays,
            storyPoints: task.storyPoints,
          };
        }

        return null;
      })
      .filter((data) => data !== null);

    const averageCycleTime =
      cycleTimeData.length > 0
        ? Math.round(
            cycleTimeData.reduce((sum, d: any) => sum + d.cycleTimeDays, 0) /
              cycleTimeData.length
          )
        : 0;

    return {
      projectId,
      averageCycleTime,
      totalCompletedTasks: cycleTimeData.length,
      tasks: cycleTimeData,
    };
  }

  /**
   * Get blocked tasks count
   */
  private async getBlockedTasksCount(projectId: string): Promise<number> {
    const tasks = await prisma.task.findMany({
      where: {
        projectId,
        status: { not: "COMPLETED" },
      },
      include: {
        dependentOn: {
          include: {
            blockingTask: {
              select: {
                status: true,
              },
            },
          },
        },
      },
    });

    const blockedTasks = tasks.filter((task) =>
      task.dependentOn.some(
        (dep: any) => dep.blockingTask.status !== "COMPLETED"
      )
    );

    return blockedTasks.length;
  }

  /**
   * Get burnup chart data for project
   */
  async getBurnupData(projectId: string) {
    const tasks = await prisma.task.findMany({
      where: { projectId },
      include: {
        activityLogs: {
          where: {
            OR: [
              { action: "CREATE" },
              { action: "STATUS_UPDATE", newStatus: "COMPLETED" },
            ],
          },
          orderBy: { timestamp: "asc" },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    if (tasks.length === 0) {
      return {
        projectId,
        burnupData: [],
      };
    }

    // Get date range
    const firstTask = tasks[0];
    if (!firstTask) {
      return {
        projectId,
        burnupData: [],
      };
    }
    const startDate = new Date(firstTask.createdAt);
    const endDate = new Date();

    const burnupData = [];
    let currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const totalScope = tasks.filter(
        (t) => new Date(t.createdAt) <= currentDate
      ).length;

      const completed = tasks.filter((t) => {
        const completedActivity = t.activityLogs.find(
          (a: any) =>
            a.action === "STATUS_UPDATE" &&
            a.newStatus === "COMPLETED" &&
            new Date(a.timestamp) <= currentDate
        );
        return completedActivity !== undefined;
      }).length;

      burnupData.push({
        date: currentDate.toISOString().split("T")[0],
        totalScope,
        completed,
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return {
      projectId,
      burnupData,
    };
  }
}

export default new ReportService();

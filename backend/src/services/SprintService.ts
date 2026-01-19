import prisma from "../db/prisma";

export interface Sprint {
  id: string;
  projectId: string;
  name: string;
  goal?: string;
  status: "PLANNING" | "ACTIVE" | "COMPLETED" | "CANCELLED";
  startDate: Date;
  endDate: Date;
  capacityHours?: number;
  createdAt: Date;
  updatedAt: Date;
}

class SprintService {
  /**
   * Create a new sprint
   */
  async createSprint(
    projectId: string,
    data: {
      name: string;
      goal?: string;
      startDate: Date;
      endDate: Date;
      capacityHours?: number;
    },
  ) {
    // Ensure no other active sprint exists
    const activeSprint = await prisma.sprint.findFirst({
      where: {
        projectId,
        status: "ACTIVE",
      },
    });

    if (activeSprint) {
      throw new Error("Project already has an active sprint");
    }

    const sprint = await prisma.sprint.create({
      data: {
        projectId,
        status: "PLANNING",
        ...data,
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return sprint;
  }

  /**
   * Get all sprints for a project
   */
  async getProjectSprints(projectId: string, includeCompleted = true) {
    const where: any = { projectId };

    if (!includeCompleted) {
      where.status = {
        in: ["PLANNING", "ACTIVE"],
      };
    }

    const sprints = await prisma.sprint.findMany({
      where,
      include: {
        tasks: {
          select: {
            id: true,
            title: true,
            status: true,
            storyPoints: true,
          },
        },
      },
      orderBy: { startDate: "desc" },
    });

    // Calculate statistics for each sprint
    return sprints.map((sprint) => ({
      ...sprint,
      stats: this.calculateSprintStats(sprint as any),
    }));
  }

  /**
   * Get sprint by ID with full details
   */
  async getSprintById(sprintId: string) {
    const sprint = await prisma.sprint.findUnique({
      where: { id: sprintId },
      include: {
        project: true,
        tasks: {
          include: {
            assignees: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                  },
                },
              },
            },
            epic: {
              select: {
                id: true,
                name: true,
                color: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!sprint) {
      throw new Error("Sprint not found");
    }

    return {
      ...sprint,
      stats: this.calculateSprintStats(sprint as any),
    };
  }

  /**
   * Update sprint
   */
  async updateSprint(
    sprintId: string,
    data: {
      name?: string;
      goal?: string;
      startDate?: Date;
      endDate?: Date;
      capacityHours?: number;
    },
  ) {
    const sprint = await prisma.sprint.update({
      where: { id: sprintId },
      data,
      include: {
        tasks: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    return sprint;
  }

  /**
   * Start a sprint (change status to ACTIVE)
   */
  async startSprint(sprintId: string) {
    const sprint = await prisma.sprint.findUnique({
      where: { id: sprintId },
    });

    if (!sprint) {
      throw new Error("Sprint not found");
    }

    if (sprint.status !== "PLANNING") {
      throw new Error("Only planning sprints can be started");
    }

    // Check for other active sprints
    const activeSprint = await prisma.sprint.findFirst({
      where: {
        projectId: sprint.projectId,
        status: "ACTIVE",
        id: { not: sprintId },
      },
    });

    if (activeSprint) {
      throw new Error("Another sprint is already active in this project");
    }

    const updatedSprint = await prisma.sprint.update({
      where: { id: sprintId },
      data: { status: "ACTIVE" },
      include: {
        tasks: true,
        project: {
          include: {
            members: {
              include: {
                user: {
                  select: {
                    email: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    // AUTOMATION: Send sprint started email to all project members
    if (
      updatedSprint.project &&
      updatedSprint.project.members.length > 0 &&
      updatedSprint.startDate &&
      updatedSprint.endDate
    ) {
      const emailService = require("./EmailService").default;
      const memberEmails = updatedSprint.project.members.map(
        (m) => m.user.email,
      );

      emailService
        .sendSprintStartedEmail(memberEmails, {
          teamMembers: updatedSprint.project.members.map((m) => m.user.name),
          sprintName: updatedSprint.name,
          sprintGoal: updatedSprint.goal || undefined,
          startDate: updatedSprint.startDate.toISOString(),
          endDate: updatedSprint.endDate.toISOString(),
          taskCount: updatedSprint.tasks.length,
        })
        .catch((err: any) =>
          console.error("Failed to send sprint started email:", err),
        );
    }

    return updatedSprint;
  }

  /**
   * Complete a sprint
   */
  async completeSprint(sprintId: string, moveIncompleteTo?: string) {
    const sprint = await prisma.sprint.findUnique({
      where: { id: sprintId },
      include: {
        tasks: true,
      },
    });

    if (!sprint) {
      throw new Error("Sprint not found");
    }

    if (sprint.status !== "ACTIVE") {
      throw new Error("Only active sprints can be completed");
    }

    // Move incomplete tasks if specified
    if (moveIncompleteTo) {
      const incompleteTasks = sprint.tasks.filter(
        (t: any) => t.status !== "COMPLETED",
      );

      await prisma.task.updateMany({
        where: {
          id: { in: incompleteTasks.map((t: any) => t.id) },
        },
        data: { sprintId: moveIncompleteTo },
      });
    } else {
      // Remove sprint from incomplete tasks
      await prisma.task.updateMany({
        where: {
          sprintId,
          status: { not: "COMPLETED" },
        },
        data: { sprintId: null },
      });
    }

    const completedSprint = await prisma.sprint.update({
      where: { id: sprintId },
      data: { status: "COMPLETED" },
      include: {
        tasks: true,
        project: {
          include: {
            members: {
              include: {
                user: {
                  select: {
                    email: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    // AUTOMATION: Send sprint completed email to all project members
    if (
      completedSprint.project &&
      completedSprint.project.members.length > 0 &&
      completedSprint.startDate &&
      completedSprint.endDate
    ) {
      const emailService = require("./EmailService").default;
      const memberEmails = completedSprint.project.members.map(
        (m) => m.user.email,
      );
      const completedTasks = completedSprint.tasks.filter(
        (t: any) => t.status === "COMPLETED",
      ).length;

      emailService
        .sendSprintCompletedEmail(memberEmails, {
          teamMembers: completedSprint.project.members.map((m) => m.user.name),
          sprintName: completedSprint.name,
          sprintGoal: completedSprint.goal || undefined,
          startDate: completedSprint.startDate.toISOString(),
          endDate: completedSprint.endDate.toISOString(),
          taskCount: completedSprint.tasks.length,
          completedTasks: completedTasks,
          totalTasks: completedSprint.tasks.length,
        })
        .catch((err: any) =>
          console.error("Failed to send sprint completed email:", err),
        );
    }

    return completedSprint;
  }

  /**
   * Cancel a sprint
   */
  async cancelSprint(sprintId: string) {
    const sprint = await prisma.sprint.findUnique({
      where: { id: sprintId },
    });

    if (!sprint) {
      throw new Error("Sprint not found");
    }

    if (sprint.status === "COMPLETED") {
      throw new Error("Cannot cancel a completed sprint");
    }

    // Remove sprint from all tasks
    await prisma.task.updateMany({
      where: { sprintId },
      data: { sprintId: null },
    });

    const cancelledSprint = await prisma.sprint.update({
      where: { id: sprintId },
      data: { status: "CANCELLED" },
    });

    return cancelledSprint;
  }

  /**
   * Add tasks to sprint
   */
  async addTasksToSprint(sprintId: string, taskIds: string[]) {
    const sprint = await prisma.sprint.findUnique({
      where: { id: sprintId },
    });

    if (!sprint) {
      throw new Error("Sprint not found");
    }

    if (sprint.status === "COMPLETED" || sprint.status === "CANCELLED") {
      throw new Error("Cannot add tasks to completed or cancelled sprint");
    }

    await prisma.task.updateMany({
      where: {
        id: { in: taskIds },
        projectId: sprint.projectId,
      },
      data: { sprintId },
    });

    return { message: `${taskIds.length} tasks added to sprint` };
  }

  /**
   * Remove tasks from sprint
   */
  async removeTasksFromSprint(taskIds: string[]) {
    await prisma.task.updateMany({
      where: { id: { in: taskIds } },
      data: { sprintId: null },
    });

    return { message: `${taskIds.length} tasks removed from sprint` };
  }

  /**
   * Get sprint burndown data
   */
  async getBurndownData(sprintId: string) {
    const sprint = await prisma.sprint.findUnique({
      where: { id: sprintId },
      include: {
        tasks: {
          include: {
            activityLogs: {
              where: {
                action: "STATUS_UPDATE",
              },
              orderBy: { timestamp: "asc" },
            },
          },
        },
      },
    });

    if (!sprint) {
      throw new Error("Sprint not found");
    }

    if (!sprint.startDate || !sprint.endDate) {
      throw new Error("Sprint must have start and end dates");
    }

    const startDate = new Date(sprint.startDate);
    const endDate = new Date(sprint.endDate);
    const totalDays = Math.ceil(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
    );

    // Calculate total story points
    const totalStoryPoints = sprint.tasks.reduce(
      (sum: number, task: any) => sum + (task.storyPoints || 0),
      0,
    );

    // Build burndown data for each day
    const burndownData = [];
    for (let i = 0; i <= totalDays; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(currentDate.getDate() + i);

      // Calculate remaining story points at end of this day
      let remainingPoints = totalStoryPoints;
      sprint.tasks.forEach((task: any) => {
        const completedActivity = task.activityLogs.find(
          (a: any) =>
            a.newStatus === "COMPLETED" && new Date(a.timestamp) <= currentDate,
        );
        if (completedActivity) {
          remainingPoints -= task.storyPoints || 0;
        }
      });

      burndownData.push({
        date: currentDate.toISOString().split("T")[0],
        remaining: remainingPoints,
        ideal: totalStoryPoints - (totalStoryPoints / totalDays) * i,
      });
    }

    return {
      sprintId,
      sprintName: sprint.name,
      totalStoryPoints,
      burndownData,
    };
  }

  /**
   * Calculate sprint velocity (completed story points)
   */
  async calculateVelocity(sprintId: string) {
    const sprint = await prisma.sprint.findUnique({
      where: { id: sprintId },
      include: {
        tasks: true,
      },
    });

    if (!sprint) {
      throw new Error("Sprint not found");
    }

    const completedPoints = sprint.tasks
      .filter((t: any) => t.status === "COMPLETED")
      .reduce((sum: number, t: any) => sum + (t.storyPoints || 0), 0);

    return {
      sprintId,
      sprintName: sprint.name,
      velocity: completedPoints,
      totalPlanned: sprint.tasks.reduce(
        (sum: number, t: any) => sum + (t.storyPoints || 0),
        0,
      ),
    };
  }

  /**
   * Get team velocity over last N sprints
   */
  async getTeamVelocity(projectId: string, lastNSprints = 3) {
    const completedSprints = await prisma.sprint.findMany({
      where: {
        projectId,
        status: "COMPLETED",
      },
      include: {
        tasks: true,
      },
      orderBy: { endDate: "desc" },
      take: lastNSprints,
    });

    const velocities = completedSprints.map((sprint) => {
      const completedPoints = sprint.tasks
        .filter((t: any) => t.status === "COMPLETED")
        .reduce((sum: number, t: any) => sum + (t.storyPoints || 0), 0);

      return {
        sprintId: sprint.id,
        sprintName: sprint.name,
        velocity: completedPoints,
      };
    });

    const averageVelocity =
      velocities.length > 0
        ? velocities.reduce((sum, v) => sum + v.velocity, 0) / velocities.length
        : 0;

    return {
      projectId,
      sprints: velocities,
      averageVelocity: Math.round(averageVelocity),
    };
  }

  /**
   * Calculate sprint statistics
   */
  private calculateSprintStats(sprint: any) {
    const tasks = sprint.tasks || [];
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(
      (t: any) => t.status === "COMPLETED",
    ).length;
    const totalStoryPoints = tasks.reduce(
      (sum: number, t: any) => sum + (t.storyPoints || 0),
      0,
    );
    const completedStoryPoints = tasks
      .filter((t: any) => t.status === "COMPLETED")
      .reduce((sum: number, t: any) => sum + (t.storyPoints || 0), 0);

    return {
      totalTasks,
      completedTasks,
      totalStoryPoints,
      completedStoryPoints,
      completionPercentage:
        totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
      storyPointsPercentage:
        totalStoryPoints > 0
          ? Math.round((completedStoryPoints / totalStoryPoints) * 100)
          : 0,
    };
  }
}

export default new SprintService();

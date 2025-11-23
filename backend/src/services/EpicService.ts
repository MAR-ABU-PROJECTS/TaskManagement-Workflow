import prisma from "../db/prisma";

export interface Epic {
  id: string;
  projectId: string;
  name: string;
  description?: string;
  color?: string;
  startDate?: Date;
  endDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

class EpicService {
  /**
   * Create a new epic
   */
  async createEpic(
    projectId: string,
    data: {
      name: string;
      description?: string;
      color?: string;
      startDate?: Date;
      endDate?: Date;
    }
  ) {
    const epic = await prisma.epic.create({
      data: {
        projectId,
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

    return epic;
  }

  /**
   * Get all epics for a project
   */
  async getProjectEpics(projectId: string) {
    const epics = await prisma.epic.findMany({
      where: { projectId },
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
      orderBy: { createdAt: "desc" },
    });

    // Calculate statistics for each epic
    return epics.map((epic) => ({
      ...epic,
      stats: {
        totalTasks: epic.tasks.length,
        completedTasks: epic.tasks.filter((t) => t.status === "COMPLETED")
          .length,
        totalStoryPoints: epic.tasks.reduce(
          (sum: number, t: any) => sum + (t.storyPoints || 0),
          0
        ),
      },
    }));
  }

  /**
   * Get epic by ID with full details
   */
  async getEpicById(epicId: string) {
    const epic = await prisma.epic.findUnique({
      where: { id: epicId },
      include: {
        project: true,
        tasks: {
          include: {
            assignee: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!epic) {
      throw new Error("Epic not found");
    }

    return epic;
  }

  /**
   * Update epic
   */
  async updateEpic(
    epicId: string,
    data: {
      name?: string;
      description?: string;
      color?: string;
      startDate?: Date;
      endDate?: Date;
    }
  ) {
    const epic = await prisma.epic.update({
      where: { id: epicId },
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

    return epic;
  }

  /**
   * Delete epic
   */
  async deleteEpic(epicId: string) {
    // Remove epic reference from all tasks
    await prisma.task.updateMany({
      where: { epicId },
      data: { epicId: null },
    });

    await prisma.epic.delete({
      where: { id: epicId },
    });

    return { message: "Epic deleted successfully" };
  }

  /**
   * Add task to epic
   */
  async addTaskToEpic(epicId: string, taskId: string) {
    const task = await prisma.task.update({
      where: { id: taskId },
      data: { epicId },
      include: {
        epic: true,
      },
    });

    return task;
  }

  /**
   * Remove task from epic
   */
  async removeTaskFromEpic(taskId: string) {
    const task = await prisma.task.update({
      where: { id: taskId },
      data: { epicId: null },
    });

    return task;
  }
}

export default new EpicService();

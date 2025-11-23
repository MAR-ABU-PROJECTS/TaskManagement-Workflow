import prisma from "../db/prisma";
import { UserRole } from "../types/enums";

export interface TimeEntry {
  id: string;
  taskId: string;
  userId: string;
  hours: number;
  description?: string;
  date: Date;
  createdAt: Date;
  updatedAt: Date;
  user?: any;
  task?: any;
}

export interface ActiveTimer {
  id: string;
  taskId: string;
  userId: string;
  startTime: Date;
  description?: string;
}

export class TimeTrackingService {
  /**
   * Log time for a task
   */
  async logTime(
    taskId: string,
    userId: string,
    hours: number,
    description?: string,
    date?: Date
  ): Promise<TimeEntry> {
    // Validate task exists
    const task = await prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      throw new Error("Task not found");
    }

    // Validate user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error("User not found");
    }

    // Validate hours
    if (hours <= 0 || hours > 24) {
      throw new Error("Hours must be between 0 and 24");
    }

    const timeEntry = await prisma.timeEntry.create({
      data: {
        taskId,
        userId,
        hours,
        description: description || null,
        date: date || new Date(),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        task: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    // Update task's logged hours (if you want to cache it)
    const totalHours = await this.getTaskTotalHours(taskId);
    await prisma.task.update({
      where: { id: taskId },
      data: { loggedHours: totalHours },
    });

    return timeEntry as TimeEntry;
  }

  /**
   * Get time entries for a task
   */
  async getTaskTimeEntries(taskId: string): Promise<TimeEntry[]> {
    const entries = await prisma.timeEntry.findMany({
      where: { taskId },
      orderBy: { date: "desc" },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return entries as TimeEntry[];
  }

  /**
   * Get time entries for a user
   */
  async getUserTimeEntries(
    userId: string,
    filters?: {
      startDate?: Date;
      endDate?: Date;
      taskId?: string;
      projectId?: string;
    }
  ): Promise<TimeEntry[]> {
    const where: any = { userId };

    if (filters?.startDate || filters?.endDate) {
      where.date = {};
      if (filters.startDate) {
        where.date.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.date.lte = filters.endDate;
      }
    }

    if (filters?.taskId) {
      where.taskId = filters.taskId;
    }

    if (filters?.projectId) {
      where.task = { projectId: filters.projectId };
    }

    const entries = await prisma.timeEntry.findMany({
      where,
      orderBy: { date: "desc" },
      include: {
        task: {
          select: {
            id: true,
            title: true,
            projectId: true,
          },
        },
      },
    });

    return entries as TimeEntry[];
  }

  /**
   * Update time entry
   */
  async updateTimeEntry(
    entryId: string,
    userId: string,
    userRole: UserRole,
    data: {
      hours?: number;
      description?: string;
      date?: Date;
    }
  ): Promise<TimeEntry> {
    const entry = await prisma.timeEntry.findUnique({
      where: { id: entryId },
    });

    if (!entry) {
      throw new Error("Time entry not found");
    }

    // Only the creator or management can edit time entries
    const canEdit =
      entry.userId === userId ||
      [UserRole.CEO, UserRole.HOO, UserRole.HR, UserRole.ADMIN].includes(
        userRole
      );

    if (!canEdit) {
      throw new Error(
        "Forbidden: You do not have permission to edit this time entry"
      );
    }

    // Validate hours if provided
    if (data.hours !== undefined && (data.hours <= 0 || data.hours > 24)) {
      throw new Error("Hours must be between 0 and 24");
    }

    const updated = await prisma.timeEntry.update({
      where: { id: entryId },
      data: {
        ...(data.hours !== undefined && { hours: data.hours }),
        ...(data.description !== undefined && {
          description: data.description,
        }),
        ...(data.date !== undefined && { date: data.date }),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        task: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    // Update task's total logged hours
    const totalHours = await this.getTaskTotalHours(entry.taskId);
    await prisma.task.update({
      where: { id: entry.taskId },
      data: { loggedHours: totalHours },
    });

    return updated as TimeEntry;
  }

  /**
   * Delete time entry
   */
  async deleteTimeEntry(
    entryId: string,
    userId: string,
    userRole: UserRole
  ): Promise<boolean> {
    const entry = await prisma.timeEntry.findUnique({
      where: { id: entryId },
    });

    if (!entry) {
      return false;
    }

    // Only the creator or management can delete time entries
    const canDelete =
      entry.userId === userId ||
      [UserRole.CEO, UserRole.HOO, UserRole.HR, UserRole.ADMIN].includes(
        userRole
      );

    if (!canDelete) {
      throw new Error(
        "Forbidden: You do not have permission to delete this time entry"
      );
    }

    await prisma.timeEntry.delete({
      where: { id: entryId },
    });

    // Update task's total logged hours
    const totalHours = await this.getTaskTotalHours(entry.taskId);
    await prisma.task.update({
      where: { id: entry.taskId },
      data: { loggedHours: totalHours },
    });

    return true;
  }

  /**
   * Start timer for a task
   */
  async startTimer(
    taskId: string,
    userId: string,
    description?: string
  ): Promise<ActiveTimer> {
    // Check if user already has an active timer
    const existingTimer = await prisma.activeTimer.findFirst({
      where: { userId },
    });

    if (existingTimer) {
      throw new Error(
        "You already have an active timer. Stop it before starting a new one."
      );
    }

    // Validate task exists
    const task = await prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      throw new Error("Task not found");
    }

    const timer = await prisma.activeTimer.create({
      data: {
        taskId,
        userId,
        description: description || null,
        startTime: new Date(),
      },
    });

    return timer as ActiveTimer;
  }

  /**
   * Stop timer and log time
   */
  async stopTimer(userId: string): Promise<TimeEntry> {
    const timer = await prisma.activeTimer.findFirst({
      where: { userId },
    });

    if (!timer) {
      throw new Error("No active timer found");
    }

    const endTime = new Date();
    const startTime = new Date(timer.startTime);
    const hoursWorked =
      (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);

    // Round to 2 decimal places
    const roundedHours = Math.round(hoursWorked * 100) / 100;

    // Log the time
    const timeEntry = await this.logTime(
      timer.taskId,
      userId,
      roundedHours,
      timer.description || undefined,
      endTime
    );

    // Delete the timer
    await prisma.activeTimer.delete({
      where: { id: timer.id },
    });

    return timeEntry;
  }

  /**
   * Get active timer for user
   */
  async getActiveTimer(userId: string): Promise<ActiveTimer | null> {
    const timer = await prisma.activeTimer.findFirst({
      where: { userId },
      include: {
        task: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    return timer as ActiveTimer | null;
  }

  /**
   * Get total hours for a task
   */
  async getTaskTotalHours(taskId: string): Promise<number> {
    const result = await prisma.timeEntry.aggregate({
      where: { taskId },
      _sum: {
        hours: true,
      },
    });

    return result._sum.hours || 0;
  }

  /**
   * Get time summary for a project
   */
  async getProjectTimeSummary(projectId: string): Promise<{
    totalHours: number;
    estimatedHours: number;
    remainingHours: number;
    loggedByUser: Array<{ userId: string; userName: string; hours: number }>;
  }> {
    const tasks = await prisma.task.findMany({
      where: { projectId },
      include: {
        timeEntries: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    const estimatedHours = tasks.reduce(
      (sum, task) => sum + (task.estimatedHours || 0),
      0
    );

    const totalHours = tasks.reduce((sum, task) => {
      const taskHours = task.timeEntries.reduce(
        (taskSum, entry) => taskSum + entry.hours,
        0
      );
      return sum + taskHours;
    }, 0);

    const remainingHours = Math.max(0, estimatedHours - totalHours);

    // Group by user
    const userHours: Record<string, { name: string; hours: number }> = {};

    tasks.forEach((task) => {
      task.timeEntries.forEach((entry) => {
        if (!userHours[entry.userId]) {
          userHours[entry.userId] = {
            name: entry.user.name,
            hours: 0,
          };
        }
        userHours[entry.userId].hours += entry.hours;
      });
    });

    const loggedByUser = Object.entries(userHours).map(
      ([userId, { name, hours }]) => ({
        userId,
        userName: name,
        hours: Math.round(hours * 100) / 100,
      })
    );

    return {
      totalHours: Math.round(totalHours * 100) / 100,
      estimatedHours,
      remainingHours: Math.round(remainingHours * 100) / 100,
      loggedByUser,
    };
  }

  /**
   * Get user's time summary for a date range
   */
  async getUserTimeSummary(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{
    totalHours: number;
    entriesCount: number;
    byTask: Array<{
      taskId: string;
      taskTitle: string;
      hours: number;
    }>;
  }> {
    const entries = await this.getUserTimeEntries(userId, {
      startDate,
      endDate,
    });

    const totalHours = entries.reduce((sum, entry) => sum + entry.hours, 0);

    // Group by task
    const taskHours: Record<string, { title: string; hours: number }> = {};

    entries.forEach((entry) => {
      if (!taskHours[entry.taskId]) {
        taskHours[entry.taskId] = {
          title: entry.task?.title || "Unknown",
          hours: 0,
        };
      }
      taskHours[entry.taskId].hours += entry.hours;
    });

    const byTask = Object.entries(taskHours).map(
      ([taskId, { title, hours }]) => ({
        taskId,
        taskTitle: title,
        hours: Math.round(hours * 100) / 100,
      })
    );

    return {
      totalHours: Math.round(totalHours * 100) / 100,
      entriesCount: entries.length,
      byTask,
    };
  }
}

export default new TimeTrackingService();

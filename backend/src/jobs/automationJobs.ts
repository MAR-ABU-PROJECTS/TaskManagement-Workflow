import cron from "node-cron";
import prisma from "../db/prisma";
import NotificationService from "../services/NotificationService";
import { TaskStatus } from "../types/enums";

/**
 * AUTOMATION: Deadline reminder at 24 hours
 * Runs every hour to check tasks due in the next 24 hours
 */
export const startDeadlineReminderChecker = () => {
  cron.schedule("0 * * * *", async () => {
    console.log(
      `[${new Date().toISOString()}] Running deadline reminder check...`
    );

    try {
      const now = new Date();
      const twentyFourHoursFromNow = new Date(
        now.getTime() + 24 * 60 * 60 * 1000
      );

      const upcomingTasks = await prisma.task.findMany({
        where: {
          dueDate: {
            gte: now,
            lte: twentyFourHoursFromNow,
          },
          status: {
            notIn: [TaskStatus.COMPLETED, TaskStatus.REJECTED],
          },
        },
        include: {
          assignee: true,
          creator: true,
        },
      });

      for (const task of upcomingTasks) {
        // Notify assignee
        if (task.assigneeId) {
          await NotificationService.notifyTaskAssigned(
            task.id,
            task.assigneeId,
            task.creatorId
          );
        }

        // Notify creator
        if (task.creatorId && task.creatorId !== task.assigneeId) {
          await NotificationService.notifyTaskAssigned(
            task.id,
            task.creatorId,
            task.creatorId
          );
        }
      }

      console.log(
        `[${new Date().toISOString()}] Deadline reminder check completed. Notified ${
          upcomingTasks.length
        } tasks.`
      );
    } catch (error) {
      console.error(
        `[${new Date().toISOString()}] Error in deadline reminder check:`,
        error
      );
    }
  });

  console.log("Deadline reminder checker started (runs hourly)");
};

/**
 * AUTOMATION: Overdue auto-label
 * Runs every hour to add "OVERDUE" label to overdue tasks
 */
export const startOverdueAutoLabeler = () => {
  cron.schedule("0 * * * *", async () => {
    console.log(
      `[${new Date().toISOString()}] Running overdue auto-labeler...`
    );

    try {
      const now = new Date();

      const overdueTasks = await prisma.task.findMany({
        where: {
          dueDate: {
            lt: now,
          },
          status: {
            notIn: [TaskStatus.COMPLETED, TaskStatus.REJECTED],
          },
        },
      });

      for (const task of overdueTasks) {
        const currentLabels = (task.labels as string[]) || [];

        if (!currentLabels.includes("OVERDUE")) {
          await prisma.task.update({
            where: { id: task.id },
            data: {
              labels: [...currentLabels, "OVERDUE"],
            },
          });
        }
      }

      console.log(
        `[${new Date().toISOString()}] Overdue auto-labeler completed. Labeled ${
          overdueTasks.length
        } tasks.`
      );
    } catch (error) {
      console.error(
        `[${new Date().toISOString()}] Error in overdue auto-labeler:`,
        error
      );
    }
  });

  console.log("Overdue auto-labeler started (runs hourly)");
};

/**
 * Start all automation cron jobs
 */
export const startAutomationJobs = () => {
  startDeadlineReminderChecker();
  startOverdueAutoLabeler();
};

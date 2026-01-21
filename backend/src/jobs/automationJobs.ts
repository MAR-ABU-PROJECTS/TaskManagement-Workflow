import cron from "node-cron";
import prisma from "../db/prisma";
import NotificationService from "../services/NotificationService";
import emailService from "../services/EmailService";
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
          assignees: { include: { user: true } },
          creator: true,
        },
      });

      for (const task of upcomingTasks) {
        // Notify all assignees
        for (const assignment of task.assignees) {
          await NotificationService.notifyTaskAssigned(
            task.id,
            assignment.userId,
            task.creatorId
          );
        }

        // Notify creator if not already notified as assignee
        const creatorIsAssignee = task.assignees.some(
          (a) => a.userId === task.creatorId
        );
        if (task.creatorId && !creatorIsAssignee) {
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
 * AUTOMATION: Project deadline reminder (daily)
 * Sends reminder emails for projects due within the next 4 days
 */
export const startProjectDeadlineReminderChecker = () => {
  cron.schedule("0 9 * * *", async () => {
    console.log(
      `[${new Date().toISOString()}] Running project deadline reminder check...`
    );

    try {
      const now = new Date();
      const todayStart = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate()
      );
      const windowEnd = new Date(todayStart);
      windowEnd.setDate(todayStart.getDate() + 4);
      windowEnd.setHours(23, 59, 59, 999);

      const upcomingProjects = await prisma.project.findMany({
        where: {
          dueDate: {
            gte: todayStart,
            lte: windowEnd,
          },
        },
        include: {
          creator: {
            select: { id: true, name: true, email: true },
          },
          members: {
            include: {
              user: { select: { id: true, name: true, email: true } },
            },
          },
        },
      });

      for (const project of upcomingProjects) {
        const dueDate = project.dueDate;
        if (!dueDate) continue;

        const daysRemaining = Math.max(
          0,
          Math.ceil(
            (dueDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)
          )
        );

        const recipients = new Set<string>();
        if (project.creator?.email) {
          recipients.add(project.creator.email);
        }
        for (const member of project.members) {
          if (member.user?.email) {
            recipients.add(member.user.email);
          }
        }

        for (const email of recipients) {
          await emailService.sendProjectDeadlineReminderEmail(email, {
            projectId: project.id,
            projectName: project.name,
            dueDate: dueDate.toISOString(),
            daysRemaining,
          });
        }
      }

      console.log(
        `[${new Date().toISOString()}] Project deadline reminder completed. Notified ${
          upcomingProjects.length
        } projects.`
      );
    } catch (error) {
      console.error(
        `[${new Date().toISOString()}] Error in project deadline reminder check:`,
        error
      );
    }
  });

  console.log("Project deadline reminder checker started (runs daily)");
};

/**
 * AUTOMATION: Retry failed emails
 * Runs every 30 seconds to resend queued emails
 */
export const startEmailRetryProcessor = () => {
  cron.schedule("*/30 * * * * *", async () => {
    try {
      await emailService.processEmailRetryQueue();
    } catch (error) {
      console.error(
        `[${new Date().toISOString()}] Error processing email retry queue:`,
        error
      );
    }
  });

  console.log("Email retry processor started (runs every 30 seconds)");
};

/**
 * Start all automation cron jobs
 */
export const startAutomationJobs = () => {
  startDeadlineReminderChecker();
  startOverdueAutoLabeler();
  startProjectDeadlineReminderChecker();
  startEmailRetryProcessor();
};

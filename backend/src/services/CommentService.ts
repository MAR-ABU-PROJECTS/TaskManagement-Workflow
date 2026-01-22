import prisma from "../db/prisma";
import { CreateCommentDTO } from "../types/interfaces";
import NotificationService from "./NotificationService";
import ActivityLogService from "./ActivityLogService";
import { ActivityAction } from "../types/enums";
import emailService from "./EmailService";

export class CommentService {
  private formatCommentForEmail(message: string): string {
    // Convert mention markup like "@[Name](userId)" to "@Name" for emails.
    return message.replace(/@\[(.+?)\]\([^)]+\)/g, "@$1");
  }

  /**
   * Create a comment on a task
   */
  async createComment(
    taskId: string,
    userId: string,
    data: CreateCommentDTO,
  ): Promise<any> {
    // Accept both 'message' and 'content' fields
    const messageText = data.message || data.content || "";

    if (!messageText) {
      throw new Error("Comment message/content is required");
    }

    // Verify task exists
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
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
        project: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!task) {
      throw new Error("Task not found");
    }

    const comment = await prisma.taskComment.create({
      data: {
        taskId,
        userId,
        message: messageText,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });

    // Log activity
    await ActivityLogService.logActivity({
      taskId,
      userId,
      action: ActivityAction.COMMENT,
      metadata: { commentId: comment.id },
    });

    const emailCommentText = this.formatCommentForEmail(messageText);

    // AUTOMATION: Send email to task creator if they're not the commenter
    if (task.creatorId && task.creatorId !== userId) {
      const creator = task.creator;
      if (creator) {
        emailService
          .sendCommentNotificationEmail(creator.email, {
            recipientName: creator.name,
            commenterName: comment.user?.name || "Unknown",
            taskTitle: task.title,
            taskId: task.id,
            commentText: emailCommentText,
            projectName: task.project?.name,
            commentId: comment.id,
          })
          .catch((err) =>
            console.error("Failed to send comment email to creator:", err),
          );
      }
    }

    // AUTOMATION: Send email to all assignees if they're not the commenter and not the creator
    for (const assignment of task.assignees) {
      if (
        assignment.userId !== userId &&
        assignment.userId !== task.creatorId
      ) {
        emailService
          .sendCommentNotificationEmail(assignment.user.email, {
            recipientName: assignment.user.name,
            commenterName: comment.user?.name || "Unknown",
            taskTitle: task.title,
            taskId: task.id,
            commentText: emailCommentText,
            projectName: task.project?.name,
            commentId: comment.id,
          })
          .catch((err) =>
            console.error("Failed to send comment email to assignee:", err),
          );
      }
    }

    // AUTOMATION: @Mention notifications
    const mentionRegex = /@(\w+)/g;
    const mentions = messageText.match(mentionRegex);
    if (mentions) {
      const usernames = mentions.map((m) => m.substring(1));
      const mentionedUsers = await prisma.user.findMany({
        where: {
          OR: [
            { name: { in: usernames } },
            { email: { in: usernames.map((u) => `${u}@example.com`) } },
          ],
        },
      });

      for (const user of mentionedUsers) {
        await NotificationService.notifyComment(taskId, user.id, messageText);

        // Send mention email
        emailService
          .sendMentionEmail(user.email, {
            mentionedUserName: user.name,
            commenterName: comment.user?.name || "Unknown",
            taskTitle: task.title,
            taskId: task.id,
            commentText: emailCommentText,
            commentId: comment.id,
          })
          .catch((err) => console.error("Failed to send mention email:", err));
      }
    }

    // AUTOMATION: Notify all watchers
    await NotificationService.notifyComment(taskId, userId, messageText);

    return comment;
  }

  /**
   * Get all comments for a task
   */
  async getTaskComments(taskId: string): Promise<any[]> {
    const comments = await prisma.taskComment.findMany({
      where: { taskId },
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });

    return comments;
  }

  /**
   * Delete a comment (only by creator or management)
   */
  async deleteComment(
    commentId: string,
    userId: string,
    userRole: string,
  ): Promise<boolean> {
    const comment = await prisma.taskComment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      return false;
    }

    // Only creator or CEO/HOO/HR can delete
    const canDelete =
      comment.userId === userId || ["CEO", "HOO", "HR"].includes(userRole);

    if (!canDelete) {
      throw new Error("Forbidden: You cannot delete this comment");
    }

    await prisma.taskComment.delete({
      where: { id: commentId },
    });

    return true;
  }
}

export default new CommentService();

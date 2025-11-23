import prisma from "../db/prisma";
import { CreateCommentDTO } from "../types/interfaces";
import NotificationService from "./NotificationService";
import ActivityLogService from "./ActivityLogService";
import { ActivityAction } from "../types/enums";

export class CommentService {
  /**
   * Create a comment on a task
   */
  async createComment(
    taskId: string,
    userId: string,
    data: CreateCommentDTO
  ): Promise<any> {
    // Verify task exists
    const task = await prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      throw new Error("Task not found");
    }

    const comment = await prisma.taskComment.create({
      data: {
        taskId,
        userId,
        message: data.message,
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

    // Send notifications
    await NotificationService.notifyComment(taskId, userId, data.message);

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
    userRole: string
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

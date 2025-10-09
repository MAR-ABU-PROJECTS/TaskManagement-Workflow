import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';
import { TaskComment } from '../types/task.types';
import { NotificationService } from './NotificationService';

const prisma = new PrismaClient();

export interface CreateCommentRequest {
  taskId: string;
  authorId: string;
  content: string;
  parentId?: string;
}

export interface UpdateCommentRequest {
  content: string;
}

export interface CommentFilters {
  taskId?: string;
  authorId?: string;
  parentId?: string;
  includeReplies?: boolean;
}

export class TaskCommentService {
  private notificationService: NotificationService;

  constructor() {
    this.notificationService = new NotificationService();
  }

  /**
   * Create a new comment on a task
   */
  async createComment(commentData: CreateCommentRequest): Promise<TaskComment> {
    try {
      // Validate task exists
      const task = await prisma.task.findUnique({
        where: { id: commentData.taskId },
        include: {
          assignee: true,
          reporter: true,
          project: {
            include: {
              members: {
                include: { user: true }
              }
            }
          }
        }
      });

      if (!task) {
        throw new Error('Task not found');
      }

      // Validate parent comment exists if specified
      if (commentData.parentId) {
        const parentComment = await prisma.comment.findUnique({
          where: { id: commentData.parentId }
        });

        if (!parentComment || parentComment.taskId !== commentData.taskId) {
          throw new Error('Parent comment not found or not on the same task');
        }
      }

      // Extract mentions from content
      const mentions = this.extractMentions(commentData.content);

      // Create comment
      const comment = await prisma.comment.create({
        data: {
          taskId: commentData.taskId,
          authorId: commentData.authorId,
          content: commentData.content,
          parentId: commentData.parentId,
          mentions,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        include: {
          author: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          },
          replies: {
            include: {
              author: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true
                }
              }
            },
            orderBy: { createdAt: 'asc' }
          }
        }
      });

      // Send notifications
      await this.sendCommentNotifications(comment, task, mentions);

      // Log activity
      await this.logCommentActivity(commentData.taskId, commentData.authorId, 'COMMENTED', comment.id);

      logger.info(`Comment created on task ${task.key} by user ${commentData.authorId}`);
      return this.mapCommentFromDb(comment);
    } catch (error) {
      logger.error('Error creating comment:', error);
      throw error;
    }
  }

  /**
   * Get comments for a task
   */
  async getTaskComments(taskId: string, includeReplies: boolean = true): Promise<TaskComment[]> {
    try {
      const comments = await prisma.comment.findMany({
        where: {
          taskId,
          parentId: null // Only get top-level comments
        },
        include: {
          author: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          },
          replies: includeReplies ? {
            include: {
              author: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true
                }
              }
            },
            orderBy: { createdAt: 'asc' }
          } : false
        },
        orderBy: { createdAt: 'desc' }
      });

      return comments.map(comment => this.mapCommentFromDb(comment));
    } catch (error) {
      logger.error('Error getting task comments:', error);
      throw error;
    }
  }

  /**
   * Get a specific comment by ID
   */
  async getComment(commentId: string): Promise<TaskComment | null> {
    try {
      const comment = await prisma.comment.findUnique({
        where: { id: commentId },
        include: {
          author: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          },
          replies: {
            include: {
              author: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true
                }
              }
            },
            orderBy: { createdAt: 'asc' }
          }
        }
      });

      if (!comment) {
        return null;
      }

      return this.mapCommentFromDb(comment);
    } catch (error) {
      logger.error('Error getting comment:', error);
      throw error;
    }
  }

  /**
   * Update a comment
   */
  async updateComment(
    commentId: string,
    updateData: UpdateCommentRequest,
    userId: string
  ): Promise<TaskComment> {
    try {
      // Get existing comment
      const existingComment = await prisma.comment.findUnique({
        where: { id: commentId },
        include: { author: true }
      });

      if (!existingComment) {
        throw new Error('Comment not found');
      }

      // Check if user can update this comment
      if (existingComment.authorId !== userId) {
        throw new Error('You can only update your own comments');
      }

      // Extract mentions from updated content
      const mentions = this.extractMentions(updateData.content);

      // Update comment
      const updatedComment = await prisma.comment.update({
        where: { id: commentId },
        data: {
          content: updateData.content,
          mentions,
          updatedAt: new Date()
        },
        include: {
          author: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          },
          replies: {
            include: {
              author: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true
                }
              }
            },
            orderBy: { createdAt: 'asc' }
          }
        }
      });

      // Log activity
      await this.logCommentActivity(
        existingComment.taskId!,
        userId,
        'COMMENT_UPDATED',
        commentId
      );

      logger.info(`Comment ${commentId} updated by user ${userId}`);
      return this.mapCommentFromDb(updatedComment);
    } catch (error) {
      logger.error('Error updating comment:', error);
      throw error;
    }
  }

  /**
   * Delete a comment
   */
  async deleteComment(commentId: string, userId: string): Promise<void> {
    try {
      // Get existing comment
      const existingComment = await prisma.comment.findUnique({
        where: { id: commentId },
        include: { 
          author: true,
          replies: true
        }
      });

      if (!existingComment) {
        throw new Error('Comment not found');
      }

      // Check if user can delete this comment
      if (existingComment.authorId !== userId) {
        // TODO: Add permission check for project managers/admins
        throw new Error('You can only delete your own comments');
      }

      // Check if comment has replies
      if (existingComment.replies && existingComment.replies.length > 0) {
        throw new Error('Cannot delete comment with replies. Delete replies first.');
      }

      // Delete comment
      await prisma.comment.delete({
        where: { id: commentId }
      });

      // Log activity
      await this.logCommentActivity(
        existingComment.taskId!,
        userId,
        'COMMENT_DELETED',
        commentId
      );

      logger.info(`Comment ${commentId} deleted by user ${userId}`);
    } catch (error) {
      logger.error('Error deleting comment:', error);
      throw error;
    }
  }

  /**
   * Get comment thread (comment and all its replies)
   */
  async getCommentThread(commentId: string): Promise<TaskComment | null> {
    try {
      const comment = await prisma.comment.findUnique({
        where: { id: commentId },
        include: {
          author: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          },
          replies: {
            include: {
              author: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true
                }
              },
              replies: {
                include: {
                  author: {
                    select: {
                      id: true,
                      firstName: true,
                      lastName: true,
                      email: true
                    }
                  }
                },
                orderBy: { createdAt: 'asc' }
              }
            },
            orderBy: { createdAt: 'asc' }
          }
        }
      });

      if (!comment) {
        return null;
      }

      return this.mapCommentFromDb(comment);
    } catch (error) {
      logger.error('Error getting comment thread:', error);
      throw error;
    }
  }

  /**
   * Search comments
   */
  async searchComments(
    filters: CommentFilters,
    options: {
      page?: number;
      limit?: number;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
    } = {}
  ): Promise<{
    comments: TaskComment[];
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
  }> {
    try {
      const page = options.page || 1;
      const limit = options.limit || 50;
      const skip = (page - 1) * limit;

      // Build where clause
      const whereClause: any = {};

      if (filters.taskId) {
        whereClause.taskId = filters.taskId;
      }

      if (filters.authorId) {
        whereClause.authorId = filters.authorId;
      }

      if (filters.parentId !== undefined) {
        whereClause.parentId = filters.parentId;
      }

      // Build order by clause
      const orderBy: any = {};
      if (options.sortBy) {
        orderBy[options.sortBy] = options.sortOrder || 'asc';
      } else {
        orderBy.createdAt = 'desc';
      }

      // Get comments
      const [comments, total] = await Promise.all([
        prisma.comment.findMany({
          where: whereClause,
          include: {
            author: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            },
            replies: filters.includeReplies ? {
              include: {
                author: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true
                  }
                }
              },
              orderBy: { createdAt: 'asc' }
            } : false
          },
          orderBy,
          skip,
          take: limit
        }),
        prisma.comment.count({ where: whereClause })
      ]);

      return {
        comments: comments.map(comment => this.mapCommentFromDb(comment)),
        total,
        page,
        limit,
        hasMore: skip + comments.length < total
      };
    } catch (error) {
      logger.error('Error searching comments:', error);
      throw error;
    }
  }

  // Private helper methods

  /**
   * Extract @mentions from comment content
   */
  private extractMentions(content: string): string[] {
    const mentionRegex = /@(\w+)/g;
    const mentions: string[] = [];
    let match;

    while ((match = mentionRegex.exec(content)) !== null) {
      mentions.push(match[1]);
    }

    return [...new Set(mentions)]; // Remove duplicates
  }

  /**
   * Send notifications for new comments
   */
  private async sendCommentNotifications(
    comment: any,
    task: any,
    mentions: string[]
  ): Promise<void> {
    try {
      const recipients = new Set<string>();

      // Add task assignee
      if (task.assigneeId && task.assigneeId !== comment.authorId) {
        recipients.add(task.assigneeId);
      }

      // Add task reporter
      if (task.reporterId && task.reporterId !== comment.authorId) {
        recipients.add(task.reporterId);
      }

      // Add project members who have commented on this task
      const taskCommenters = await prisma.comment.findMany({
        where: { taskId: task.id },
        select: { authorId: true },
        distinct: ['authorId']
      });

      taskCommenters.forEach(commenter => {
        if (commenter.authorId !== comment.authorId) {
          recipients.add(commenter.authorId);
        }
      });

      // Add mentioned users
      if (mentions.length > 0) {
        const mentionedUsers = await prisma.user.findMany({
          where: {
            OR: [
              { email: { in: mentions } },
              { firstName: { in: mentions } },
              { lastName: { in: mentions } }
            ]
          },
          select: { id: true }
        });

        mentionedUsers.forEach(user => {
          if (user.id !== comment.authorId) {
            recipients.add(user.id);
          }
        });
      }

      // Send notifications
      for (const recipientId of recipients) {
        await this.notificationService.createNotification({
          userId: recipientId,
          type: 'TASK_COMMENTED',
          title: `New comment on ${task.key}`,
          message: `${comment.author.firstName} ${comment.author.lastName} commented on task "${task.title}"`,
          data: {
            taskId: task.id,
            taskKey: task.key,
            commentId: comment.id,
            authorId: comment.authorId,
            authorName: `${comment.author.firstName} ${comment.author.lastName}`
          }
        });
      }
    } catch (error) {
      logger.error('Error sending comment notifications:', error);
      // Don't throw error for notification failures
    }
  }

  /**
   * Log comment activity
   */
  private async logCommentActivity(
    taskId: string,
    userId: string,
    action: string,
    commentId: string
  ): Promise<void> {
    try {
      await prisma.auditLog.create({
        data: {
          userId,
          action,
          resource: 'COMMENT',
          resourceId: commentId,
          newValues: { taskId },
          createdAt: new Date()
        }
      });
    } catch (error) {
      logger.error('Error logging comment activity:', error);
      // Don't throw error for logging failures
    }
  }

  /**
   * Map comment from database to domain model
   */
  private mapCommentFromDb(dbComment: any): TaskComment {
    return {
      id: dbComment.id,
      taskId: dbComment.taskId,
      authorId: dbComment.authorId,
      content: dbComment.content,
      parentId: dbComment.parentId,
      mentions: dbComment.mentions || [],
      createdAt: dbComment.createdAt,
      updatedAt: dbComment.updatedAt,
      author: dbComment.author ? {
        id: dbComment.author.id,
        firstName: dbComment.author.firstName,
        lastName: dbComment.author.lastName,
        email: dbComment.author.email
      } : undefined,
      replies: dbComment.replies ? dbComment.replies.map((reply: any) => this.mapCommentFromDb(reply)) : undefined
    };
  }
}
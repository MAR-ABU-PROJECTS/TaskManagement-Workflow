import { Request, Response } from 'express';
import { TaskCommentService, CreateCommentRequest, UpdateCommentRequest } from '../services/TaskCommentService';
import { logger } from '../utils/logger';
import { AuthenticatedRequest } from '../middleware/auth';

export class TaskCommentController {
  private commentService: TaskCommentService;

  constructor() {
    this.commentService = new TaskCommentService();
  }

  /**
   * Create a new comment on a task
   * POST /api/tasks/:taskId/comments
   */
  async createComment(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { taskId } = req.params;
      const { content, parentId } = req.body;
      const userId = req.user!.id;

      if (!content || content.trim().length === 0) {
        res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Comment content is required'
          }
        });
        return;
      }

      if (content.length > 10000) {
        res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Comment content cannot exceed 10000 characters'
          }
        });
        return;
      }

      const commentData: CreateCommentRequest = {
        taskId,
        authorId: userId,
        content: content.trim(),
        parentId
      };

      const comment = await this.commentService.createComment(commentData);

      res.status(201).json({
        success: true,
        data: comment
      });
    } catch (error) {
      logger.error('Error creating comment:', error);
      
      if (error.message === 'Task not found') {
        res.status(404).json({
          error: {
            code: 'TASK_NOT_FOUND',
            message: 'Task not found'
          }
        });
        return;
      }

      if (error.message.includes('Parent comment not found')) {
        res.status(400).json({
          error: {
            code: 'PARENT_COMMENT_NOT_FOUND',
            message: 'Parent comment not found or not on the same task'
          }
        });
        return;
      }

      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to create comment'
        }
      });
    }
  }

  /**
   * Get comments for a task
   * GET /api/tasks/:taskId/comments
   */
  async getTaskComments(req: Request, res: Response): Promise<void> {
    try {
      const { taskId } = req.params;
      const includeReplies = req.query.includeReplies !== 'false';

      const comments = await this.commentService.getTaskComments(taskId, includeReplies);

      res.json({
        success: true,
        data: comments
      });
    } catch (error) {
      logger.error('Error getting task comments:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to get task comments'
        }
      });
    }
  }

  /**
   * Get a specific comment
   * GET /api/comments/:commentId
   */
  async getComment(req: Request, res: Response): Promise<void> {
    try {
      const { commentId } = req.params;

      const comment = await this.commentService.getComment(commentId);

      if (!comment) {
        res.status(404).json({
          error: {
            code: 'COMMENT_NOT_FOUND',
            message: 'Comment not found'
          }
        });
        return;
      }

      res.json({
        success: true,
        data: comment
      });
    } catch (error) {
      logger.error('Error getting comment:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to get comment'
        }
      });
    }
  }

  /**
   * Update a comment
   * PUT /api/comments/:commentId
   */
  async updateComment(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { commentId } = req.params;
      const { content } = req.body;
      const userId = req.user!.id;

      if (!content || content.trim().length === 0) {
        res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Comment content is required'
          }
        });
        return;
      }

      if (content.length > 10000) {
        res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Comment content cannot exceed 10000 characters'
          }
        });
        return;
      }

      const updateData: UpdateCommentRequest = {
        content: content.trim()
      };

      const comment = await this.commentService.updateComment(commentId, updateData, userId);

      res.json({
        success: true,
        data: comment
      });
    } catch (error) {
      logger.error('Error updating comment:', error);
      
      if (error.message === 'Comment not found') {
        res.status(404).json({
          error: {
            code: 'COMMENT_NOT_FOUND',
            message: 'Comment not found'
          }
        });
        return;
      }

      if (error.message === 'You can only update your own comments') {
        res.status(403).json({
          error: {
            code: 'ACCESS_DENIED',
            message: 'You can only update your own comments'
          }
        });
        return;
      }

      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to update comment'
        }
      });
    }
  }

  /**
   * Delete a comment
   * DELETE /api/comments/:commentId
   */
  async deleteComment(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { commentId } = req.params;
      const userId = req.user!.id;

      await this.commentService.deleteComment(commentId, userId);

      res.json({
        success: true,
        message: 'Comment deleted successfully'
      });
    } catch (error) {
      logger.error('Error deleting comment:', error);
      
      if (error.message === 'Comment not found') {
        res.status(404).json({
          error: {
            code: 'COMMENT_NOT_FOUND',
            message: 'Comment not found'
          }
        });
        return;
      }

      if (error.message === 'You can only delete your own comments') {
        res.status(403).json({
          error: {
            code: 'ACCESS_DENIED',
            message: 'You can only delete your own comments'
          }
        });
        return;
      }

      if (error.message.includes('Cannot delete comment with replies')) {
        res.status(400).json({
          error: {
            code: 'HAS_REPLIES',
            message: 'Cannot delete comment with replies. Delete replies first.'
          }
        });
        return;
      }

      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to delete comment'
        }
      });
    }
  }

  /**
   * Get comment thread (comment and all its replies)
   * GET /api/comments/:commentId/thread
   */
  async getCommentThread(req: Request, res: Response): Promise<void> {
    try {
      const { commentId } = req.params;

      const thread = await this.commentService.getCommentThread(commentId);

      if (!thread) {
        res.status(404).json({
          error: {
            code: 'COMMENT_NOT_FOUND',
            message: 'Comment not found'
          }
        });
        return;
      }

      res.json({
        success: true,
        data: thread
      });
    } catch (error) {
      logger.error('Error getting comment thread:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to get comment thread'
        }
      });
    }
  }

  /**
   * Search comments
   * GET /api/comments/search
   */
  async searchComments(req: Request, res: Response): Promise<void> {
    try {
      const {
        taskId,
        authorId,
        parentId,
        includeReplies,
        page = '1',
        limit = '50',
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = req.query;

      const filters = {
        taskId: taskId as string,
        authorId: authorId as string,
        parentId: parentId === 'null' ? null : (parentId as string),
        includeReplies: includeReplies === 'true'
      };

      const options = {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        sortBy: sortBy as string,
        sortOrder: sortOrder as 'asc' | 'desc'
      };

      const result = await this.commentService.searchComments(filters, options);

      res.json({
        success: true,
        data: result.comments,
        pagination: {
          total: result.total,
          page: result.page,
          limit: result.limit,
          hasMore: result.hasMore
        }
      });
    } catch (error) {
      logger.error('Error searching comments:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to search comments'
        }
      });
    }
  }
}
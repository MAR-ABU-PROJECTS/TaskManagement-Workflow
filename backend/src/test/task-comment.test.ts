import { TaskCommentService } from '../services/TaskCommentService';
import { PrismaClient } from '@prisma/client';

// Mock Prisma
jest.mock('@prisma/client');
const mockPrisma = {
  task: {
    findUnique: jest.fn(),
  },
  comment: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  user: {
    findMany: jest.fn(),
  },
  auditLog: {
    create: jest.fn(),
  },
};

// Mock logger
jest.mock('../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

// Mock NotificationService
jest.mock('../services/NotificationService', () => ({
  NotificationService: jest.fn().mockImplementation(() => ({
    createNotification: jest.fn(),
  })),
}));

describe('TaskCommentService', () => {
  let commentService: TaskCommentService;

  beforeEach(() => {
    jest.clearAllMocks();
    // Replace the actual prisma instance with our mock
    (PrismaClient as jest.Mock).mockImplementation(() => mockPrisma);
    commentService = new TaskCommentService();
  });

  describe('createComment', () => {
    const mockTask = {
      id: 'task-1',
      key: 'TEST-1',
      title: 'Test Task',
      assignee: { id: 'user-2', firstName: 'John', lastName: 'Doe' },
      reporter: { id: 'user-3', firstName: 'Jane', lastName: 'Smith' },
      project: {
        id: 'project-1',
        members: [
          { user: { id: 'user-2', firstName: 'John', lastName: 'Doe' } },
          { user: { id: 'user-3', firstName: 'Jane', lastName: 'Smith' } },
        ],
      },
    };

    const mockComment = {
      id: 'comment-1',
      taskId: 'task-1',
      authorId: 'user-1',
      content: 'This is a test comment',
      parentId: null,
      mentions: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      author: {
        id: 'user-1',
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
      },
      replies: [],
    };

    it('should create a comment successfully', async () => {
      mockPrisma.task.findUnique.mockResolvedValue(mockTask);
      mockPrisma.comment.create.mockResolvedValue(mockComment);

      const result = await commentService.createComment({
        taskId: 'task-1',
        authorId: 'user-1',
        content: 'This is a test comment',
      });

      expect(mockPrisma.task.findUnique).toHaveBeenCalledWith({
        where: { id: 'task-1' },
        include: expect.any(Object),
      });

      expect(mockPrisma.comment.create).toHaveBeenCalledWith({
        data: {
          taskId: 'task-1',
          authorId: 'user-1',
          content: 'This is a test comment',
          parentId: undefined,
          mentions: [],
          createdAt: expect.any(Date),
          updatedAt: expect.any(Date),
        },
        include: expect.any(Object),
      });

      expect(result).toEqual({
        id: 'comment-1',
        taskId: 'task-1',
        authorId: 'user-1',
        content: 'This is a test comment',
        parentId: null,
        mentions: [],
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
        author: {
          id: 'user-1',
          firstName: 'Test',
          lastName: 'User',
          email: 'test@example.com',
        },
        replies: undefined,
      });
    });

    it('should throw error if task not found', async () => {
      mockPrisma.task.findUnique.mockResolvedValue(null);

      await expect(
        commentService.createComment({
          taskId: 'non-existent-task',
          authorId: 'user-1',
          content: 'This is a test comment',
        })
      ).rejects.toThrow('Task not found');
    });

    it('should extract mentions from comment content', async () => {
      mockPrisma.task.findUnique.mockResolvedValue(mockTask);
      mockPrisma.comment.create.mockResolvedValue({
        ...mockComment,
        content: 'Hello @john and @jane',
        mentions: ['john', 'jane'],
      });

      await commentService.createComment({
        taskId: 'task-1',
        authorId: 'user-1',
        content: 'Hello @john and @jane',
      });

      expect(mockPrisma.comment.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          mentions: ['john', 'jane'],
        }),
        include: expect.any(Object),
      });
    });
  });

  describe('getTaskComments', () => {
    const mockComments = [
      {
        id: 'comment-1',
        taskId: 'task-1',
        authorId: 'user-1',
        content: 'First comment',
        parentId: null,
        mentions: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        author: {
          id: 'user-1',
          firstName: 'Test',
          lastName: 'User',
          email: 'test@example.com',
        },
        replies: [],
      },
    ];

    it('should get task comments successfully', async () => {
      mockPrisma.comment.findMany.mockResolvedValue(mockComments);

      const result = await commentService.getTaskComments('task-1');

      expect(mockPrisma.comment.findMany).toHaveBeenCalledWith({
        where: {
          taskId: 'task-1',
          parentId: null,
        },
        include: expect.any(Object),
        orderBy: { createdAt: 'desc' },
      });

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('comment-1');
    });

    it('should get task comments without replies when specified', async () => {
      mockPrisma.comment.findMany.mockResolvedValue(mockComments);

      await commentService.getTaskComments('task-1', false);

      expect(mockPrisma.comment.findMany).toHaveBeenCalledWith({
        where: {
          taskId: 'task-1',
          parentId: null,
        },
        include: {
          author: expect.any(Object),
          replies: false,
        },
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('updateComment', () => {
    const mockComment = {
      id: 'comment-1',
      taskId: 'task-1',
      authorId: 'user-1',
      content: 'Original content',
      author: { id: 'user-1' },
    };

    const mockUpdatedComment = {
      ...mockComment,
      content: 'Updated content',
      mentions: [],
      updatedAt: new Date(),
      author: {
        id: 'user-1',
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
      },
      replies: [],
    };

    it('should update comment successfully', async () => {
      mockPrisma.comment.findUnique.mockResolvedValue(mockComment);
      mockPrisma.comment.update.mockResolvedValue(mockUpdatedComment);

      const result = await commentService.updateComment(
        'comment-1',
        { content: 'Updated content' },
        'user-1'
      );

      expect(mockPrisma.comment.findUnique).toHaveBeenCalledWith({
        where: { id: 'comment-1' },
        include: { author: true },
      });

      expect(mockPrisma.comment.update).toHaveBeenCalledWith({
        where: { id: 'comment-1' },
        data: {
          content: 'Updated content',
          mentions: [],
          updatedAt: expect.any(Date),
        },
        include: expect.any(Object),
      });

      expect(result.content).toBe('Updated content');
    });

    it('should throw error if comment not found', async () => {
      mockPrisma.comment.findUnique.mockResolvedValue(null);

      await expect(
        commentService.updateComment('non-existent-comment', { content: 'Updated' }, 'user-1')
      ).rejects.toThrow('Comment not found');
    });

    it('should throw error if user is not the author', async () => {
      mockPrisma.comment.findUnique.mockResolvedValue(mockComment);

      await expect(
        commentService.updateComment('comment-1', { content: 'Updated' }, 'user-2')
      ).rejects.toThrow('You can only update your own comments');
    });
  });

  describe('deleteComment', () => {
    const mockComment = {
      id: 'comment-1',
      taskId: 'task-1',
      authorId: 'user-1',
      author: { id: 'user-1' },
      replies: [],
    };

    it('should delete comment successfully', async () => {
      mockPrisma.comment.findUnique.mockResolvedValue(mockComment);
      mockPrisma.comment.delete.mockResolvedValue(mockComment);

      await commentService.deleteComment('comment-1', 'user-1');

      expect(mockPrisma.comment.findUnique).toHaveBeenCalledWith({
        where: { id: 'comment-1' },
        include: {
          author: true,
          replies: true,
        },
      });

      expect(mockPrisma.comment.delete).toHaveBeenCalledWith({
        where: { id: 'comment-1' },
      });
    });

    it('should throw error if comment has replies', async () => {
      const commentWithReplies = {
        ...mockComment,
        replies: [{ id: 'reply-1' }],
      };
      mockPrisma.comment.findUnique.mockResolvedValue(commentWithReplies);

      await expect(
        commentService.deleteComment('comment-1', 'user-1')
      ).rejects.toThrow('Cannot delete comment with replies');
    });
  });
});
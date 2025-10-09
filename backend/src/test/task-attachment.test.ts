import { TaskAttachmentService } from '../services/TaskAttachmentService';
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs/promises';

// Mock Prisma
jest.mock('@prisma/client');
const mockPrisma = {
  task: {
    findUnique: jest.fn(),
  },
  attachment: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
    groupBy: jest.fn(),
    aggregate: jest.fn(),
  },
  auditLog: {
    create: jest.fn(),
  },
};

// Mock fs/promises
jest.mock('fs/promises');
const mockFs = fs as jest.Mocked<typeof fs>;

// Mock logger
jest.mock('../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

describe('TaskAttachmentService', () => {
  let attachmentService: TaskAttachmentService;

  beforeEach(() => {
    jest.clearAllMocks();
    // Replace the actual prisma instance with our mock
    (PrismaClient as jest.Mock).mockImplementation(() => mockPrisma);
    
    // Mock fs operations
    mockFs.access.mockResolvedValue(undefined);
    mockFs.writeFile.mockResolvedValue(undefined);
    mockFs.readFile.mockResolvedValue(Buffer.from('test file content'));
    mockFs.unlink.mockResolvedValue(undefined);
    mockFs.mkdir.mockResolvedValue(undefined);

    attachmentService = new TaskAttachmentService();
  });

  describe('uploadAttachment', () => {
    const mockTask = {
      id: 'task-1',
      key: 'TEST-1',
      projectId: 'project-1',
    };

    const mockAttachment = {
      id: 'attachment-1',
      taskId: 'task-1',
      filename: 'test-file.pdf',
      originalName: 'document.pdf',
      mimeType: 'application/pdf',
      size: 1024,
      path: '/uploads/attachments/test-file.pdf',
      uploadedBy: 'user-1',
      createdAt: new Date(),
    };

    const mockFile = {
      originalName: 'document.pdf',
      mimeType: 'application/pdf',
      size: 1024,
      buffer: Buffer.from('test file content'),
    };

    it('should upload attachment successfully', async () => {
      mockPrisma.task.findUnique.mockResolvedValue(mockTask);
      mockPrisma.attachment.create.mockResolvedValue(mockAttachment);

      const result = await attachmentService.uploadAttachment({
        taskId: 'task-1',
        uploadedBy: 'user-1',
        file: mockFile,
      });

      expect(mockPrisma.task.findUnique).toHaveBeenCalledWith({
        where: { id: 'task-1' },
        select: { id: true, key: true, projectId: true },
      });

      expect(mockFs.writeFile).toHaveBeenCalled();
      expect(mockPrisma.attachment.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          taskId: 'task-1',
          originalName: 'document.pdf',
          mimeType: 'application/pdf',
          size: 1024,
          uploadedBy: 'user-1',
        }),
      });

      expect(result).toEqual({
        id: 'attachment-1',
        taskId: 'task-1',
        filename: 'test-file.pdf',
        originalName: 'document.pdf',
        mimeType: 'application/pdf',
        size: 1024,
        path: '/uploads/attachments/test-file.pdf',
        uploadedBy: 'user-1',
        createdAt: expect.any(Date),
        uploader: undefined,
      });
    });

    it('should throw error if task not found', async () => {
      mockPrisma.task.findUnique.mockResolvedValue(null);

      await expect(
        attachmentService.uploadAttachment({
          taskId: 'non-existent-task',
          uploadedBy: 'user-1',
          file: mockFile,
        })
      ).rejects.toThrow('Task not found');
    });

    it('should throw error for file size exceeding limit', async () => {
      mockPrisma.task.findUnique.mockResolvedValue(mockTask);

      const largeFile = {
        ...mockFile,
        size: 20 * 1024 * 1024, // 20MB
      };

      await expect(
        attachmentService.uploadAttachment({
          taskId: 'task-1',
          uploadedBy: 'user-1',
          file: largeFile,
        })
      ).rejects.toThrow('File size exceeds maximum allowed size');
    });

    it('should throw error for disallowed file type', async () => {
      mockPrisma.task.findUnique.mockResolvedValue(mockTask);

      const disallowedFile = {
        ...mockFile,
        mimeType: 'application/x-executable',
      };

      await expect(
        attachmentService.uploadAttachment({
          taskId: 'task-1',
          uploadedBy: 'user-1',
          file: disallowedFile,
        })
      ).rejects.toThrow('File type application/x-executable is not allowed');
    });

    it('should throw error for dangerous file extensions', async () => {
      mockPrisma.task.findUnique.mockResolvedValue(mockTask);

      const dangerousFile = {
        ...mockFile,
        originalName: 'malware.exe',
        mimeType: 'application/octet-stream',
      };

      await expect(
        attachmentService.uploadAttachment({
          taskId: 'task-1',
          uploadedBy: 'user-1',
          file: dangerousFile,
        })
      ).rejects.toThrow('File extension .exe is not allowed for security reasons');
    });
  });

  describe('getTaskAttachments', () => {
    const mockAttachments = [
      {
        id: 'attachment-1',
        taskId: 'task-1',
        filename: 'test-file.pdf',
        originalName: 'document.pdf',
        mimeType: 'application/pdf',
        size: 1024,
        path: '/uploads/attachments/test-file.pdf',
        uploadedBy: 'user-1',
        createdAt: new Date(),
      },
    ];

    it('should get task attachments successfully', async () => {
      mockPrisma.attachment.findMany.mockResolvedValue(mockAttachments);

      const result = await attachmentService.getTaskAttachments('task-1');

      expect(mockPrisma.attachment.findMany).toHaveBeenCalledWith({
        where: { taskId: 'task-1' },
        orderBy: { createdAt: 'desc' },
      });

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('attachment-1');
    });
  });

  describe('downloadAttachment', () => {
    const mockAttachment = {
      id: 'attachment-1',
      taskId: 'task-1',
      filename: 'test-file.pdf',
      originalName: 'document.pdf',
      mimeType: 'application/pdf',
      size: 1024,
      path: '/uploads/attachments/test-file.pdf',
      uploadedBy: 'user-1',
      createdAt: new Date(),
      task: {
        project: {
          members: [{ id: 'member-1' }],
        },
      },
    };

    it('should download attachment successfully', async () => {
      mockPrisma.attachment.findUnique.mockResolvedValue(mockAttachment);
      const mockBuffer = Buffer.from('test file content');
      mockFs.readFile.mockResolvedValue(mockBuffer);

      const result = await attachmentService.downloadAttachment('attachment-1', 'user-1');

      expect(mockPrisma.attachment.findUnique).toHaveBeenCalledWith({
        where: { id: 'attachment-1' },
        include: expect.any(Object),
      });

      expect(mockFs.access).toHaveBeenCalledWith('/uploads/attachments/test-file.pdf');
      expect(mockFs.readFile).toHaveBeenCalledWith('/uploads/attachments/test-file.pdf');

      expect(result).toEqual({
        filename: 'test-file.pdf',
        originalName: 'document.pdf',
        mimeType: 'application/pdf',
        buffer: mockBuffer,
      });
    });

    it('should throw error if attachment not found', async () => {
      mockPrisma.attachment.findUnique.mockResolvedValue(null);

      await expect(
        attachmentService.downloadAttachment('non-existent-attachment', 'user-1')
      ).rejects.toThrow('Attachment not found');
    });

    it('should throw error if user has no access', async () => {
      const attachmentWithoutAccess = {
        ...mockAttachment,
        task: {
          project: {
            members: [], // No members, so no access
          },
        },
      };
      mockPrisma.attachment.findUnique.mockResolvedValue(attachmentWithoutAccess);

      await expect(
        attachmentService.downloadAttachment('attachment-1', 'user-1')
      ).rejects.toThrow('Access denied');
    });

    it('should throw error if file not found on disk', async () => {
      mockPrisma.attachment.findUnique.mockResolvedValue(mockAttachment);
      mockFs.access.mockRejectedValue(new Error('File not found'));

      await expect(
        attachmentService.downloadAttachment('attachment-1', 'user-1')
      ).rejects.toThrow('File not found on disk');
    });
  });

  describe('deleteAttachment', () => {
    const mockAttachment = {
      id: 'attachment-1',
      taskId: 'task-1',
      path: '/uploads/attachments/test-file.pdf',
      uploadedBy: 'user-1',
      task: {
        project: {
          members: [{ role: 'OWNER' }],
        },
      },
    };

    it('should delete attachment successfully', async () => {
      mockPrisma.attachment.findUnique.mockResolvedValue(mockAttachment);
      mockPrisma.attachment.delete.mockResolvedValue(mockAttachment);

      await attachmentService.deleteAttachment('attachment-1', 'user-1');

      expect(mockFs.unlink).toHaveBeenCalledWith('/uploads/attachments/test-file.pdf');
      expect(mockPrisma.attachment.delete).toHaveBeenCalledWith({
        where: { id: 'attachment-1' },
      });
    });

    it('should throw error if attachment not found', async () => {
      mockPrisma.attachment.findUnique.mockResolvedValue(null);

      await expect(
        attachmentService.deleteAttachment('non-existent-attachment', 'user-1')
      ).rejects.toThrow('Attachment not found');
    });

    it('should throw error if user cannot delete attachment', async () => {
      const attachmentWithoutPermission = {
        ...mockAttachment,
        uploadedBy: 'user-2', // Different user
        task: {
          project: {
            members: [{ role: 'VIEWER' }], // No admin privileges
          },
        },
      };
      mockPrisma.attachment.findUnique.mockResolvedValue(attachmentWithoutPermission);

      await expect(
        attachmentService.deleteAttachment('attachment-1', 'user-1')
      ).rejects.toThrow('You can only delete your own attachments or you need admin privileges');
    });
  });

  describe('getAttachmentStatistics', () => {
    it('should get attachment statistics successfully', async () => {
      mockPrisma.attachment.count.mockResolvedValue(5);
      mockPrisma.attachment.aggregate.mockResolvedValue({ _sum: { size: 5120 } });
      mockPrisma.attachment.groupBy
        .mockResolvedValueOnce([
          { mimeType: 'application/pdf', _count: 3 },
          { mimeType: 'image/jpeg', _count: 2 },
        ])
        .mockResolvedValueOnce([
          { uploadedBy: 'user-1', _count: 3 },
          { uploadedBy: 'user-2', _count: 2 },
        ]);

      const result = await attachmentService.getAttachmentStatistics('task-1');

      expect(result).toEqual({
        totalAttachments: 5,
        totalSize: 5120,
        byMimeType: {
          'application/pdf': 3,
          'image/jpeg': 2,
        },
        byUploader: {
          'user-1': 3,
          'user-2': 2,
        },
      });
    });
  });
});
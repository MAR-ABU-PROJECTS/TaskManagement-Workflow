# Task Collaboration Features

This document describes the task collaboration features including comments, attachments, and activity tracking.

## Overview

The task collaboration system provides:
- **Threaded Comments**: Support for comments and replies with @mentions
- **File Attachments**: Upload and manage files attached to tasks
- **Activity Feed**: Track all changes and activities on tasks
- **Notifications**: Real-time notifications for task updates and mentions

## API Endpoints

### Task Comments

#### Create Comment
```http
POST /api/tasks/{taskId}/comments
Content-Type: application/json

{
  "content": "This is a comment with @mention",
  "parentId": "optional-parent-comment-id"
}
```

#### Get Task Comments
```http
GET /api/tasks/{taskId}/comments?includeReplies=true
```

#### Update Comment
```http
PUT /api/comments/{commentId}
Content-Type: application/json

{
  "content": "Updated comment content"
}
```

#### Delete Comment
```http
DELETE /api/comments/{commentId}
```

#### Get Comment Thread
```http
GET /api/comments/{commentId}/thread
```

#### Search Comments
```http
GET /api/comments/search?taskId={taskId}&authorId={userId}&page=1&limit=50
```

### Task Attachments

#### Upload Attachment
```http
POST /api/tasks/{taskId}/attachments
Content-Type: multipart/form-data

file: [binary file data]
```

#### Get Task Attachments
```http
GET /api/tasks/{taskId}/attachments
```

#### Download Attachment
```http
GET /api/attachments/{attachmentId}/download
```

#### Delete Attachment
```http
DELETE /api/attachments/{attachmentId}
```

#### Search Attachments
```http
GET /api/attachments/search?taskId={taskId}&mimeType=application/pdf
```

#### Get Attachment Statistics
```http
GET /api/attachments/statistics?taskId={taskId}
```

### Task Activity

#### Get Task Activity
```http
GET /api/tasks/{taskId}/activity?page=1&limit=50&sortOrder=desc
```

#### Get Activity Feed
```http
GET /api/activity/feed?taskId={taskId}&userId={userId}&dateFrom=2024-01-01
```

#### Get Activity Statistics
```http
GET /api/activity/statistics?taskId={taskId}
```

#### Get User Recent Activity
```http
GET /api/activity/recent?limit=20
```

## Features

### Comments

#### Threaded Comments
- Support for nested comments (replies)
- Maximum nesting depth of 3 levels
- Comments can be edited by their authors
- Comments with replies cannot be deleted (must delete replies first)

#### @Mentions
- Mention users using @username format
- Mentioned users receive notifications
- Mentions are extracted and stored separately for efficient querying

#### Content Validation
- Maximum comment length: 10,000 characters
- HTML content is sanitized
- Markdown formatting supported

### Attachments

#### File Upload
- Maximum file size: 10MB (configurable)
- Allowed file types:
  - Images: JPEG, PNG, GIF, WebP
  - Documents: PDF, Word, Excel, PowerPoint
  - Text: Plain text, CSV, JSON, XML
  - Archives: ZIP
- Dangerous file extensions are blocked for security

#### File Management
- Files are stored with unique names to prevent conflicts
- Original filenames are preserved for display
- File metadata is tracked (size, mime type, upload date)
- Files are automatically deleted when attachments are removed

#### Access Control
- Users can only download attachments from tasks they have access to
- Users can delete their own attachments
- Project admins can delete any attachment in their projects

### Activity Tracking

#### Automatic Activity Logging
All task changes are automatically logged:
- Task creation, updates, deletion
- Status transitions
- Assignment changes
- Comment additions/updates/deletions
- Attachment uploads/deletions
- Field value changes

#### Activity Types
- `CREATED`: Task was created
- `UPDATED`: Task fields were updated
- `STATUS_CHANGED`: Task status was changed
- `ASSIGNED`: Task was assigned to a user
- `COMMENTED`: Comment was added
- `COMMENT_UPDATED`: Comment was modified
- `COMMENT_DELETED`: Comment was removed
- `ATTACHMENT_UPLOADED`: File was attached
- `ATTACHMENT_DOWNLOADED`: File was downloaded
- `ATTACHMENT_DELETED`: Attachment was removed

#### Activity Data
Each activity entry includes:
- Timestamp
- User who performed the action
- Action type
- Field that was changed (if applicable)
- Old and new values
- Additional context/comments

## Notifications

### Notification Triggers
- Task assignment changes
- New comments on tasks you're involved with
- @mentions in comments
- Status changes on assigned tasks
- Approaching due dates

### Notification Recipients
- Task assignee
- Task reporter
- Users who have commented on the task
- Mentioned users
- Project team members (configurable)

### Notification Channels
- In-app notifications
- Email notifications (configurable)
- Real-time WebSocket updates (future)

## Security Considerations

### File Upload Security
- File type validation based on MIME type and extension
- Dangerous file extensions are blocked (.exe, .bat, .scr, etc.)
- Files are stored outside the web root
- Virus scanning integration (recommended for production)

### Access Control
- All endpoints require authentication
- Users can only access tasks they have permission to view
- Comment authors can edit/delete their own comments
- Project admins have elevated permissions

### Data Validation
- All input is validated and sanitized
- SQL injection prevention through parameterized queries
- XSS prevention through content sanitization
- File upload size limits enforced

## Performance Considerations

### Database Optimization
- Indexes on frequently queried fields (taskId, authorId, createdAt)
- Pagination for large result sets
- Efficient queries with proper joins and includes

### File Storage
- Files stored on disk with configurable upload directory
- File cleanup when attachments are deleted
- Optional integration with cloud storage (S3, etc.)

### Caching
- Activity statistics can be cached
- Comment counts cached at task level
- File metadata cached for quick access

## Configuration

### Environment Variables
```bash
# File upload settings
UPLOAD_PATH=./uploads/attachments
MAX_FILE_SIZE=10485760  # 10MB in bytes

# Notification settings
ENABLE_EMAIL_NOTIFICATIONS=true
NOTIFICATION_FROM_EMAIL=noreply@example.com

# Activity cleanup
ACTIVITY_RETENTION_DAYS=365
```

### Database Configuration
Ensure proper indexes are created:
```sql
-- Comments
CREATE INDEX idx_comments_task_id ON comments(task_id);
CREATE INDEX idx_comments_author_id ON comments(author_id);
CREATE INDEX idx_comments_created_at ON comments(created_at);

-- Attachments
CREATE INDEX idx_attachments_task_id ON attachments(task_id);
CREATE INDEX idx_attachments_uploaded_by ON attachments(uploaded_by);

-- Audit logs (for activity tracking)
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource, resource_id);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
```

## Error Handling

### Common Error Codes
- `TASK_NOT_FOUND`: Task does not exist
- `COMMENT_NOT_FOUND`: Comment does not exist
- `ATTACHMENT_NOT_FOUND`: Attachment does not exist
- `ACCESS_DENIED`: User lacks permission
- `VALIDATION_ERROR`: Invalid input data
- `FILE_TOO_LARGE`: File exceeds size limit
- `INVALID_FILE_TYPE`: File type not allowed
- `SECURITY_VIOLATION`: Dangerous file detected

### Error Response Format
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Comment content is required",
    "timestamp": "2024-01-15T10:30:00Z",
    "requestId": "req-123456"
  }
}
```

## Usage Examples

### Adding a Comment with Mention
```javascript
const response = await fetch('/api/tasks/task-123/comments', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + token
  },
  body: JSON.stringify({
    content: 'Hey @john, can you review this task?'
  })
});
```

### Uploading an Attachment
```javascript
const formData = new FormData();
formData.append('file', fileInput.files[0]);

const response = await fetch('/api/tasks/task-123/attachments', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + token
  },
  body: formData
});
```

### Getting Task Activity
```javascript
const response = await fetch('/api/tasks/task-123/activity?page=1&limit=20', {
  headers: {
    'Authorization': 'Bearer ' + token
  }
});

const data = await response.json();
console.log('Activities:', data.data);
console.log('Total:', data.pagination.total);
```

## Future Enhancements

### Planned Features
- Real-time collaboration with WebSocket support
- Rich text editor for comments with formatting
- File preview for common file types
- Bulk operations for comments and attachments
- Advanced search with full-text indexing
- Integration with external file storage services
- Automated activity summaries and reports
- Comment templates and quick replies
- File versioning for attachments
- Advanced notification preferences and filtering
# User Administration System

## Overview

The MAR ABU Project Management system provides comprehensive administrative capabilities for user management, system monitoring, audit logging, and compliance reporting.

## Core Features

### User Management
- **User Invitations**: Send secure invitation links via email
- **Bulk Operations**: Update, activate, or deactivate multiple users
- **Session Management**: Monitor and control user sessions
- **Role Management**: Assign and modify user roles

### Data Management
- **Export**: Export user data in CSV, JSON, or Excel formats
- **Import**: Bulk import users from various file formats
- **Filtering**: Advanced filtering options for data operations

### Audit and Compliance
- **Audit Logging**: Comprehensive tracking of all admin actions
- **Compliance Reports**: Generate reports for regulatory compliance
- **Activity Monitoring**: Track user activity and system usage

### System Monitoring
- **Dashboard**: Real-time statistics and metrics
- **Health Checks**: Monitor system component health
- **Performance Metrics**: Track system performance and usage

## API Endpoints

### Dashboard
- `GET /api/admin/dashboard/stats` - Get admin dashboard statistics

### User Management
- `POST /api/admin/users/invite` - Invite user via email
- `POST /api/admin/users/bulk-update` - Bulk update users
- `GET /api/admin/users/:userId/audit` - Get user audit log
- `POST /api/admin/users/:userId/force-logout` - Force user logout

### Data Operations
- `POST /api/admin/users/export` - Export user data
- `POST /api/admin/users/import` - Import user data

### System Monitoring
- `GET /api/admin/system/info` - Get system information
- `GET /api/admin/system/health` - Get system health status

### Public Endpoints
- `POST /api/public/accept-invitation` - Accept user invitation
- `GET /api/public/invitation/:token` - Get invitation details

## Security Features

- **Admin-Only Access**: All admin endpoints require ADMIN role
- **Comprehensive Audit Logging**: All actions are logged
- **Secure Invitations**: Time-limited invitation tokens
- **Session Control**: Force logout and session termination

## Usage Examples

### Invite User
```typescript
const inviteData = {
  email: 'newuser@example.com',
  role: 'DEVELOPER',
  message: 'Welcome to the team!'
};

const result = await adminService.inviteUser(inviteData, adminUserId);
```

### Bulk Update Users
```typescript
const bulkUpdate = {
  updates: [
    { userId: 'user-1', data: { department: 'Engineering' } },
    { userId: 'user-2', data: { role: 'TEAM_LEAD' } }
  ]
};

const result = await adminService.bulkUpdateUsers(bulkUpdate, adminUserId);
```

### Export Users
```typescript
const filters = { roles: ['DEVELOPER'], isActive: true };
const result = await adminService.exportUsers(filters, 'csv', adminUserId);
```

## Testing

The admin system includes comprehensive tests covering:
- User invitation workflows
- Bulk operations
- Session management
- Data export/import
- Audit logging
- System monitoring
- Security validation

Run tests with:
```bash
npm test -- --testPathPattern=user-admin.test.ts
```
# Role-Based Access Control (RBAC) System

## Overview

The MAR ABU Project Management system implements a comprehensive Role-Based Access Control (RBAC) system that provides fine-grained permission management for users, projects, teams, and resources.

## Architecture

### Core Components

1. **PermissionService** - Central service for permission management and validation
2. **Authentication Middleware** - JWT-based authentication with role and permission checks
3. **Permission Controller** - REST API endpoints for permission management
4. **Role Definitions** - Predefined roles with specific permission sets

### Permission Model

The system uses a hierarchical permission model with the following structure:

```
Permission = Resource:Action
Example: "projects:create", "tasks:read", "users:manage_roles"
```

## User Roles

### 1. ADMIN
- **Description**: System administrators with full access
- **Permissions**: All system permissions including user management, system configuration
- **Key Capabilities**:
  - Manage all users and their roles
  - Grant/revoke custom permissions
  - Access system configuration
  - Full CRUD on all resources

### 2. PROJECT_MANAGER
- **Description**: Project managers who oversee projects and teams
- **Permissions**: Project and team management, limited user management
- **Key Capabilities**:
  - Create and manage projects
  - Manage project teams and members
  - Assign tasks and manage sprints
  - View reports and analytics
  - Invite users to projects

### 3. TEAM_LEAD
- **Description**: Team leaders who manage development teams
- **Permissions**: Team management, task assignment, limited project access
- **Key Capabilities**:
  - Manage assigned teams
  - Assign and update tasks
  - View team reports
  - Participate in sprint planning

### 4. DEVELOPER
- **Description**: Development team members
- **Permissions**: Task management, time tracking, basic project access
- **Key Capabilities**:
  - Update assigned tasks
  - Log time entries
  - Comment on tasks
  - View project information

### 5. VIEWER
- **Description**: Read-only access for stakeholders
- **Permissions**: Read-only access to projects, tasks, and reports
- **Key Capabilities**:
  - View projects and tasks
  - Access reports and dashboards
  - Read team information

## Permission Categories

### User Management
- `users:create` - Create new users
- `users:read` - View user information
- `users:update` - Update user profiles
- `users:delete` - Delete users
- `users:manage_roles` - Change user roles
- `users:manage_permissions` - Grant/revoke custom permissions
- `users:invite` - Invite new users

### Project Management
- `projects:create` - Create new projects
- `projects:read` - View project information
- `projects:update` - Update project details
- `projects:delete` - Delete projects
- `projects:manage_members` - Add/remove project members
- `projects:manage_settings` - Configure project settings

### Task Management
- `tasks:create` - Create new tasks
- `tasks:read` - View task information
- `tasks:update` - Update task details
- `tasks:delete` - Delete tasks
- `tasks:assign` - Assign tasks to users
- `tasks:manage_status` - Change task status
- `tasks:comment` - Add comments to tasks

### Team Management
- `teams:create` - Create new teams
- `teams:read` - View team information
- `teams:update` - Update team details
- `teams:delete` - Delete teams
- `teams:manage_members` - Add/remove team members

### Sprint Management
- `sprints:create` - Create new sprints
- `sprints:read` - View sprint information
- `sprints:update` - Update sprint details
- `sprints:delete` - Delete sprints
- `sprints:manage` - Full sprint management

### Reporting & Analytics
- `reports:read` - View reports
- `reports:create` - Create custom reports
- `reports:export` - Export report data
- `analytics:read` - View analytics dashboards

### Time Tracking
- `time:log` - Log time entries
- `time:read` - View time tracking data
- `time:manage` - Manage time entries for others

### System Administration
- `system:configure` - System configuration
- `system:backup` - Backup management
- `system:monitor` - System monitoring
- `integrations:manage` - Manage external integrations

## API Endpoints

### Authentication
```http
POST /api/auth/login
POST /api/auth/refresh
GET  /api/auth/me
POST /api/auth/logout
```

### Permission Management
```http
GET  /api/permissions/me                    # Get current user permissions
GET  /api/permissions/users/:userId        # Get user permissions (Admin/Self)
POST /api/permissions/check                # Check specific permission (Admin)
POST /api/permissions/grant                # Grant permission (Admin)
POST /api/permissions/revoke               # Revoke permission (Admin)
PUT  /api/permissions/users/:userId/role   # Change user role (Admin)
GET  /api/permissions/roles                # Get all roles
GET  /api/permissions/roles/:role          # Get role permissions
POST /api/permissions/bulk-grant           # Bulk grant permissions (Admin)
GET  /api/permissions/users-with-permission # Get users with permission (Admin)
GET  /api/permissions/matrix               # Get permission matrix
```

## Usage Examples

### Checking Permissions in Code

```typescript
import { PermissionService } from '@/services/PermissionService';

const permissionService = new PermissionService(prisma);

// Check if user can create projects
const canCreateProject = await permissionService.hasPermission(userId, {
  resource: 'projects',
  action: 'create'
});

// Check with context (project membership)
const canUpdateTask = await permissionService.hasPermission(userId, {
  resource: 'tasks',
  action: 'update',
  context: { projectId: 'project-123' }
});
```

### Using Middleware

```typescript
import { requirePermission, requireRole } from '@/middleware/auth';

// Require specific permission
router.post('/projects', 
  authenticate,
  requirePermission('projects', 'create'),
  createProject
);

// Require specific role
router.get('/admin/users',
  authenticate,
  requireRole(UserRole.ADMIN),
  getUsers
);

// Context-aware permission check
router.put('/projects/:projectId/tasks/:taskId',
  authenticate,
  requirePermission('tasks', 'update', (req) => ({
    projectId: req.params.projectId,
    taskId: req.params.taskId
  })),
  updateTask
);
```

### Granting Custom Permissions

```typescript
// Grant custom permission to user
await permissionService.grantPermission(
  'user-123',
  'projects',
  ['create', 'update']
);

// Bulk grant permissions
await permissionService.bulkGrantPermissions(
  ['user-1', 'user-2', 'user-3'],
  'tasks',
  ['read', 'update']
);
```

## Contextual Permissions

The system supports contextual permissions that consider:

1. **Resource Ownership** - Users can access their own resources
2. **Project Membership** - Users can access resources in projects they're members of
3. **Team Membership** - Users can access resources related to their teams
4. **Hierarchical Access** - Higher roles can access lower-level resources

### Context Types

- `projectId` - Project-specific access
- `teamId` - Team-specific access
- `userId` - User-specific access
- `resourceOwnerId` - Resource ownership

## Caching Strategy

The permission system implements intelligent caching:

1. **User Permissions Cache** - 5-minute TTL for user permission data
2. **Cache Invalidation** - Automatic invalidation when permissions change
3. **Performance Optimization** - Reduces database queries for frequent permission checks

## Security Features

1. **JWT Token Validation** - Secure token-based authentication
2. **Role Hierarchy** - Structured permission inheritance
3. **Audit Logging** - All permission changes are logged
4. **Rate Limiting** - Protection against permission abuse
5. **Input Validation** - Comprehensive validation of permission requests

## Testing

The system includes comprehensive tests:

- **Unit Tests** - Individual service and middleware testing
- **Integration Tests** - End-to-end permission flow testing
- **RBAC Matrix Tests** - Role-based access validation
- **Performance Tests** - Caching and optimization validation

### Running Tests

```bash
# Run all permission tests
npm test -- --testPathPattern=permission

# Run RBAC integration tests
npm test -- --testPathPattern=rbac-integration

# Run with coverage
npm test -- --coverage --testPathPattern=permission
```

## Configuration

### Environment Variables

```env
JWT_SECRET=your-jwt-secret-key
JWT_REFRESH_SECRET=your-refresh-secret-key
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d
REDIS_URL=redis://localhost:6379
```

### Default Role Permissions

Role permissions are defined in `PermissionService.ROLE_PERMISSIONS` and can be customized based on organizational needs.

## Best Practices

1. **Principle of Least Privilege** - Grant minimum necessary permissions
2. **Regular Permission Audits** - Review and update permissions regularly
3. **Context-Aware Checks** - Use contextual permissions for resource-specific access
4. **Custom Permissions** - Use custom permissions for special cases
5. **Performance Monitoring** - Monitor permission check performance
6. **Security Logging** - Log all permission-related activities

## Troubleshooting

### Common Issues

1. **Permission Denied Errors**
   - Check user role and permissions
   - Verify context parameters
   - Review permission cache

2. **Performance Issues**
   - Monitor cache hit rates
   - Check database query performance
   - Review permission check frequency

3. **Cache Issues**
   - Verify Redis connection
   - Check cache invalidation logic
   - Monitor cache memory usage

### Debug Mode

Enable debug logging for permission checks:

```env
LOG_LEVEL=debug
```

This will provide detailed logs for all permission checks and cache operations.
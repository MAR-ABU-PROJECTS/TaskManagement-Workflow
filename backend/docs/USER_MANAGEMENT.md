# User Management System

## Overview

The MAR ABU Project Management system provides comprehensive user management functionality with role-based access control, profile management, and administrative capabilities.

## Architecture

### Core Components

1. **UserService** - Business logic for user operations
2. **UserController** - HTTP request handling and validation
3. **User Routes** - RESTful API endpoints with proper authorization
4. **User Model** - Database operations and data validation
5. **Authentication Integration** - JWT-based authentication with RBAC

## User Data Model

### Core User Fields

```typescript
interface IUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  isActive: boolean;

  // Profile Information
  profilePicture?: string;
  phoneNumber?: string;
  timezone: string;
  language: string;
  jobTitle?: string;
  department?: string;
  location?: string;
  bio?: string;
  skills: string[];
  socialLinks: Record<string, string>;
  preferences: Record<string, any>;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}
```

### User Roles

- **ADMIN**: Full system access and user management
- **PROJECT_MANAGER**: Project oversight and team management
- **TEAM_LEAD**: Team leadership and task coordination
- **DEVELOPER**: Development work and task execution
- **VIEWER**: Read-only access to projects and reports

## API Endpoints

### User Profile Management

#### Get Current User Profile

```http
GET /api/users/me
Authorization: Bearer <token>
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "user-123",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "DEVELOPER",
    "isActive": true,
    "profilePicture": "https://example.com/avatar.jpg",
    "jobTitle": "Senior Developer",
    "department": "Engineering",
    "skills": ["JavaScript", "TypeScript", "React"],
    "preferences": { "theme": "dark" }
  }
}
```

#### Update User Profile

```http
PUT /api/users/me/profile
Authorization: Bearer <token>
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Smith",
  "bio": "Passionate full-stack developer",
  "skills": ["JavaScript", "Python", "Docker"],
  "preferences": { "theme": "dark", "notifications": true }
}
```

#### Change Own Password

```http
POST /api/users/me/change-password
Authorization: Bearer <token>
Content-Type: application/json

{
  "currentPassword": "oldPassword123!",
  "newPassword": "newPassword123!"
}
```

### User Administration (Admin Only)

#### Create New User

```http
POST /api/users
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "email": "newuser@example.com",
  "password": "Password123!",
  "firstName": "New",
  "lastName": "User",
  "role": "DEVELOPER",
  "jobTitle": "Junior Developer",
  "department": "Engineering",
  "skills": ["JavaScript", "React"]
}
```

#### Search Users

```http
GET /api/users?search=john&role=DEVELOPER&department=Engineering&page=1&limit=20
Authorization: Bearer <token>
```

**Query Parameters:**

- `search`: Search in name and email
- `role`: Filter by user role
- `isActive`: Filter by active status (true/false)
- `department`: Filter by department
- `location`: Filter by location
- `skills`: Comma-separated skills to filter by
- `createdAfter`: Filter users created after date (ISO format)
- `createdBefore`: Filter users created before date (ISO format)
- `sortBy`: Sort field (firstName, lastName, email, role, createdAt, updatedAt)
- `sortOrder`: Sort direction (asc, desc)
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20, max: 100)

#### Update User

```http
PUT /api/users/:id
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "firstName": "Updated",
  "lastName": "Name",
  "role": "TEAM_LEAD",
  "isActive": true,
  "jobTitle": "Senior Developer"
}
```

#### Deactivate User

```http
POST /api/users/:id/deactivate
Authorization: Bearer <admin-token>
```

#### Reactivate User

```http
POST /api/users/:id/reactivate
Authorization: Bearer <admin-token>
```

#### Delete User (Hard Delete)

```http
DELETE /api/users/:id
Authorization: Bearer <admin-token>
```

#### Change User Password (Admin)

```http
POST /api/users/:id/change-password
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "newPassword": "newPassword123!"
}
```

#### Bulk Operations

```http
POST /api/users/bulk/deactivate
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "userIds": ["user-1", "user-2", "user-3"]
}
```

```http
POST /api/users/bulk/reactivate
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "userIds": ["user-1", "user-2", "user-3"]
}
```

#### Get User Statistics

```http
GET /api/users/stats
Authorization: Bearer <admin-token>
```

**Response:**

```json
{
  "success": true,
  "data": {
    "total": 150,
    "active": 140,
    "inactive": 10,
    "byRole": {
      "ADMIN": 2,
      "PROJECT_MANAGER": 8,
      "TEAM_LEAD": 15,
      "DEVELOPER": 120,
      "VIEWER": 5
    },
    "recentlyCreated": 12
  }
}
```

#### Get User by Email

```http
GET /api/users/email/:email
Authorization: Bearer <admin-token>
```

## Service Layer

### UserService Methods

#### User CRUD Operations

```typescript
// Create user
async createUser(userData: CreateUserRequest, createdBy?: string): Promise<IUser>

// Get user by ID with options
async getUserById(userId: string, options?: UserServiceOptions): Promise<UserWithPermissions | null>

// Get user by email
async getUserByEmail(email: string): Promise<IUser | null>

// Update user
async updateUser(userId: string, updateData: UpdateUserRequest, updatedBy?: string): Promise<IUser>

// Update user profile (self-service)
async updateUserProfile(userId: string, profileData: UpdateUserProfileRequest): Promise<IUser>
```

#### User Status Management

```typescript
// Deactivate user (soft delete)
async deactivateUser(userId: string, deactivatedBy?: string): Promise<void>

// Reactivate user
async reactivateUser(userId: string, reactivatedBy?: string): Promise<void>

// Delete user (hard delete)
async deleteUser(userId: string, deletedBy?: string): Promise<void>
```

#### Search and Analytics

```typescript
// Search users with filters and pagination
async searchUsers(filters: UserSearchFilters, page?: number, limit?: number): Promise<UserListResponse>

// Get user statistics
async getUserStats(): Promise<UserStats>
```

#### Password Management

```typescript
// Change user password
async changeUserPassword(userId: string, passwordData: ChangePasswordRequest, changedBy?: string): Promise<void>
```

#### Bulk Operations

```typescript
// Bulk deactivate users
async bulkDeactivateUsers(userIds: string[], deactivatedBy?: string): Promise<void>

// Bulk reactivate users
async bulkReactivateUsers(userIds: string[], reactivatedBy?: string): Promise<void>
```

## Security Features

### Access Control

1. **Authentication Required**: All endpoints require valid JWT token
2. **Role-Based Authorization**: Admin-only operations are protected
3. **Resource Ownership**: Users can only access their own profile data
4. **Permission Validation**: Integration with RBAC system

### Data Protection

1. **Password Security**: Bcrypt hashing with salt rounds
2. **Email Uniqueness**: Prevents duplicate email addresses
3. **Input Validation**: Comprehensive validation using Joi schemas
4. **SQL Injection Prevention**: Prisma ORM with parameterized queries

### Audit and Logging

1. **Operation Logging**: All user management operations are logged
2. **Change Tracking**: Who performed what action and when
3. **Session Management**: Token invalidation on sensitive operations
4. **Error Tracking**: Detailed error logging for troubleshooting

## Validation Rules

### User Creation

```typescript
{
  email: "Valid email address (required)",
  password: "8-128 chars, uppercase, lowercase, number, special char (required)",
  firstName: "1-100 characters (required)",
  lastName: "1-100 characters (required)",
  role: "Valid UserRole enum (optional, defaults to DEVELOPER)",
  isActive: "Boolean (optional, defaults to true)",
  profilePicture: "Valid URL (optional)",
  phoneNumber: "Valid international format (optional)",
  timezone: "Valid timezone string (optional, defaults to UTC)",
  language: "2-character language code (optional, defaults to 'en')",
  jobTitle: "Max 100 characters (optional)",
  department: "Max 100 characters (optional)",
  location: "Max 100 characters (optional)",
  bio: "Max 500 characters (optional)",
  skills: "Array of strings, max 20 items, each max 50 chars (optional)",
  socialLinks: "Object with URL values (optional)",
  preferences: "Object (optional)"
}
```

### User Search

```typescript
{
  page: "Integer >= 1 (default: 1)",
  limit: "Integer 1-100 (default: 20)",
  search: "Max 100 characters",
  role: "Valid UserRole enum",
  isActive: "'true' or 'false'",
  department: "Max 100 characters",
  location: "Max 100 characters",
  skills: "Comma-separated string",
  createdAfter: "ISO date string",
  createdBefore: "ISO date string",
  sortBy: "firstName|lastName|email|role|createdAt|updatedAt",
  sortOrder: "asc|desc"
}
```

## Caching Strategy

### User Data Caching

1. **User Profile Cache**: 5-minute TTL for user profile data
2. **User Statistics Cache**: 10-minute TTL for aggregated statistics
3. **Search Results**: No caching (real-time data required)

### Cache Invalidation

1. **Profile Updates**: Invalidate user-specific cache
2. **Role Changes**: Invalidate user permissions cache
3. **Status Changes**: Invalidate user and statistics cache
4. **Bulk Operations**: Invalidate multiple user caches

## Error Handling

### Common Error Responses

```json
{
  "success": false,
  "message": "Error description",
  "errors": [
    {
      "field": "email",
      "message": "Email already exists"
    }
  ]
}
```

### Error Types

- **ValidationError**: Invalid input data
- **ConflictError**: Duplicate email or constraint violation
- **NotFoundError**: User not found
- **AuthorizationError**: Insufficient permissions
- **AuthenticationError**: Invalid or missing token

## Usage Examples

### Creating a User Service Instance

```typescript
import { UserService } from "@/services/UserService";
import { prisma } from "@/config/database";

const userService = new UserService(prisma);
```

### Creating a New User

```typescript
const userData = {
  email: "john.doe@example.com",
  password: "SecurePassword123!",
  firstName: "John",
  lastName: "Doe",
  role: UserRole.DEVELOPER,
  jobTitle: "Software Developer",
  skills: ["JavaScript", "TypeScript", "React"],
};

const user = await userService.createUser(userData, adminUserId);
```

### Searching Users

```typescript
const filters = {
  search: "john",
  role: UserRole.DEVELOPER,
  department: "Engineering",
  isActive: true,
};

const result = await userService.searchUsers(filters, 1, 20);
console.log(`Found ${result.pagination.total} users`);
```

### Updating User Profile

```typescript
const profileData = {
  firstName: "John",
  lastName: "Smith",
  bio: "Senior full-stack developer with 5+ years experience",
  skills: ["JavaScript", "Python", "Docker", "Kubernetes"],
  preferences: { theme: "dark", notifications: true },
};

const updatedUser = await userService.updateUserProfile(userId, profileData);
```

## Best Practices

### Security

1. **Principle of Least Privilege**: Grant minimum necessary permissions
2. **Regular Password Updates**: Encourage strong password policies
3. **Session Management**: Invalidate sessions on sensitive operations
4. **Input Sanitization**: Validate all user inputs
5. **Audit Logging**: Log all administrative actions

### Performance

1. **Pagination**: Always use pagination for list operations
2. **Caching**: Leverage caching for frequently accessed data
3. **Database Indexing**: Ensure proper indexes on search fields
4. **Bulk Operations**: Use bulk operations for multiple updates
5. **Query Optimization**: Use selective field loading

### Data Management

1. **Soft Deletes**: Use deactivation instead of hard deletion
2. **Data Retention**: Implement data retention policies
3. **Backup Strategy**: Regular backups of user data
4. **GDPR Compliance**: Support data export and deletion requests
5. **Data Validation**: Comprehensive validation at all layers

## Testing

### Unit Tests

```bash
# Run user service tests
npm test -- --testPathPattern=user.test.ts

# Run with coverage
npm test -- --coverage --testPathPattern=user.test.ts
```

### Integration Tests

```bash
# Run user API integration tests
npm test -- --testPathPattern=user-integration.test.ts
```

### Test Coverage

The user management system includes comprehensive tests covering:

- User CRUD operations
- Authentication and authorization
- Input validation
- Error handling
- Bulk operations
- Search functionality
- Password management
- Profile updates

## Monitoring and Metrics

### Key Metrics

1. **User Growth**: Track user registration trends
2. **Active Users**: Monitor daily/monthly active users
3. **Role Distribution**: Track user role distribution
4. **Authentication Failures**: Monitor failed login attempts
5. **API Performance**: Track response times and error rates

### Logging

```typescript
// User creation
logger.info(`User created: ${user.email} (${user.id}) by ${createdBy}`);

// User updates
logger.info(`User updated: ${user.email} (${userId}) by ${updatedBy}`);

// Password changes
logger.info(
  `Password changed for user: ${user.email} (${userId}) by ${changedBy}`
);

// Deactivation
logger.info(`User deactivated: ${user.email} (${userId}) by ${deactivatedBy}`);
```

## Troubleshooting

### Common Issues

1. **Email Conflicts**: Check for existing users with same email
2. **Permission Denied**: Verify user roles and permissions
3. **Validation Errors**: Check input data format and constraints
4. **Cache Issues**: Clear user-specific cache entries
5. **Performance Issues**: Review database queries and indexes

### Debug Mode

Enable detailed logging for user operations:

```env
LOG_LEVEL=debug
```

This provides detailed logs for all user management operations, cache operations, and database queries.

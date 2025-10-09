# Sprint Management System

This document describes the comprehensive sprint management system that provides Agile/Scrum functionality for project management.

## Overview

The sprint management system provides:
- **Sprint Lifecycle Management**: Create, start, and complete sprints
- **Task Assignment**: Add and remove tasks from sprints
- **Capacity Planning**: Team capacity and workload management
- **Velocity Tracking**: Historical velocity data and trends
- **Burndown Charts**: Sprint progress visualization
- **Metrics & Analytics**: Comprehensive sprint performance data

## Core Features

### Sprint Lifecycle

#### Sprint Statuses
- `PLANNING`: Sprint is being planned, tasks can be added/removed
- `ACTIVE`: Sprint is in progress, limited modifications allowed
- `COMPLETED`: Sprint is finished, metrics are finalized
- `CANCELLED`: Sprint was cancelled, can be reopened to planning

#### Status Transitions
```
PLANNING → ACTIVE → COMPLETED
    ↓         ↓
CANCELLED ←────┘
    ↓
PLANNING (reopen)
```

### Sprint Operations

#### Create Sprint
```http
POST /api/sprints
Content-Type: application/json

{
  "name": "Sprint 1",
  "goal": "Implement user authentication system",
  "projectId": "project-uuid",
  "startDate": "2024-02-01T00:00:00Z",
  "endDate": "2024-02-14T23:59:59Z",
  "capacity": 80
}
```

#### Get Sprint with Details
```http
GET /api/sprints/{sprintId}?includeTasks=true&includeMetrics=true
```

#### Update Sprint
```http
PUT /api/sprints/{sprintId}
Content-Type: application/json

{
  "name": "Updated Sprint Name",
  "goal": "Updated sprint goal",
  "capacity": 100
}
```

#### Start Sprint
```http
POST /api/sprints/{sprintId}/start
```

#### Complete Sprint
```http
POST /api/sprints/{sprintId}/complete
```

### Task Management

#### Add Task to Sprint
```http
POST /api/sprints/{sprintId}/tasks
Content-Type: application/json

{
  "taskId": "task-uuid"
}
```

#### Remove Task from Sprint
```http
DELETE /api/sprints/{sprintId}/tasks/{taskId}
```

### Metrics and Analytics

#### Get Sprint Metrics
```http
GET /api/sprints/{sprintId}/metrics
```

Returns comprehensive sprint metrics:
```json
{
  "success": true,
  "data": {
    "sprintId": "sprint-uuid",
    "totalTasks": 15,
    "completedTasks": 8,
    "inProgressTasks": 5,
    "todoTasks": 2,
    "totalStoryPoints": 45,
    "completedStoryPoints": 28,
    "totalEstimatedHours": 120,
    "totalLoggedHours": 85,
    "totalRemainingHours": 35,
    "completionPercentage": 53.3,
    "velocityPoints": 28,
    "velocityHours": 85,
    "burndownData": [...],
    "dailyProgress": [...]
  }
}
```

#### Get Capacity Planning
```http
GET /api/sprints/{sprintId}/capacity
```

Returns team capacity analysis:
```json
{
  "success": true,
  "data": {
    "sprintId": "sprint-uuid",
    "totalCapacity": 320,
    "allocatedCapacity": 280,
    "availableCapacity": 40,
    "teamMembers": [
      {
        "userId": "user-uuid",
        "userName": "John Doe",
        "totalCapacity": 80,
        "allocatedHours": 75,
        "availableHours": 5,
        "utilizationPercentage": 93.75,
        "assignedTasks": 6,
        "assignedStoryPoints": 18
      }
    ],
    "recommendations": [
      {
        "type": "OVERALLOCATED",
        "message": "John Doe is over-allocated (105%)",
        "severity": "HIGH",
        "userId": "user-uuid",
        "suggestedAction": "Redistribute some tasks to other team members"
      }
    ]
  }
}
```

#### Get Velocity Data
```http
GET /api/projects/{projectId}/velocity
```

Returns historical velocity information:
```json
{
  "success": true,
  "data": {
    "projectId": "project-uuid",
    "averageVelocity": 25.5,
    "lastSprintVelocity": 28,
    "velocityTrend": "INCREASING",
    "historicalVelocity": [
      {
        "sprintId": "sprint-uuid",
        "sprintName": "Sprint 5",
        "velocity": 28,
        "completedStoryPoints": 28,
        "sprintDuration": 14
      }
    ]
  }
}
```

## Data Models

### Sprint
```typescript
interface Sprint {
  id: string;
  name: string;
  goal?: string;
  projectId: string;
  startDate: Date;
  endDate: Date;
  status: SprintStatus;
  capacity?: number;
  velocity?: number;
  createdAt: Date;
  updatedAt: Date;
  project?: Project;
  tasks?: SprintTask[];
  metrics?: SprintMetrics;
}
```

### Sprint Metrics
```typescript
interface SprintMetrics {
  sprintId: string;
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  todoTasks: number;
  totalStoryPoints: number;
  completedStoryPoints: number;
  totalEstimatedHours: number;
  totalLoggedHours: number;
  totalRemainingHours: number;
  completionPercentage: number;
  velocityPoints: number;
  velocityHours: number;
  burndownData: BurndownPoint[];
  dailyProgress: DailyProgress[];
}
```

### Burndown Data
```typescript
interface BurndownPoint {
  date: Date;
  remainingStoryPoints: number;
  remainingTasks: number;
  remainingHours: number;
  idealRemaining: number;
  completedStoryPoints: number;
  completedTasks: number;
}
```

## Business Rules

### Sprint Creation Rules
1. **Unique Names**: Sprint names must be unique within a project
2. **Date Validation**: Start date must be before end date
3. **Future Dates**: End date must be in the future
4. **Duration Limits**: Sprints should be between 1-30 days (warning for >30 days)
5. **No Overlaps**: Sprint dates cannot overlap with other active/planning sprints in the same project

### Sprint Lifecycle Rules
1. **Single Active Sprint**: Only one sprint can be active per project at a time
2. **Status Transitions**: Must follow valid status transition rules
3. **Task Modifications**: 
   - Tasks can be added/removed in PLANNING status
   - Limited modifications allowed in ACTIVE status
   - No modifications allowed in COMPLETED status

### Task Assignment Rules
1. **Same Project**: Tasks must belong to the same project as the sprint
2. **No Duplicates**: A task cannot be in multiple sprints simultaneously
3. **Status Restrictions**: Cannot add tasks to completed or cancelled sprints

### Capacity Planning Rules
1. **Working Days**: Calculated based on sprint duration and working days per week (5)
2. **Hours Per Day**: Default 8 hours per working day
3. **Team Member Capacity**: Individual capacity calculated per team member
4. **Utilization Warnings**: 
   - Over 100% utilization triggers high severity warning
   - Under 50% utilization triggers low severity recommendation

## Metrics Calculations

### Velocity Calculation
- **Story Points Velocity**: Sum of completed story points in the sprint
- **Hours Velocity**: Total hours logged during the sprint
- **Average Velocity**: Mean velocity across last 10 completed sprints

### Completion Percentage
```
Completion % = (Completed Tasks / Total Tasks) × 100
```

### Utilization Percentage
```
Utilization % = (Allocated Hours / Total Capacity Hours) × 100
```

### Burndown Calculation
- **Ideal Burndown**: Linear decrease from total to zero over sprint duration
- **Actual Burndown**: Based on daily task completions and story point burn
- **Remaining Work**: Updated daily based on task status changes

## Notifications

### Sprint Events
- **Sprint Started**: Notify all project team members
- **Sprint Completed**: Notify all project team members
- **Task Added/Removed**: Notify task assignee and sprint stakeholders
- **Capacity Warnings**: Notify project managers when team is over-allocated

### Notification Recipients
- Project team members
- Task assignees
- Project managers
- Sprint stakeholders

## API Endpoints Summary

### Sprint CRUD
- `POST /api/sprints` - Create sprint
- `GET /api/sprints` - Search sprints
- `GET /api/sprints/{id}` - Get sprint details
- `PUT /api/sprints/{id}` - Update sprint
- `DELETE /api/sprints/{id}` - Delete sprint

### Sprint Lifecycle
- `POST /api/sprints/{id}/start` - Start sprint
- `POST /api/sprints/{id}/complete` - Complete sprint

### Task Management
- `POST /api/sprints/{id}/tasks` - Add task to sprint
- `DELETE /api/sprints/{id}/tasks/{taskId}` - Remove task from sprint

### Analytics
- `GET /api/sprints/{id}/metrics` - Get sprint metrics
- `GET /api/sprints/{id}/capacity` - Get capacity planning
- `GET /api/projects/{id}/velocity` - Get velocity data
- `GET /api/sprints/statistics` - Get sprint statistics

## Error Handling

### Common Error Codes
- `SPRINT_NOT_FOUND`: Sprint does not exist
- `VALIDATION_ERROR`: Invalid input data
- `SPRINT_OVERLAP`: Sprint dates overlap with existing sprint
- `INVALID_OPERATION`: Operation not allowed in current sprint status
- `RESOURCE_NOT_FOUND`: Referenced resource (task, project) not found

### Validation Rules
- Sprint name: Required, max 255 characters
- Sprint goal: Optional, max 1000 characters
- Dates: Valid ISO 8601 format, logical date ranges
- Capacity: Non-negative integer
- Project ID: Valid UUID, existing project
- Task ID: Valid UUID, existing task in same project

## Performance Considerations

### Database Optimization
- Indexes on frequently queried fields (projectId, status, dates)
- Efficient queries for metrics calculation
- Pagination for large result sets

### Caching Strategy
- Sprint metrics cached for active sprints
- Velocity data cached per project
- Capacity calculations cached during sprint planning

### Metrics Calculation
- Burndown data generated on-demand for active sprints
- Historical metrics pre-calculated for completed sprints
- Daily progress tracked through audit logs

## Security Considerations

### Access Control
- Users can only access sprints in projects they're members of
- Project managers can modify sprint settings
- Team members can view sprint details and metrics
- Only project owners/admins can delete sprints

### Data Validation
- All input validated and sanitized
- Date range validation prevents invalid sprint configurations
- Capacity limits prevent unrealistic planning

### Audit Logging
- All sprint operations logged for audit trail
- Task additions/removals tracked
- Status changes recorded with user attribution

## Integration Points

### Task Management
- Seamless integration with task system
- Automatic task status synchronization
- Dependency validation for sprint planning

### Project Management
- Project-based sprint organization
- Team member capacity based on project membership
- Project methodology influences sprint configuration

### Reporting System
- Sprint metrics feed into project reports
- Velocity data used for project planning
- Burndown charts available in dashboards

## Future Enhancements

### Planned Features
- Sprint templates for consistent planning
- Automated sprint creation based on project schedules
- Advanced capacity planning with skills matching
- Integration with external calendar systems
- Sprint retrospective management
- Custom sprint fields and metadata
- Sprint comparison and analysis tools
- Predictive velocity modeling
- Resource conflict detection and resolution
- Sprint health scoring and recommendations
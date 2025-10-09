import React, { useState } from 'react';
import {
  Container,
  Box,
  Paper,
  Typography,
  Grid,
  Chip,
  Avatar,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Divider,
  Card,
  CardContent,
  LinearProgress,
  Breadcrumbs,
  Link,
  Stack,
  Tooltip,
  Alert,
} from '@mui/material';
import {
  Edit as EditIcon,
  MoreVert as MoreVertIcon,
  Assignment as AssignIcon,
  Link as LinkIcon,
  Schedule as ScheduleIcon,
  Flag as FlagIcon,
  Person as PersonIcon,
  CalendarToday as CalendarIcon,
  AccessTime as TimeIcon,
  AccountTree as HierarchyIcon,
  Block as BlockIcon,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import {
  useTask,
  useTaskBlockingInfo,
  useSubtaskSummary,
  useTaskDependencies,
} from '../hooks/useTasks';
import TaskStatusChip from '../components/task/TaskStatusChip';
import TaskPriorityIcon from '../components/task/TaskPriorityIcon';
import TaskTypeIcon from '../components/task/TaskTypeIcon';
import EditTaskDialog from '../components/task/EditTaskDialog';

const TaskDetailPage: React.FC = () => {
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  // Fetch task data
  const { data: task, isLoading, error } = useTask(taskId!, {
    includeSubtasks: true,
    includeComments: true,
    includeAttachments: true,
    includeTimeEntries: true,
    includeCustomFields: true,
  });

  const { data: blockingInfo } = useTaskBlockingInfo(taskId!);
  const { data: subtaskSummary } = useSubtaskSummary(taskId!);
  const { data: dependencies } = useTaskDependencies({ taskId: taskId! });

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const getUserDisplayName = (user?: { firstName: string; lastName: string }) => {
    if (!user) return 'Unassigned';
    return `${user.firstName} ${user.lastName}`;
  };

  const getUserInitials = (user?: { firstName: string; lastName: string }) => {
    if (!user) return 'U';
    return `${user.firstName[0]}${user.lastName[0]}`;
  };

  if (isLoading) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ mt: 4 }}>
          <LinearProgress />
          <Typography variant="body2" color="text.secondary" mt={2}>
            Loading task details...
          </Typography>
        </Box>
      </Container>
    );
  }

  if (error || !task) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ mt: 4 }}>
          <Alert severity="error">
            {error ? `Error loading task: ${error.message}` : 'Task not found'}
          </Alert>
          <Button
            variant="contained"
            onClick={() => navigate('/tasks')}
            sx={{ mt: 2 }}
          >
            Back to Tasks
          </Button>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 2, mb: 4 }}>
        {/* Breadcrumbs */}
        <Breadcrumbs sx={{ mb: 2 }}>
          <Link
            underline="hover"
            color="inherit"
            href="/dashboard"
            onClick={(e) => {
              e.preventDefault();
              navigate('/dashboard');
            }}
          >
            Dashboard
          </Link>
          <Link
            underline="hover"
            color="inherit"
            href="/tasks"
            onClick={(e) => {
              e.preventDefault();
              navigate('/tasks');
            }}
          >
            Tasks
          </Link>
          <Typography color="text.primary">{task.key}</Typography>
        </Breadcrumbs>

        {/* Task Header */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
            <Box flex={1}>
              <Box display="flex" alignItems="center" gap={2} mb={1}>
                <TaskTypeIcon type={task.type} />
                <Typography variant="h6" color="text.secondary">
                  {task.key}
                </Typography>
                <TaskStatusChip status={task.status} />
                {task.priority && <TaskPriorityIcon priority={task.priority} />}
              </Box>
              <Typography variant="h4" component="h1" gutterBottom>
                {task.title}
              </Typography>
              {task.description && (
                <Typography variant="body1" color="text.secondary" paragraph>
                  {task.description}
                </Typography>
              )}
            </Box>
            <Box>
              <IconButton onClick={handleMenuClick}>
                <MoreVertIcon />
              </IconButton>
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
              >
                <MenuItem onClick={() => { setEditDialogOpen(true); handleMenuClose(); }}>
                  <EditIcon sx={{ mr: 1 }} />
                  Edit Task
                </MenuItem>
                <MenuItem onClick={handleMenuClose}>
                  <AssignIcon sx={{ mr: 1 }} />
                  Assign
                </MenuItem>
                <MenuItem onClick={handleMenuClose}>
                  <LinkIcon sx={{ mr: 1 }} />
                  Link Issue
                </MenuItem>
              </Menu>
            </Box>
          </Box>

          {/* Task Metadata */}
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Stack spacing={2}>
                {/* Assignee */}
                <Box display="flex" alignItems="center" gap={2}>
                  <PersonIcon color="action" />
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Assignee
                    </Typography>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Avatar sx={{ width: 24, height: 24, fontSize: '0.75rem' }}>
                        {getUserInitials(task.assignee)}
                      </Avatar>
                      <Typography variant="body1">
                        {getUserDisplayName(task.assignee)}
                      </Typography>
                    </Box>
                  </Box>
                </Box>

                {/* Reporter */}
                <Box display="flex" alignItems="center" gap={2}>
                  <PersonIcon color="action" />
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Reporter
                    </Typography>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Avatar sx={{ width: 24, height: 24, fontSize: '0.75rem' }}>
                        {getUserInitials(task.reporter)}
                      </Avatar>
                      <Typography variant="body1">
                        {getUserDisplayName(task.reporter)}
                      </Typography>
                    </Box>
                  </Box>
                </Box>

                {/* Due Date */}
                {task.dueDate && (
                  <Box display="flex" alignItems="center" gap={2}>
                    <CalendarIcon color="action" />
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Due Date
                      </Typography>
                      <Typography variant="body1">
                        {format(new Date(task.dueDate), 'MMM dd, yyyy')}
                      </Typography>
                    </Box>
                  </Box>
                )}
              </Stack>
            </Grid>

            <Grid item xs={12} md={6}>
              <Stack spacing={2}>
                {/* Time Tracking */}
                <Box display="flex" alignItems="center" gap={2}>
                  <TimeIcon color="action" />
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Time Tracking
                    </Typography>
                    <Typography variant="body1">
                      {task.loggedHours}h logged
                      {task.estimatedHours && ` / ${task.estimatedHours}h estimated`}
                      {task.remainingHours && ` (${task.remainingHours}h remaining)`}
                    </Typography>
                  </Box>
                </Box>

                {/* Created/Updated */}
                <Box display="flex" alignItems="center" gap={2}>
                  <ScheduleIcon color="action" />
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Created
                    </Typography>
                    <Typography variant="body1">
                      {format(new Date(task.createdAt), 'MMM dd, yyyy HH:mm')}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Updated {format(new Date(task.updatedAt), 'MMM dd, yyyy HH:mm')}
                    </Typography>
                  </Box>
                </Box>

                {/* Story Points */}
                {task.storyPoints && (
                  <Box display="flex" alignItems="center" gap={2}>
                    <FlagIcon color="action" />
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Story Points
                      </Typography>
                      <Typography variant="body1">
                        {task.storyPoints}
                      </Typography>
                    </Box>
                  </Box>
                )}
              </Stack>
            </Grid>
          </Grid>

          {/* Labels and Components */}
          {(task.labels.length > 0 || task.components.length > 0) && (
            <Box mt={3}>
              <Divider sx={{ mb: 2 }} />
              <Stack direction="row" spacing={2}>
                {task.labels.length > 0 && (
                  <Box>
                    <Typography variant="body2" color="text.secondary" mb={1}>
                      Labels
                    </Typography>
                    <Box display="flex" gap={1} flexWrap="wrap">
                      {task.labels.map((label) => (
                        <Chip key={label} label={label} size="small" />
                      ))}
                    </Box>
                  </Box>
                )}
                {task.components.length > 0 && (
                  <Box>
                    <Typography variant="body2" color="text.secondary" mb={1}>
                      Components
                    </Typography>
                    <Box display="flex" gap={1} flexWrap="wrap">
                      {task.components.map((component) => (
                        <Chip key={component} label={component} size="small" color="secondary" />
                      ))}
                    </Box>
                  </Box>
                )}
              </Stack>
            </Box>
          )}
        </Paper>

        {/* Blocking Information */}
        {blockingInfo && blockingInfo.isBlocked && (
          <Alert severity="warning" sx={{ mb: 3 }}>
            <Box display="flex" alignItems="center" gap={1}>
              <BlockIcon />
              <Typography variant="body1">
                {blockingInfo.blockedReason}
              </Typography>
            </Box>
          </Alert>
        )}

        {/* Subtask Summary */}
        {subtaskSummary && subtaskSummary.totalSubtasks > 0 && (
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2} mb={2}>
                <HierarchyIcon />
                <Typography variant="h6">
                  Subtasks ({subtaskSummary.completedSubtasks}/{subtaskSummary.totalSubtasks})
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={subtaskSummary.completionPercentage}
                sx={{ height: 8, borderRadius: 4, mb: 2 }}
              />
              <Grid container spacing={2}>
                <Grid item xs={3}>
                  <Typography variant="body2" color="text.secondary">
                    Completed
                  </Typography>
                  <Typography variant="h6" color="success.main">
                    {subtaskSummary.completedSubtasks}
                  </Typography>
                </Grid>
                <Grid item xs={3}>
                  <Typography variant="body2" color="text.secondary">
                    In Progress
                  </Typography>
                  <Typography variant="h6" color="primary.main">
                    {subtaskSummary.inProgressSubtasks}
                  </Typography>
                </Grid>
                <Grid item xs={3}>
                  <Typography variant="body2" color="text.secondary">
                    To Do
                  </Typography>
                  <Typography variant="h6">
                    {subtaskSummary.todoSubtasks}
                  </Typography>
                </Grid>
                <Grid item xs={3}>
                  <Typography variant="body2" color="text.secondary">
                    Progress
                  </Typography>
                  <Typography variant="h6">
                    {subtaskSummary.completionPercentage}%
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        )}

        {/* Task Content */}
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Activity & Comments
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Comments and activity will be displayed here.
              </Typography>
            </Paper>
          </Grid>

          <Grid item xs={12} md={4}>
            <Stack spacing={3}>
              {/* Dependencies */}
              {dependencies && dependencies.length > 0 && (
                <Paper sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    Dependencies
                  </Typography>
                  {dependencies.map((dep) => (
                    <Box key={dep.id} mb={1}>
                      <Typography variant="body2">
                        {dep.type}: {dep.blockingTask?.key} - {dep.blockingTask?.title}
                      </Typography>
                    </Box>
                  ))}
                </Paper>
              )}

              {/* Subtasks */}
              {task.subtasks && task.subtasks.length > 0 && (
                <Paper sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    Subtasks
                  </Typography>
                  {task.subtasks.map((subtask) => (
                    <Box key={subtask.id} mb={1}>
                      <Typography variant="body2">
                        {subtask.key}: {subtask.title}
                      </Typography>
                      <TaskStatusChip status={subtask.status} size="small" />
                    </Box>
                  ))}
                </Paper>
              )}
            </Stack>
          </Grid>
        </Grid>

        {/* Edit Dialog */}
        <EditTaskDialog
          open={editDialogOpen}
          onClose={() => setEditDialogOpen(false)}
          task={task}
        />
      </Box>
    </Container>
  );
};

export default TaskDetailPage;
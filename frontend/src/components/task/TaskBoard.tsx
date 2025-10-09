import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Card,
  CardContent,
  Avatar,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Stack,
} from '@mui/material';
import {
  MoreVert as MoreVertIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { useTasks, useTransitionTaskStatus } from '../../hooks/useTasks';
import { Task, TaskFilters, TaskBoardColumn } from '../../types/task.types';
import TaskStatusChip from './TaskStatusChip';
import TaskPriorityIcon from './TaskPriorityIcon';
import TaskTypeIcon from './TaskTypeIcon';
import CreateTaskDialog from './CreateTaskDialog';

interface TaskBoardProps {
  projectId?: string;
  onTaskClick?: (task: Task) => void;
}

const TaskBoard: React.FC<TaskBoardProps> = ({
  projectId,
  onTaskClick,
}) => {
  const [columns, setColumns] = useState<TaskBoardColumn[]>([
    { id: 'TODO', title: 'To Do', status: 'TODO', tasks: [], color: '#f5f5f5' },
    { id: 'IN_PROGRESS', title: 'In Progress', status: 'IN_PROGRESS', tasks: [], color: '#e3f2fd' },
    { id: 'IN_REVIEW', title: 'In Review', status: 'IN_REVIEW', tasks: [], color: '#f3e5f5' },
    { id: 'TESTING', title: 'Testing', status: 'TESTING', tasks: [], color: '#fff3e0' },
    { id: 'DONE', title: 'Done', status: 'DONE', tasks: [], color: '#e8f5e8' },
  ]);

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedColumnStatus, setSelectedColumnStatus] = useState<string>('');

  // Fetch tasks
  const filters: TaskFilters = projectId ? { projectId } : {};
  const { data: taskResult, isLoading } = useTasks(filters, {
    limit: 1000, // Get all tasks for board view
    includeSubtasks: false,
  });

  const transitionStatusMutation = useTransitionTaskStatus();

  // Organize tasks into columns
  useEffect(() => {
    if (taskResult?.tasks) {
      const updatedColumns = columns.map(column => ({
        ...column,
        tasks: taskResult.tasks.filter(task => task.status === column.status),
      }));
      setColumns(updatedColumns);
    }
  }, [taskResult?.tasks]);

  const handleDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) {
      return;
    }

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const sourceColumn = columns.find(col => col.id === source.droppableId);
    const destColumn = columns.find(col => col.id === destination.droppableId);

    if (!sourceColumn || !destColumn) {
      return;
    }

    const task = sourceColumn.tasks.find(t => t.id === draggableId);
    if (!task) {
      return;
    }

    // If moving to a different column, update task status
    if (source.droppableId !== destination.droppableId) {
      try {
        await transitionStatusMutation.mutateAsync({
          taskId: task.id,
          toStatus: destColumn.status,
          comment: `Moved from ${sourceColumn.title} to ${destColumn.title}`,
        });
      } catch (error) {
        console.error('Failed to update task status:', error);
      }
    }
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, task: Task) => {
    setAnchorEl(event.currentTarget);
    setSelectedTask(task);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedTask(null);
  };

  const handleTaskClick = (task: Task) => {
    if (onTaskClick) {
      onTaskClick(task);
    }
  };

  const handleCreateTask = (columnStatus: string) => {
    setSelectedColumnStatus(columnStatus);
    setCreateDialogOpen(true);
  };

  const getUserInitials = (user?: { firstName: string; lastName: string }) => {
    if (!user) return 'U';
    return `${user.firstName[0]}${user.lastName[0]}`;
  };

  const getUserDisplayName = (user?: { firstName: string; lastName: string }) => {
    if (!user) return 'Unassigned';
    return `${user.firstName} ${user.lastName}`;
  };

  if (isLoading) {
    return (
      <Box p={3}>
        <Typography>Loading tasks...</Typography>
      </Box>
    );
  }

  return (
    <Box p={2}>
      <DragDropContext onDragEnd={handleDragEnd}>
        <Box display="flex" gap={2} overflow="auto" minHeight="70vh">
          {columns.map((column) => (
            <Paper
              key={column.id}
              sx={{
                minWidth: 300,
                maxWidth: 300,
                bgcolor: column.color,
                p: 1,
              }}
            >
              {/* Column Header */}
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                mb={2}
                p={1}
              >
                <Box>
                  <Typography variant="h6" component="h3">
                    {column.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {column.tasks.length} task{column.tasks.length !== 1 ? 's' : ''}
                  </Typography>
                </Box>
                <IconButton
                  size="small"
                  onClick={() => handleCreateTask(column.status)}
                >
                  <AddIcon />
                </IconButton>
              </Box>

              {/* Column Content */}
              <Droppable droppableId={column.id}>
                {(provided, snapshot) => (
                  <Box
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    sx={{
                      minHeight: 200,
                      bgcolor: snapshot.isDraggingOver ? 'action.hover' : 'transparent',
                      borderRadius: 1,
                      p: 1,
                    }}
                  >
                    {column.tasks.map((task, index) => (
                      <Draggable key={task.id} draggableId={task.id} index={index}>
                        {(provided, snapshot) => (
                          <Card
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            sx={{
                              mb: 1,
                              cursor: 'pointer',
                              transform: snapshot.isDragging ? 'rotate(5deg)' : 'none',
                              '&:hover': {
                                boxShadow: 2,
                              },
                            }}
                            onClick={() => handleTaskClick(task)}
                          >
                            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                              {/* Task Header */}
                              <Box
                                display="flex"
                                justifyContent="space-between"
                                alignItems="flex-start"
                                mb={1}
                              >
                                <Box display="flex" alignItems="center" gap={1}>
                                  <TaskTypeIcon type={task.type} size="small" />
                                  <Typography variant="body2" color="text.secondary">
                                    {task.key}
                                  </Typography>
                                </Box>
                                <IconButton
                                  size="small"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleMenuClick(e, task);
                                  }}
                                >
                                  <MoreVertIcon fontSize="small" />
                                </IconButton>
                              </Box>

                              {/* Task Title */}
                              <Typography
                                variant="body1"
                                fontWeight="medium"
                                mb={1}
                                sx={{
                                  display: '-webkit-box',
                                  WebkitLineClamp: 2,
                                  WebkitBoxOrient: 'vertical',
                                  overflow: 'hidden',
                                }}
                              >
                                {task.title}
                              </Typography>

                              {/* Task Details */}
                              <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                                {task.priority && (
                                  <TaskPriorityIcon priority={task.priority} size="small" />
                                )}
                                {task.estimatedHours && (
                                  <Typography variant="caption" color="text.secondary">
                                    {task.estimatedHours}h
                                  </Typography>
                                )}
                              </Stack>

                              {/* Labels */}
                              {task.labels.length > 0 && (
                                <Box mb={1}>
                                  {task.labels.slice(0, 2).map((label) => (
                                    <Chip
                                      key={label}
                                      label={label}
                                      size="small"
                                      sx={{ mr: 0.5, mb: 0.5, fontSize: '0.7rem' }}
                                    />
                                  ))}
                                  {task.labels.length > 2 && (
                                    <Typography variant="caption" color="text.secondary">
                                      +{task.labels.length - 2} more
                                    </Typography>
                                  )}
                                </Box>
                              )}

                              {/* Assignee */}
                              <Box display="flex" justifyContent="space-between" alignItems="center">
                                <Box display="flex" alignItems="center" gap={1}>
                                  <Avatar sx={{ width: 20, height: 20, fontSize: '0.7rem' }}>
                                    {getUserInitials(task.assignee)}
                                  </Avatar>
                                  <Typography variant="caption" color="text.secondary">
                                    {getUserDisplayName(task.assignee)}
                                  </Typography>
                                </Box>
                                {task.dueDate && (
                                  <Typography variant="caption" color="text.secondary">
                                    {new Date(task.dueDate).toLocaleDateString()}
                                  </Typography>
                                )}
                              </Box>
                            </CardContent>
                          </Card>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </Box>
                )}
              </Droppable>
            </Paper>
          ))}
        </Box>
      </DragDropContext>

      {/* Context Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => selectedTask && handleTaskClick(selectedTask)}>
          <EditIcon sx={{ mr: 1 }} />
          View Details
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>
          <EditIcon sx={{ mr: 1 }} />
          Edit
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>
          <DeleteIcon sx={{ mr: 1 }} />
          Delete
        </MenuItem>
      </Menu>

      {/* Create Task Dialog */}
      <CreateTaskDialog
        open={createDialogOpen}
        onClose={() => {
          setCreateDialogOpen(false);
          setSelectedColumnStatus('');
        }}
        projectId={projectId}
      />
    </Box>
  );
};

export default TaskBoard;
import React, { useState, useMemo } from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  Avatar,
  IconButton,
  Tooltip,
  Typography,
  Checkbox,
  Menu,
  MenuItem,
  LinearProgress,
  Stack,
  Button,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  SelectChangeEvent,
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  MoreVert as MoreVertIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Assignment as AssignmentIcon,
  Link as LinkIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { useTasks, useDeleteTask, useBulkTaskOperation } from '../../hooks/useTasks';
import { Task, TaskFilters, TaskQueryOptions, TaskType, Priority } from '../../types/task.types';
import TaskStatusChip from './TaskStatusChip';
import TaskPriorityIcon from './TaskPriorityIcon';
import TaskTypeIcon from './TaskTypeIcon';
import CreateTaskDialog from './CreateTaskDialog';
import EditTaskDialog from './EditTaskDialog';
import BulkActionsToolbar from './BulkActionsToolbar';

interface TaskListProps {
  projectId?: string;
  showProjectColumn?: boolean;
  onTaskClick?: (task: Task) => void;
  onTaskEdit?: (task: Task) => void;
  onTaskDelete?: (task: Task) => void;
}

const TaskList: React.FC<TaskListProps> = ({
  projectId,
  showProjectColumn = false,
  onTaskClick,
  onTaskEdit,
  onTaskDelete,
}) => {
  // State
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<TaskFilters>({
    projectId,
  });
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  // Query options
  const queryOptions: TaskQueryOptions = {
    page: page + 1,
    limit: rowsPerPage,
    sortBy,
    sortOrder,
    includeSubtasks: false,
  };

  // Combined filters
  const combinedFilters = useMemo(() => ({
    ...filters,
    search: searchTerm || undefined,
  }), [filters, searchTerm]);

  // Hooks
  const { data: taskResult, isLoading, error } = useTasks(combinedFilters, queryOptions);
  const deleteTaskMutation = useDeleteTask();
  const bulkOperationMutation = useBulkTaskOperation();

  // Handlers
  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      const newSelected = taskResult?.tasks.map((task) => task.id) || [];
      setSelectedTasks(newSelected);
    } else {
      setSelectedTasks([]);
    }
  };

  const handleSelectTask = (taskId: string) => {
    const selectedIndex = selectedTasks.indexOf(taskId);
    let newSelected: string[] = [];

    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selectedTasks, taskId);
    } else if (selectedIndex === 0) {
      newSelected = newSelected.concat(selectedTasks.slice(1));
    } else if (selectedIndex === selectedTasks.length - 1) {
      newSelected = newSelected.concat(selectedTasks.slice(0, -1));
    } else if (selectedIndex > 0) {
      newSelected = newSelected.concat(
        selectedTasks.slice(0, selectedIndex),
        selectedTasks.slice(selectedIndex + 1)
      );
    }

    setSelectedTasks(newSelected);
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

  const handleEditTask = (task: Task) => {
    setSelectedTask(task);
    setEditDialogOpen(true);
    handleMenuClose();
  };

  const handleDeleteTask = async (task: Task) => {
    if (window.confirm(`Are you sure you want to delete task ${task.key}?`)) {
      try {
        await deleteTaskMutation.mutateAsync(task.id);
        if (onTaskDelete) {
          onTaskDelete(task);
        }
      } catch (error) {
        console.error('Failed to delete task:', error);
      }
    }
    handleMenuClose();
  };

  const handleFilterChange = (field: keyof TaskFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [field]: value,
    }));
    setPage(0);
  };

  const handleBulkAction = async (action: string, data?: any) => {
    if (selectedTasks.length === 0) return;

    try {
      await bulkOperationMutation.mutateAsync({
        taskIds: selectedTasks,
        operation: action as any,
        data: data || {},
      });
      setSelectedTasks([]);
    } catch (error) {
      console.error('Bulk operation failed:', error);
    }
  };

  const isSelected = (taskId: string) => selectedTasks.indexOf(taskId) !== -1;

  const getUserDisplayName = (user?: { firstName: string; lastName: string }) => {
    if (!user) return 'Unassigned';
    return `${user.firstName} ${user.lastName}`;
  };

  const getUserInitials = (user?: { firstName: string; lastName: string }) => {
    if (!user) return 'U';
    return `${user.firstName[0]}${user.lastName[0]}`;
  };

  if (error) {
    return (
      <Box p={3}>
        <Typography color="error">
          Error loading tasks: {error.message}
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5" component="h1">
          Tasks
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setCreateDialogOpen(true)}
        >
          Create Task
        </Button>
      </Box>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <TextField
            placeholder="Search tasks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{ minWidth: 300 }}
          />

          <FormControl sx={{ minWidth: 120 }}>
            <InputLabel>Type</InputLabel>
            <Select
              value={filters.type || ''}
              label="Type"
              onChange={(e: SelectChangeEvent) => 
                handleFilterChange('type', e.target.value || undefined)
              }
            >
              <MenuItem value="">All Types</MenuItem>
              {Object.values(TaskType).map((type) => (
                <MenuItem key={type} value={type}>
                  {type}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl sx={{ minWidth: 120 }}>
            <InputLabel>Priority</InputLabel>
            <Select
              value={filters.priority || ''}
              label="Priority"
              onChange={(e: SelectChangeEvent) => 
                handleFilterChange('priority', e.target.value || undefined)
              }
            >
              <MenuItem value="">All Priorities</MenuItem>
              {Object.values(Priority).map((priority) => (
                <MenuItem key={priority} value={priority}>
                  {priority}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl sx={{ minWidth: 120 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={filters.status || ''}
              label="Status"
              onChange={(e: SelectChangeEvent) => 
                handleFilterChange('status', e.target.value || undefined)
              }
            >
              <MenuItem value="">All Statuses</MenuItem>
              <MenuItem value="TODO">To Do</MenuItem>
              <MenuItem value="IN_PROGRESS">In Progress</MenuItem>
              <MenuItem value="IN_REVIEW">In Review</MenuItem>
              <MenuItem value="DONE">Done</MenuItem>
            </Select>
          </FormControl>
        </Stack>
      </Paper>

      {/* Bulk Actions */}
      {selectedTasks.length > 0 && (
        <BulkActionsToolbar
          selectedCount={selectedTasks.length}
          onBulkAction={handleBulkAction}
          onClearSelection={() => setSelectedTasks([])}
        />
      )}

      {/* Loading */}
      {isLoading && <LinearProgress />}

      {/* Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox">
                <Checkbox
                  indeterminate={
                    selectedTasks.length > 0 && 
                    selectedTasks.length < (taskResult?.tasks.length || 0)
                  }
                  checked={
                    taskResult?.tasks.length > 0 && 
                    selectedTasks.length === taskResult.tasks.length
                  }
                  onChange={handleSelectAll}
                />
              </TableCell>
              <TableCell>Key</TableCell>
              <TableCell>Title</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Priority</TableCell>
              <TableCell>Assignee</TableCell>
              {showProjectColumn && <TableCell>Project</TableCell>}
              <TableCell>Due Date</TableCell>
              <TableCell>Created</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {taskResult?.tasks.map((task) => {
              const isItemSelected = isSelected(task.id);
              return (
                <TableRow
                  key={task.id}
                  hover
                  selected={isItemSelected}
                  sx={{ cursor: 'pointer' }}
                >
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={isItemSelected}
                      onChange={() => handleSelectTask(task.id)}
                    />
                  </TableCell>
                  <TableCell onClick={() => handleTaskClick(task)}>
                    <Typography variant="body2" fontWeight="medium">
                      {task.key}
                    </Typography>
                  </TableCell>
                  <TableCell onClick={() => handleTaskClick(task)}>
                    <Typography variant="body2">
                      {task.title}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <TaskTypeIcon type={task.type} />
                      <Typography variant="body2">
                        {task.type}
                      </Typography>
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <TaskStatusChip status={task.status} />
                  </TableCell>
                  <TableCell>
                    {task.priority && (
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <TaskPriorityIcon priority={task.priority} />
                        <Typography variant="body2">
                          {task.priority}
                        </Typography>
                      </Stack>
                    )}
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Avatar sx={{ width: 24, height: 24, fontSize: '0.75rem' }}>
                        {getUserInitials(task.assignee)}
                      </Avatar>
                      <Typography variant="body2">
                        {getUserDisplayName(task.assignee)}
                      </Typography>
                    </Stack>
                  </TableCell>
                  {showProjectColumn && (
                    <TableCell>
                      <Typography variant="body2">
                        {task.project?.name}
                      </Typography>
                    </TableCell>
                  )}
                  <TableCell>
                    {task.dueDate && (
                      <Typography variant="body2">
                        {format(new Date(task.dueDate), 'MMM dd, yyyy')}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {format(new Date(task.createdAt), 'MMM dd, yyyy')}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      size="small"
                      onClick={(e) => handleMenuClick(e, task)}
                    >
                      <MoreVertIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination */}
      <TablePagination
        rowsPerPageOptions={[10, 25, 50, 100]}
        component="div"
        count={taskResult?.total || 0}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />

      {/* Context Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => selectedTask && handleTaskClick(selectedTask)}>
          <ViewIcon sx={{ mr: 1 }} />
          View Details
        </MenuItem>
        <MenuItem onClick={() => selectedTask && handleEditTask(selectedTask)}>
          <EditIcon sx={{ mr: 1 }} />
          Edit
        </MenuItem>
        <MenuItem onClick={() => selectedTask && handleDeleteTask(selectedTask)}>
          <DeleteIcon sx={{ mr: 1 }} />
          Delete
        </MenuItem>
      </Menu>

      {/* Dialogs */}
      <CreateTaskDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        projectId={projectId}
      />

      {selectedTask && (
        <EditTaskDialog
          open={editDialogOpen}
          onClose={() => {
            setEditDialogOpen(false);
            setSelectedTask(null);
          }}
          task={selectedTask}
        />
      )}
    </Box>
  );
};

export default TaskList;
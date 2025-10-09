import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Collapse,
  LinearProgress,
  Chip,
  Avatar,
  Stack,
  Tooltip,
  Menu,
  MenuItem,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ChevronRight as ChevronRightIcon,
  MoreVert as MoreVertIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import { TreeView, TreeItem } from '@mui/x-tree-view';
import { useTasks, useTaskTree, useSubtaskSummary } from '../../hooks/useTasks';
import { Task, TaskFilters, TaskTreeNode } from '../../types/task.types';
import TaskStatusChip from './TaskStatusChip';
import TaskPriorityIcon from './TaskPriorityIcon';
import TaskTypeIcon from './TaskTypeIcon';
import CreateTaskDialog from './CreateTaskDialog';

interface TaskTreeProps {
  projectId?: string;
  onTaskClick?: (task: Task) => void;
}

interface TaskTreeItemProps {
  node: TaskTreeNode;
  onTaskClick?: (task: Task) => void;
  onCreateSubtask?: (parentId: string) => void;
}

const TaskTreeItem: React.FC<TaskTreeItemProps> = ({
  node,
  onTaskClick,
  onCreateSubtask,
}) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const { data: subtaskSummary } = useSubtaskSummary(node.task.id);

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleTaskClick = () => {
    if (onTaskClick) {
      // We need to get the full task object, for now we'll use what we have
      const task = {
        ...node.task,
        description: '',
        reporterId: '',
        projectId: '',
        loggedHours: 0,
        labels: [],
        components: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as Task;
      onTaskClick(task);
    }
  };

  const getUserInitials = (assigneeId?: string) => {
    // This would normally come from user data
    return assigneeId ? 'U' : 'U';
  };

  const nodeId = node.task.id;
  const hasChildren = node.hasChildren;
  const completionPercentage = node.task.completionPercentage || 0;

  return (
    <TreeItem
      nodeId={nodeId}
      label={
        <Box
          display="flex"
          alignItems="center"
          justifyContent="space-between"
          py={1}
          pr={1}
          sx={{
            '&:hover': {
              bgcolor: 'action.hover',
            },
          }}
        >
          <Box display="flex" alignItems="center" gap={1} flex={1}>
            {/* Task Type Icon */}
            <TaskTypeIcon type={node.task.type as any} size="small" />

            {/* Task Key */}
            <Typography variant="body2" color="text.secondary" minWidth={80}>
              {node.task.key}
            </Typography>

            {/* Task Title */}
            <Typography
              variant="body1"
              sx={{
                cursor: 'pointer',
                '&:hover': { textDecoration: 'underline' },
                flex: 1,
                minWidth: 200,
              }}
              onClick={handleTaskClick}
            >
              {node.task.title}
            </Typography>

            {/* Task Status */}
            <TaskStatusChip status={node.task.status} size="small" />

            {/* Priority */}
            {node.task.priority && (
              <TaskPriorityIcon priority={node.task.priority as any} size="small" />
            )}

            {/* Assignee */}
            {node.task.assigneeId && (
              <Avatar sx={{ width: 24, height: 24, fontSize: '0.75rem' }}>
                {getUserInitials(node.task.assigneeId)}
              </Avatar>
            )}

            {/* Progress for parent tasks */}
            {hasChildren && subtaskSummary && (
              <Box minWidth={120}>
                <Tooltip
                  title={`${subtaskSummary.completedSubtasks}/${subtaskSummary.totalSubtasks} subtasks completed`}
                >
                  <Box>
                    <LinearProgress
                      variant="determinate"
                      value={completionPercentage}
                      sx={{ height: 6, borderRadius: 3 }}
                    />
                    <Typography variant="caption" color="text.secondary">
                      {Math.round(completionPercentage)}%
                    </Typography>
                  </Box>
                </Tooltip>
              </Box>
            )}

            {/* Estimated Hours */}
            {node.task.estimatedHours && (
              <Typography variant="caption" color="text.secondary" minWidth={40}>
                {node.task.estimatedHours}h
              </Typography>
            )}
          </Box>

          {/* Actions */}
          <Box display="flex" alignItems="center" gap={0.5}>
            {hasChildren && (
              <Tooltip title="Add subtask">
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    onCreateSubtask?.(node.task.id);
                  }}
                >
                  <AddIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            <IconButton size="small" onClick={handleMenuClick}>
              <MoreVertIcon fontSize="small" />
            </IconButton>
          </Box>

          {/* Context Menu */}
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
          >
            <MenuItem onClick={() => { handleTaskClick(); handleMenuClose(); }}>
              View Details
            </MenuItem>
            <MenuItem onClick={() => { onCreateSubtask?.(node.task.id); handleMenuClose(); }}>
              Add Subtask
            </MenuItem>
            <MenuItem onClick={handleMenuClose}>
              Edit
            </MenuItem>
            <MenuItem onClick={handleMenuClose}>
              Delete
            </MenuItem>
          </Menu>
        </Box>
      }
    >
      {node.children.map((child) => (
        <TaskTreeItem
          key={child.task.id}
          node={child}
          onTaskClick={onTaskClick}
          onCreateSubtask={onCreateSubtask}
        />
      ))}
    </TreeItem>
  );
};

const TaskTree: React.FC<TaskTreeProps> = ({
  projectId,
  onTaskClick,
}) => {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedParentId, setSelectedParentId] = useState<string>('');

  // Fetch root level tasks (tasks without parents)
  const filters: TaskFilters = {
    ...(projectId ? { projectId } : {}),
    parentId: null, // Only root level tasks
  };

  const { data: taskResult, isLoading } = useTasks(filters, {
    limit: 1000,
    includeSubtasks: true,
  });

  const handleCreateSubtask = (parentId: string) => {
    setSelectedParentId(parentId);
    setCreateDialogOpen(true);
  };

  const buildTreeNodes = (tasks: Task[]): TaskTreeNode[] => {
    return tasks
      .filter(task => !task.parentId) // Root level tasks
      .map(task => buildTreeNode(task, tasks));
  };

  const buildTreeNode = (task: Task, allTasks: Task[]): TaskTreeNode => {
    const children = allTasks
      .filter(t => t.parentId === task.id)
      .map(child => buildTreeNode(child, allTasks));

    // Calculate completion percentage for parent tasks
    let completionPercentage = 0;
    if (children.length > 0) {
      const completedChildren = children.filter(child => 
        ['DONE', 'COMPLETED', 'CLOSED'].includes(child.task.status.toUpperCase())
      ).length;
      completionPercentage = Math.round((completedChildren / children.length) * 100);
    } else {
      // For leaf tasks, base on status
      completionPercentage = ['DONE', 'COMPLETED', 'CLOSED'].includes(task.status.toUpperCase()) ? 100 : 0;
    }

    return {
      task: {
        id: task.id,
        key: task.key,
        title: task.title,
        status: task.status,
        type: task.type,
        priority: task.priority,
        assigneeId: task.assigneeId,
        estimatedHours: task.estimatedHours,
        completionPercentage,
      },
      children,
      depth: 0, // Will be calculated based on nesting
      hasChildren: children.length > 0,
      isExpanded: true,
    };
  };

  if (isLoading) {
    return (
      <Box p={3}>
        <Typography>Loading task tree...</Typography>
      </Box>
    );
  }

  if (!taskResult?.tasks || taskResult.tasks.length === 0) {
    return (
      <Box p={3} textAlign="center">
        <Typography variant="h6" color="text.secondary" mb={2}>
          No tasks found
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Create your first task to see the task hierarchy
        </Typography>
      </Box>
    );
  }

  const treeNodes = buildTreeNodes(taskResult.tasks);

  return (
    <Box p={2}>
      {/* Header */}
      <Box mb={2}>
        <Typography variant="h6" gutterBottom>
          Task Hierarchy
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Organize and track your tasks in a hierarchical structure
        </Typography>
      </Box>

      {/* Tree View */}
      <Paper sx={{ p: 2 }}>
        <TreeView
          defaultCollapseIcon={<ExpandMoreIcon />}
          defaultExpandIcon={<ChevronRightIcon />}
          defaultExpanded={treeNodes.map(node => node.task.id)}
          sx={{
            flexGrow: 1,
            maxWidth: '100%',
            overflowY: 'auto',
          }}
        >
          {treeNodes.map((node) => (
            <TaskTreeItem
              key={node.task.id}
              node={node}
              onTaskClick={onTaskClick}
              onCreateSubtask={handleCreateSubtask}
            />
          ))}
        </TreeView>
      </Paper>

      {/* Create Subtask Dialog */}
      <CreateTaskDialog
        open={createDialogOpen}
        onClose={() => {
          setCreateDialogOpen(false);
          setSelectedParentId('');
        }}
        projectId={projectId}
        parentTaskId={selectedParentId}
      />
    </Box>
  );
};

export default TaskTree;
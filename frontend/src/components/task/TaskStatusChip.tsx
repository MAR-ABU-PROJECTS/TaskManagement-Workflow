import React from 'react';
import { Chip } from '@mui/material';

interface TaskStatusChipProps {
  status: string;
  size?: 'small' | 'medium';
}

const TaskStatusChip: React.FC<TaskStatusChipProps> = ({ status, size = 'small' }) => {
  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'TODO':
      case 'BACKLOG':
        return 'default';
      case 'IN_PROGRESS':
      case 'IN_DEVELOPMENT':
        return 'primary';
      case 'IN_REVIEW':
      case 'REVIEW':
        return 'secondary';
      case 'TESTING':
      case 'QA':
        return 'warning';
      case 'DONE':
      case 'COMPLETED':
      case 'CLOSED':
        return 'success';
      case 'BLOCKED':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status.toUpperCase()) {
      case 'TODO':
        return 'To Do';
      case 'IN_PROGRESS':
        return 'In Progress';
      case 'IN_REVIEW':
        return 'In Review';
      case 'DONE':
        return 'Done';
      default:
        return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
  };

  return (
    <Chip
      label={getStatusLabel(status)}
      color={getStatusColor(status) as any}
      size={size}
      variant="filled"
    />
  );
};

export default TaskStatusChip;
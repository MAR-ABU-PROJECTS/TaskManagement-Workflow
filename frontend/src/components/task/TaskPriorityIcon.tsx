import React from 'react';
import {
  KeyboardDoubleArrowUp,
  KeyboardArrowUp,
  Remove,
  KeyboardArrowDown,
  KeyboardDoubleArrowDown,
} from '@mui/icons-material';
import { Priority } from '../../types/task.types';

interface TaskPriorityIconProps {
  priority: Priority;
  size?: 'small' | 'medium' | 'large';
}

const TaskPriorityIcon: React.FC<TaskPriorityIconProps> = ({ priority, size = 'small' }) => {
  const getIcon = () => {
    switch (priority) {
      case Priority.HIGHEST:
        return <KeyboardDoubleArrowUp color="error" fontSize={size} />;
      case Priority.HIGH:
        return <KeyboardArrowUp color="error" fontSize={size} />;
      case Priority.MEDIUM:
        return <Remove color="warning" fontSize={size} />;
      case Priority.LOW:
        return <KeyboardArrowDown color="success" fontSize={size} />;
      case Priority.LOWEST:
        return <KeyboardDoubleArrowDown color="success" fontSize={size} />;
      default:
        return <Remove color="disabled" fontSize={size} />;
    }
  };

  return getIcon();
};

export default TaskPriorityIcon;
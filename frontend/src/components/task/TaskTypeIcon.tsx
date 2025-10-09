import React from 'react';
import {
  AccountTree,
  BookmarkBorder,
  CheckBox,
  SubdirectoryArrowRight,
} from '@mui/icons-material';
import { TaskType } from '../../types/task.types';

interface TaskTypeIconProps {
  type: TaskType;
  size?: 'small' | 'medium' | 'large';
  color?: 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info';
}

const TaskTypeIcon: React.FC<TaskTypeIconProps> = ({ 
  type, 
  size = 'small', 
  color = 'primary' 
}) => {
  const getIcon = () => {
    switch (type) {
      case TaskType.EPIC:
        return <AccountTree color={color} fontSize={size} />;
      case TaskType.STORY:
        return <BookmarkBorder color={color} fontSize={size} />;
      case TaskType.TASK:
        return <CheckBox color={color} fontSize={size} />;
      case TaskType.SUBTASK:
        return <SubdirectoryArrowRight color={color} fontSize={size} />;
      default:
        return <CheckBox color={color} fontSize={size} />;
    }
  };

  return getIcon();
};

export default TaskTypeIcon;
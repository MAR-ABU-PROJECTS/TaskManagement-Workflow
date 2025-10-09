import React, { useState } from 'react';
import {
  Container,
  Box,
  Paper,
  Tabs,
  Tab,
  Typography,
  Breadcrumbs,
  Link,
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import TaskList from '../components/task/TaskList';
import TaskBoard from '../components/task/TaskBoard';
import TaskTree from '../components/task/TaskTree';
import { Task } from '../types/task.types';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`task-tabpanel-${index}`}
      aria-labelledby={`task-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

const TaskListPage: React.FC = () => {
  const { projectId } = useParams<{ projectId?: string }>();
  const navigate = useNavigate();
  const [currentTab, setCurrentTab] = useState(0);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  const handleTaskClick = (task: Task) => {
    navigate(`/tasks/${task.id}`);
  };

  const handleTaskEdit = (task: Task) => {
    // Edit functionality is handled within the TaskList component
    console.log('Edit task:', task.key);
  };

  const handleTaskDelete = (task: Task) => {
    // Delete functionality is handled within the TaskList component
    console.log('Delete task:', task.key);
  };

  return (
    <Container maxWidth="xl">
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
          {projectId && (
            <Link
              underline="hover"
              color="inherit"
              href={`/projects/${projectId}`}
              onClick={(e) => {
                e.preventDefault();
                navigate(`/projects/${projectId}`);
              }}
            >
              Project
            </Link>
          )}
          <Typography color="text.primary">Tasks</Typography>
        </Breadcrumbs>

        {/* Page Header */}
        <Typography variant="h4" component="h1" gutterBottom>
          {projectId ? 'Project Tasks' : 'All Tasks'}
        </Typography>

        {/* Task Views */}
        <Paper sx={{ width: '100%' }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs
              value={currentTab}
              onChange={handleTabChange}
              aria-label="task view tabs"
            >
              <Tab label="List View" id="task-tab-0" />
              <Tab label="Board View" id="task-tab-1" />
              <Tab label="Tree View" id="task-tab-2" />
            </Tabs>
          </Box>

          <TabPanel value={currentTab} index={0}>
            <TaskList
              projectId={projectId}
              showProjectColumn={!projectId}
              onTaskClick={handleTaskClick}
              onTaskEdit={handleTaskEdit}
              onTaskDelete={handleTaskDelete}
            />
          </TabPanel>

          <TabPanel value={currentTab} index={1}>
            <TaskBoard
              projectId={projectId}
              onTaskClick={handleTaskClick}
            />
          </TabPanel>

          <TabPanel value={currentTab} index={2}>
            <TaskTree
              projectId={projectId}
              onTaskClick={handleTaskClick}
            />
          </TabPanel>
        </Paper>
      </Box>
    </Container>
  );
};

export default TaskListPage;
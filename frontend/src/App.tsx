import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { Box } from '@mui/material'

import { RootState } from './store'
import { Layout } from './components/Layout'
import { LoginPage } from './pages/auth/LoginPage'
import { DashboardPage } from './pages/DashboardPage'
import { TeamsPage } from './pages/teams/TeamsPage'
import { ProjectsPage } from './pages/projects/ProjectsPage'
import { TasksPage } from './pages/tasks/TasksPage'
import { IssuesPage } from './pages/issues/IssuesPage'
import { LoadingSpinner } from './components/common/LoadingSpinner'

function App() {
  const { isAuthenticated, isLoading } = useSelector((state: RootState) => state.auth)

  if (isLoading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
      >
        <LoadingSpinner size={60} />
      </Box>
    )
  }

  return (
    <Router>
      <Routes>
        {!isAuthenticated ? (
          <>
            <Route path="/login" element={<LoginPage />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </>
        ) : (
          <Route path="/" element={<Layout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="teams/*" element={<TeamsPage />} />
            <Route path="projects/*" element={<ProjectsPage />} />
            <Route path="tasks/*" element={<TasksPage />} />
            <Route path="issues/*" element={<IssuesPage />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Route>
        )}
      </Routes>
    </Router>
  )
}

export default App
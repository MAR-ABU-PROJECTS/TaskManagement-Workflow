import React, { useState } from 'react';
import {
  Box,
  Toolbar,
  Typography,
  IconButton,
  Tooltip,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  SelectChangeEvent,
} from '@mui/material';
import {
  Close as CloseIcon,
  Delete as DeleteIcon,
  Assignment as AssignmentIcon,
  Edit as EditIcon,
  ChangeCircle as StatusIcon,
} from '@mui/icons-material';
import { Priority } from '../../types/task.types';

interface BulkActionsToolbarProps {
  selectedCount: number;
  onBulkAction: (action: string, data?: any) => void;
  onClearSelection: () => void;
}

const BulkActionsToolbar: React.FC<BulkActionsToolbarProps> = ({
  selectedCount,
  onBulkAction,
  onClearSelection,
}) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [priorityDialogOpen, setPriorityDialogOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedPriority, setSelectedPriority] = useState('');

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleBulkDelete = () => {
    if (window.confirm(`Are you sure you want to delete ${selectedCount} task(s)?`)) {
      onBulkAction('DELETE');
    }
    handleMenuClose();
  };

  const handleBulkStatusChange = () => {
    setStatusDialogOpen(true);
    handleMenuClose();
  };

  const handleBulkPriorityChange = () => {
    setPriorityDialogOpen(true);
    handleMenuClose();
  };

  const handleStatusUpdate = () => {
    if (selectedStatus) {
      onBulkAction('UPDATE', { status: selectedStatus });
      setStatusDialogOpen(false);
      setSelectedStatus('');
    }
  };

  const handlePriorityUpdate = () => {
    if (selectedPriority) {
      onBulkAction('UPDATE', { priority: selectedPriority });
      setPriorityDialogOpen(false);
      setSelectedPriority('');
    }
  };

  return (
    <>
      <Toolbar
        sx={{
          pl: { sm: 2 },
          pr: { xs: 1, sm: 1 },
          bgcolor: 'primary.main',
          color: 'primary.contrastText',
          mb: 2,
        }}
      >
        <Typography
          sx={{ flex: '1 1 100%' }}
          color="inherit"
          variant="subtitle1"
          component="div"
        >
          {selectedCount} task(s) selected
        </Typography>

        <Tooltip title="Edit selected">
          <IconButton color="inherit" onClick={handleMenuClick}>
            <EditIcon />
          </IconButton>
        </Tooltip>

        <Tooltip title="Delete selected">
          <IconButton color="inherit" onClick={handleBulkDelete}>
            <DeleteIcon />
          </IconButton>
        </Tooltip>

        <Tooltip title="Clear selection">
          <IconButton color="inherit" onClick={onClearSelection}>
            <CloseIcon />
          </IconButton>
        </Tooltip>
      </Toolbar>

      {/* Bulk Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleBulkStatusChange}>
          <StatusIcon sx={{ mr: 1 }} />
          Change Status
        </MenuItem>
        <MenuItem onClick={handleBulkPriorityChange}>
          <AssignmentIcon sx={{ mr: 1 }} />
          Change Priority
        </MenuItem>
      </Menu>

      {/* Status Change Dialog */}
      <Dialog open={statusDialogOpen} onClose={() => setStatusDialogOpen(false)}>
        <DialogTitle>Change Status</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={selectedStatus}
              label="Status"
              onChange={(e: SelectChangeEvent) => setSelectedStatus(e.target.value)}
            >
              <MenuItem value="TODO">To Do</MenuItem>
              <MenuItem value="IN_PROGRESS">In Progress</MenuItem>
              <MenuItem value="IN_REVIEW">In Review</MenuItem>
              <MenuItem value="TESTING">Testing</MenuItem>
              <MenuItem value="DONE">Done</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStatusDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleStatusUpdate} variant="contained">
            Update Status
          </Button>
        </DialogActions>
      </Dialog>

      {/* Priority Change Dialog */}
      <Dialog open={priorityDialogOpen} onClose={() => setPriorityDialogOpen(false)}>
        <DialogTitle>Change Priority</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Priority</InputLabel>
            <Select
              value={selectedPriority}
              label="Priority"
              onChange={(e: SelectChangeEvent) => setSelectedPriority(e.target.value)}
            >
              {Object.values(Priority).map((priority) => (
                <MenuItem key={priority} value={priority}>
                  {priority}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPriorityDialogOpen(false)}>Cancel</Button>
          <Button onClick={handlePriorityUpdate} variant="contained">
            Update Priority
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default BulkActionsToolbar;
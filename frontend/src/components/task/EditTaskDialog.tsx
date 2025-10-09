import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Chip,
  Box,
  Typography,
  SelectChangeEvent,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import dayjs, { Dayjs } from 'dayjs';
import { useUpdateTask } from '../../hooks/useTasks';
import { Task, UpdateTaskRequest, TaskType, Priority } from '../../types/task.types';

interface EditTaskDialogProps {
  open: boolean;
  onClose: () => void;
  task: Task;
}

const schema = yup.object({
  title: yup.string().required('Title is required').max(255, 'Title must be less than 255 characters'),
  description: yup.string().max(10000, 'Description must be less than 10000 characters'),
  type: yup.string().oneOf(Object.values(TaskType)).required('Type is required'),
  priority: yup.string().oneOf(Object.values(Priority)),
  assigneeId: yup.string(),
  estimatedHours: yup.number().min(0, 'Estimated hours must be positive'),
  remainingHours: yup.number().min(0, 'Remaining hours must be positive'),
  storyPoints: yup.number().min(0, 'Story points must be positive').max(100, 'Story points must be less than 100'),
  labels: yup.array().of(yup.string()),
  components: yup.array().of(yup.string()),
});

type FormData = {
  title: string;
  description: string;
  type: TaskType;
  priority?: Priority;
  assigneeId?: string;
  estimatedHours?: number;
  remainingHours?: number;
  storyPoints?: number;
  labels: string[];
  components: string[];
  dueDate?: Dayjs | null;
};

const EditTaskDialog: React.FC<EditTaskDialogProps> = ({
  open,
  onClose,
  task,
}) => {
  const [labels, setLabels] = useState<string[]>(task.labels || []);
  const [components, setComponents] = useState<string[]>(task.components || []);
  const [newLabel, setNewLabel] = useState('');
  const [newComponent, setNewComponent] = useState('');

  const updateTaskMutation = useUpdateTask();

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
    watch,
    setValue,
  } = useForm<FormData>({
    resolver: yupResolver(schema),
    defaultValues: {
      title: task.title,
      description: task.description || '',
      type: task.type,
      priority: task.priority,
      assigneeId: task.assigneeId || '',
      estimatedHours: task.estimatedHours || undefined,
      remainingHours: task.remainingHours || undefined,
      storyPoints: task.storyPoints || undefined,
      labels: task.labels || [],
      components: task.components || [],
      dueDate: task.dueDate ? dayjs(task.dueDate) : null,
    },
  });

  const watchedType = watch('type');

  useEffect(() => {
    if (open) {
      reset({
        title: task.title,
        description: task.description || '',
        type: task.type,
        priority: task.priority,
        assigneeId: task.assigneeId || '',
        estimatedHours: task.estimatedHours || undefined,
        remainingHours: task.remainingHours || undefined,
        storyPoints: task.storyPoints || undefined,
        labels: task.labels || [],
        components: task.components || [],
        dueDate: task.dueDate ? dayjs(task.dueDate) : null,
      });
      setLabels(task.labels || []);
      setComponents(task.components || []);
    }
  }, [open, task, reset]);

  const handleClose = () => {
    setNewLabel('');
    setNewComponent('');
    onClose();
  };

  const onSubmit = async (data: FormData) => {
    try {
      const updateData: UpdateTaskRequest = {
        title: data.title,
        description: data.description || undefined,
        type: data.type,
        priority: data.priority,
        assigneeId: data.assigneeId || undefined,
        estimatedHours: data.estimatedHours || undefined,
        remainingHours: data.remainingHours || undefined,
        dueDate: data.dueDate?.toISOString() || undefined,
        labels: data.labels,
        components: data.components,
        storyPoints: data.storyPoints || undefined,
      };

      await updateTaskMutation.mutateAsync({
        taskId: task.id,
        updateData,
      });
      handleClose();
    } catch (error) {
      console.error('Failed to update task:', error);
    }
  };

  const handleAddLabel = () => {
    if (newLabel.trim() && !labels.includes(newLabel.trim())) {
      const updatedLabels = [...labels, newLabel.trim()];
      setLabels(updatedLabels);
      setValue('labels', updatedLabels);
      setNewLabel('');
    }
  };

  const handleRemoveLabel = (labelToRemove: string) => {
    const updatedLabels = labels.filter(label => label !== labelToRemove);
    setLabels(updatedLabels);
    setValue('labels', updatedLabels);
  };

  const handleAddComponent = () => {
    if (newComponent.trim() && !components.includes(newComponent.trim())) {
      const updatedComponents = [...components, newComponent.trim()];
      setComponents(updatedComponents);
      setValue('components', updatedComponents);
      setNewComponent('');
    }
  };

  const handleRemoveComponent = (componentToRemove: string) => {
    const updatedComponents = components.filter(component => component !== componentToRemove);
    setComponents(updatedComponents);
    setValue('components', updatedComponents);
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        Edit Task - {task.key}
      </DialogTitle>
      
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent>
          <Grid container spacing={3}>
            {/* Title */}
            <Grid item xs={12}>
              <Controller
                name="title"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Title"
                    fullWidth
                    required
                    error={!!errors.title}
                    helperText={errors.title?.message}
                  />
                )}
              />
            </Grid>

            {/* Description */}
            <Grid item xs={12}>
              <Controller
                name="description"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Description"
                    fullWidth
                    multiline
                    rows={4}
                    error={!!errors.description}
                    helperText={errors.description?.message}
                  />
                )}
              />
            </Grid>

            {/* Type and Priority */}
            <Grid item xs={6}>
              <Controller
                name="type"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth required>
                    <InputLabel>Type</InputLabel>
                    <Select
                      {...field}
                      label="Type"
                      error={!!errors.type}
                    >
                      {Object.values(TaskType).map((type) => (
                        <MenuItem key={type} value={type}>
                          {type}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}
              />
            </Grid>

            <Grid item xs={6}>
              <Controller
                name="priority"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth>
                    <InputLabel>Priority</InputLabel>
                    <Select
                      {...field}
                      label="Priority"
                      error={!!errors.priority}
                    >
                      {Object.values(Priority).map((priority) => (
                        <MenuItem key={priority} value={priority}>
                          {priority}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}
              />
            </Grid>

            {/* Time Tracking */}
            <Grid item xs={6}>
              <Controller
                name="estimatedHours"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Estimated Hours"
                    type="number"
                    fullWidth
                    inputProps={{ min: 0, step: 0.5 }}
                    error={!!errors.estimatedHours}
                    helperText={errors.estimatedHours?.message}
                  />
                )}
              />
            </Grid>

            <Grid item xs={6}>
              <Controller
                name="remainingHours"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Remaining Hours"
                    type="number"
                    fullWidth
                    inputProps={{ min: 0, step: 0.5 }}
                    error={!!errors.remainingHours}
                    helperText={errors.remainingHours?.message}
                  />
                )}
              />
            </Grid>

            {/* Story Points for Stories */}
            {watchedType === TaskType.STORY && (
              <Grid item xs={6}>
                <Controller
                  name="storyPoints"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Story Points"
                      type="number"
                      fullWidth
                      inputProps={{ min: 0, max: 100 }}
                      error={!!errors.storyPoints}
                      helperText={errors.storyPoints?.message}
                    />
                  )}
                />
              </Grid>
            )}

            {/* Due Date */}
            <Grid item xs={6}>
              <Controller
                name="dueDate"
                control={control}
                render={({ field }) => (
                  <DatePicker
                    {...field}
                    label="Due Date"
                    slotProps={{
                      textField: {
                        fullWidth: true,
                      },
                    }}
                  />
                )}
              />
            </Grid>

            {/* Labels */}
            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>
                Labels
              </Typography>
              <Box display="flex" gap={1} mb={1} flexWrap="wrap">
                {labels.map((label) => (
                  <Chip
                    key={label}
                    label={label}
                    onDelete={() => handleRemoveLabel(label)}
                    size="small"
                  />
                ))}
              </Box>
              <Box display="flex" gap={1}>
                <TextField
                  size="small"
                  placeholder="Add label"
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddLabel();
                    }
                  }}
                />
                <Button onClick={handleAddLabel} size="small">
                  Add
                </Button>
              </Box>
            </Grid>

            {/* Components */}
            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>
                Components
              </Typography>
              <Box display="flex" gap={1} mb={1} flexWrap="wrap">
                {components.map((component) => (
                  <Chip
                    key={component}
                    label={component}
                    onDelete={() => handleRemoveComponent(component)}
                    size="small"
                    color="secondary"
                  />
                ))}
              </Box>
              <Box display="flex" gap={1}>
                <TextField
                  size="small"
                  placeholder="Add component"
                  value={newComponent}
                  onChange={(e) => setNewComponent(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddComponent();
                    }
                  }}
                />
                <Button onClick={handleAddComponent} size="small">
                  Add
                </Button>
              </Box>
            </Grid>

            {/* Task Progress Info */}
            <Grid item xs={12}>
              <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Task Progress
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Logged Hours: {task.loggedHours}h
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Status: {task.status}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Created: {new Date(task.createdAt).toLocaleDateString()}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Last Updated: {new Date(task.updatedAt).toLocaleDateString()}
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button
            type="submit"
            variant="contained"
            disabled={isSubmitting || updateTaskMutation.isPending}
          >
            {isSubmitting || updateTaskMutation.isPending ? 'Updating...' : 'Update Task'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default EditTaskDialog;
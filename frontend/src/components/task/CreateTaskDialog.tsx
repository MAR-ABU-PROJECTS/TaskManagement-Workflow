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
  Autocomplete,
  SelectChangeEvent,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import dayjs, { Dayjs } from 'dayjs';
import { useCreateTask } from '../../hooks/useTasks';
import { CreateTaskRequest, TaskType, Priority } from '../../types/task.types';

interface CreateTaskDialogProps {
  open: boolean;
  onClose: () => void;
  projectId?: string;
  parentTaskId?: string;
}

const schema = yup.object({
  title: yup.string().required('Title is required').max(255, 'Title must be less than 255 characters'),
  description: yup.string().max(10000, 'Description must be less than 10000 characters'),
  type: yup.string().oneOf(Object.values(TaskType)).required('Type is required'),
  priority: yup.string().oneOf(Object.values(Priority)),
  assigneeId: yup.string(),
  estimatedHours: yup.number().min(0, 'Estimated hours must be positive'),
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
  storyPoints?: number;
  labels: string[];
  components: string[];
  dueDate?: Dayjs | null;
};

const CreateTaskDialog: React.FC<CreateTaskDialogProps> = ({
  open,
  onClose,
  projectId,
  parentTaskId,
}) => {
  const [labels, setLabels] = useState<string[]>([]);
  const [components, setComponents] = useState<string[]>([]);
  const [newLabel, setNewLabel] = useState('');
  const [newComponent, setNewComponent] = useState('');

  const createTaskMutation = useCreateTask();

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
      title: '',
      description: '',
      type: TaskType.TASK,
      priority: Priority.MEDIUM,
      labels: [],
      components: [],
      dueDate: null,
    },
  });

  const watchedType = watch('type');

  useEffect(() => {
    if (parentTaskId) {
      setValue('type', TaskType.SUBTASK);
    }
  }, [parentTaskId, setValue]);

  const handleClose = () => {
    reset();
    setLabels([]);
    setComponents([]);
    setNewLabel('');
    setNewComponent('');
    onClose();
  };

  const onSubmit = async (data: FormData) => {
    try {
      const taskData: CreateTaskRequest = {
        title: data.title,
        description: data.description || undefined,
        type: data.type,
        priority: data.priority,
        assigneeId: data.assigneeId || undefined,
        projectId: projectId!,
        parentId: parentTaskId || undefined,
        estimatedHours: data.estimatedHours || undefined,
        dueDate: data.dueDate?.toISOString() || undefined,
        labels: data.labels,
        components: data.components,
        storyPoints: data.storyPoints || undefined,
      };

      await createTaskMutation.mutateAsync(taskData);
      handleClose();
    } catch (error) {
      console.error('Failed to create task:', error);
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

  if (!projectId) {
    return null;
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {parentTaskId ? 'Create Subtask' : 'Create Task'}
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
                      disabled={!!parentTaskId}
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

            {/* Estimated Hours and Story Points */}
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
          </Grid>
        </DialogContent>

        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button
            type="submit"
            variant="contained"
            disabled={isSubmitting || createTaskMutation.isPending}
          >
            {isSubmitting || createTaskMutation.isPending ? 'Creating...' : 'Create Task'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default CreateTaskDialog;
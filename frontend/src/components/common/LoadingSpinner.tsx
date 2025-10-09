import { CircularProgress, Box } from '@mui/material';

interface LoadingSpinnerProps {
  size?: number;
  color?: 'primary' | 'secondary' | 'inherit';
}

export function LoadingSpinner({ size = 40, color = 'primary' }: LoadingSpinnerProps) {
  return (
    <Box display="flex" justifyContent="center" alignItems="center" p={2}>
      <CircularProgress size={size} color={color} />
    </Box>
  );
}
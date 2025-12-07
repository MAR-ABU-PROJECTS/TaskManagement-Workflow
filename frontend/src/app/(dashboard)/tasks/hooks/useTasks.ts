// import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
// import { toast } from 'sonner';
// // import TaskService from '../services/taskService';
// import {
//   Task,
//   CreateTaskRequest,
//   UpdateTaskRequest,
//   TaskFilters,
//   TaskQueryOptions,
//   TaskStatistics,
//   TaskDependency,
//   TaskBlockingInfo,
//   SubtaskSummary,
//   TaskTreeNode,
//   BulkTaskOperation,
//   DependencyType
// } from '@/types/task.types';

// // Query Keys
// export const taskKeys = {
//   all: ['tasks'] as const,
//   lists: () => [...taskKeys.all, 'list'] as const,
//   list: (filters: TaskFilters, options: TaskQueryOptions) =>
//     [...taskKeys.lists(), { filters, options }] as const,
//   details: () => [...taskKeys.all, 'detail'] as const,
//   detail: (id: string, options?: TaskQueryOptions) =>
//     [...taskKeys.details(), id, options] as const,
//   statistics: (filters: TaskFilters) =>
//     [...taskKeys.all, 'statistics', filters] as const,
//   dependencies: (filters: any) =>
//     [...taskKeys.all, 'dependencies', filters] as const,
//   blockingInfo: (taskId: string) =>
//     [...taskKeys.all, 'blocking-info', taskId] as const,
//   subtaskSummary: (taskId: string) =>
//     [...taskKeys.all, 'subtask-summary', taskId] as const,
//   tree: (taskId: string, maxDepth?: number) =>
//     [...taskKeys.all, 'tree', taskId, maxDepth] as const,
// };

// // Task List Hook
// export function useTasks(filters: TaskFilters = {}, options: TaskQueryOptions = {}) {
//   return useQuery({
//     queryKey: taskKeys.list(filters, options),
//     queryFn: () => TaskService.searchTasks(filters, options),
//     staleTime: 30000, // 30 seconds
//     gcTime: 300000, // 5 minutes
//   });
// }

// // Task Detail Hook
// export function useTask(taskId: string, options?: TaskQueryOptions) {
//   return useQuery({
//     queryKey: taskKeys.detail(taskId, options),
//     queryFn: () => TaskService.getTask(taskId, options),
//     enabled: !!taskId,
//     staleTime: 60000, // 1 minute
//   });
// }

// // Task by Key Hook
// export function useTaskByKey(taskKey: string, options?: TaskQueryOptions) {
//   return useQuery({
//     queryKey: ['tasks', 'by-key', taskKey, options],
//     queryFn: () => TaskService.getTaskByKey(taskKey, options),
//     enabled: !!taskKey,
//     staleTime: 60000,
//   });
// }

// // Task Statistics Hook
// export function useTaskStatistics(filters: TaskFilters = {}) {
//   return useQuery({
//     queryKey: taskKeys.statistics(filters),
//     queryFn: () => TaskService.getTaskStatistics(filters),
//     staleTime: 60000,
//   });
// }

// // Task Dependencies Hook
// export function useTaskDependencies(filters: {
//   taskId?: string;
//   projectId?: string;
//   type?: DependencyType;
// } = {}) {
//   return useQuery({
//     queryKey: taskKeys.dependencies(filters),
//     queryFn: () => TaskService.getDependencies(filters),
//     enabled: !!(filters.taskId || filters.projectId),
//     staleTime: 30000,
//   });
// }

// // Task Blocking Info Hook
// export function useTaskBlockingInfo(taskId: string) {
//   return useQuery({
//     queryKey: taskKeys.blockingInfo(taskId),
//     queryFn: () => TaskService.getTaskBlockingInfo(taskId),
//     enabled: !!taskId,
//     staleTime: 30000,
//   });
// }

// // Subtask Summary Hook
// export function useSubtaskSummary(taskId: string) {
//   return useQuery({
//     queryKey: taskKeys.subtaskSummary(taskId),
//     queryFn: () => TaskService.getSubtaskSummary(taskId),
//     enabled: !!taskId,
//     staleTime: 30000,
//   });
// }

// // Task Tree Hook
// export function useTaskTree(taskId: string, maxDepth?: number) {
//   return useQuery({
//     queryKey: taskKeys.tree(taskId, maxDepth),
//     queryFn: () => TaskService.getTaskTree(taskId, maxDepth),
//     enabled: !!taskId,
//     staleTime: 60000,
//   });
// }

// // Mutation Hooks
// export function useCreateTask() {
//   const queryClient = useQueryClient();

//   return useMutation({
//     mutationFn: (taskData: CreateTaskRequest) => TaskService.createTask(taskData),
//     onSuccess: (newTask) => {
//       // Invalidate and refetch task lists
//       queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
//       queryClient.invalidateQueries({ queryKey: taskKeys.statistics({}) });

//       // If it's a subtask, invalidate parent's subtask summary
//       if (newTask.parentId) {
//         queryClient.invalidateQueries({
//           queryKey: taskKeys.subtaskSummary(newTask.parentId)
//         });
//         queryClient.invalidateQueries({
//           queryKey: taskKeys.tree(newTask.parentId)
//         });
//       }

//       toast.success(`Task ${newTask.key} created successfully`);
//     },
//     onError: (error: any) => {
//       toast.error(error.response?.data?.message || 'Failed to create task');
//     },
//   });
// }

// export function useUpdateTask() {
//   const queryClient = useQueryClient();

//   return useMutation({
//     mutationFn: ({ taskId, updateData }: { taskId: string; updateData: UpdateTaskRequest }) =>
//       TaskService.updateTask(taskId, updateData),
//     onSuccess: (updatedTask) => {
//       // Update the task in cache
//       queryClient.setQueryData(
//         taskKeys.detail(updatedTask.id),
//         updatedTask
//       );

//       // Invalidate related queries
//       queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
//       queryClient.invalidateQueries({ queryKey: taskKeys.statistics({}) });

//       if (updatedTask.parentId) {
//         queryClient.invalidateQueries({
//           queryKey: taskKeys.subtaskSummary(updatedTask.parentId)
//         });
//       }

//       toast.success(`Task ${updatedTask.key} updated successfully`);
//     },
//     onError: (error: any) => {
//       toast.error(error.response?.data?.message || 'Failed to update task');
//     },
//   });
// }

// export function useDeleteTask() {
//   const queryClient = useQueryClient();

//   return useMutation({
//     mutationFn: (taskId: string) => TaskService.deleteTask(taskId),
//     onSuccess: (_, taskId) => {
//       // Remove task from cache
//       queryClient.removeQueries({ queryKey: taskKeys.detail(taskId) });

//       // Invalidate lists and statistics
//       queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
//       queryClient.invalidateQueries({ queryKey: taskKeys.statistics({}) });

//       toast.success('Task deleted successfully');
//     },
//     onError: (error: any) => {
//       toast.error(error.response?.data?.message || 'Failed to delete task');
//     },
//   });
// }

// export function useAssignTask() {
//   const queryClient = useQueryClient();

//   return useMutation({
//     mutationFn: ({ taskId, assigneeId, comment }: {
//       taskId: string;
//       assigneeId: string;
//       comment?: string;
//     }) => TaskService.assignTask(taskId, assigneeId, comment),
//     onSuccess: (updatedTask) => {
//       queryClient.setQueryData(
//         taskKeys.detail(updatedTask.id),
//         updatedTask
//       );
//       queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
//       queryClient.invalidateQueries({ queryKey: taskKeys.statistics({}) });

//       toast.success(`Task ${updatedTask.key} assigned successfully`);
//     },
//     onError: (error: any) => {
//       toast.error(error.response?.data?.message || 'Failed to assign task');
//     },
//   });
// }

// export function useTransitionTaskStatus() {
//   const queryClient = useQueryClient();

//   return useMutation({
//     mutationFn: ({
//       taskId,
//       toStatus,
//       comment,
//       transitionId
//     }: {
//       taskId: string;
//       toStatus: string;
//       comment?: string;
//       transitionId?: string;
//     }) => TaskService.transitionTaskStatus(taskId, toStatus, comment, transitionId),
//     onSuccess: (updatedTask) => {
//       queryClient.setQueryData(
//         taskKeys.detail(updatedTask.id),
//         updatedTask
//       );
//       queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
//       queryClient.invalidateQueries({ queryKey: taskKeys.statistics({}) });
//       queryClient.invalidateQueries({ queryKey: taskKeys.blockingInfo(updatedTask.id) });

//       if (updatedTask.parentId) {
//         queryClient.invalidateQueries({
//           queryKey: taskKeys.subtaskSummary(updatedTask.parentId)
//         });
//       }

//       toast.success(`Task ${updatedTask.key} status updated to ${toStatus}`);
//     },
//     onError: (error: any) => {
//       toast.error(error.response?.data?.message || 'Failed to update task status');
//     },
//   });
// }

// export function useBulkTaskOperation() {
//   const queryClient = useQueryClient();

//   return useMutation({
//     mutationFn: (operation: BulkTaskOperation) => TaskService.bulkOperation(operation),
//     onSuccess: (result) => {
//       queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
//       queryClient.invalidateQueries({ queryKey: taskKeys.statistics({}) });

//       const successCount = result.successful.length;
//       const failCount = result.failed.length;

//       if (successCount > 0) {
//         toast.success(`${successCount} task(s) updated successfully`);
//       }
//       if (failCount > 0) {
//         toast.error(`${failCount} task(s) failed to update`);
//       }
//     },
//     onError: (error: any) => {
//       toast.error(error.response?.data?.message || 'Bulk operation failed');
//     },
//   });
// }

// // Dependency Mutations
// export function useCreateDependency() {
//   const queryClient = useQueryClient();

//   return useMutation({
//     mutationFn: ({
//       dependentTaskId,
//       blockingTaskId,
//       type
//     }: {
//       dependentTaskId: string;
//       blockingTaskId: string;
//       type: DependencyType;
//     }) => TaskService.createDependency(dependentTaskId, blockingTaskId, type),
//     onSuccess: () => {
//       queryClient.invalidateQueries({ queryKey: taskKeys.dependencies({}) });
//       queryClient.invalidateQueries({ queryKey: [...taskKeys.all, 'blocking-info'] });
//       toast.success('Task dependency created successfully');
//     },
//     onError: (error: any) => {
//       toast.error(error.response?.data?.message || 'Failed to create dependency');
//     },
//   });
// }

// export function useDeleteDependency() {
//   const queryClient = useQueryClient();

//   return useMutation({
//     mutationFn: (dependencyId: string) => TaskService.deleteDependency(dependencyId),
//     onSuccess: () => {
//       queryClient.invalidateQueries({ queryKey: taskKeys.dependencies({}) });
//       queryClient.invalidateQueries({ queryKey: [...taskKeys.all, 'blocking-info'] });
//       toast.success('Task dependency deleted successfully');
//     },
//     onError: (error: any) => {
//       toast.error(error.response?.data?.message || 'Failed to delete dependency');
//     },
//   });
// }

// export function useMoveTask() {
//   const queryClient = useQueryClient();

//   return useMutation({
//     mutationFn: ({
//       taskId,
//       newParentId,
//       position
//     }: {
//       taskId: string;
//       newParentId?: string;
//       position?: number;
//     }) => TaskService.moveTask(taskId, newParentId, position),
//     onSuccess: (_, { taskId, newParentId }) => {
//       queryClient.invalidateQueries({ queryKey: taskKeys.detail(taskId) });
//       queryClient.invalidateQueries({ queryKey: taskKeys.lists() });

//       if (newParentId) {
//         queryClient.invalidateQueries({
//           queryKey: taskKeys.subtaskSummary(newParentId)
//         });
//         queryClient.invalidateQueries({
//           queryKey: taskKeys.tree(newParentId)
//         });
//       }

//       toast.success('Task moved successfully');
//     },
//     onError: (error: any) => {
//       toast.error(error.response?.data?.message || 'Failed to move task');
//     },
//   });
// }

export interface Task {
  id: number
  title: string
  description?: string
  priority: string
  assignee: string
  comments: number
  attachments: number
  status: string
}

export interface KanbanColumnProps {
	id: string;
	title: string;
	color: string;
	tasks: Task[];
	onAddTask: () => void;
	onEditTask: (taskId: number) => void;
	onChangeStatus: (taskId: number) => void;
	onAssignTask: (taskId: number) => void;
	onDeleteTask: (taskId: number) => void;
}

export interface TaskCardProps {
	id: number;
	title: string;
	description?: string;
	priority: string;
	assignee: string;
	comments: number;
	attachments: number;
	onEdit: (taskId: number) => void;
	onChangeStatus: (taskId: number) => void;
	onAssign: (taskId: number) => void;
	onDelete: (taskId: number) => void;
}
export interface Column {
  id: string
  title: string
  color: string
}

export interface KanbanBoardProps {
  columns: Column[]
  tasks: Task[]
  onAddTask: (columnId: string) => void
  onEditTask: (taskId: number) => void
  onChangeStatus: (taskId: number) => void
  onAssignTask: (taskId: number) => void
  onDeleteTask: (taskId: number) => void
}
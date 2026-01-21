export type WorkflowType =
	| "AGILE"
	| "SCRUM"
	| "KANBAN"
	| "WATERFALL"
	| "CUSTOM"; // add more if needed

export interface ProjectType {
	id: string;
	name: string;
	key: string;
	description: string;
	creatorId: string;
	creator: {
		id: string;
		name: string;
		email: string;
		role: string;
	};
	dueDate: string | null;
	isPublic: boolean;
	workflowType: WorkflowType;
	workflowSchemeId: string | null;
	createdAt: string;
	updatedAt: string;
	members: { userId: string }[];
}
export interface Task {
	id: number;
	title: string;
	description: string;
	priority: string;
	assignee: string;
	comments: number;
	attachments: number;
	status: string;
}

export interface KanbanColumnProps {
	id: string;
	title: string;
	tasks: BoardTask[];
	projectId: string;
}

export interface TaskCardProps {
	task: BoardTask;
	onEdit: (taskId: number) => void;
	onChangeStatus: (taskId: number) => void;
	onAssign: (taskId: number) => void;
	onDelete: (taskId: number) => void;
}
export interface Column {
	id: string;
	title: string;
	tasks: BoardTask[];
}

export interface KanbanBoardProps {
	columns: Column[];
	projectId: string;
}

export type BoardTask = {
	id: string;
	projectId: string;
	title: string;
	description: string;
	priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
	issueType: "TASK" | "BUG" | "STORY";
	status: string;

	position: number;

	assigneeId: string | null;
	reporterId: string | null;
	creatorId: string;

	requiresApproval: boolean;
	approvedById: string | null;
	rejectionReason: string | null;

	labels: string[];

	dueDate: string | null;
	estimatedHours: number | null;
	loggedHours: number;
	storyPoints: number | null;

	epicId: string | null;
	sprintId: string | null;
	parentTaskId: string | null;
	boardColumnId: string | null;

	createdAt: string;
	updatedAt: string;

	creator: {
		id: string;
		name: string;
		email: string;
		role: string;
	};

	assignees: { user: { name: string; id: string } }[] | null;

	_count: {
		comments: number;
		subTasks: number;
	};
};

export type BoardColumn = {
	name: string;
	description: string;
	statuses: string[];
	tasks: BoardTask[];
};

export type KanbanColumn = {
	name: string;
	description: string;
	statuses: string[];
	tasks: BoardTask[];
};

export type KanbanColumnsMap = Record<string, KanbanColumn>;

export type KanbanBoard = {
	projectId: string;
	projectKey: string;
	projectName: string;
	workflowType: "AGILE" | "KANBAN";
	columns: KanbanColumnsMap;
	statusCategories: Record<string, unknown>;
};

import React from "react";
import KanbanColumn from "./kanban-column";
import { KanbanBoardProps } from "../type";

const Kanbanboard = ({
	columns,
	tasks,
	onAddTask,
	onEditTask,
	onChangeStatus,
	onAssignTask,
	onDeleteTask,
}: KanbanBoardProps) => {
	return (
		<div className="flex gap-4 pb-4 max-w-full w-full overflow-x-scroll scrollbar-hide">
			{columns.map((column) => {
				const columnTasks = tasks.filter(
					(task) => task.status === column.id
				);
				return (
					<KanbanColumn
						key={column.id}
						{...column}
						tasks={columnTasks}
						onAddTask={() => onAddTask(column.id)}
						onEditTask={onEditTask}
						onChangeStatus={onChangeStatus}
						onAssignTask={onAssignTask}
						onDeleteTask={onDeleteTask}
					/>
				);
			})}
		</div>
	);
};

export default Kanbanboard;

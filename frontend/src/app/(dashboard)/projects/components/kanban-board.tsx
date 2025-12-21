import React from "react";
import KanbanColumn from "./kanban-column";
import { KanbanBoardProps } from "../lib/type";

const Kanbanboard = ({
	columns,
	projectId,
	onAddTask,
	onEditTask,
	onChangeStatus,
	onAssignTask,
	onDeleteTask,
}: KanbanBoardProps) => {
	return (
		<div className="flex gap-4 pb-4 max-w-full w-full overflow-x-scroll scrollbar-hide">
			{/* {columns.map((column) => {
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
			})} */}

			{/* {boardColumns.map((column) => {
				const columnTasks = tasks.filter(
					(task) => task.id === column.id
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
			})} */}

			{/* {boardColumns.map((column) => (
				<KanbanColumn
					key={column.id}
					id={column.id}
					title={column.title}
					tasks={column.tasks}
					onAddTask={() => onAddTask(column.id)}
					onEditTask={onEditTask}
					onChangeStatus={onChangeStatus}
					onAssignTask={onAssignTask}
					onDeleteTask={onDeleteTask}
				/>
			))} */}

			{columns.map((column, i) => (
				<KanbanColumn
					key={i}
					{...column}
					tasks={column.tasks}
					onAddTask={() => onAddTask(column.id)}
					onEditTask={onEditTask}
					onChangeStatus={onChangeStatus}
					onAssignTask={onAssignTask}
					onDeleteTask={onDeleteTask}
					projectId={projectId}
				/>
			))}
		</div>
	);
};

export default Kanbanboard;

import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import React from "react";
import TaskCard from "./tasks-card";
import { KanbanColumnProps } from "../lib/type";

const KanbanColumn = ({
	id,
	title,
	color,
	tasks,
	onAddTask,
	onEditTask,
	onChangeStatus,
	onAssignTask,
	onDeleteTask,
}: KanbanColumnProps) => {
	return (
		<div key={id} className="w-full max-w-[280px] shrink-0 h-svh">
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-2">
					<div className={`h-2 w-2 rounded-full ${color}`} />
					<h3 className="font-semibold">{title}</h3>
					<span className="text-sm text-muted-foreground">
						{tasks.length}
					</span>
				</div>
				<Button
					variant="ghost"
					size="icon"
					className="h-6 w-6"
					onClick={onAddTask}
					title="Add Task"
				>
					<Plus className="h-4 w-4" />
				</Button>
			</div>

			<div className="space-y-3 mt-2">
				{tasks.map((task) => (
					<TaskCard
						key={task.id}
						{...task}
						onEdit={onEditTask}
						onChangeStatus={onChangeStatus}
						onAssign={onAssignTask}
						onDelete={onDeleteTask}
					/>
				))}
			</div>
		</div>
	);
};

export default KanbanColumn;

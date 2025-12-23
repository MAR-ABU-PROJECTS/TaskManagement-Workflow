import React from "react";
import TaskCard from "./tasks-card";
import { KanbanColumnProps } from "../lib/type";

const KanbanColumn = ({ id, title, tasks, projectId }: KanbanColumnProps) => {
	return (
		<div key={id} className="w-full max-w-[280px] shrink-0 h-svh">
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-2">
					{/* <div className={`h-2 w-2 rounded-full ${color}`} /> */}
					<h3 className="font-semibold">{title}</h3>
					<span className="text-sm text-muted-foreground">
						{tasks.length}
					</span>
				</div>
			</div>

			<div className="space-y-3.5 mt-2">
				{tasks.map((task) => (
					<TaskCard projectId={projectId} key={task.id} task={task} />
				))}
			</div>
		</div>
	);
};

export default KanbanColumn;

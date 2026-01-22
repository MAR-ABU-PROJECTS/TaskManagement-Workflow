import React from "react";
import KanbanColumn from "./kanban-column";
import { KanbanBoardProps } from "../lib/type";

const Kanbanboard = ({ columns, projectId }: KanbanBoardProps) => {
	
	return (
		<div className="flex gap-4 pb-4 max-w-full w-full overflow-x-scroll scrollbar-hide">
			{columns.map((column, i) => (
				<KanbanColumn
					key={i}
					{...column}
					tasks={column.tasks}
					projectId={projectId}
				/>
			))}
		</div>
	);
};

export default Kanbanboard;

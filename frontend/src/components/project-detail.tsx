"use client";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useState } from "react";
import { columns, initialTasks } from "@/app/(dashboard)/projects/lib/utils";
import TaskCard from "@/app/(dashboard)/projects/components/tasks";

export default function ProjectDetailPage() {
	const [tasks] = useState(initialTasks);

	return (
		<div className="flex flex-1 flex-col  w-full">
			{/* Main Content - Kanban Board */}
			<main className=" py-6 px-4">
				{/* Header */}

				<div className="mb-4">
					<Button size="sm">
						<Plus className="mr-2 h-4 w-4" />
						Add Task
					</Button>
				</div>

				<div className="">
					<div
						className="flex gap-4 pb-4 max-w-full w-full overflow-x-scroll scrollbar-hide"
						// className="w-full h-full flex gap-6"
					>
						{columns.map((column) => {
							const columnTasks = tasks.filter(
								(task) => task.status === column.id
							);
							return (
								<div
									key={column.id}
									className="w-full max-w-[280px] shrink-0 h-svh"
								>
									<div className="flex items-center justify-between">
										<div className="flex items-center gap-2">
											<div
												className={`h-2 w-2 rounded-full ${column.color}`}
											/>
											<h3 className="font-semibold">
												{column.title}
											</h3>
											<span className="text-sm text-muted-foreground">
												{columnTasks.length}
											</span>
										</div>
										<Button
											variant="ghost"
											size="icon"
											className="h-6 w-6"
										>
											<Plus className="h-4 w-4" />
										</Button>
									</div>

									<div className="space-y-3 mt-2">
										{columnTasks.map((task, i) => (
											<TaskCard {...task} key={i} />
										))}
									</div>
								</div>
							);
						})}
					</div>
				</div>
			</main>
		</div>
	);
}

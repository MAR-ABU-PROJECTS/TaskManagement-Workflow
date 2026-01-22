"use client";
import { useState } from "react";
import Kanbanboard from "@/app/(dashboard)/projects/components/kanban-board";
import { KanbanBoard } from "@/app/(dashboard)/projects/lib/type";
import { AddTaskModal } from "@/app/(dashboard)/projects/components/add-task-modal";
import { useGetProjectTasks } from "@/app/(dashboard)/tasks/lib/queries";
import { QueryStateHandler } from "./QueryStateHandler";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Members from "@/app/(dashboard)/projects/components/members";
import { Button } from "./ui/button";
import { Plus } from "lucide-react";

export default function ProjectBoardPage({ projectId }: { projectId: string }) {
	const [openModal, setOpenModal] = useState<
		"edit" | "status" | "assign" | "delete" | "add" | null
	>(null);

	const boardQuery = useGetProjectTasks(projectId, {
		disableGlobalSuccess: true,
	});
	return (
		<div className="flex flex-1 flex-col  w-full overflow-x-hidden">
			{/* Main Content - Kanban Board */}
			<main className=" py-6 px-4">
				<div>
					<Tabs defaultValue="board">
						<TabsList>
							<TabsTrigger value="board">Board</TabsTrigger>
							<TabsTrigger value="members">Members</TabsTrigger>
						</TabsList>
						<TabsContent value="board">
							<div className="mt-4">
								<div className="flex justify-end mb-4">
									<Button
										size={"sm"}
										onClick={() => setOpenModal("add")}
									>
										<Plus />
										Add Task
									</Button>
								</div>
								<QueryStateHandler
									query={boardQuery}
									emptyMessage="No Tasks."
									getItems={(res) => res}
									render={(res) => {
										const data = res.data as KanbanBoard;

										const columns = Object.entries(
											data.columns,
										).map(([key, column]) => ({
											id: key,
											title: column.name,
											tasks: column.tasks,
										}));

										return (
											<div className="">
												<Kanbanboard
													projectId={projectId}
													columns={columns}
												/>
											</div>
										);
									}}
								/>
							</div>
						</TabsContent>
						<TabsContent value="members">
							<div className="mt-4">
								<Members projectId={projectId} />
							</div>
						</TabsContent>
					</Tabs>
				</div>
			</main>

			<AddTaskModal
				projectId={projectId}
				isOpen={openModal === "add"}
				onClose={() => setOpenModal(null)}
			/>
		</div>
	);
}

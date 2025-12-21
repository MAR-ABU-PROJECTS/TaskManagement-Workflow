"use client";
import { useState } from "react";
import { initialTasks } from "@/app/(dashboard)/projects/lib/utils";
import Kanbanboard from "@/app/(dashboard)/projects/components/kanban-board";
import {
	BoardTask,
	KanbanBoard,
	Task,
} from "@/app/(dashboard)/projects/lib/type";
import { AddTaskModal } from "@/app/(dashboard)/projects/components/add-task-modal";
import { useGetProjectTasks } from "@/app/(dashboard)/tasks/lib/queries";
import { QueryStateHandler } from "./QueryStateHandler";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Members from "@/app/(dashboard)/projects/components/members";

export default function ProjectBoardPage({ projectId }: { projectId: string }) {
	const [tasks, setTasks] = useState(initialTasks);
	const [selectedTask, setSelectedTask] = useState<BoardTask | null>();
	const [openModal, setOpenModal] = useState<
		"edit" | "status" | "assign" | "delete" | "add" | null
	>(null);

	const [selectedColumnId, setSelectedColumnId] = useState<string>("todo");

	const handleEditTask = (taskId: number) => {
		const task = tasks.find((t) => t.id === taskId);
		setSelectedTask(task);
		setOpenModal("edit");
	};

	const handleChangeStatus = (taskId: number) => {
		const task = tasks.find((t) => t.id === taskId);
		setSelectedTask(task);
		setOpenModal("status");
	};

	const handleAssignTask = (taskId: number) => {
		const task = tasks.find((t) => t.id === taskId);
		setSelectedTask(task);
		setOpenModal("assign");
	};

	const handleDeleteTask = (taskId: number) => {
		const task = tasks.find((t) => t.id === taskId);
		setSelectedTask(task);
		setOpenModal("delete");
	};

	const handleSaveTask = (updatedTask: Task) => {
		setTasks(tasks.map((t) => (t.id === updatedTask.id ? updatedTask : t)));
		setOpenModal(null);
	};

	const handleStatusChange = (taskId: number, newStatus: string) => {
		setTasks(
			tasks.map((t) =>
				t.id === taskId ? { ...t, status: newStatus } : t
			)
		);
		setOpenModal(null);
	};

	const handleAssignChange = (taskId: number, assignee: string) => {
		setTasks(tasks.map((t) => (t.id === taskId ? { ...t, assignee } : t)));
		setOpenModal(null);
	};

	const handleConfirmDelete = (taskId: number) => {
		setTasks(tasks.filter((t) => t.id !== taskId));
		setOpenModal(null);
	};

	const handleAddTask = (newTask: Task) => {
		setTasks([...tasks, newTask]);
		setOpenModal(null);
	};

	const handleOpenAddTask = (columnId: string) => {
		setSelectedColumnId(columnId);
		setOpenModal("add");
	};

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
								<QueryStateHandler
									query={boardQuery}
									emptyMessage="Board Not found"
									getItems={(res) => res}
									render={(res) => {
										const data = res.data as KanbanBoard;

										const columns = Object.entries(
											data.columns
										).map(([key, column]) => ({
											id: key,
											title: column.name,
											tasks: column.tasks,
										}));

										const t = Object.values(
											data.columns
										).flatMap((column) => column.tasks);

										return (
											<div className="">
												<Kanbanboard
													projectId={projectId}
													columns={columns}
													tasks={t}
													onAddTask={
														handleOpenAddTask
													}
													onEditTask={handleEditTask}
													onChangeStatus={
														handleChangeStatus
													}
													onAssignTask={
														handleAssignTask
													}
													onDeleteTask={
														handleDeleteTask
													}
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

				{/* <QueryStateHandler
					query={useGetProjectTasks(projectId)}
					emptyMessage="Board Not found"
					getItems={(res) => res}
					render={(res) => {
						const data = res.data as KanbanBoard;

						const columns = Object.entries(data.columns).map(
							([key, column]) => ({
								id: key,
								title: column.name,
								tasks: column.tasks,
							})
						);

						const t = Object.values(data.columns).flatMap(
							(column) => column.tasks
						);

						return (
							<div className="">
								<Kanbanboard
									projectId={projectId}
									columns={columns}
									tasks={t}
									onAddTask={handleOpenAddTask}
									onEditTask={handleEditTask}
									onChangeStatus={handleChangeStatus}
									onAssignTask={handleAssignTask}
									onDeleteTask={handleDeleteTask}
								/>
							</div>
						);
					}}
				/> */}
			</main>

			<AddTaskModal
				projectId={projectId}
				isOpen={openModal === "add"}
				onClose={() => setOpenModal(null)}
				onAdd={handleAddTask}
				columnId={selectedColumnId}
			/>
			{/* <EditTaskModal
				projectId={projectId}
				isOpen={openModal === "edit"}
				onClose={() => setOpenModal(null)}
				task={selectedTask as Task}
				onSave={handleSaveTask}
			/> */}
			{/* <ChangeStatusModal
				isOpen={openModal === "status"}
				onClose={() => setOpenModal(null)}
				task={selectedTask as Task}
				onStatusChange={handleStatusChange}
			/> */}
			{/* <AssignTaskModal
				isOpen={openModal === "assign"}
				onClose={() => setOpenModal(null)}
				task={selectedTask as Task}
				onAssign={handleAssignChange}
			/> */}
			{/* <DeleteTaskModal
				isOpen={openModal === "delete"}
				onClose={() => setOpenModal(null)}
				title={title}
				id={id}
				onConfirm={handleConfirmDelete}
			/> */}
		</div>
	);
}

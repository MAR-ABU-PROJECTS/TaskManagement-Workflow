"use client";
import { useState } from "react";
import { columns, initialTasks } from "@/app/(dashboard)/projects/lib/utils";
import Kanbanboard from "@/app/(dashboard)/projects/components/kanban-board";
import { DeleteTaskModal } from "@/app/(dashboard)/projects/components/delete-task-modal";
import { AssignTaskModal } from "@/app/(dashboard)/projects/components/assign-task-modal";
import { ChangeStatusModal } from "@/app/(dashboard)/projects/components/change-status-modal";
import { EditTaskModal } from "@/app/(dashboard)/projects/components/edit-task-modal";
import { Task } from "@/app/(dashboard)/projects/lib/type";
import { AddTaskModal } from "@/app/(dashboard)/projects/components/add-task-modal";
import { useGetProjectsById } from "@/app/(dashboard)/projects/lib/queries";

export default function ProjectDetailPage({
	projectId,
}: {
	projectId: string;
}) {
	const query = useGetProjectsById(projectId);
	console.log(query.data);
	const [tasks, setTasks] = useState(initialTasks);
	const [selectedTask, setSelectedTask] = useState<Task | null>();
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

	return (
		<div className="flex flex-1 flex-col  w-full overflow-x-hidden">
			{/* Main Content - Kanban Board */}
			<main className=" py-6 px-4">
				{/* Header */}

				<div className="">
					<Kanbanboard
						columns={columns}
						tasks={tasks}
						onAddTask={handleOpenAddTask}
						onEditTask={handleEditTask}
						onChangeStatus={handleChangeStatus}
						onAssignTask={handleAssignTask}
						onDeleteTask={handleDeleteTask}
					/>
				</div>
			</main>

			<AddTaskModal
				isOpen={openModal === "add"}
				onClose={() => setOpenModal(null)}
				onAdd={handleAddTask}
				columnId={selectedColumnId}
			/>
			<EditTaskModal
				isOpen={openModal === "edit"}
				onClose={() => setOpenModal(null)}
				task={selectedTask as Task}
				onSave={handleSaveTask}
			/>
			<ChangeStatusModal
				isOpen={openModal === "status"}
				onClose={() => setOpenModal(null)}
				task={selectedTask as Task}
				onStatusChange={handleStatusChange}
			/>
			<AssignTaskModal
				isOpen={openModal === "assign"}
				onClose={() => setOpenModal(null)}
				task={selectedTask as Task}
				onAssign={handleAssignChange}
			/>
			<DeleteTaskModal
				isOpen={openModal === "delete"}
				onClose={() => setOpenModal(null)}
				task={selectedTask as Task}
				onConfirm={handleConfirmDelete}
			/>
		</div>
	);
}

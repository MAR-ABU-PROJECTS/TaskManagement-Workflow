"use client";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useState } from "react";
import { columns, initialTasks } from "@/app/(dashboard)/projects/lib/utils";
import Kanbanboard from "@/app/(dashboard)/projects/components/kanban-board";
import { DeleteTaskModal } from "@/app/(dashboard)/projects/components/delete-task-modal";
import { AssignTaskModal } from "@/app/(dashboard)/projects/components/assign-task-modal";
import { ChangeStatusModal } from "@/app/(dashboard)/projects/components/change-status-modal";
import { EditTaskModal } from "@/app/(dashboard)/projects/components/edit-task-modal";

export default function ProjectDetailPage() {
	const [tasks, setTasks] = useState(initialTasks);
	const [selectedTask, setSelectedTask] = useState<any>(null);
	const [openModal, setOpenModal] = useState<
		"edit" | "status" | "assign" | "delete" | null
	>(null);

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

	const handleSaveTask = (updatedTask: any) => {
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
					<Kanbanboard
						columns={columns}
						tasks={tasks}
						onAddTask={() => console.log("Add task to column")}
						onEditTask={handleEditTask}
						onChangeStatus={handleChangeStatus}
						onAssignTask={handleAssignTask}
						onDeleteTask={handleDeleteTask}
					/>
				</div>
			</main>

			<EditTaskModal
				isOpen={openModal === "edit"}
				onClose={() => setOpenModal(null)}
				task={selectedTask}
				onSave={handleSaveTask}
			/>
			<ChangeStatusModal
				isOpen={openModal === "status"}
				onClose={() => setOpenModal(null)}
				task={selectedTask}
				onStatusChange={handleStatusChange}
			/>
			<AssignTaskModal
				isOpen={openModal === "assign"}
				onClose={() => setOpenModal(null)}
				task={selectedTask}
				onAssign={handleAssignChange}
			/>
			<DeleteTaskModal
				isOpen={openModal === "delete"}
				onClose={() => setOpenModal(null)}
				task={selectedTask}
				onConfirm={handleConfirmDelete}
			/>
		</div>
	);
}

"use client";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { BoardTask, KanbanBoard } from "../lib/type";
import { useGetProjectTasks } from "../../tasks/lib/queries";
import { useState } from "react";
import { useTransitionTask } from "../../tasks/lib/mutation";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";

interface ChangeStatusModalProps {
	isOpen: boolean;
	onClose: () => void;
	task: BoardTask;
	projectId: string;
	// onStatusChange: (taskId: number, newStatus: string) => void;
}

export function ChangeStatusModal({
	isOpen,
	onClose,
	task,
	projectId,
	// onStatusChange,
}: ChangeStatusModalProps) {
	const projects = useGetProjectTasks(projectId);

	const data = projects.data.data as KanbanBoard;

	const columns = Object.entries(data.columns).map(([key, column]) => ({
		id: key,
		title: column.name,
	}));

	const [selectedStatus, setSelectedStatus] = useState('');

	const statusMutation = useTransitionTask(projectId);

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Change Task Status</DialogTitle>
					<DialogDescription>
						Select a new status for this task
					</DialogDescription>
				</DialogHeader>
				<div className="grid grid-cols-2 gap-2">
					{columns.map((status) => (
						<Button
							key={status.id}
							variant={
								selectedStatus === status.id
									? "default"
									: "outline"
							}
							onClick={() => {
								setSelectedStatus(status.id);
							}}
							className="w-full"
						>
							{status.title}
						</Button>
					))}
				</div>

				<div className="flex justify-end mt-4">
					<Button
						type="button"
						variant="outline"
						onClick={onClose}
						disabled={statusMutation.isPending}
						className="border-slate-200 dark:border-slate-800 bg-transparent"
					>
						Cancel
					</Button>
					<Button
						type="submit"
						disabled={statusMutation.isPending}
						className="bg-primary hover:bg-primary/90 text-white"
						onClick={() => {
							if (!selectedStatus) {
								return toast.error("select status first");
							}

							statusMutation.mutate({
								taskId: task.id,
								status: selectedStatus,
							});
						}}
					>
						{statusMutation.isPending && (
							<Spinner className="mr-1.5" />
						)}
						Update Status
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
}

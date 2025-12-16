"use client";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Task } from "../lib/type";

interface DeleteTaskModalProps {
	isOpen: boolean;
	onClose: () => void;
	task: Task;
	onConfirm: (taskId: number) => void;
}

export function DeleteTaskModal({
	isOpen,
	onClose,
	task,
	onConfirm,
}: DeleteTaskModalProps) {
	return (
		<AlertDialog open={isOpen} onOpenChange={onClose}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>Delete Task</AlertDialogTitle>
					<AlertDialogDescription>
						Are you sure you want to delete &quot;{task?.title}
						&quot;? This saction cannot be undone.
					</AlertDialogDescription>
				</AlertDialogHeader>
				<div className="flex gap-2 justify-end">
					<AlertDialogCancel>Cancel</AlertDialogCancel>
					<AlertDialogAction
						onClick={() => {
							onConfirm(task?.id);
							onClose();
						}}
						className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
					>
						Delete
					</AlertDialogAction>
				</div>
			</AlertDialogContent>
		</AlertDialog>
	);
}

"use client";
import {
	AlertDialog,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useDeleteTaskProject } from "../../tasks/lib/mutation";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

interface DeleteTaskModalProps {
	isOpen: boolean;
	onClose: () => void;
	title: string;
	id: string;
	projectId: string;
}

export function DeleteTaskModal({
	isOpen,
	onClose,
	title,
	id,
	projectId,
}: DeleteTaskModalProps) {
	const mutation = useDeleteTaskProject(projectId);
	return (
		<AlertDialog open={isOpen} onOpenChange={onClose}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>Delete Task</AlertDialogTitle>
					<AlertDialogDescription>
						Are you sure you want to delete &quot;{title}
						&quot;? This saction cannot be undone.
					</AlertDialogDescription>
				</AlertDialogHeader>
				<div className="flex justify-end gap-4">
					<Button
						type="button"
						variant="outline"
						onClick={onClose}
						disabled={mutation.isPending}
						className="border-slate-200 dark:border-slate-800 bg-transparent"
					>
						Cancel
					</Button>
					<Button
						type="submit"
						disabled={mutation.isPending}
						className="bg-primary hover:bg-primary/90 text-white"
						onClick={() =>
							mutation.mutate(id, {
								onSuccess() {
									onClose();
								},
							})
						}
					>
						{mutation.isPending && <Spinner className="mr-1.5" />}
						Delete
					</Button>
				</div>
			</AlertDialogContent>
		</AlertDialog>
	);
}

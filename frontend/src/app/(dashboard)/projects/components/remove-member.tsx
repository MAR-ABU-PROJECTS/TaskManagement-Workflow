import {
	AlertDialog,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import React from "react";
import { useRemoveProjectMembers } from "../lib/mutations";
import { Spinner } from "@/components/ui/spinner";

interface RemoveMemberModalProps {
	isOpen: boolean;
	onClose: () => void;
	projectId: string;
	selectedUsers: string[];
}

const RemoveMembers = ({
	isOpen,
	onClose,
	selectedUsers,
	projectId,
}: RemoveMemberModalProps) => {
	const { mutate: removeMembers, isPending } = useRemoveProjectMembers();

	const handleRemove = () => {
		if (selectedUsers.length > 1) {
			removeMembers(
				{
					projectId,
					userIds: selectedUsers,
				},
				{
					onSuccess() {
						onClose();
					},
				}
			);
			return;
		}

		if (selectedUsers.length === 1) {
			removeMembers(
				{
					projectId,
					userId: selectedUsers[0],
				},
				{
					onSuccess() {
						onClose();
					},
				}
			);
		}
	};
	return (
		<div>
			<AlertDialog open={isOpen} onOpenChange={onClose}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Remove Member</AlertDialogTitle>
						<AlertDialogDescription>
							Are you sure you want to remove &quot;
							{selectedUsers.length}&quot; member
							{selectedUsers.length > 1 ? "s" : ""} from this
							project?. This action cannot be undone.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<div className="flex justify-end mt-5 gap-4">
						<Button
							type="button"
							variant="outline"
							onClick={onClose}
							disabled={isPending}
							className="border-slate-200 dark:border-slate-800 bg-transparent"
						>
							Cancel
						</Button>
						<Button
							type="submit"
							disabled={!selectedUsers || isPending}
							className="bg-primary hover:bg-primary/90 text-white"
							onClick={handleRemove}
						>
							{isPending && <Spinner className="mr-1.5" />}
							Remove
						</Button>
					</div>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
};

export default RemoveMembers;

import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import React, { useEffect } from "react";
import { useAddProjectMembers } from "../lib/mutations";
import { useGetUsers } from "../../user-management/lib/queries";
import { Spinner } from "@/components/ui/spinner";

interface AddMemberModalProps {
	isOpen: boolean;
	onClose: () => void;
	projectId: string;
	selectedUsers: string[];
	toggleSelectedUsers: (id: string) => void;
}
const AddMemberModal = ({
	isOpen,
	onClose,
	projectId,
	selectedUsers,
	toggleSelectedUsers,
}: AddMemberModalProps) => {
	const addMembersMutation = useAddProjectMembers();
	const users = useGetUsers();

	return (
		<div>
			<Dialog open={isOpen} onOpenChange={onClose}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Add Members</DialogTitle>
						<DialogDescription>
							Add a new member to your project
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-3">
						{users.data?.users.map((u, i) => (
							<Button
								key={u.id}
								variant={"outline"}
								className=" justify-between w-full items-center"
							>
								<p> {u.name}</p>
								<input
									type="checkbox"
									onChange={() => toggleSelectedUsers(u.id)}
									className="size-4 accent-primary"
								/>
							</Button>
						))}

						<div className="flex justify-end gap-5 mt-5">
							<Button
								type="button"
								variant="outline"
								onClick={onClose}
								disabled={addMembersMutation.isPending}
								className="border-slate-200 dark:border-slate-800 bg-transparent"
							>
								Cancel
							</Button>
							<Button
								type="button"
								disabled={
									addMembersMutation.isPending ||
									selectedUsers.length === 0
								}
								className="bg-primary hover:bg-primary/90 text-white"
								onClick={() =>
									addMembersMutation.mutate({
										projectId,
										members: [...selectedUsers],
									})
								}
							>
								{addMembersMutation.isPending && (
									<Spinner className="mr-1.5" />
								)}
								Add Member
							</Button>
						</div>
					</div>
				</DialogContent>
			</Dialog>
		</div>
	);
};

export default AddMemberModal;

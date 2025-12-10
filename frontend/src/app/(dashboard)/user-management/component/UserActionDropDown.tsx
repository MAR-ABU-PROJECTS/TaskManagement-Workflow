import { useState } from "react";
import { ConfirmActionModal } from "@/components/ConfirmActionModal";
import { Role, canPromote } from "@/lib/rolespermissions";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Eye, MoreHorizontal, Slash, Trash2, UserPlus } from "lucide-react";
import Link from "next/link";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { userService } from "../lib/service";
import { userKeys } from "../lib/keys";

export interface UserActionDropdownProps {
	currentUserRole: Role; // role of the logged-in user
	user: {
		id: string;
		name: string;
		role: Role;
	};
}

export const UserActionDropdown = ({
	currentUserRole,
	user,
}: UserActionDropdownProps) => {
	const [modalOpen, setModalOpen] = useState(false);
	const [actionType, setActionType] = useState<
		"delete" | "deactivate" | "promote" | null
	>(null);
	const [selectedRole, setSelectedRole] = useState<Role | null>(null);

	const promotableRoles = Object.values(Role).filter((role) =>
		canPromote(currentUserRole, role)
	);

	const openModalForAction = (type: typeof actionType, role?: Role) => {
		setActionType(type);
		setSelectedRole(role ?? null);
		setModalOpen(true);
	};

	const filterRoles = promotableRoles.filter((role) => role !== user.role);
	const qc = useQueryClient();
	const deleteUserMutation = useMutation({
		mutationFn: (userid: string) => userService.deleteUser(userid),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: userKeys.all });
		},
	});
	const deactivateUserMutation = useMutation({
		mutationFn: (userid: string) => userService.deactivateUser(userid),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: userKeys.all });
		},
	});
	const promoteUserMutation = useMutation({
		mutationFn: ({ userid, role }: { userid: string; role: Role }) =>
			userService.promoteUser(userid, role),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: userKeys.all });
		},
	});

	return (
		<>
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button variant="ghost">
						<MoreHorizontal />
					</Button>
				</DropdownMenuTrigger>

				<DropdownMenuContent align="end" className="p-1">
					{/* View User */}
					<DropdownMenuItem className="hover:bg-zinc-100 p-1">
						<Link
							href={`/user-management/${user.id}`}
							className="flex items-center text-sm"
						>
							<Eye className="size-5 text-gray-500 mr-1.5" />
							View Details
						</Link>
					</DropdownMenuItem>

					<DropdownMenuSeparator />

					{/* Promote User */}
					{filterRoles.map((role) => (
						<DropdownMenuItem
							key={role}
							className="hover:bg-zinc-100 p-1 flex items-center text-sm"
							onClick={() => openModalForAction("promote", role)}
						>
							<UserPlus className="size-5 text-green-500 mr-1.5" />
							Promote to {role.replace("_", " ")}
						</DropdownMenuItem>
					))}

					{filterRoles.length > 0 && <DropdownMenuSeparator />}

					{/* Deactivate */}
					<DropdownMenuItem
						className="hover:bg-zinc-100 p-1 flex items-center text-sm"
						onClick={() => openModalForAction("deactivate")}
					>
						<Slash className="size-5 text-yellow-500 mr-1.5" />
						Deactivate
					</DropdownMenuItem>

					{/* Delete */}
					<DropdownMenuItem
						className="hover:bg-zinc-100 p-1 flex items-center text-sm"
						onClick={() => openModalForAction("delete")}
					>
						<Trash2 className="size-5 text-red-500 mr-1.5" />
						Delete
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>

			{/* Confirmation Modal */}
			<ConfirmActionModal
				open={modalOpen}
				onOpenChange={setModalOpen}
				title={
					actionType === "delete"
						? "Delete User?"
						: actionType === "deactivate"
							? "Deactivate User?"
							: actionType === "promote"
								? `Promote User to ${selectedRole?.replace("_", " ")}?`
								: ""
				}
				description={
					actionType === "delete"
						? `Are you sure you want to delete ${user.name}? This action cannot be undone.`
						: actionType === "deactivate"
							? `Are you sure you want to deactivate ${user.name}?`
							: actionType === "promote"
								? `Are you sure you want to promote ${user.name} to ${selectedRole?.replace("_", " ")}?`
								: ""
				}
				onConfirm={async () => {
					if (actionType === "delete") {
						await deleteUserMutation.mutateAsync(user.id);
					}
					if (actionType === "deactivate") {
						await deactivateUserMutation.mutateAsync(user.id);
					}
					if (actionType === "promote") {
						await promoteUserMutation.mutateAsync({
							userid: user.id,
							role: selectedRole as Role,
						});
					}
				}}
			/>
		</>
	);
};

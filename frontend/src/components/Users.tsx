"use client";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { apiService } from "@/lib/apiService";
import {
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@radix-ui/react-dropdown-menu";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ColumnDef, PaginationState } from "@tanstack/react-table";
import { isAxiosError } from "axios";
import { Eye, Loader2, MoreHorizontal, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { DataTable } from "@/components/ui/data-table";
import { DataTableSkeleton } from "@/components/ui/data-table-skeleton";
import { QueryStateHandler } from "@/components/QueryStateHandler";
import {
	AlertDialog,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import Link from "next/link";
import { useGetUsers } from "@/app/(dashboard)/user-management/hooks/useGetUsers";
import { User } from "@/app/(dashboard)/user-management/lib/types";
import { RoleBadge } from "./ui/role-badge";
import { UserActionDropdown } from "@/app/(dashboard)/user-management/component/UserActionDropDown";
import { Role } from "@/lib/rolespermissions";
// import dayjs from "dayjs";
// import advancedFormat from "dayjs/plugin/advancedFormat";
// dayjs.extend(advancedFormat);

const UsersManagement = () => {
	const [pagination, setPagination] = useState<PaginationState>({
		pageIndex: 0,
		pageSize: 10,
	});
	const [open, setOpen] = useState(false);
	const queryClient = useQueryClient();

	const [selectedUser, setSelectedUser] = useState({
		id: "",
		name: "",
		email: "",
	});

	const handldeTrashMenuClick = (id: string, name: string, email: string) => {
		setSelectedUser({
			id,
			name,
			email,
		});
		setOpen(true);
	};

	const { data } = useGetUsers();
	console.log({ data });

	const columns: ColumnDef<User>[] = [
		{
			accessorKey: "name",
			header: "Name",
		},
		{
			accessorKey: "role",
			header: "Role",
			cell: ({ row }) => {
				const user = row.original;

				return <RoleBadge role={user.role} />;
			},
		},

		{
			id: "actions",

			cell: ({ row }) => {
				const user = row.original;
				return (
					<UserActionDropdown
						currentUserRole={Role.SUPER_ADMIN}
						user={user}
					/>
				);
			},
		},
	];

	return (
		<div className="flex flex-1 flex-col">
			{/* Main Content */}
			<main className="flex-1 overflow-auto p-6 px-4">
				<div className="mx-auto space-y-6">
					{/* Header */}

					{/* Projects Grid */}
					<QueryStateHandler
						query={useGetUsers()}
						emptyMessage="No Users found"
						getItems={(res) => res.users}
						loadingComponent={
							<DataTableSkeleton
								columnCount={3}
								cellWidths={["20rem", "30rem", "20em"]}
							/>
						}
						render={(res) => {
							const data = res.users ?? [];
							const pages = res.data?.pagination?.pages ?? 0;

							return (
								<DataTable
									columns={columns}
									data={data}
									pagination={pagination}
									setPagination={setPagination}
									pageCount={pages}
								/>
							);
						}}
					/>
					<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"></div>
				</div>
			</main>
		</div>
	);
};

export default UsersManagement;

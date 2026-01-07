"use client";
import React, { useState } from "react";
import { QueryStateHandler } from "./QueryStateHandler";
import { useQuery } from "@tanstack/react-query";
import { apiService } from "@/lib/apiService";
import {
	Card,
	CardHeader,
	CardTitle,
	CardContent,
	CardDescription,
} from "./ui/card";
import { CheckCircle2, Clock, FolderKanban } from "lucide-react";
import Link from "next/link";
import { Role } from "@/lib/rolespermissions";
import { RoleBadge } from "./ui/role-badge";
import { User } from "@/app/(dashboard)/user-management/lib/types";
import { ColumnDef, PaginationState } from "@tanstack/react-table";
import { DataTable } from "./ui/data-table";

const AdminDashboard = () => {
	const [pagination, setPagination] = useState<PaginationState>({
		pageIndex: 0,
		pageSize: 10,
	});
	const query = useQuery<UsersOverview>({
		queryKey: ["admin-dashboard"],
		queryFn: () => {
			return apiService.get("/users/dashboard/overview");
		},
		meta: { disableGlobalSuccess: true },
	});

	console.log(query.data);
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
	];
	return (
		<div>
			<QueryStateHandler
				query={query}
				emptyMessage="No Data Found"
				getItems={(res) => res}
				render={(res) => {
					const data = res;

					return (
						<div>
							<div className="grid gap-4 md:grid-cols-3">
								<Card>
									<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
										<CardTitle className="text-sm font-medium">
											Total Users
										</CardTitle>
										<FolderKanban className="h-4 w-4 text-muted-foreground" />
									</CardHeader>
									<CardContent>
										<div className="text-2xl font-bold">
											{data.totalUsers}
										</div>
									</CardContent>
								</Card>

								<Card>
									<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
										<CardTitle className="text-sm font-medium">
											Active Users
										</CardTitle>
										<Clock className="h-4 w-4 text-muted-foreground" />
									</CardHeader>
									<CardContent>
										<div className="text-2xl font-bold">
											{data.activeUsers}
										</div>
									</CardContent>
								</Card>

								<Card>
									<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
										<CardTitle className="text-sm font-medium">
											Inactive Users
										</CardTitle>
										<CheckCircle2 className="h-4 w-4 text-muted-foreground" />
									</CardHeader>
									<CardContent>
										<div className="text-2xl font-bold">
											{data.inactiveUsers}
										</div>
									</CardContent>
								</Card>
							</div>
							<div className="grid gap-6 lg:grid-cols-2 mt-5">
								{/* Recent Projects */}
								<Card>
									<CardHeader>
										<div className="flex justify-between items-center flex-wrap">
											<CardTitle>Recent Users</CardTitle>
											<Link
												href={"/user-management"}
												className="text-underline text-sm"
											>
												View all
											</Link>
										</div>
										<CardDescription>
											Your most recently registered users
										</CardDescription>
									</CardHeader>
									<CardContent className="space-y-4">
										<div>
											<DataTable
												columns={columns}
												data={data.recentUsers}
												pagination={pagination}
												setPagination={setPagination}
												pageCount={0}
												showPagination={false}
											/>
										</div>
									</CardContent>
								</Card>

								{/* My Tasks */}
								<Card>
									<CardHeader>
										<CardTitle>Users By Role</CardTitle>
										<CardDescription>
											Users role count
										</CardDescription>
									</CardHeader>
									<CardContent className="space-y-1.5">
										{data.usersByRole.map((u, i) => (
											<p key={i} className="text-sm">
												<span className="text-gray-500"> {u.role}</span>:{" "}
												<span>{u._count}</span>
											</p>
										))}
									</CardContent>
								</Card>
							</div>
						</div>
					);
				}}
			/>
		</div>
	);
};

export default AdminDashboard;

export type UsersOverview = {
	totalUsers: number;
	activeUsers: number;
	inactiveUsers: number;

	recentUsers: UserSummary[];

	usersByRole: UsersByRole[];
};

export type UserSummary = {
	id: string;
	name: string;
	email: string;
	role: Role;
	createdAt: string;
};

export type UsersByRole = {
	role: Role;
	_count: number;
};

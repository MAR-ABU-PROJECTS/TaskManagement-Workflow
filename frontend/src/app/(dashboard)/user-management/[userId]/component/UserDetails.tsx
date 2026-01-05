"use client";
import React from "react";
import { useGetUserById } from "../../lib/queries";
import { QueryStateHandler } from "@/components/QueryStateHandler";
import { ArrowLeft, Calendar, Mail, Shield } from "lucide-react";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { RoleBadge } from "@/components/ui/role-badge";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Role } from "@/lib/rolespermissions";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

const UserDetails = ({ userId }: { userId: string }) => {
	const router = useRouter();
	return (
		<div className="flex flex-1 flex-col px-4 p-6">
			<div className="mb-3">
				<Button
				
					onClick={() => router.back()}
					className="flex items-center gap-2  hover:text-black/50 text-base font-[500] text-black bg-white hover:bg-white"
				>
					<ArrowLeft className="h-5 w-5" />
					<span className="text-sm">Back</span>
				</Button>
			</div>

			<main className="flex-1">
				<div className="mx-auto max-w-7xl">
					<QueryStateHandler
						query={useGetUserById(userId)}
						emptyMessage="User Not found"
						getItems={(res) => res}
						render={(res) => {
							console.log({ res });

							const avatar = res?.name?.split(" ");
							const first = (avatar?.[0] as string)
								?.charAt(0)
								?.toUpperCase();
							const last = (avatar?.[1] as string)
								?.charAt(0)
								?.toUpperCase();

							return (
								<div>
									<Card>
										<CardHeader>
											<div className="flex items-start justify-between">
												<div className="flex items-center gap-4">
													<Avatar className="h-16 w-16">
														<AvatarFallback>
															{first}
															{last}
														</AvatarFallback>
													</Avatar>
													<div>
														<div className="flex items-center gap-2">
															<h1 className="text-2xl font-bold">
																{res?.name}
															</h1>
															<RoleBadge
																role={
																	res?.role as Role
																}
															/>
														</div>
														<p className="text-muted-foreground">
															{/* {mockMember.department} */}
														</p>
													</div>
												</div>
											</div>
										</CardHeader>
										<CardContent className="space-y-4">
											<div className="grid grid-cols-2 gap-4">
												<div className="space-y-1">
													<div className="flex items-center gap-2 text-sm text-muted-foreground">
														<Mail className="h-4 w-4" />
														Email
													</div>
													<p className="text-sm font-medium">
														{res?.email}
													</p>
												</div>
												<div className="space-y-1">
													<div className="flex items-center gap-2 text-sm text-muted-foreground">
														<Calendar className="h-4 w-4" />
														Joined
													</div>
													<p className="text-sm font-medium">
														{res.createdAt
															? format(
																	new Date(
																		res.createdAt
																	),
																	"yyyy-MM-dd"
																)
															: ""}
													</p>
												</div>

												<div className="space-y-1">
													<div className="flex items-center gap-2 text-sm text-muted-foreground">
														<Shield className="h-4 w-4" />
														Status
													</div>
													<Badge variant="outline">
														{res?.isActive
															? "Active"
															: "Not Active"}
													</Badge>
												</div>

												{res?.promotedBy && (
													<div className="space-y-1">
														<div className="flex items-center gap-2 text-sm text-muted-foreground">
															Promoted By:
														</div>
														<p className="text-sm font-medium">
															{
																res?.promotedBy
																	?.name
															}
														</p>
														<p className="text-sm font-medium">
															{
																res?.promotedBy
																	?.email
															}
														</p>

														<RoleBadge
															role={
																res?.promotedBy
																	?.role as Role
															}
														/>
													</div>
												)}
											</div>
										</CardContent>
									</Card>

									{/* Statistics */}
									<div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
										<Card>
											<CardHeader className="pb-3">
												<CardTitle className="text-base">
													Tasks Completed
												</CardTitle>
												<CardDescription>
													Total completed tasks
												</CardDescription>
											</CardHeader>
											<CardContent>
												<div className="text-3xl font-bold">
													{/* {mockMember.tasksCompleted} */}
												</div>
												<p className="text-xs text-muted-foreground mt-1">
													+2 this month
												</p>
											</CardContent>
										</Card>
										<Card>
											<CardHeader className="pb-3">
												<CardTitle className="text-base">
													Projects Owned
												</CardTitle>
												<CardDescription>
													Active projects
												</CardDescription>
											</CardHeader>
											<CardContent>
												<div className="text-3xl font-bold">
													{/* {mockMember.projectsOwned} */}
												</div>
												<p className="text-xs text-muted-foreground mt-1">
													All active
												</p>
											</CardContent>
										</Card>
									</div>
								</div>
							);
						}}
					/>
				</div>
			</main>
		</div>
	);
};

export default UserDetails;

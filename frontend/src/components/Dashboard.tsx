"use client";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useSession } from "@/app/providers/session-provider";
import UserDashboard from "./UserDashboard";
import AdminDashboard from "./AdminDashboard";
import { Plus } from "lucide-react";
import { Can, Permission, Role } from "@/lib/rolespermissions";

export default function DashboardPage() {
	const { user } = useSession();
	return (
		<div className="flex flex-1 flex-col">
			{/* Header */}

			{/* Main Content */}
			<main className="flex-1 overflow-auto px-4 py-6">
				<div className="mx-auto space-y-6">
					{/* Welcome Section */}
					<div>
						<div className="flex justify-between items-center mb-2 flex-wrap gap-2.5">
							<h2 className="text-2xl font-bold tracking-tight">
								Welcome back, {user?.name ?? ""}
							</h2>
							<Can
								role={user?.role as Role}
								Permission={Permission["CREATE_PROJECT"]}
							>
								<Button size="sm" variant={"default"} asChild>
									<Link href="/projects/new">
										<Plus className="mr-2 h-4 w-4" />
										New Project
									</Link>
								</Button>
							</Can>
						</div>

						<p className="text-muted-foreground">
							Here&apos;s what&apos;s happening.
						</p>
					</div>
					{user?.role?.toLowerCase() === "super_admin" ? (
						<AdminDashboard />
					) : (
						<UserDashboard />
					)}
				</div>
			</main>
		</div>
	);
}

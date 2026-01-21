"use client";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";
import { QueryStateHandler } from "./QueryStateHandler";
import { useGetPersonalTasks } from "@/app/(dashboard)/tasks/lib/queries";
import PerosnalTask from "@/app/(dashboard)/tasks/components/perosnalTask";
import { BoardTask } from "@/app/(dashboard)/projects/lib/type";

export default function TasksPage() {
	const query = useGetPersonalTasks();
	return (
		<div className="flex flex-1 flex-col px-4 p-6">
			{/* Header */}
			{/* Main Content */}
			<main className="flex-1 overflow-auto">
				<div className="flex items-center gap-2">
					<div className="ml-auto flex items-center gap-2">
						{/* <div className="relative">
							<Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
							<Input
								placeholder="Search tasks..."
								className="w-64 pl-8"
							/>
						</div> */}
						{/* <Button
							size="sm"
							variant="outline"
							className="bg-transparent"
						>
							<Filter className="mr-2 h-4 w-4" />
							Filter
						</Button> */}
						<Button size="sm" asChild>
							<Link href={"/tasks/new"}>
								<Plus className="mr-2 h-4 w-4" />
								New Task
							</Link>
						</Button>
					</div>
				</div>

				<div className="mx-auto space-y-6 mt-3">
					{/* Filter Tabs */}
					<div defaultValue="all" className="w-full">
						<div className="mt-5">
							<QueryStateHandler
								query={query}
								emptyMessage="No Tasks."
								getItems={(res) => res}
								render={(res) => {
									const data: BoardTask[] = res.data ?? [];

									return (
										<div className="space-y-4">
											{data.map((p, i) => (
												<PerosnalTask key={i} {...p} />
											))}
										</div>
									);
								}}
							/>
						</div>
					</div>
				</div>
			</main>
		</div>
	);
}

"use client";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";
import Projectitem from "@/app/(dashboard)/projects/components/projectitem";
import { QueryStateHandler } from "./QueryStateHandler";
import { useGetProjects } from "@/app/(dashboard)/projects/lib/queries";

export default function ProjectsPage() {

	return (
		<div className="flex flex-1 flex-col">
			{/* Main Content */}
			<main className="flex-1 overflow-auto p-6 px-4">
				<div className="mx-auto space-y-6">
					{/* Header */}
					<div className="flex items-center gap-2">
						<div className="flex items-center gap-2">
							<Button size="sm" asChild>
								<Link href={"/projects/new"}>
									<Plus className="mr-2 h-4 w-4" />
									New Project
								</Link>
							</Button>
						</div>
					</div>

					{/* Projects Grid */}
					<QueryStateHandler
						query={useGetProjects()}
						emptyMessage="No Projects."
						getItems={(res) => res.data}
						render={(res) => {
							const data = res.data ?? [];

							return (
								<>
									{data.map((project) => {
										const { key, ...rest } = project;
										void key;
										return (
											<Projectitem
												key={project.id}
												{...rest}
											/>
										);
									})}
								</>
							);
						}}
					/>
				</div>
			</main>
		</div>
	);
}

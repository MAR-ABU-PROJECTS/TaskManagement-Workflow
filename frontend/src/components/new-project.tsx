"use client";

import type React from "react";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Textarea } from "@/components/ui/textarea";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Spinner } from "./ui/spinner";
import { useCreateProject } from "@/app/(dashboard)/projects/lib/mutations";

export type createProjectType = z.infer<typeof CreateProjectSchema>;

export default function NewProjectPage() {
	const { mutate, isPending } = useCreateProject();

	const form = useForm<createProjectType>({
		resolver: zodResolver(CreateProjectSchema),
		defaultValues: {
			description: "",
			key: "",
			name: "",
			workflowType: "AGILE",
			workflowSchemeId: "",
		},
	});

	const onSubmit = (data: createProjectType) => {
		mutate(data, {
			onSuccess: () => {
				form.reset();
			},
		});
	};

	return (
		<div className="flex flex-1 flex-col w-full h-full">
			{/* Header */}

			{/* Main Content */}
			<main className="flex-1 overflow-auto px-4 p-6">
				<div className="mx-auto">
					<div className="flex items-center gap-2 mb-4">
						<Link
							href="/projects"
							className="flex items-center gap-2  hover:text-black/50 text-base font-[500] text-black"
						>
							<ArrowLeft className="h-5 w-5" />
							<span className="text-sm">Back to Projects</span>
						</Link>
					</div>
					<Form {...form}>
						<form
							onSubmit={form.handleSubmit(onSubmit)}
							className="space-y-6 max-w-6xl mx-auto"
						>
							{/* Basic Information Card */}
							<Card>
								<CardHeader>
									<CardTitle>Basic Information</CardTitle>
									<CardDescription>
										Provide the foundational details for
										your project
									</CardDescription>
								</CardHeader>
								<CardContent className="space-y-4">
									<FormField
										control={form.control}
										name="name"
										render={({ field }) => (
											<FormItem>
												<FormLabel>
													{" "}
													Project Name *
												</FormLabel>
												<FormControl>
													<Input
														placeholder="Enter project name"
														className="border-slate-200 dark:border-slate-800"
														{...field}
													/>
												</FormControl>

												<FormMessage />
											</FormItem>
										)}
									/>

									<FormField
										control={form.control}
										name="key"
										render={({ field }) => (
											<FormItem>
												<FormLabel>
													{" "}
													Project Key *
												</FormLabel>
												<FormControl>
													<Input
														placeholder="Enter project Key (useful) for search"
														className="border-slate-200 dark:border-slate-800"
														{...field}
													/>
												</FormControl>

												<FormMessage />
											</FormItem>
										)}
									/>

									<FormField
										control={form.control}
										name="description"
										render={({ field }) => (
											<FormItem>
												<FormLabel>
													{" "}
													Description *
												</FormLabel>
												<FormControl>
													<Textarea
														placeholder="Describe your project goals and scope"
														rows={4}
														className="border-slate-200 dark:border-slate-800"
														{...field}
													/>
												</FormControl>

												<FormMessage />
											</FormItem>
										)}
									/>
								</CardContent>
							</Card>

							{/* Action Buttons */}
							<div className="flex gap-3 justify-end">
								<Button
									type="submit"
									disabled={isPending}
									className="bg-primary hover:bg-primary/90 text-white"
								>
									{isPending && (
										<Spinner className="mr-1.5" />
									)}
									Create Project
								</Button>
							</div>
						</form>
					</Form>
				</div>
			</main>
		</div>
	);
}

export const CreateProjectSchema = z.object({
	name: z.string().min(1, "project name is required"),
	key: z.string().min(1, "project key is required"),
	description: z.string().min(1, "project description is required"),
	workflowType: z.enum(["AGILE", "KANBAN", "SCRUM", "WATERFALL"]),
	workflowSchemeId: z.string().optional(),
});

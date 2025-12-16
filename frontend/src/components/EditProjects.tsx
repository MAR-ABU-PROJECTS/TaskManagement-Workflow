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
import { useUpdateProject } from "@/app/(dashboard)/projects/lib/mutations";
import { useGetProjectsById } from "@/app/(dashboard)/projects/lib/queries";
import { QueryStateHandler } from "./QueryStateHandler";
import { useEffect } from "react";
import { Spinner } from "./ui/spinner";

export type editProjectType = z.infer<typeof EditProjectSchema>;

export default function EditProjectPage({ id }: { id: string }) {
	const query = useGetProjectsById(id);
	const { mutate, isPending } = useUpdateProject();

	const form = useForm<editProjectType>({
		resolver: zodResolver(EditProjectSchema),
		defaultValues: {
			description: "",
			key: "",
			name: "",
		},
	});

	useEffect(() => {
		if (query.data?.data) {
			form.reset({
				description: query.data.data.description,
				key: query.data.data.key,
				name: query.data.data.name,
			});
		}
	}, [query.data, form]);

	const onSubmit = (data: editProjectType) => {
		mutate({ id, project: data });
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

					<QueryStateHandler
						query={query}
						emptyMessage={`Project with id:${id} not found`}
						getItems={(res) => res.data}
						render={() => {
							return (
								<>
									<Form {...form}>
										<form
											onSubmit={form.handleSubmit(
												onSubmit
											)}
											className="space-y-6 max-w-6xl mx-auto"
										>
											<Card>
												<CardHeader>
													<CardTitle>
														Project Information
													</CardTitle>
													<CardDescription>
														Update this project
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
																	Project Name
																	*
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
																	Project Key
																	*
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
																	Description
																	*
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

											<div className="flex gap-3 justify-end">
												<Button
													type="submit"
													disabled={isPending}
													className="bg-primary hover:bg-primary/90 text-white"
												>
													{isPending && (
														<Spinner className="mr-1.5" />
													)}
													Update Project
												</Button>
											</div>
										</form>
									</Form>
								</>
							);
						}}
					/>
				</div>
			</main>
		</div>
	);
}

export const EditProjectSchema = z.object({
	name: z.string().min(1, "project name is required"),
	key: z.string().min(1, "project key is required"),
	description: z.string().min(1, "project description is required"),
});

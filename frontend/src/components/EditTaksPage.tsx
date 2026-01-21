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
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { useGetTaskDetails } from "@/app/(dashboard)/tasks/lib/queries";
import { createPTaskSchemaType } from "./NewTaskPage";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { createTaskSchema } from "@/app/(dashboard)/projects/components/add-task-modal";
import { Spinner } from "./ui/spinner";
import z from "zod";
import { useEffect } from "react";
import { useEditPersonalTask } from "@/app/(dashboard)/tasks/lib/mutation";
import { toDateInputValue } from "@/lib/utils";

export default function EditTaskPage({ id }: { id: string }) {
	const query = useGetTaskDetails(id);

	const form = useForm<createPTaskSchemaType>({
		resolver: zodResolver(schema),
		defaultValues: {
			title: "",
			description: "",
			issueType: "",
			priority: "",
			dueDate: "",
			estimatedHours: 0,
		},
	});

	console.log(query.data?.data);

	useEffect(() => {
		if (query.data?.data) {
			form.reset({
				title: query.data.data.title,
				issueType: query.data.data.issueType,
				description: query.data.data.description,
				priority: query.data.data.priority,
				dueDate: query.data?.data?.dueDate
					? toDateInputValue(query.data?.data?.dueDate)
					: "",
				estimatedHours: 0,
			});
		}
	}, [query.data, form]);

	const taskMutation = useEditPersonalTask();

	const onSubmit = (data: createPTaskSchemaType) => {
		const dueDate = new Date(data.dueDate).toISOString();
		taskMutation.mutate(
			{ task: { ...data, dueDate }, taskId: id },
			{
				onSuccess: () => {
					form.reset();
				},
			},
		);
	};

	return (
		<div className="flex flex-1 flex-col">
			<div className="flex h-16 shrink-0 items-center gap-2 px-4">
				<Link
					href={`/tasks`}
					className="flex items-center gap-2 hover:text-muted-foreground text-foreground"
				>
					<ArrowLeft className="h-4 w-4" />
					<span className="text-sm">Back to Tasks</span>
				</Link>
			</div>

			<main className="flex-1 overflow-auto">
				<div className="mx-auto max-w-6xl">
					<Form {...form}>
						<form
							onSubmit={form.handleSubmit(onSubmit)}
							className="space-y-6"
						>
							<Card>
								<CardHeader>
									<CardTitle>Task Information</CardTitle>
									<CardDescription>
										Provide details about the task
									</CardDescription>
								</CardHeader>
								<CardContent className="space-y-4">
									<FormField
										control={form.control}
										name="title"
										render={({ field }) => (
											<FormItem>
												<FormLabel>
													{" "}
													Task Title *
												</FormLabel>
												<FormControl>
													<Input
														placeholder="Enter task title"
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
														placeholder="Task description"
														rows={3}
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

							<Card>
								<CardHeader>
									<CardTitle>Task Settings</CardTitle>
									<CardDescription>
										Configure task properties
									</CardDescription>
								</CardHeader>
								<CardContent className="space-y-4">
									<div className="grid gap-4 md:grid-cols-2">
										<FormField
											control={form.control}
											name="issueType"
											render={({ field }) => (
												<FormItem>
													<FormLabel>
														{" "}
														Issue Type *
													</FormLabel>
													<FormControl>
														<div className="w-full">
															<Select
																value={
																	field.value
																}
																onValueChange={
																	field.onChange
																}
															>
																<SelectTrigger className="border-slate-200 dark:border-slate-800">
																	<SelectValue placeholder="Issue Type" />
																</SelectTrigger>
																<SelectContent>
																	<SelectItem value="TASK">
																		Task
																	</SelectItem>
																	<SelectItem value="BUG">
																		Bug
																	</SelectItem>
																	<SelectItem value="STORY">
																		Story
																	</SelectItem>
																</SelectContent>
															</Select>
														</div>
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>

										<FormField
											control={form.control}
											name="priority"
											render={({ field }) => (
												<FormItem>
													<FormLabel>
														{" "}
														Priority *
													</FormLabel>
													<FormControl>
														<div className="w-full">
															<Select
																value={
																	field.value
																}
																onValueChange={
																	field.onChange
																}
															>
																<SelectTrigger className="border-slate-200 dark:border-slate-800">
																	<SelectValue placeholder="Select priority" />
																</SelectTrigger>
																<SelectContent>
																	<SelectItem value="LOW">
																		Low
																	</SelectItem>
																	<SelectItem value="MEDIUM">
																		Medium
																	</SelectItem>
																	<SelectItem value="HIGH">
																		High
																	</SelectItem>
																</SelectContent>
															</Select>
														</div>
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>

										<FormField
											control={form.control}
											name="dueDate"
											render={({ field }) => (
												<FormItem>
													<FormLabel>
														{" "}
														Due Date
													</FormLabel>
													<FormControl>
														<Input
															type="date"
															className="border-slate-200 dark:border-slate-800"
															{...field}
															// className="border-slate-200 dark:border-slate-800 pl-10"
														/>
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>
									</div>

									<FormField
										control={form.control}
										name="estimatedHours"
										render={({ field }) => (
											<FormItem>
												<FormLabel>
													{" "}
													Estimated Hours
												</FormLabel>
												<FormControl>
													<Input
														type="number"
														placeholder="e.g. 8"
														className="border-slate-200 dark:border-slate-800"
														step={0.1}
														value={
															field.value || ""
														}
														onChange={(e) =>
															field.onChange(
																e.target
																	.valueAsNumber ||
																	0,
															)
														}
														onBlur={field.onBlur}
														name={field.name}
														ref={field.ref}
													/>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
								</CardContent>
							</Card>

							<div className="flex justify-end">
								<Button
									type="submit"
									disabled={taskMutation.isPending}
									className="bg-primary hover:bg-primary/90 text-white"
								>
									{taskMutation.isPending && (
										<Spinner className="mr-1.5" />
									)}
									Update Task
								</Button>
							</div>
						</form>
					</Form>
				</div>
			</main>
		</div>
	);
}

const schema = createTaskSchema
	.pick({
		description: true,
		title: true,
		priority: true,
		issueType: true,
	})
	.extend({
		dueDate: z
			.string()
			.min(1, "due date is required")
			.refine((val) => /^\d{4}-\d{2}-\d{2}$/.test(val), {
				message: "Invalid date",
			}),
		estimatedHours: z.number().min(0.1, "input estimated hours"),
	});

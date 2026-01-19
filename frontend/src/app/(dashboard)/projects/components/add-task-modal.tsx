"use client";
import type React from "react";
import { useEffect } from "react";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { z } from "zod";
import ReactSelect from "react-select";

import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCreateTaskProject } from "../../tasks/lib/mutation";
import { Spinner } from "@/components/ui/spinner";
import { useGetProjectsMembers } from "../lib/queries";

interface AddTaskModalProps {
	isOpen: boolean;
	onClose: () => void;
	projectId: string;
}
export type createTaskPSchemaType = z.infer<typeof createTaskSchema>;
export function AddTaskModal({
	isOpen,
	onClose,
	projectId,
}: AddTaskModalProps) {
	const members = useGetProjectsMembers(projectId);

	const form = useForm<createTaskPSchemaType>({
		resolver: zodResolver(createTaskSchema),
		defaultValues: {
			title: "",
			projectId: projectId,
			description: "",
			issueType: "",
			priority: "",
			assigneeIds: [""],
		},
	});

	type MembersOption = {
		value: string;
		label: string;
	};

	const options: { value: string; label: string }[] = members.data?.map(
		(u: { user: { name: string; id: string } }) => ({
			value: u?.user?.id,
			label: u?.user?.name,
		})
	);

	const taskMutation = useCreateTaskProject();
	const onSubmit = (data: createTaskPSchemaType) => {
		taskMutation.mutate(data, {
			onSuccess: () => {
				form.reset();
				onClose();
			},
		});
	};

	useEffect(() => {
		if (!isOpen) {
			form.reset();
		}
	}, [isOpen, form]);

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>Add New Task</DialogTitle>
					<DialogDescription>
						Create a new task in this project
					</DialogDescription>
				</DialogHeader>

				<Form {...form}>
					<form
						onSubmit={form.handleSubmit(onSubmit)}
						className="space-y-4"
					>
						<FormField
							control={form.control}
							name="title"
							render={({ field }) => (
								<FormItem>
									<FormLabel> Task Title *</FormLabel>
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
									<FormLabel> Description *</FormLabel>
									<FormControl>
										<Textarea
											placeholder="Task description (optional)"
											rows={3}
											className="border-slate-200 dark:border-slate-800"
											{...field}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<div className="">
							<FormField
								control={form.control}
								name="priority"
								render={({ field }) => (
									<FormItem>
										<FormLabel> Priority *</FormLabel>
										<FormControl>
											<div className="w-full">
												<Select
													value={field.value}
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
						</div>
						<FormField
							control={form.control}
							name="assigneeIds"
							render={({ field }) => (
								<FormItem>
									<FormLabel> Assignee *</FormLabel>
									<FormControl>
										<div className="w-full">
											<ReactSelect<MembersOption, true>
												isMulti
												options={options}
												value={options?.filter((o) =>
													field.value?.includes(
														o.value
													)
												)}
												onChange={(selected) =>
													field.onChange(
														selected.map(
															(s) => s.value
														)
													)
												}
											/>
										</div>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="issueType"
							render={({ field }) => (
								<FormItem>
									<FormLabel> Issue Type *</FormLabel>
									<FormControl>
										<div className="w-full">
											<Select
												value={field.value}
												onValueChange={field.onChange}
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

						<div className="flex justify-end gap-4">
							<Button
								type="button"
								variant="outline"
								onClick={onClose}
								disabled={taskMutation.isPending}
								className="border-slate-200 dark:border-slate-800 bg-transparent"
							>
								Cancel
							</Button>
							<Button
								type="submit"
								disabled={taskMutation.isPending}
								className="bg-primary hover:bg-primary/90 text-white"
							>
								{taskMutation.isPending && (
									<Spinner className="mr-1.5" />
								)}
								Add Task
							</Button>
						</div>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
}

export const createTaskSchema = z.object({
	projectId: z.string(),
	title: z.string().min(1, "title is required"),
	description: z.string().min(1, "description is required"),
	issueType: z.string().min(1, "issue type is required"),
	priority: z.string().min(1, "priority is required"),
	assigneeIds: z.array(z.string()),
});


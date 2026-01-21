"use client";
import { useEffect, useMemo } from "react";
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
import { BoardTask } from "../lib/type";
import { Spinner } from "@/components/ui/spinner";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { z } from "zod";
import { createTaskPSchemaType } from "./add-task-modal";
import { useEditTaskProject } from "../../tasks/lib/mutation";
import { useGetProjectsMembers } from "../lib/queries";
import ReactSelect from "react-select";
import { toDateInputValue } from "@/lib/utils";

interface EditTaskModalProps {
	isOpen: boolean;
	onClose: () => void;
	task: BoardTask;
	projectId: string;
}

export function EditTaskModal({
	isOpen,
	onClose,
	task,
	projectId,
}: EditTaskModalProps) {
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

	const taskMutation = useEditTaskProject(projectId);
	const onSubmit = (data: createTaskPSchemaType) => {
		if (data) {
			taskMutation.mutate(
				{ task: data, taskId: task.id },
				{
					onSuccess: () => {
						onClose();
					},
				},
			);
		}
	};

	type MembersOption = {
		value: string;
		label: string;
	};

	const taskMembers: Member[] = useMemo(
		() =>
			task.assignees?.map((m) => ({
				id: m.user.id,
				name: m.user.name,
			})) ?? [],
		[task.assignees],
	);

	const options: Option[] =
		members.data?.map((u: { user: { id: string; name: string } }) => ({
			value: u.user.id,
			label: u.user.name,
		})) ?? [];

	type Member = {
		id: string;
		name: string;
	};

	type Option = {
		value: string;
		label: string;
	};

	const mergeToOptions = (a: Option[] = [], b: Member[] = []): Option[] => {
		return Array.from(
			new Map(
				[
					...a,
					...b.map((m) => ({
						value: m.id,
						label: m.name,
					})),
				].map((o) => [o.value, o]),
			).values(),
		);
	};

	const mergedOptions = mergeToOptions(options, taskMembers);

	useEffect(() => {
		const assignedMembers = taskMembers.map((m) => m.id);
		form.reset({
			title: task.title,
			assigneeIds: [...assignedMembers],
			description: task.description,
			issueType: task.issueType,
			priority: task.priority,
			projectId: projectId,
			dueDate: task.dueDate ? toDateInputValue(task.dueDate) : "",
		});
	}, [task, form, projectId, taskMembers]);

	const today = new Date().toISOString().split("T")[0];
	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Edit Task</DialogTitle>
					<DialogDescription>
						Make changes to your task
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
												onValueChange={field.onChange}
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
							name="assigneeIds"
							render={({ field }) => (
								<FormItem>
									<FormLabel> Assignee *</FormLabel>
									<FormControl>
										<div className="w-full">
											<ReactSelect<MembersOption, true>
												isMulti
												options={mergedOptions}
												value={options?.filter((o) =>
													field.value?.includes(
														o.value,
													),
												)}
												onChange={(selected) =>
													field.onChange(
														selected.map(
															(s) => s.value,
														),
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

						<FormField
							control={form.control}
							name="dueDate"
							render={({ field }) => (
								<FormItem>
									<FormLabel> Due Date</FormLabel>
									<FormControl>
										<Input
											type="date"
											min={today}
											className="border-slate-200 dark:border-slate-800"
											{...field}
											// className="border-slate-200 dark:border-slate-800 pl-10"
										/>
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
								Update Task
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
	dueDate: z
		.string()
		.min(1, "due date is required")
		.refine((val) => /^\d{4}-\d{2}-\d{2}$/.test(val), {
			message: "Invalid date",
		}),
});

"use client";

import { useState } from "react";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Task } from "../type";

interface EditTaskModalProps {
	isOpen: boolean;
	onClose: () => void;
	task: Task;
	onSave: (updatedTask: Task) => void;
}

export function EditTaskModal({
	isOpen,
	onClose,
	task,
	onSave,
}: EditTaskModalProps) {
	const [formData, setFormData] = useState({
		title: task?.title || "",
		description: task?.description || "",
		priority: task?.priority || "Medium",
	});

	const handleSave = () => {
		onSave({ ...task, ...formData });
		onClose();
	};

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Edit Task</DialogTitle>
					<DialogDescription>
						Make changes to your task
					</DialogDescription>
				</DialogHeader>
				<div className="space-y-4">
					<div>
						<Label htmlFor="title">Task Title</Label>
						<Input
							id="title"
							value={formData.title}
							onChange={(e) =>
								setFormData({
									...formData,
									title: e.target.value,
								})
							}
							className="mt-1"
						/>
					</div>
					<div>
						<Label htmlFor="description">Description</Label>
						<Textarea
							id="description"
							value={formData.description}
							onChange={(e) =>
								setFormData({
									...formData,
									description: e.target.value,
								})
							}
							className="mt-1"
						/>
					</div>
					<div>
						<Label htmlFor="priority">Priority</Label>
						<Select
							value={formData.priority}
							onValueChange={(value) =>
								setFormData({ ...formData, priority: value })
							}
						>
							<SelectTrigger id="priority" className="mt-1">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="Low">Low</SelectItem>
								<SelectItem value="Medium">Medium</SelectItem>
								<SelectItem value="High">High</SelectItem>
								<SelectItem value="Critical">
									Critical
								</SelectItem>
							</SelectContent>
						</Select>
					</div>
					<div className="flex gap-2 justify-end">
						<Button variant="outline" onClick={onClose}>
							Cancel
						</Button>
						<Button onClick={handleSave}>Save Changes</Button>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}

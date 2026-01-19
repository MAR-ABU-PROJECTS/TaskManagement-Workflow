"use client";

import type React from "react";

import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useRef, useEffect } from "react";
import { Upload } from "lucide-react";
import { useParams } from "next/navigation";
import { useAttachmentMutation } from "../../tasks/lib/mutation";
import { Spinner } from "@/components/ui/spinner";

interface AddFileModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export function AddFileModal({ open, onOpenChange }: AddFileModalProps) {
	const [selectedFile, setSelectedFile] = useState<File | null>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);

	const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (e.target.files?.[0]) {
			setSelectedFile(e.target.files[0]);
		}
	};

	const { taskId } = useParams();
	const mutation = useAttachmentMutation(taskId as string);

	const handleSubmit = () => {
		// if (selectedFile) {
		// 	onAddFile(selectedFile);
		// 	setSelectedFile(null);
		// 	onOpenChange(false);
		// }
		if (!selectedFile) return;
		const formData = new FormData();
		formData.append("file", selectedFile);

		mutation.mutate(
			{ formData, taskId: taskId as string },
			{
				onSuccess: () => {
					setSelectedFile(null);
					onOpenChange(false);
				},
			}
		);
	};

	useEffect(() => {
		if (!open) {
			setSelectedFile(null);
		}
	}, [open]);

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Add File</DialogTitle>
					<DialogDescription>
						Upload a file to attach to this task
					</DialogDescription>
				</DialogHeader>
				<div className="space-y-4">
					<div className="space-y-2">
						<Label htmlFor="file-input">Select File</Label>
						<div
							className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
							onClick={() => fileInputRef.current?.click()}
						>
							<Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />

							<div>
								{selectedFile ? (
									<p className="text-sm font-medium">
										{selectedFile.name} (
										{(
											selectedFile.size /
											1024 /
											1024
										).toFixed(2)}{" "}
										MB)
									</p>
								) : (
									<div>
										<p className="text-sm font-medium">
											Click to select file or drag and
											drop
										</p>
										<p className="text-xs text-muted-foreground mt-1">
											Max 50 MB
										</p>
									</div>
								)}
							</div>
						</div>
						<Input
							ref={fileInputRef}
							id="file-input"
							type="file"
							onChange={handleFileSelect}
							className="hidden"
						/>
					</div>
				</div>
				<DialogFooter>
					<Button
						variant="outline"
						onClick={() => onOpenChange(false)}
						disabled={mutation.isPending}
					>
						Cancel
					</Button>
					<Button
						onClick={handleSubmit}
						disabled={!selectedFile || mutation.isPending}
					>
						{mutation.isPending && <Spinner />}
						Upload File
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

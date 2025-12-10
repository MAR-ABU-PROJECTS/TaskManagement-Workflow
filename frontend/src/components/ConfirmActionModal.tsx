"use client";

import {
	AlertDialog,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogAction,
	AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Spinner } from "./ui/spinner";

interface ConfirmActionModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	title: string;
	description: string;
	confirmLabel?: string;
	onConfirm: () => Promise<void>;
}

export const ConfirmActionModal = ({
	open,
	onOpenChange,
	title,
	description,
	confirmLabel = "Confirm",
	onConfirm,
}: ConfirmActionModalProps) => {
	const [loading, setLoading] = useState(false);

	const handleConfirm = async () => {
		try {
			setLoading(true);
			await onConfirm(); // <- your mutation goes here
			onOpenChange(false); // close modal on success
		} finally {
			setLoading(false);
		}
	};
	return (
		<AlertDialog open={open} onOpenChange={onOpenChange}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>{title}</AlertDialogTitle>
					<AlertDialogDescription>
						{description}
					</AlertDialogDescription>
				</AlertDialogHeader>
				<div className="flex justify-end space-x-2 mt-4">
					<Button
						variant="outline"
						disabled={loading}
						onClick={() => onOpenChange(false)}
					>
						Cancel
					</Button>

					<Button
						variant="destructive"
						disabled={loading}
						onClick={handleConfirm}
					>
						{loading && <Spinner className="mr-2" />}
						{confirmLabel}
					</Button>
				</div>
			</AlertDialogContent>
		</AlertDialog>
	);
};

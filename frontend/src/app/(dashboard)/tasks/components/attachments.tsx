"use client";
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { AddFileModal } from "./add-file-modal";
import { useParams } from "next/navigation";
import { useGetAttachment } from "../lib/queries";
import TaskAttachment from "./attachment";

const Attachments = () => {
	const { taskId } = useParams();
	const [showFileModal, setShowFileModal] = useState(false);
	const attachments = useGetAttachment(taskId as string, {
		disableGlobalSuccess: true,
	});
	return (
		<div>
			<Card>
				<CardHeader>
					<div className="flex items-center justify-between">
						<CardTitle>Attachments</CardTitle>
						<Button
							size="sm"
							variant="outline"
							className="bg-transparent"
							onClick={() => setShowFileModal(true)}
						>
							<Plus className="mr-2 h-3 w-3" />
							Add File
						</Button>
					</div>
				</CardHeader>
				<CardContent className="space-y-2">
					{attachments?.data?.data?.map((file) => (
						<TaskAttachment key={file.id} {...file} />
					))}
				</CardContent>
			</Card>
			<AddFileModal
				open={showFileModal}
				onOpenChange={setShowFileModal}
				// onAddFile={handleAddFile}
			/>
		</div>
	);
};

export default Attachments;

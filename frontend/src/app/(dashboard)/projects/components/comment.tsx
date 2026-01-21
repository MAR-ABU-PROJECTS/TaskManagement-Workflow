import { useSession } from "@/app/providers/session-provider";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { formatTimeStamp, getInitials } from "@/lib/utils";
import { Trash2 } from "lucide-react";
import React, { useState } from "react";
import { useDeleteCommentMutation } from "../../tasks/lib/mutation";
import {
	AlertDialog,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogTitle,
	AlertDialogHeader,
} from "@/components/ui/alert-dialog";
import { Spinner } from "@/components/ui/spinner";
import { renderComment } from "@/lib/rendercomment";

const Comment = (comment: CommentType) => {
	const { first, last } = getInitials(comment.user.name ?? "");
	const { user } = useSession();
	const [alert, setAlert] = useState(false);

	const isAuthor = user?.id === comment.user.id;
	const mutation = useDeleteCommentMutation();
	return (
		<div>
			<div className="flex gap-3 mb-1.5 items-start hover:bg-gray-200 p-1.5 rounded-sm transition-all">
				<Avatar className="h-8 w-8">
					<AvatarFallback className="text-sm">
						{first}
						{last}
					</AvatarFallback>
				</Avatar>
				<div className="flex-1 flex">
					<div className="flex-1 gap-4">
						<div className="flex items-center gap-2 mb-1">
							<span className="text-sm font-medium">
								{comment.user.name}
							</span>
							<span className="text-xs text-muted-foreground">
								{formatTimeStamp(comment.createdAt)}
							</span>
						</div>
						<div className="text-sm leading-relaxed">
							{renderComment(comment.message)}
						</div>
					</div>
					<div className="shrink-0">
						{isAuthor && (
							<Button
								className="h-[40px] w-[40px] flex justify-center items-center rounded-full bg-transparent"
								variant={"ghost"}
								onClick={() => setAlert(true)}
							>
								<Trash2 className="text-destructive" />
							</Button>
						)}
					</div>
				</div>
			</div>

			<AlertDialog open={alert} onOpenChange={setAlert}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Delete Comment</AlertDialogTitle>
						<AlertDialogDescription>
							Are you sure you want to delete this comment? This
							action cannot be undone.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<div className="flex items-center justify-end gap-4">
						<Button
							variant="outline"
							onClick={() => setAlert(false)}
							disabled={mutation.isPending}
						>
							Cancel
						</Button>
						<Button
							variant="destructive"
							disabled={mutation.isPending}
							onClick={() =>
								mutation.mutate(
									{
										commentId: comment.id,
										taskId: comment.taskId,
									},
									{
										onSuccess: () => {
											setAlert(false);
										},
									},
								)
							}
						>
							{mutation.isPending && (
								<Spinner className="mr-1.5" />
							)}
							Delete
						</Button>
					</div>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
};

export default Comment;

export type CommentType = {
	createdAt: string;
	id: string;
	message: string;
	taskId: string;
	user: {
		id: string;
		name: string;
		email: string;
		role: string;
	};
	userId: string;
};

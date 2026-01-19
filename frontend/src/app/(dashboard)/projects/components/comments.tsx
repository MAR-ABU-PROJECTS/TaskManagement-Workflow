import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useGetComments } from "../../tasks/lib/queries";
import { useParams } from "next/navigation";
import { useCommentMutation } from "../../tasks/lib/mutation";
import { Spinner } from "@/components/ui/spinner";
import { useSession } from "@/app/providers/session-provider";
import { QueryStateHandler } from "@/components/QueryStateHandler";
import { getInitials } from "@/lib/utils";
import Comment, { CommentType } from "./comment";

const TaskComments = () => {
	const { taskId } = useParams();
	const user = useSession();

	const query = useGetComments(taskId as string);
	const [newComment, setNewComment] = useState("");
	const mutation = useCommentMutation();

	const { first, last } = getInitials(user?.user?.name ?? "");
	return (
		<Card>
			<CardHeader>
				<CardTitle>Comments</CardTitle>
			</CardHeader>
			<CardContent className="space-y-4">
				<QueryStateHandler
					query={query}
					emptyMessage="No Comments."
					getItems={(res) => res.data}
					render={(res) => {
						const data = (res.data as CommentType[]) ?? [];

						return (
							<div className="max-h-[300px] overflow-y-auto w-full">
								{data.map((c) => (
									<Comment {...c} key={c.id} />
								))}
							</div>
						);
					}}
				/>

				<div className="flex gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
					<Avatar className="h-8 w-8">
						<AvatarFallback className="uppercase">
							{first}
							{last}
						</AvatarFallback>
					</Avatar>
					<div className="flex-1 space-y-2">
						<Textarea
							placeholder="Add a comment..."
							value={newComment}
							onChange={(e) => setNewComment(e.target.value)}
							disabled={mutation.isPending}
							className="min-h-20"
						/>
						<div className="flex justify-end">
							<Button
								size="sm"
								disabled={mutation.isPending || !newComment}
								onClick={() =>
									mutation.mutate(
										{
											comment: newComment,
											taskId: taskId as string,
										},
										{
											onSuccess: () => {
												setNewComment("");
											},
										}
									)
								}
							>
								{mutation.isPending ? (
									<Spinner className="mr-2 h-3 w-3" />
								) : (
									<Send className="mr-2 h-3 w-3" />
								)}
								Comment
							</Button>
						</div>
					</div>
				</div>
			</CardContent>
		</Card>
	);
};

export default TaskComments;

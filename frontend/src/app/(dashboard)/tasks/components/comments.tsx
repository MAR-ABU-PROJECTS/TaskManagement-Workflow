import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Send, Trash2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useGetComments } from "../lib/queries";
import { useParams } from "next/navigation";
import { useCommentMutation } from "../lib/mutation";
import { Spinner } from "@/components/ui/spinner";
import { useSession } from "@/app/providers/session-provider";
import { QueryStateHandler } from "@/components/QueryStateHandler";

const TaskComments = () => {
	const { taskId } = useParams();
	const user = useSession();
	const comments = [
		{
			id: 1,
			author: { name: "John Doe", avatar: "JD" },
			content:
				"I've started working on the initial mockup. Should have something to review by EOD.",
			timestamp: "2 hours ago",
		},
		{
			id: 2,
			author: { name: "Jane Smith", avatar: "JS" },
			content:
				"Great! Make sure to follow the new brand guidelines we discussed. lorewejfbkjewf ijwbfiwbf iwbefwebf iwbfew ibwifbwifwe fuwefm wefbowf oebfeq qofbwf wfobn",
			timestamp: "1 hour ago",
		},
		{
			id: 3,
			author: { name: "John Doe", avatar: "JD" },
			content: "Will do. I've attached the first draft for feedback.",
			timestamp: "30 minutes ago",
		},
		{
			id: 4,
			author: { name: "John Doe", avatar: "JD" },
			content: "Will do. I've attached the first draft for feedback.",
			timestamp: "30 minutes ago",
		},
		{
			id: 5,
			author: { name: "John Doe", avatar: "JD" },
			content: "Will do. I've attached the first draft for feedback.",
			timestamp: "30 minutes ago",
		},
		{
			id: 6,
			author: { name: "John Doe", avatar: "JD" },
			content: "Will do. I've attached the first draft for feedback.",
			timestamp: "30 minutes ago",
		},
		{
			id: 7,
			author: { name: "John Doe", avatar: "JD" },
			content: "Will do. I've attached the first draft for feedback.",
			timestamp: "30 minutes ago",
		},
	];
	const query = useGetComments(taskId as string);
	const [newComment, setNewComment] = useState("");
	const mutation = useCommentMutation();
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
						const data = res.data ?? [];

						return <>hello</>;
					}}
				/>

				{/* <div className="max-h-[600px] overflow-y-auto">
					{comments.map((comment) => (
						<div
							key={comment.id}
							className="flex gap-3 mb-3 items-start"
						>
							<Avatar className="h-8 w-8">
								<AvatarFallback>
									{comment.author.avatar}
								</AvatarFallback>
							</Avatar>
							<div className="flex-1 flex gap-4">
								<div className="flex-1">
									<div className="flex items-center gap-2 mb-3">
										<span className="text-sm font-medium">
											{comment.author.name}
										</span>
										<span className="text-xs text-muted-foreground">
											{comment.timestamp}
										</span>
									</div>
									<p className="text-sm text-muted-foreground">
										{comment.content}
									</p>
								</div>
								<div className="shrink-0">
									<Button
										className="h-[45px] w-[45px] flex justify-center items-center rounded-full"
										variant={"ghost"}
									>
										<Trash2 className="text-destructive" />
									</Button>
								</div>
							</div>
						</div>
					))}
				</div> */}

				<div className="flex gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
					<Avatar className="h-8 w-8">
						<AvatarFallback className="uppercase">
							{user.user?.name?.[0]}
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
									mutation.mutate({
										comment: newComment,
										taskId: taskId as string,
									})
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

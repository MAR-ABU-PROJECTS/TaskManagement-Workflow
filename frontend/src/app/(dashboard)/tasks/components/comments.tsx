import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const TaskComments = () => {
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
				"Great! Make sure to follow the new brand guidelines we discussed.",
			timestamp: "1 hour ago",
		},
		{
			id: 3,
			author: { name: "John Doe", avatar: "JD" },
			content: "Will do. I've attached the first draft for feedback.",
			timestamp: "30 minutes ago",
		},
	];
  const [newComment, setNewComment] = useState("");
	return (
		<Card>
			<CardHeader>
				<CardTitle>Comments</CardTitle>
			</CardHeader>
			<CardContent className="space-y-4">
				{comments.map((comment) => (
					<div key={comment.id} className="flex gap-3">
						<Avatar className="h-8 w-8">
							<AvatarFallback>
								{comment.author.avatar}
							</AvatarFallback>
						</Avatar>
						<div className="flex-1 space-y-1">
							<div className="flex items-center gap-2">
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
					</div>
				))}

				<div className="flex gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
					<Avatar className="h-8 w-8">
						<AvatarFallback>JD</AvatarFallback>
					</Avatar>
					<div className="flex-1 space-y-2">
						<Textarea
							placeholder="Add a comment..."
							value={newComment}
							onChange={(e) => setNewComment(e.target.value)}
							className="min-h-20"
						/>
						<div className="flex justify-end">
							<Button size="sm">
								<Send className="mr-2 h-3 w-3" />
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

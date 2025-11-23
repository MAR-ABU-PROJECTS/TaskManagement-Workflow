"use client";

import type React from "react";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function EditTeamPage() {
	const [teamName, setTeamName] = useState("");
	const [description, setDescription] = useState("");
	const [isLoading, setIsLoading] = useState(false);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsLoading(true);
		// Simulate API call
		setTimeout(() => {
			setIsLoading(false);
			// Redirect to teams page
			window.location.href = "/teams";
		}, 1000);
	};

	return (
		<div className="flex flex-1 flex-col px-4 p-6">
			{/* Header */}
			<div className="flex items-center gap-2 mb-4">
				<Link
					href="/teams"
					className="flex items-center gap-2  hover:text-black/50 text-base font-[500] text-black"
				>
					<ArrowLeft className="h-5 w-5" />
					<span className="text-sm">Back to Teams</span>
				</Link>
			</div>

			{/* Main Content */}
			<main className="flex-1 overflow-auto">
				<div className="mx-auto max-w-6xl">
					<Card>
						<CardHeader>
							<CardTitle>Edit Team</CardTitle>
							<CardDescription>
								Update team to organize your projects and
								collaborate with members
							</CardDescription>
						</CardHeader>
						<CardContent>
							<form onSubmit={handleSubmit} className="space-y-6">
								{/* Team Name */}
								<div className="space-y-2">
									<label className="text-sm font-medium">
										Team Name
									</label>
									<input
										type="text"
										placeholder="e.g., Design Team"
										value={teamName}
										onChange={(e) =>
											setTeamName(e.target.value)
										}
										className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground"
										required
									/>
									<p className="text-xs text-muted-foreground">
										Choose a name that represents your team
									</p>
								</div>

								{/* Description */}
								<div className="space-y-2">
									<label className="text-sm font-medium">
										Description
									</label>
									<textarea
										placeholder="e.g., UI/UX and visual design"
										value={description}
										onChange={(e) =>
											setDescription(e.target.value)
										}
										className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground"
										rows={3}
									/>
									<p className="text-xs text-muted-foreground">
										Add a brief description of what this
										team does
									</p>
								</div>

								{/* Action Buttons */}
								<div className="flex gap-3 pt-4">
									<Button
										type="submit"
										disabled={!teamName || isLoading}
									>
										{isLoading
											? "Creating..."
											: "Create Team"}
									</Button>
									<Link href="/teams">
										<Button
											type="button"
											variant="outline"
											className="bg-transparent"
										>
											Cancel
										</Button>
									</Link>
								</div>
							</form>
						</CardContent>
					</Card>
				</div>
			</main>
		</div>
	);
}

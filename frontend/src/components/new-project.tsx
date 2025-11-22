"use client";

import type React from "react";

import { useState } from "react";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft} from "lucide-react";
import Link from "next/link";
import { Textarea } from "@/components/ui/textarea";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface FormData {
	name: string;
	description: string;
	team: string;
	status: string;
	dueDate: string;
	visibility: string;
	members: string[];
}

export default function NewProjectPage() {
	const [formData, setFormData] = useState<FormData>({
		name: "",
		description: "",
		team: "",
		status: "Planning",
		dueDate: "",
		visibility: "team-only",
		members: [],
	});

	const [isSubmitting, setIsSubmitting] = useState(false);

	const teams = [
		{ id: "design", name: "Design Team" },
		{ id: "engineering", name: "Engineering" },
		{ id: "marketing", name: "Marketing" },
		{ id: "product", name: "Product" },
	];

	const teamMembers = [
		{ id: "jd", name: "John Doe", email: "john@marprojects.com" },
		{ id: "js", name: "Jane Smith", email: "jane@marprojects.com" },
		{ id: "mj", name: "Mike Johnson", email: "mike@marprojects.com" },
		{ id: "sw", name: "Sarah Williams", email: "sarah@marprojects.com" },
		{ id: "tb", name: "Tom Brown", email: "tom@marprojects.com" },
	];

	const handleInputChange = (
		e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
	) => {
		const { name, value } = e.target;
		setFormData((prev) => ({ ...prev, [name]: value }));
	};

	const handleSelectChange = (name: string, value: string) => {
		setFormData((prev) => ({ ...prev, [name]: value }));
	};

	const handleMemberToggle = (memberId: string) => {
		setFormData((prev) => ({
			...prev,
			members: prev.members.includes(memberId)
				? prev.members.filter((id) => id !== memberId)
				: [...prev.members, memberId],
		}));
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsSubmitting(true);

		// Simulate API call
		console.log("[v0] Submitting new project:", formData);
		await new Promise((resolve) => setTimeout(resolve, 1000));

		// Redirect to projects page
		window.location.href = "/projects";
	};

	return (
		<div className="flex flex-1 flex-col w-full h-full">
			{/* Header */}

			{/* Main Content */}
			<main className="flex-1 overflow-auto px-4 p-6">
				<div className="mx-auto">
					<div className="flex items-center gap-2 mb-4">
						<Link
							href="/projects"
							className="flex items-center gap-2  hover:text-black/50 text-base font-[500] text-black"
						>
							<ArrowLeft className="h-5 w-5" />
							<span className="text-sm">Back to Projects</span>
						</Link>
						
					</div>
					<form onSubmit={handleSubmit} className="space-y-6 max-w-6xl mx-auto">
						{/* Basic Information Card */}
						<Card>
							<CardHeader>
								<CardTitle>Basic Information</CardTitle>
								<CardDescription>
									Provide the foundational details for your
									project
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="space-y-2">
									<label className="text-sm font-medium">
										Project Name *
									</label>
									<Input
										name="name"
										placeholder="Enter project name"
										value={formData.name}
										onChange={handleInputChange}
										required
										className="border-slate-200 dark:border-slate-800"
									/>
								</div>

								<div className="space-y-2">
									<label className="text-sm font-medium">
										Description
									</label>
									<Textarea
										name="description"
										placeholder="Describe your project goals and scope"
										value={formData.description}
										onChange={handleInputChange}
										rows={4}
										className="border-slate-200 dark:border-slate-800"
									/>
								</div>
							</CardContent>
						</Card>

						{/* Project Settings Card */}
						<Card>
							<CardHeader>
								<CardTitle>Project Settings</CardTitle>
								<CardDescription>
									Configure project details and workflow
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="grid gap-4 md:grid-cols-2">
									<div className="space-y-2">
										<label className="text-sm font-medium">
											Team *
										</label>
										<Select
											value={formData.team}
											onValueChange={(value) =>
												handleSelectChange(
													"team",
													value
												)
											}
										>
											<SelectTrigger className="border-slate-200 dark:border-slate-800">
												<SelectValue placeholder="Select a team" />
											</SelectTrigger>
											<SelectContent>
												{teams.map((team) => (
													<SelectItem
														key={team.id}
														value={team.id}
													>
														{team.name}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									</div>

									<div className="space-y-2">
										<label className="text-sm font-medium">
											Status *
										</label>
										<Select
											value={formData.status}
											onValueChange={(value) =>
												handleSelectChange(
													"status",
													value
												)
											}
										>
											<SelectTrigger className="border-slate-200 dark:border-slate-800">
												<SelectValue placeholder="Select status" />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="Planning">
													Planning
												</SelectItem>
												<SelectItem value="In Progress">
													In Progress
												</SelectItem>
												<SelectItem value="Completed">
													Completed
												</SelectItem>
											</SelectContent>
										</Select>
									</div>
								</div>

								<div className="grid gap-4 md:grid-cols-2">
									<div className="space-y-2">
										<label className="text-sm font-medium">
											Due Date
										</label>
										<div className="relative">
											<Input
												type="date"
												name="dueDate"
												value={formData.dueDate}
												onChange={handleInputChange}
												className="border-slate-200 dark:border-slate-800 w-full"
											/>
				
										</div>
									</div>

									<div className="space-y-2">
										<label className="text-sm font-medium">
											Visibility *
										</label>
										<Select
											value={formData.visibility}
											onValueChange={(value) =>
												handleSelectChange(
													"visibility",
													value
												)
											}
										>
											<SelectTrigger className="border-slate-200 dark:border-slate-800">
												<SelectValue placeholder="Select visibility" />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="public">
													Public
												</SelectItem>
												<SelectItem value="team-only">
													Team Only
												</SelectItem>
												<SelectItem value="private">
													Private
												</SelectItem>
											</SelectContent>
										</Select>
									</div>
								</div>
							</CardContent>
						</Card>

						{/* Team Members Card */}
						<Card>
							<CardHeader>
								<CardTitle>Team Members</CardTitle>
								<CardDescription>
									Select team members to add to this project
								</CardDescription>
							</CardHeader>
							<CardContent>
								<div className="space-y-3">
									{teamMembers.map((member) => (
										<div
											key={member.id}
											className="flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 cursor-pointer transition-colors"
											onClick={() =>
												handleMemberToggle(member.id)
											}
										>
											<div className="flex items-center gap-3 flex-1">
												<Avatar className="h-8 w-8">
													<AvatarFallback className="bg-primary text-white text-xs">
														{member.name
															.split(" ")
															.map((n) => n[0])
															.join("")}
													</AvatarFallback>
												</Avatar>
												<div>
													<p className="text-sm font-medium">
														{member.name}
													</p>
													<p className="text-xs text-muted-foreground">
														{member.email}
													</p>
												</div>
											</div>
											<input
												type="checkbox"
												checked={formData.members.includes(
													member.id
												)}
												onChange={() =>
													handleMemberToggle(
														member.id
													)
												}
												className="h-4 w-4 rounded border-slate-200"
											/>
										</div>
									))}
								</div>
							</CardContent>
						</Card>

						{/* Action Buttons */}
						<div className="flex gap-3 justify-end">
							<Link href="/projects">
								<Button
									type="button"
									variant="outline"
									className="border-slate-200 dark:border-slate-800 bg-transparent"
								>
									Cancel
								</Button>
							</Link>
							<Button
								type="submit"
								disabled={
									!formData.name ||
									!formData.team ||
									isSubmitting
								}
								className="bg-primary hover:bg-primary/90 text-white"
							>
								{isSubmitting
									? "Creating..."
									: "Create Project"}
							</Button>
						</div>
					</form>
				</div>
			</main>
		</div>
	);
}

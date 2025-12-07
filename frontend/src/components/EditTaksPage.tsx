"use client";

import type React from "react";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Calendar } from "lucide-react";
import Link from "next/link";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useParams } from "next/navigation";

interface FormData {
  title: string;
  description: string;
  project: string;
  priority: string;
  status: string;
  dueDate: string;
  assignee: string;
  estimatedHours: string;
}

export default function EditTaskPage() {
  const params = useParams();
  const taskId = params.id;

  const [formData, setFormData] = useState<FormData>({
    title: "Design homepage mockup",
    description: "Create a high-fidelity mockup for the new homepage design.",
    project: "website",
    priority: "High",
    status: "In Progress",
    dueDate: "2025-01-20",
    assignee: "jd",
    estimatedHours: "8",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const projects = [
    { id: "website", name: "Website Redesign" },
    { id: "mobile", name: "Mobile App Development" },
    { id: "marketing", name: "Marketing Campaign Q1" },
  ];

  const teamMembers = [
    { id: "jd", name: "John Doe" },
    { id: "js", name: "Jane Smith" },
    { id: "mj", name: "Mike Johnson" },
  ];

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    console.log("[v0] Updating task:", formData);
    await new Promise((resolve) => setTimeout(resolve, 1000));

    window.location.href = `/tasks/${taskId}`;
  };

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex h-16 shrink-0 items-center gap-2 border-b border-slate-200 dark:border-slate-800 px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <Link
          href={`/tasks/${taskId}`}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="text-sm">Back to Task</span>
        </Link>
        <h1 className="ml-auto text-lg font-semibold">Edit Task</h1>
      </header>

      <main className="flex-1 overflow-auto p-6">
        <div className="mx-auto max-w-3xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Task Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Task Title *</label>
                  <Input
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    required
                    className="border-slate-200 dark:border-slate-800"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Description</label>
                  <Textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={4}
                    className="border-slate-200 dark:border-slate-800"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Task Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Project *</label>
                    <Select
                      value={formData.project}
                      onValueChange={(value) =>
                        handleSelectChange("project", value)
                      }
                    >
                      <SelectTrigger className="border-slate-200 dark:border-slate-800">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {projects.map((project) => (
                          <SelectItem key={project.id} value={project.id}>
                            {project.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Priority</label>
                    <Select
                      value={formData.priority}
                      onValueChange={(value) =>
                        handleSelectChange("priority", value)
                      }
                    >
                      <SelectTrigger className="border-slate-200 dark:border-slate-800">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Low">Low</SelectItem>
                        <SelectItem value="Medium">Medium</SelectItem>
                        <SelectItem value="High">High</SelectItem>
                        <SelectItem value="Critical">Critical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Status</label>
                    <Select
                      value={formData.status}
                      onValueChange={(value) =>
                        handleSelectChange("status", value)
                      }
                    >
                      <SelectTrigger className="border-slate-200 dark:border-slate-800">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Backlog">Backlog</SelectItem>
                        <SelectItem value="To Do">To Do</SelectItem>
                        <SelectItem value="In Progress">In Progress</SelectItem>
                        <SelectItem value="Review">Review</SelectItem>
                        <SelectItem value="Done">Done</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Due Date</label>
                    <div className="relative">
                      <Input
                        type="date"
                        name="dueDate"
                        value={formData.dueDate}
                        onChange={handleInputChange}
                        className="border-slate-200 dark:border-slate-800 pl-10"
                      />
                      <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Assignee</label>
                    <Select
                      value={formData.assignee}
                      onValueChange={(value) =>
                        handleSelectChange("assignee", value)
                      }
                    >
                      <SelectTrigger className="border-slate-200 dark:border-slate-800">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {teamMembers.map((member) => (
                          <SelectItem key={member.id} value={member.id}>
                            {member.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Estimated Hours
                    </label>
                    <Input
                      name="estimatedHours"
                      type="number"
                      value={formData.estimatedHours}
                      onChange={handleInputChange}
                      className="border-slate-200 dark:border-slate-800"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-3 justify-end">
              <Link href={`/tasks/${taskId}`}>
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
                disabled={!formData.title || isSubmitting}
                className="bg-primary hover:bg-primary/90 text-white"
              >
                {isSubmitting ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}

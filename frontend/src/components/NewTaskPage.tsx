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
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface FormData {
  title: string;
  description: string;
  project: string;
  priority: string;
  status: string;
  dueDate: string;
  assignee: string;
  estimatedHours: string;
  labels: string[];
}

export default function NewTaskPage() {
  const [formData, setFormData] = useState<FormData>({
    title: "",
    description: "",
    project: "",
    priority: "Medium",
    status: "To Do",
    dueDate: "",
    assignee: "",
    estimatedHours: "",
    labels: [],
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const projects = [
    { id: "website", name: "Website Redesign" },
    { id: "mobile", name: "Mobile App Development" },
    { id: "marketing", name: "Marketing Campaign Q1" },
  ];

  const teamMembers = [
    { id: "jd", name: "John Doe", avatar: "JD" },
    { id: "js", name: "Jane Smith", avatar: "JS" },
    { id: "mj", name: "Mike Johnson", avatar: "MJ" },
    { id: "sw", name: "Sarah Williams", avatar: "SW" },
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

    console.log(" Submitting new task:", formData);
    await new Promise((resolve) => setTimeout(resolve, 1000));

    window.location.href = "/tasks";
  };

  return (
    <div className="flex flex-1 flex-col px-4 p-6">
      <div className="flex items-center mb-3">
        <Link
          href="/tasks"
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="text-sm">Back to Tasks</span>
        </Link>
      </div>

      <main className="flex-1 overflow-auto">
        <div className="mx-auto max-w-6xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Task Information</CardTitle>
                <CardDescription>
                  Provide details about the task
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Task Title *</label>
                  <Input
                    name="title"
                    placeholder="Enter task title"
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
                    placeholder="Describe the task details"
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
                <CardDescription>Configure task properties</CardDescription>
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
                        <SelectValue placeholder="Select a project" />
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
                        <SelectValue placeholder="Select priority" />
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
                        <SelectValue placeholder="Select status" />
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
                      {/* <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" /> */}
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
                        <SelectValue placeholder="Select assignee" />
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
                      placeholder="e.g. 8"
                      value={formData.estimatedHours}
                      onChange={handleInputChange}
                      className="border-slate-200 dark:border-slate-800"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-3 justify-end">
              <Link href="/tasks">
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
                disabled={!formData.title || !formData.project || isSubmitting}
                className="bg-primary hover:bg-primary/90 text-white"
              >
                {isSubmitting ? "Creating..." : "Create Task"}
              </Button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}

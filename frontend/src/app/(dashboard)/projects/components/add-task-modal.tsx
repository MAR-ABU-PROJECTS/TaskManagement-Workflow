"use client";

import type React from "react";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Task {
  id: number;
  title: string;
  description: string;
  status: string;
  priority: string;
  assignee: string;
  comments: number;
  attachments: number;
}

interface AddTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (task: Task) => void;
  columnId?: string;
}

export function AddTaskModal({
  isOpen,
  onClose,
  onAdd,
  columnId = "todo",
}: AddTaskModalProps) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    priority: "Medium",
    assignee: "",
  });

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    const newTask: Task = {
      id: Math.random(),
      title: formData.title,
      description: formData.description,
      status: columnId,
      priority: formData.priority,
      assignee: formData.assignee,
      comments: 0,
      attachments: 0,
    };

    onAdd(newTask);
    setFormData({
      title: "",
      description: "",
      priority: "Medium",
      assignee: "",
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Task</DialogTitle>
          <DialogDescription>
            Create a new task in this project
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
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
              placeholder="Task description (optional)"
              value={formData.description}
              onChange={handleInputChange}
              rows={3}
              className="border-slate-200 dark:border-slate-800"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Priority</label>
              <Select
                value={formData.priority}
                onValueChange={(value) => handleSelectChange("priority", value)}
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

            <div className="space-y-2">
              <label className="text-sm font-medium">Assignee</label>
              <Select
                value={formData.assignee}
                onValueChange={(value) => handleSelectChange("assignee", value)}
              >
                <SelectTrigger className="border-slate-200 dark:border-slate-800">
                  <SelectValue placeholder="Assign to" />
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
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="border-slate-200 dark:border-slate-800 bg-transparent"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!formData.title.trim()}
              className="bg-primary hover:bg-primary/90 text-white"
            >
              Add Task
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

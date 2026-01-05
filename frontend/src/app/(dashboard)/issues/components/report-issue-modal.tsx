"use client";

import type React from "react";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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

interface ReportIssueModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (issueData: IssueData) => void;
}

interface IssueData {
  title: string;
  description: string;
  project: string;
  severity: string;
  linkedTask?: string;
}

const projects = [
  { id: "website", name: "Website Redesign" },
  { id: "mobile", name: "Mobile App Development" },
  { id: "marketing", name: "Marketing Campaign Q1" },
];

const severityLevels = [
  { id: "Minor", label: "Minor", color: "text-blue-500" },
  { id: "Major", label: "Major", color: "text-yellow-500" },
  { id: "Critical", label: "Critical", color: "text-orange-500" },
  { id: "Blocker", label: "Blocker", color: "text-red-500" },
];

export function ReportIssueModal({
  isOpen,
  onClose,
  onSubmit,
}: ReportIssueModalProps) {
  const [formData, setFormData] = useState<IssueData>({
    title: "",
    description: "",
    project: "",
    severity: "Major",
    linkedTask: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

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

    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      onSubmit(formData);
      setFormData({
        title: "",
        description: "",
        project: "",
        severity: "Major",
        linkedTask: "",
      });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Report New Issue</DialogTitle>
          <DialogDescription>
            Describe the issue you&apos;ve encountered so our team can
            prioritize and address it
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Issue Title */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Issue Title *</label>
            <Input
              name="title"
              placeholder="Brief description of the issue"
              value={formData.title}
              onChange={handleInputChange}
              required
              className="border-slate-200 dark:border-slate-800"
            />
          </div>

          {/* Issue Description */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Description *</label>
            <Textarea
              name="description"
              placeholder="Provide detailed information about the issue. Include steps to reproduce, error messages, and expected vs actual behavior."
              value={formData.description}
              onChange={handleInputChange}
              rows={5}
              required
              className="border-slate-200 dark:border-slate-800"
            />
          </div>

          {/* Project and Severity */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Project *</label>
              <Select
                value={formData.project}
                onValueChange={(value) => handleSelectChange("project", value)}
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
              <label className="text-sm font-medium">Severity *</label>
              <Select
                value={formData.severity}
                onValueChange={(value) => handleSelectChange("severity", value)}
              >
                <SelectTrigger className="border-slate-200 dark:border-slate-800">
                  <SelectValue placeholder="Select severity" />
                </SelectTrigger>
                <SelectContent>
                  {severityLevels.map((level) => (
                    <SelectItem key={level.id} value={level.id}>
                      {level.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Linked Task (Optional) */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Linked Task (Optional)
            </label>
            <Input
              name="linkedTask"
              placeholder="Link this issue to an existing task"
              value={formData.linkedTask}
              onChange={handleInputChange}
              className="border-slate-200 dark:border-slate-800"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-end pt-4">
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
              disabled={
                !formData.title ||
                !formData.description ||
                !formData.project ||
                isSubmitting
              }
              className="bg-primary hover:bg-primary/90 text-white"
            >
              {isSubmitting ? "Reporting..." : "Report Issue"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

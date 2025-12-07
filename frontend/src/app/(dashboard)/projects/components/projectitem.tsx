"use client";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical } from "lucide-react";
import Link from "next/link";
import React, { useState } from "react";

type ProjectProps = {
  id: number;
  name: string;
  description: string;
  team: string;
  status: string;
  progress: number;
  tasks: {
    total: number;
    completed: number;
  };
  members: number;
  dueDate: string;
};
const Projectitem = (project: ProjectProps) => {
  const [confirm, setConfirm] = useState(false);
  return (
    <div>
      <Card
        key={project.id}
        className="hover:border-primary/50 transition-colors"
      >
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-base">
                <Link
                  href={`/projects/${project.id}`}
                  className="hover:text-primary"
                >
                  {project.name}
                </Link>
              </CardTitle>
              <CardDescription className="mt-1 text-sm">
                {project.description}
              </CardDescription>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <Link href={`/projects/${project.id}/edit`}>
                    Edit Project
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuItem
                  className="text-destructive"
                  onClick={() => setConfirm(true)}
                >
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium">{project.progress}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full bg-primary transition-all"
                style={{
                  width: `${project.progress}%`,
                }}
              />
            </div>
          </div>

          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Badge
                variant={
                  project.status === "Completed"
                    ? "default"
                    : project.status === "In Progress"
                      ? "secondary"
                      : "outline"
                }
              >
                {project.status}
              </Badge>
            </div>
            <span className="text-muted-foreground">
              {project.tasks.completed}/{project.tasks.total} tasks
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex -space-x-2">
              {Array.from({
                length: Math.min(project.members, 3),
              }).map((_, i) => (
                <Avatar key={i} className="h-6 w-6 border-2 border-card">
                  <AvatarFallback className="text-xs">U{i + 1}</AvatarFallback>
                </Avatar>
              ))}
              {project.members > 3 && (
                <div className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-card bg-muted text-xs font-medium">
                  +{project.members - 3}
                </div>
              )}
            </div>
            <span className="text-xs text-muted-foreground">
              Due {project.dueDate}
            </span>
          </div>

          <Button
            variant="outline"
            size="lg"
            className="w-full bg-transparent"
            asChild
          >
            <Link href={`/projects/${project.id}`}>View Project</Link>
          </Button>
        </CardContent>
      </Card>

      <AlertDialog open={confirm} onOpenChange={setConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Project</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{project.name}
              &quot;? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-2 justify-end">
            <AlertDialogCancel onClick={() => setConfirm(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {}}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Projectitem;

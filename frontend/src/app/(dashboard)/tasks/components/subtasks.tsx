"use client";
import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AddSubtaskModal } from "./add-subtask-modal";
import { Plus } from "lucide-react";

interface Subtask {
  id: number;
  title: string;
  completed: boolean;
}

const Subtasks = () => {
  const subtasks = [
    { id: 1, title: "Create wireframe", completed: true },
    { id: 2, title: "Design hero section", completed: true },
    { id: 3, title: "Design features section", completed: false },
    { id: 4, title: "Add responsive breakpoints", completed: false },
  ];
  const [showSubtaskModal, setShowSubtaskModal] = useState(false);

  const handleAddSubtask = (title: string) => {
    const newSubtask: Subtask = {
      id: subtasks.length + 1,
      title,
      completed: false,
    };
    // setSubtasks([...subtasks, newSubtask]);
    console.log(newSubtask);
  };

  // const handleToggleSubtask = (id: number) => {
  //   setSubtasks(subtasks.map((s) => (s.id === id ? { ...s, completed: !s.completed } : s)))
  // }

  return (
    <div>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Subtasks</CardTitle>
            <Button
              size="sm"
              variant="outline"
              className="bg-transparent"
              onClick={() => setShowSubtaskModal(true)}
            >
              <Plus className="mr-2 h-3 w-3" />
              Add Subtask
            </Button>
          </div>
          <CardDescription>
            {subtasks.filter((s) => s.completed).length} of {subtasks.length}{" "}
            completed
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {subtasks.map((subtask) => (
            <div
              key={subtask.id}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent"
            >
              <input
                type="checkbox"
                checked={subtask.completed}
                className="h-4 w-4 rounded border-slate-200 dark:border-slate-800"
              />
              <span
                className={`text-sm flex-1 ${
                  subtask.completed ? "line-through text-muted-foreground" : ""
                }`}
              >
                {subtask.title}
              </span>
            </div>
          ))}
        </CardContent>
      </Card>

      <AddSubtaskModal
        open={showSubtaskModal}
        onOpenChange={setShowSubtaskModal}
        onAddSubtask={handleAddSubtask}
      />
    </div>
  );
};

export default Subtasks;

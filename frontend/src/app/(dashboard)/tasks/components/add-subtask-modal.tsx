"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";

interface AddSubtaskModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddSubtask: (title: string) => void;
}

export function AddSubtaskModal({
  open,
  onOpenChange,
  onAddSubtask,
}: AddSubtaskModalProps) {
  const [title, setTitle] = useState("");

  const handleSubmit = () => {
    if (title.trim()) {
      onAddSubtask(title);
      setTitle("");
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Subtask</DialogTitle>
          <DialogDescription>
            Create a new subtask for this task
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="subtask-title">Subtask Title</Label>
            <Input
              id="subtask-title"
              placeholder="Enter subtask title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>Add Subtask</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

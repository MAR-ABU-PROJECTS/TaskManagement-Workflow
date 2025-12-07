"use client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Task } from "../type";

interface ChangeStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task;
  onStatusChange: (taskId: number, newStatus: string) => void;
}

const statuses = [
  { id: "backlog", title: "Backlog", color: "bg-gray-500" },
  { id: "todo", title: "To Do", color: "bg-blue-500" },
  { id: "in-progress", title: "In Progress", color: "bg-yellow-500" },
  { id: "review", title: "Review", color: "bg-purple-500" },
  { id: "done", title: "Done", color: "bg-green-500" },
];

export function ChangeStatusModal({
  isOpen,
  onClose,
  task,
  onStatusChange,
}: ChangeStatusModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Change Task Status</DialogTitle>
          <DialogDescription>
            Select a new status for this task
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-2">
          {statuses.map((status) => (
            <Button
              key={status.id}
              variant={task?.status === status.id ? "default" : "outline"}
              onClick={() => {
                onStatusChange(task?.id, status.id);
                onClose();
              }}
              className="w-full"
            >
              <span
                className={`inline-block h-2 w-2 rounded-full ${status.color} mr-2`}
              />
              {status.title}
            </Button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

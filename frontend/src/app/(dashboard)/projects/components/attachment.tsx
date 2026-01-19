"use client";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { downloadFile, formatFileSize } from "@/lib/utils";
import { Paperclip, Trash2 } from "lucide-react";
import React, { useState } from "react";
import { useDeleteAttachment } from "../../tasks/lib/mutation";
import { Spinner } from "@/components/ui/spinner";
import { TaskService } from "../../tasks/lib/service";
import { toast } from "sonner";

type TaskAttachment = {
  id: string;
  taskId: string;
  fileName: string;
  originalName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  createdAt: string;
  uploadedById: string;
  uploadedBy: {
    id: string;
    name: string;
    email: string;
  };
};
const TaskAttachment = ({
  originalName,
  fileSize,
  uploadedBy,
  taskId,
  id,
}: TaskAttachment) => {
  const [alert, setAlert] = useState(false);

  const mutation = useDeleteAttachment();

  const handleDownload = async () => {
    try {
      const res = await TaskService.downloadAttachment({
        taskId,
        attachmentId: id,
      });

      downloadFile(res, originalName);
    } catch (error) {
      console.error("Download failed", error);
      toast.error("Download failed");
    }
  };
  return (
    <div className="flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-primary/50 transition-colors">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <Paperclip className="h-5 w-5 text-primary" />
        </div>
        <div>
          <div>
            <p className="text-sm font-medium">{originalName}</p>
            <p className="text-xs text-muted-foreground">
              {/* {file.type} •{" "} */}
              {formatFileSize(fileSize)}
            </p>
          </div>

          <p className="text-[13px] font-medium text-gray-300">
            Uploaded By: {uploadedBy.name}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 ">
        <Button size="sm" variant="ghost" onClick={handleDownload}>
          Download
        </Button>
        <Button
          size="icon"
          className="px-0 py-0 rounded-full"
          variant="ghost"
          onClick={() => setAlert(true)}
        >
          <Trash2 className="text-destructive" />
        </Button>
      </div>

      <AlertDialog open={alert} onOpenChange={setAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Attachment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this attachment?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex items-center justify-end gap-4">
            <Button
              variant="outline"
              onClick={() => setAlert(false)}
              disabled={mutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={mutation.isPending}
              onClick={() =>
                mutation.mutate(
                  { taskId, attachmentId: id },
                  {
                    onSuccess: () => {
                      setAlert(false);
                    },
                  }
                )
              }
            >
              {mutation.isPending && (
                <Spinner className="mr-1.5" />
              )}
              Delete
            </Button>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default TaskAttachment;

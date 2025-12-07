"use client";
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Paperclip, Plus } from "lucide-react";
import { AddFileModal } from "./add-file-modal";

interface Attachment {
  id: number;
  name: string;
  size: string;
  type: string;
}
const Attachments = () => {
  const [showFileModal, setShowFileModal] = useState(false);
  const attachments = [
    {
      id: 1,
      name: "homepage-mockup-v1.fig",
      size: "2.4 MB",
      type: "Figma",
    },
    { id: 2, name: "design-specs.pdf", size: "1.1 MB", type: "PDF" },
  ];

  const handleAddFile = (file: File) => {
    const newAttachment: Attachment = {
      id: attachments.length + 1,
      name: file.name,
      size: (file.size / 1024 / 1024).toFixed(1) + " MB",
      type: file.type || "File",
    };
    // setAttachments([...attachments, newAttachment]);
    console.log(newAttachment);
  };

  return (
    <div>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Attachments</CardTitle>
            <Button
              size="sm"
              variant="outline"
              className="bg-transparent"
              onClick={() => setShowFileModal(true)}
            >
              <Plus className="mr-2 h-3 w-3" />
              Add File
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {attachments.map((file) => (
            <div
              key={file.id}
              className="flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-primary/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Paperclip className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {file.type} • {file.size}
                  </p>
                </div>
              </div>
              <Button size="sm" variant="ghost">
                Download
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>
      <AddFileModal
        open={showFileModal}
        onOpenChange={setShowFileModal}
        onAddFile={handleAddFile}
      />
    </div>
  );
};

export default Attachments;

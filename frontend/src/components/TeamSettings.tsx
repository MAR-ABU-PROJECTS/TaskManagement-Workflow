"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";

export default function TeamSettingsPage() {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showDeleteSuccess, setShowDeleteSuccess] = useState(false);

  const handleDeleteTeam = () => {
    // Simulate deletion
    setShowDeleteConfirm(false);
    setShowDeleteSuccess(true);
  };

  return (
    <div className="flex flex-1 flex-col px-4 p-6">
      {/* Header */}
      <div className="mb-3">
        <Link
          href="/teams"
          className="flex items-center gap-2 hover:text-black/50 text-base font-[500] text-black"
        >
          <ArrowLeft className="h-5 w-5" />
          <span className="text-sm">Back to Teams</span>
        </Link>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="mx-auto max-w-6xl space-y-6">
          {/* General Settings */}
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>
                Manage your team&apos;s general information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Team Name</label>
                <input
                  type="text"
                  defaultValue="Design Team"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <textarea
                  defaultValue="UI/UX and visual design team"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  rows={3}
                />
              </div>
              <Button>Save Changes</Button>
            </CardContent>
          </Card>

          {/* Privacy Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Privacy Settings</CardTitle>
              <CardDescription>
                Control who can access your team
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Make Team Public</p>
                  <p className="text-sm text-muted-foreground">
                    Anyone can view this team
                  </p>
                </div>
                <input type="checkbox" className="rounded" />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Allow Invitations</p>
                  <p className="text-sm text-muted-foreground">
                    Members can invite others
                  </p>
                </div>
                <input type="checkbox" defaultChecked className="rounded" />
              </div>
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card className="border-destructive/50">
            <CardHeader>
              <CardTitle className="text-destructive">Danger Zone</CardTitle>
              <CardDescription>
                Irreversible and destructive actions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Dialog
                open={showDeleteConfirm}
                onOpenChange={setShowDeleteConfirm}
              >
                <DialogTrigger asChild>
                  <Button variant="destructive" size="sm">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Team
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Delete Team?</DialogTitle>
                    <DialogDescription>
                      This action cannot be undone. All projects and data
                      associated with this team will be permanently deleted.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setShowDeleteConfirm(false)}
                      className="bg-transparent"
                    >
                      Cancel
                    </Button>
                    <Button variant="destructive" onClick={handleDeleteTeam}>
                      Delete Team
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Success Modal */}
      <Dialog open={showDeleteSuccess} onOpenChange={setShowDeleteSuccess}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Team Deleted Successfully</DialogTitle>
            <DialogDescription>
              Your team has been deleted. Redirecting you back to teams...
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </div>
  );
}

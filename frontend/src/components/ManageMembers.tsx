"use client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MoreVertical, ArrowLeft, Plus } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  getRoleBadgeVariant,
  getRoleIcon,
  teamMembers,
} from "@/app/(dashboard)/teams/lib/utils";
import { ChangeRoleModal } from "@/app/(dashboard)/teams/components/change-role-modal";

export default function ManageMembersPage() {
  const [members, setMembers] = useState(teamMembers);
  const [inviteEmail, setInviteEmail] = useState("");
  const [changeRoleOpen, setChangeRoleOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<{
    id: number;
    name: string;
    role: string;
  } | null>(null);

  const handleInvite = () => {
    if (inviteEmail) {
      // Simulate adding member
      setInviteEmail("");
    }
  };

  const handleRemoveMember = (id: number) => {
    setMembers(members.filter((m) => m.id !== id));
  };

  const handleChangeRole = (memberId: number, newRole: string) => {
    setMembers(
      members.map((m) => (m.id === memberId ? { ...m, role: newRole } : m)),
    );
  };

  const handleOpenChangeRole = (member: {
    id: number;
    name: string;
    role: string;
  }) => {
    setSelectedMember(member);
    setChangeRoleOpen(true);
  };

  return (
    <div className="flex flex-1 flex-col px-4 p-6">
      {/* Header */}
      <div className="flex items-center gap-2 flex-wrap justify-between w-full mb-3">
        <Link
          href="/teams"
          className="flex items-center gap-2  hover:text-black/50 text-base font-[500] text-black"
        >
          <ArrowLeft className="h-5 w-5" />
          <span className="text-sm">Back to Teams</span>
        </Link>

        <Dialog>
          <DialogTrigger asChild>
            <Button size="lg">
              <Plus className="mr-2 h-4 w-4" />
              Invite Member
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invite Member</DialogTitle>
              <DialogDescription>
                Add a new member to your team
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <input
                type="email"
                placeholder="Enter email address"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
              <div className="flex gap-2 justify-end">
                <Button onClick={handleInvite}>Send Invite</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="mx-auto max-w-6xl">
          <Card>
            <CardHeader>
              <CardTitle>Team Members</CardTitle>
              <CardDescription>
                Manage team members and their roles
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-accent/50"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback>{member.avatar}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">{member.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {member.email}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={getRoleBadgeVariant(member.role)}>
                        <span className="mr-1">{getRoleIcon(member.role)}</span>
                        {member.role}
                      </Badge>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => handleOpenChangeRole(member)}
                          >
                            Change Role
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/teams/1/members/${member.id}`}>
                              View Profile
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => handleRemoveMember(member.id)}
                          >
                            Remove from Team
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <ChangeRoleModal
        open={changeRoleOpen}
        onOpenChange={setChangeRoleOpen}
        member={selectedMember}
        onConfirm={handleChangeRole}
      />
    </div>
  );
}

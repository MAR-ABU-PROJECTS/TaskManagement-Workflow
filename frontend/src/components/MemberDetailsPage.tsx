"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowLeft, Mail, Calendar, Shield, Clock } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

// Mock member data - in real app, fetch from params
const mockMember = {
  id: 1,
  name: "John Doe",
  email: "john@marprojects.com",
  role: "Owner",
  avatar: "JD",
  joinedDate: "January 2024",
  status: "Active",
  tasksCompleted: 24,
  projectsOwned: 5,
  bio: "Project management expert with 10+ years of experience",
  department: "Project Management",
  lastActive: "2 hours ago",
};

export default function MemberProfilePage() {
  const params = { id: "1", memberId: "900" };
  return (
    <div className="flex flex-1 flex-col px-4 p-6">
      {/* Header */}

      <div className="mb-3">
        <Link
          href={`/teams/${params.id}/members`}
          className="flex items-center gap-2  hover:text-black/50 text-base font-[500] text-black"
        >
          <ArrowLeft className="h-5 w-5" />
          <span className="text-sm">Back to Members</span>
        </Link>
      </div>

      {/* Main Content */}

      <main className="flex-1">
        <div className="mx-auto max-w-7xl">
          {/* Profile Card */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarFallback>{mockMember.avatar}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-2">
                      <h1 className="text-2xl font-bold">{mockMember.name}</h1>
                      <Badge
                        variant={
                          mockMember.role === "Owner"
                            ? "default"
                            : mockMember.role === "Admin"
                              ? "secondary"
                              : "outline"
                        }
                      >
                        {mockMember.role}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground">
                      {mockMember.department}
                    </p>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm">{mockMember.bio}</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    Email
                  </div>
                  <p className="text-sm font-medium">{mockMember.email}</p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    Joined
                  </div>
                  <p className="text-sm font-medium">{mockMember.joinedDate}</p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    Last Active
                  </div>
                  <p className="text-sm font-medium">{mockMember.lastActive}</p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Shield className="h-4 w-4" />
                    Status
                  </div>
                  <Badge variant="outline">{mockMember.status}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Tasks Completed</CardTitle>
                <CardDescription>Total completed tasks</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {mockMember.tasksCompleted}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  +2 this month
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Projects Owned</CardTitle>
                <CardDescription>Active projects</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {mockMember.projectsOwned}
                </div>
                <p className="text-xs text-muted-foreground mt-1">All active</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}

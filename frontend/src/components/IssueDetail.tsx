"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { AlertTriangle, User, Flag, CheckCircle2, MoreVertical, LinkIcon, Send, FileText } from 'lucide-react'
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useState } from "react"

const comments = [
  {
    id: 1,
    author: { name: "John Doe", avatar: "JD" },
    content: "I've identified the issue. The event listener is not properly attached on iOS Safari.",
    timestamp: "2 hours ago",
  },
  {
    id: 2,
    author: { name: "Jane Smith", avatar: "JS" },
    content: "Can you check if it's related to the touch event handling?",
    timestamp: "1 hour ago",
  },
  {
    id: 3,
    author: { name: "John Doe", avatar: "JD" },
    content: "Yes, exactly. I'm working on a fix now. Should have it ready for testing soon.",
    timestamp: "30 minutes ago",
  },
]

const activityLog = [
  { id: 1, user: "John Doe", action: "changed status to", value: "In Progress", timestamp: "2 hours ago" },
  { id: 2, user: "Jane Smith", action: "changed severity to", value: "Critical", timestamp: "4 hours ago" },
  { id: 3, user: "John Doe", action: "was assigned to this issue", value: "", timestamp: "5 hours ago" },
  { id: 4, user: "Mike Johnson", action: "created this issue", value: "", timestamp: "1 day ago" },
]

export default function IssueDetailPage() {
  const [newComment, setNewComment] = useState("")

  return (
    <div className="flex flex-1 flex-col px-4 p-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
       
        <div className="flex items-center gap-3 flex-1">
          <AlertTriangle className="h-5 w-5 text-orange-500" />
          <h1 className="text-lg font-semibold">Login button not responding on mobile</h1>
          <Badge variant="default">Critical</Badge>
          <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20">
            Open
          </Badge>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" variant="outline" className="bg-transparent">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>Convert to Task</DropdownMenuItem>
            <DropdownMenuItem>Duplicate Issue</DropdownMenuItem>
            <DropdownMenuItem>Move to Project</DropdownMenuItem>
            <DropdownMenuItem className="text-destructive">Delete Issue</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            <Card>
              <CardHeader>
                <CardTitle>Issue Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Multiple users have reported that the login button on the homepage is not responding when clicked on
                  iOS Safari browsers. The issue appears to be specific to mobile devices and does not occur on desktop
                  browsers. This is blocking users from accessing their accounts and needs immediate attention.
                </p>
              </CardContent>
            </Card>

            {/* Reproduction Steps */}
            <Card>
              <CardHeader>
                <CardTitle>Steps to Reproduce</CardTitle>
              </CardHeader>
              <CardContent>
                <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                  <li>Open the website on an iOS device using Safari</li>
                  <li>Navigate to the homepage</li>
                  <li>Tap on the login button</li>
                  <li>Observe that nothing happens</li>
                </ol>
              </CardContent>
            </Card>

            {/* Root Cause Analysis */}
            <Card>
              <CardHeader>
                <CardTitle>Root Cause Analysis</CardTitle>
                <CardDescription>Technical investigation and findings</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="rounded-lg border border-slate-200 dark:border-slate-800 p-4 space-y-2">
                    <h4 className="text-sm font-medium">Identified Cause</h4>
                    <p className="text-sm text-muted-foreground">
                      The click event listener is not properly attached on iOS Safari due to touch event handling
                      conflicts.
                    </p>
                  </div>
                  <div className="rounded-lg border border-slate-200 dark:border-slate-800 p-4 space-y-2">
                    <h4 className="text-sm font-medium">Proposed Solution</h4>
                    <p className="text-sm text-muted-foreground">
                      Update the event handling to use both click and touchstart events with proper preventDefault
                      calls.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Comments */}
            <Card>
              <CardHeader>
                <CardTitle>Discussion</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {comments.map((comment) => (
                  <div key={comment.id} className="flex gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>{comment.author.avatar}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{comment.author.name}</span>
                        <span className="text-xs text-muted-foreground">{comment.timestamp}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{comment.content}</p>
                    </div>
                  </div>
                ))}

                <div className="flex gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>JD</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-2">
                    <Textarea
                      placeholder="Add a comment..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      className="min-h-20"
                    />
                    <div className="flex justify-end">
                      <Button size="sm">
                        <Send className="mr-2 h-3 w-3" />
                        Comment
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Activity Log */}
            <Card>
              <CardHeader>
                <CardTitle>Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {activityLog.map((activity) => (
                    <div key={activity.id} className="flex gap-3 text-sm">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted">
                        <div className="h-2 w-2 rounded-full bg-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="text-muted-foreground">
                          <span className="font-medium text-foreground">{activity.user}</span> {activity.action}{" "}
                          {activity.value && <span className="font-medium text-foreground">{activity.value}</span>}
                        </p>
                        <p className="text-xs text-muted-foreground">{activity.timestamp}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Issue Details */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Issue Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-sm font-medium">
                    <User className="h-4 w-4" />
                    Assignee
                  </Label>
                  <Select defaultValue="john">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="john">John Doe</SelectItem>
                      <SelectItem value="jane">Jane Smith</SelectItem>
                      <SelectItem value="mike">Mike Johnson</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-sm font-medium">
                    <Flag className="h-4 w-4" />
                    Severity
                  </Label>
                  <Select defaultValue="critical">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="blocker">Blocker</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                      <SelectItem value="major">Major</SelectItem>
                      <SelectItem value="minor">Minor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-sm font-medium">
                    <CheckCircle2 className="h-4 w-4" />
                    Status
                  </Label>
                  <Select defaultValue="open">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="in-progress">In Progress</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                      <SelectItem value="reopened">Reopened</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-sm font-medium">
                    <LinkIcon className="h-4 w-4" />
                    Linked Task
                  </Label>
                  <div className="rounded-lg border border-slate-200 dark:border-slate-800 p-3">
                    <p className="text-sm font-medium">Authentication Flow</p>
                    <p className="text-xs text-muted-foreground">Website Redesign</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-sm font-medium">
                    <FileText className="h-4 w-4" />
                    Project
                  </Label>
                  <div className="rounded-lg border border-slate-200 dark:border-slate-800 p-3">
                    <p className="text-sm font-medium">Website Redesign</p>
                    <p className="text-xs text-muted-foreground">Design Team</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Resolution</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Resolution Time</Label>
                  <div className="text-2xl font-bold">-</div>
                  <p className="text-xs text-muted-foreground">Issue is still open</p>
                </div>
                <Button variant="outline" size="sm" className="w-full bg-transparent">
                  Mark as Resolved
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}

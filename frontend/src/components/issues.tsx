import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Filter, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  getSeverityColor,
  getSeverityIcon,
  getStatusBadge,
} from "@/app/(dashboard)/issues/lib/utils";

const issues = [
  {
    id: 1,
    title: "Login button not responding on mobile",
    description:
      "Users report that the login button doesn't work on iOS Safari",
    project: "Website Redesign",
    severity: "Critical",
    status: "Open",
    assignee: { name: "John Doe", avatar: "JD" },
    createdAt: "2025-01-15",
    linkedTask: "Authentication Flow",
  },
  {
    id: 2,
    title: "Images not loading in production",
    description: "Product images fail to load after deployment",
    project: "Mobile App",
    severity: "Blocker",
    status: "In Progress",
    assignee: { name: "Jane Smith", avatar: "JS" },
    createdAt: "2025-01-14",
    linkedTask: "Image Upload Feature",
  },
  {
    id: 3,
    title: "Typo in welcome email",
    description: "Welcome email has incorrect company name",
    project: "Marketing Campaign",
    severity: "Minor",
    status: "Resolved",
    assignee: { name: "Mike Johnson", avatar: "MJ" },
    createdAt: "2025-01-13",
    linkedTask: "Email Templates",
  },
  {
    id: 4,
    title: "Dashboard charts not updating",
    description: "Real-time data not reflecting in dashboard charts",
    project: "Website Redesign",
    severity: "Major",
    status: "Open",
    assignee: { name: "Sarah Williams", avatar: "SW" },
    createdAt: "2025-01-12",
    linkedTask: "Analytics Dashboard",
  },
  {
    id: 5,
    title: "Slow API response times",
    description: "API endpoints taking 5+ seconds to respond",
    project: "Mobile App",
    severity: "Major",
    status: "In Progress",
    assignee: { name: "Tom Brown", avatar: "TB" },
    createdAt: "2025-01-11",
    linkedTask: "Backend Optimization",
  },
];

export default function IssuesPage() {
  return (
    <div className="flex flex-1 flex-col">
      {/* Header */}

      {/* Main Content */}
      <main className="flex-1 overflow-auto px-4 py-6">
        <div className="mx-auto space-y-6">
          <div className="flex shrink-0 items-center gap-2">
            <div className="lg:ml-auto flex items-center gap-2 flex-wrap">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search issues..." className="w-64 pl-8" />
              </div>
              <Button size="sm" variant="outline" className="bg-transparent">
                <Filter className="mr-2 h-4 w-4" />
                Filter
              </Button>
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Report Issue
              </Button>
            </div>
          </div>

          {/* Filter Tabs */}
          <Tabs defaultValue="all" className="w-full">
            <TabsList>
              <TabsTrigger value="all">All Issues</TabsTrigger>
              <TabsTrigger value="open">Open</TabsTrigger>
              <TabsTrigger value="in-progress">In Progress</TabsTrigger>
              <TabsTrigger value="resolved">Resolved</TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Issues List */}
          <div className="space-y-3">
            {issues.map((issue) => (
              <Link
                key={issue.id}
                href={`/issues/${issue.id}`}
                className="mb-5 inline-block w-full"
              >
                <Card className="hover:border-primary/50 transition-colors cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className="mt-1">
                        {getSeverityIcon(issue.severity)}
                      </div>

                      <div className="flex-1 space-y-2">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-medium">{issue.title}</h3>
                              <Badge
                                variant={getSeverityColor(issue.severity)}
                                className="text-xs"
                              >
                                {issue.severity}
                              </Badge>
                              {getStatusBadge(issue.status)}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {issue.description}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-6 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-5 w-5">
                              <AvatarFallback className="text-xs">
                                {issue.assignee.avatar}
                              </AvatarFallback>
                            </Avatar>
                            <span>{issue.assignee.name}</span>
                          </div>
                          <span>•</span>
                          <span>{issue.project}</span>
                          <span>•</span>
                          <span>Linked to: {issue.linkedTask}</span>
                          <span>•</span>
                          <span>Created {issue.createdAt}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

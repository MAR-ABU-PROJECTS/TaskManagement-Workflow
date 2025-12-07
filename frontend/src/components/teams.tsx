import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Users, FolderKanban, MoreVertical } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const teams = [
  {
    id: 1,
    name: "Design Team",
    description: "UI/UX and visual design",
    members: 8,
    projects: 5,
    color: "bg-blue-500",
  },
  {
    id: 2,
    name: "Engineering",
    description: "Software development and infrastructure",
    members: 15,
    projects: 12,
    color: "bg-green-500",
  },
  {
    id: 3,
    name: "Marketing",
    description: "Brand and growth initiatives",
    members: 6,
    projects: 8,
    color: "bg-purple-500",
  },
  {
    id: 4,
    name: "Product",
    description: "Product strategy and management",
    members: 4,
    projects: 6,
    color: "bg-orange-500",
  },
];

export default function TeamsPage() {
  return (
    <div className="flex flex-1 flex-col">
      {/* Header */}

      {/* Main Content */}
      <main className="flex-1 overflow-auto px-4 p-6">
        <div className="mx-auto">
          {/* header */}
          <div className="flex items-center flex-wrap gap-2 mb-3">
            <div />
            <div className="ml-auto flex items-center gap-2">
              <Button size="lg" asChild>
                <Link href={"/teams/new"}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Team
                </Link>
              </Button>
            </div>
          </div>

          {/* Teams Grid */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {teams.map((team) => (
              <Card
                key={team.id}
                className="hover:border-primary/50 transition-colors"
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-lg ${team.color}`}
                      >
                        <Users className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-base">
                          <Link
                            href={`/teams/${team.id}`}
                            className="hover:text-primary"
                          >
                            {team.name}
                          </Link>
                        </CardTitle>
                        <CardDescription className="text-sm">
                          {team.description}
                        </CardDescription>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Link href={`/teams/${team.id}/edit`}>Edit Team</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Link href={`/teams/${team.id}/members`}>
                            {" "}
                            Manage Members
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Link href={`/teams/${team.id}/settings`}>
                            {" "}
                            Team Settings
                          </Link>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Users className="h-4 w-4" />
                      <span>{team.members} members</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <FolderKanban className="h-4 w-4" />
                      <span>{team.projects} projects</span>
                    </div>
                  </div>
                  <div className="flex -space-x-2">
                    {Array.from({
                      length: Math.min(team.members, 5),
                    }).map((_, i) => (
                      <Avatar key={i} className="h-8 w-8 border-2 border-card">
                        <AvatarFallback className="text-xs">
                          U{i + 1}
                        </AvatarFallback>
                      </Avatar>
                    ))}
                    {team.members > 5 && (
                      <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-card bg-muted text-xs font-medium">
                        +{team.members - 5}
                      </div>
                    )}
                  </div>

                  <Button
                    variant="outline"
                    size="lg"
                    className="w-full bg-transparent"
                    asChild
                  >
                    <Link href={`/teams/${team.id}`}>View Team</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

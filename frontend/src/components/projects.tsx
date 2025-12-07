import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";
import Projectitem from "@/app/(dashboard)/projects/components/projectitem";

const projects = [
  {
    id: 1,
    name: "Website Redesign",
    description: "Complete overhaul of company website",
    team: "Design Team",
    status: "In Progress",
    progress: 75,
    tasks: { total: 24, completed: 18 },
    members: 5,
    dueDate: "2025-02-15",
  },
  {
    id: 2,
    name: "Mobile App Development",
    description: "iOS and Android native applications",
    team: "Engineering",
    status: "In Progress",
    progress: 45,
    tasks: { total: 48, completed: 22 },
    members: 8,
    dueDate: "2025-03-30",
  },
  {
    id: 3,
    name: "Marketing Campaign Q1",
    description: "Q1 2025 marketing initiatives",
    team: "Marketing",
    status: "Planning",
    progress: 20,
    tasks: { total: 16, completed: 3 },
    members: 4,
    dueDate: "2025-03-31",
  },
  {
    id: 4,
    name: "Brand Guidelines",
    description: "Updated brand identity guidelines",
    team: "Design Team",
    status: "Completed",
    progress: 100,
    tasks: { total: 8, completed: 8 },
    members: 3,
    dueDate: "2025-01-10",
  },
];

export default function ProjectsPage() {
  return (
    <div className="flex flex-1 flex-col">
      {/* Main Content */}
      <main className="flex-1 overflow-auto p-6 px-4">
        <div className="mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <Button size="lg" asChild>
                <Link href={"/projects/new"}>
                  <Plus className="mr-2 h-4 w-4" />
                  New Project
                </Link>
              </Button>
            </div>
          </div>

          {/* Projects Grid */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((project, i: number) => (
              <Projectitem key={i} {...project} />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

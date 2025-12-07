"use client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Calendar,
  TrendingUp,
  TrendingDown,
  Users,
  FolderKanban,
  CheckCircle2,
  Clock,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
// import {
//   Bar,
//   BarChart,
//   Line,
//   LineChart,
//   Pie,
//   PieChart,
//   Cell,
//   XAxis,
//   YAxis,
//   CartesianGrid,
//   Legend,
//   ResponsiveContainer,
// } from "recharts";
// import {
//   ChartConfig,
//   ChartContainer,
//   ChartTooltip,
//   ChartTooltipContent,
// } from "@/components/ui/chart";

// const projectCompletionData = [
//   { month: "Jan", completed: 12, inProgress: 8 },
//   { month: "Feb", completed: 15, inProgress: 10 },
//   { month: "Mar", completed: 18, inProgress: 12 },
//   { month: "Apr", completed: 14, inProgress: 9 },
//   { month: "May", completed: 20, inProgress: 15 },
//   { month: "Jun", completed: 22, inProgress: 11 },
// ];

// const taskStatusDataArray = [
//   { name: "Completed", value: 234, color: "#22c55e" },
//   { name: "In Progress", value: 48, color: "#eab308" },
//   { name: "To Do", value: 67, color: "#3b82f6" },
//   { name: "Blocked", value: 12, color: "#ef4444" },
// ];

// const teamPerformanceData = [
//   { team: "Design", velocity: 85, tasks: 45 },
//   { team: "Engineering", velocity: 92, tasks: 78 },
//   { team: "Marketing", velocity: 78, tasks: 34 },
//   { team: "Product", velocity: 88, tasks: 52 },
// ];

// const issueResolutionData = [
//   { week: "Week 1", resolved: 8, opened: 5 },
//   { week: "Week 2", resolved: 12, opened: 7 },
//   { week: "Week 3", resolved: 10, opened: 9 },
//   { week: "Week 4", resolved: 15, opened: 6 },
// ];

export default function ReportsPage() {
  return (
    <div className="flex flex-1 flex-col w-full h-full">
      {/* Header */}

      {/* Main Content */}
      <main className="flex-1 p-6 px-4">
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <div className="flex items-center gap-2">
            <Select defaultValue="30">
              <SelectTrigger className="w-40">
                <Calendar className="mr-2 h-4 w-4" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
                <SelectItem value="365">Last year</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="mx-auto">
          {/* View Tabs */}
          <Tabs defaultValue="overview" className="w-full mb-4 hidden">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="projects">Projects</TabsTrigger>
              <TabsTrigger value="teams">Teams</TabsTrigger>
              <TabsTrigger value="issues">Issues</TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Key Metrics */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Projects
                </CardTitle>
                <FolderKanban className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">24</div>
                <div className="flex items-center text-xs text-muted-foreground">
                  <TrendingUp className="mr-1 h-3 w-3 text-green-500" />
                  <span className="text-green-500">+12%</span>
                  <span className="ml-1">from last month</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Task Completion Rate
                </CardTitle>
                <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">87%</div>
                <div className="flex items-center text-xs text-muted-foreground">
                  <TrendingUp className="mr-1 h-3 w-3 text-green-500" />
                  <span className="text-green-500">+5%</span>
                  <span className="ml-1">from last month</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Avg. Resolution Time
                </CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">2.4 days</div>
                <div className="flex items-center text-xs text-muted-foreground">
                  <TrendingDown className="mr-1 h-3 w-3 text-green-500" />
                  <span className="text-green-500">-8%</span>
                  <span className="ml-1">from last month</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Team Velocity
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">86%</div>
                <div className="flex items-center text-xs text-muted-foreground">
                  <TrendingUp className="mr-1 h-3 w-3 text-green-500" />
                  <span className="text-green-500">+3%</span>
                  <span className="ml-1">from last month</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts Grid */}
          <div className="grid gap-6 lg:grid-cols-2 mb-4">
            {/* Project Completion Trend */}
            <Card>
              <CardHeader>
                <CardTitle>Project Completion Trend</CardTitle>
                <CardDescription>
                  Monthly project completion vs in-progress
                </CardDescription>
              </CardHeader>
              <CardContent className="w-full">
                {/* <ChartContainer
									config={
										{
											completed: {
												label: "Completed",
												color: "var(--chart-1)",
											},
											inProgress: {
												label: "In Progress",
												color: "var(--chart-2)",
											},
										} satisfies ChartConfig
									}
									className="h-[350px] w-full"
								>
									<ResponsiveContainer
										width="100%"
										height="100%"
									>
										<LineChart data={projectCompletionData}>
											<CartesianGrid
												strokeDasharray="3 3"
												className="stroke-muted"
											/>
											<XAxis
												dataKey="month"
												className="text-xs"
											/>
											<YAxis className="text-xs" />
											<ChartTooltip
												cursor={false}
												content={
													<ChartTooltipContent />
												}
											/>
											<Legend />
											<Line
												type="monotone"
												dataKey="completed"
												stroke="hsl(var(--chart-1))"
												strokeWidth={2}
											/>
											<Line
												type="monotone"
												dataKey="inProgress"
												stroke="hsl(var(--chart-2))"
												strokeWidth={2}
											/>
										</LineChart>
									</ResponsiveContainer>
								</ChartContainer> */}
              </CardContent>
            </Card>

            {/* Task Status Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Task Status Distribution</CardTitle>
                <CardDescription>
                  Current task breakdown by status
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* <ChartContainer
									config={{
										completed: {
											label: "Completed",
											color: "#22c55e",
										},
										inProgress: {
											label: "In Progress",
											color: "#eab308",
										},
										todo: {
											label: "To Do",
											color: "#3b82f6",
										},
										blocked: {
											label: "Blocked",
											color: "#ef4444",
										},
									}}
									className="h-[350px] w-full"
								>
									<ResponsiveContainer
										width="100%"
										height="100%"
									>
										<PieChart>
											<Pie
												data={taskStatusDataArray}
												cx="50%"
												cy="50%"
												labelLine={false}
												label={({ name, percent }) =>
													`${name ?? "Unknown"} ${
														percent != null
															? (
																	percent *
																	100
															  ).toFixed(0)
															: "0"
													}%`
												}
												outerRadius={80}
												fill="#8884d8"
												dataKey="value"
											>
												{taskStatusDataArray.map(
													(entry, index) => (
														<Cell
															key={`cell-${index}`}
															fill={entry.color}
														/>
													)
												)}
											</Pie>
											<ChartTooltip
												content={
													<ChartTooltipContent />
												}
											/>
										</PieChart>
									</ResponsiveContainer>
								</ChartContainer> */}
              </CardContent>
            </Card>

            {/* Team Performance */}
            <Card>
              <CardHeader>
                <CardTitle>Team Performance</CardTitle>
                <CardDescription>
                  Velocity and task completion by team
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* <ChartContainer
									config={{
										velocity: {
											label: "Velocity %",
											color: "hsl(var(--chart-1))",
										},
									}}
									className="h-[350px] w-full"
								>
									<ResponsiveContainer
										width="100%"
										height="100%"
									>
										<BarChart data={teamPerformanceData}>
											<CartesianGrid
												strokeDasharray="3 3"
												className="stroke-muted"
											/>
											<XAxis
												dataKey="team"
												className="text-xs"
											/>
											<YAxis className="text-xs" />
											<ChartTooltip
												content={
													<ChartTooltipContent />
												}
											/>
											<Legend />
											<Bar
												dataKey="velocity"
												fill="hsl(var(--chart-1))"
												radius={[4, 4, 0, 0]}
											/>
										</BarChart>
									</ResponsiveContainer>
								</ChartContainer> */}
              </CardContent>
            </Card>

            {/* Issue Resolution */}
            <Card>
              <CardHeader>
                <CardTitle>Issue Resolution</CardTitle>
                <CardDescription>
                  Weekly issues opened vs resolved
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* <ChartContainer
									config={{
										resolved: {
											label: "Resolved",
											color: "hsl(var(--chart-1))",
										},
										opened: {
											label: "Opened",
											color: "hsl(var(--chart-2))",
										},
									}}
									className="h-[350px] w-full"
								>
									<ResponsiveContainer
										width="100%"
										height="100%"
									>
										<BarChart data={issueResolutionData}>
											<CartesianGrid
												strokeDasharray="3 3"
												className="stroke-muted"
											/>
											<XAxis
												dataKey="week"
												className="text-xs"
											/>
											<YAxis className="text-xs" />
											<ChartTooltip
												content={
													<ChartTooltipContent />
												}
											/>
											<Legend />
											<Bar
												dataKey="resolved"
												fill="hsl(var(--chart-1))"
												radius={[4, 4, 0, 0]}
											/>
											<Bar
												dataKey="opened"
												fill="hsl(var(--chart-2))"
												radius={[4, 4, 0, 0]}
											/>
										</BarChart>
									</ResponsiveContainer>
								</ChartContainer> */}
              </CardContent>
            </Card>
          </div>

          {/* Detailed Insights */}
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Top Performing Teams</CardTitle>
                <CardDescription>
                  Based on velocity and task completion
                </CardDescription>
              </CardHeader>
              {/* <CardContent>
								<div className="space-y-4">
									{teamPerformanceData
										.sort((a, b) => b.velocity - a.velocity)
										.map((team, index) => (
											<div
												key={team.team}
												className="flex items-center justify-between"
											>
												<div className="flex items-center gap-3">
													<div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
														{index + 1}
													</div>
													<div>
														<p className="font-medium">
															{team.team}
														</p>
														<p className="text-sm text-muted-foreground">
															{team.tasks} tasks
															completed
														</p>
													</div>
												</div>
												<div className="text-right">
													<p className="font-medium">
														{team.velocity}%
													</p>
													<p className="text-xs text-muted-foreground">
														Velocity
													</p>
												</div>
											</div>
										))}
								</div>
							</CardContent> */}
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Key Insights</CardTitle>
                <CardDescription>AI-powered recommendations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="rounded-lg border border-green-500/20 bg-green-500/10 p-4">
                    <div className="flex items-start gap-3">
                      <TrendingUp className="h-5 w-5 text-green-500 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-green-500">
                          Strong Performance
                        </h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          Engineering team is exceeding velocity targets by 15%.
                          Consider sharing their workflow with other teams.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/10 p-4">
                    <div className="flex items-start gap-3">
                      <Clock className="h-5 w-5 text-yellow-500 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-yellow-500">
                          Attention Needed
                        </h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          12 tasks are currently blocked. Review dependencies
                          and resource allocation.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-lg border border-blue-500/20 bg-blue-500/10 p-4">
                    <div className="flex items-start gap-3">
                      <Users className="h-5 w-5 text-blue-500 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-blue-500">
                          Resource Optimization
                        </h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          Marketing team has capacity for 8 more tasks this
                          sprint based on current velocity.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Starting database seed...");

  // Clear existing data
  console.log("🗑️  Clearing existing data...");
  await prisma.notification.deleteMany();
  await prisma.taskActivityLog.deleteMany();
  await prisma.taskComment.deleteMany();
  await prisma.task.deleteMany();
  await prisma.project.deleteMany();
  await prisma.user.deleteMany();

  // Hash password for all users (password: "password123")
  const hashedPassword = await bcrypt.hash("password123", 10);

  // Create Users
  console.log("👥 Creating users...");
  const ceo = await prisma.user.create({
    data: {
      email: "ceo@company.com",
      passwordHash: hashedPassword,
      name: "John CEO",
      role: "CEO",
      department: null,
    },
  });

  const hoo = await prisma.user.create({
    data: {
      email: "hoo@company.com",
      passwordHash: hashedPassword,
      name: "Sarah HOO",
      role: "HOO",
      department: null,
    },
  });

  const hrManager = await prisma.user.create({
    data: {
      email: "hr@company.com",
      passwordHash: hashedPassword,
      name: "Emily HR Manager",
      role: "HR",
      department: "HR",
    },
  });

  const opsAdmin = await prisma.user.create({
    data: {
      email: "ops.admin@company.com",
      passwordHash: hashedPassword,
      name: "Mike OPS Admin",
      role: "ADMIN",
      department: "OPS",
    },
  });

  const hrAdmin = await prisma.user.create({
    data: {
      email: "hr.admin@company.com",
      passwordHash: hashedPassword,
      name: "Lisa HR Admin",
      role: "ADMIN",
      department: "HR",
    },
  });

  const opsStaff1 = await prisma.user.create({
    data: {
      email: "ops.staff1@company.com",
      passwordHash: hashedPassword,
      name: "David OPS Staff",
      role: "STAFF",
      department: "OPS",
    },
  });

  const opsStaff2 = await prisma.user.create({
    data: {
      email: "ops.staff2@company.com",
      passwordHash: hashedPassword,
      name: "Emma OPS Staff",
      role: "STAFF",
      department: "OPS",
    },
  });

  const hrStaff1 = await prisma.user.create({
    data: {
      email: "hr.staff1@company.com",
      passwordHash: hashedPassword,
      name: "Robert HR Staff",
      role: "STAFF",
      department: "HR",
    },
  });

  const hrStaff2 = await prisma.user.create({
    data: {
      email: "hr.staff2@company.com",
      passwordHash: hashedPassword,
      name: "Anna HR Staff",
      role: "STAFF",
      department: "HR",
    },
  });

  console.log("✅ Created 9 users");

  // Create Projects
  console.log("📁 Creating projects...");
  const opsProject1 = await prisma.project.create({
    data: {
      name: "Website Redesign",
      description: "Complete overhaul of company website",
      department: "OPS",
      creatorId: ceo.id,
    },
  });

  const opsProject2 = await prisma.project.create({
    data: {
      name: "Mobile App Development",
      description: "Build iOS and Android applications",
      department: "OPS",
      creatorId: opsAdmin.id,
    },
  });

  const hrProject1 = await prisma.project.create({
    data: {
      name: "Employee Onboarding System",
      description: "Streamline new hire processes",
      department: "HR",
      creatorId: hrManager.id,
    },
  });

  const hrProject2 = await prisma.project.create({
    data: {
      name: "Performance Review 2025",
      description: "Annual performance evaluation process",
      department: "HR",
      creatorId: hrAdmin.id,
    },
  });

  console.log("✅ Created 4 projects");

  // Create Tasks with various statuses and approval states
  console.log("📋 Creating tasks...");

  // CEO task - auto-approved
  const ceoTask = await prisma.task.create({
    data: {
      projectId: opsProject1.id,
      title: "Define Website Requirements",
      description: "Gather requirements from stakeholders",
      priority: "HIGH",
      issueType: "TASK",
      status: "COMPLETED",
      creatorId: ceo.id,
      assigneeId: opsAdmin.id,
      requiresApproval: false,
    },
  });

  // HOO task - auto-approved
  const hooTask = await prisma.task.create({
    data: {
      projectId: opsProject2.id,
      title: "Mobile App Architecture Design",
      description: "Design scalable architecture for mobile apps",
      priority: "HIGH",
      issueType: "TASK",
      status: "IN_PROGRESS",
      creatorId: hoo.id,
      assigneeId: opsStaff1.id,
      requiresApproval: false,
    },
  });

  // HR Manager task - auto-approved
  const hrTask = await prisma.task.create({
    data: {
      projectId: hrProject1.id,
      title: "Design Onboarding Checklist",
      description: "Create comprehensive onboarding checklist",
      priority: "MEDIUM",
      issueType: "TASK",
      status: "REVIEW",
      creatorId: hrManager.id,
      assigneeId: hrStaff1.id,
      requiresApproval: false,
    },
  });

  // Admin -> Staff task - PENDING APPROVAL
  const pendingTask1 = await prisma.task.create({
    data: {
      projectId: opsProject1.id,
      title: "Implement Homepage Design",
      description: "Code the new homepage using React",
      priority: "HIGH",
      issueType: "TASK",
      status: "ASSIGNED",
      creatorId: opsAdmin.id,
      assigneeId: opsStaff1.id,
      requiresApproval: true,
    },
  });

  const pendingTask2 = await prisma.task.create({
    data: {
      projectId: hrProject2.id,
      title: "Schedule Review Meetings",
      description: "Coordinate with all departments for review sessions",
      priority: "MEDIUM",
      issueType: "TASK",
      status: "ASSIGNED",
      creatorId: hrAdmin.id,
      assigneeId: hrStaff2.id,
      requiresApproval: true,
    },
  });

  // Approved task
  const approvedTask = await prisma.task.create({
    data: {
      projectId: opsProject2.id,
      title: "Setup Development Environment",
      description: "Configure React Native development tools",
      priority: "HIGH",
      issueType: "TASK",
      status: "IN_PROGRESS",
      creatorId: opsAdmin.id,
      assigneeId: opsStaff2.id,
      requiresApproval: true,
      approvedById: hoo.id,
    },
  });

  // Rejected task
  const rejectedTask = await prisma.task.create({
    data: {
      projectId: hrProject1.id,
      title: "Purchase New HR Software",
      description: "Buy expensive software without budget approval",
      priority: "LOW",
      issueType: "TASK",
      status: "REJECTED",
      creatorId: hrAdmin.id,
      assigneeId: hrStaff1.id,
      requiresApproval: true,
      approvedById: hrManager.id,
      rejectionReason: "Budget not allocated for this quarter",
    },
  });

  // Bug tasks
  const bugTask = await prisma.task.create({
    data: {
      projectId: opsProject1.id,
      title: "Fix Navigation Menu Bug",
      description: "Menu doesn't work on mobile devices",
      priority: "HIGH",
      issueType: "BUG",
      status: "ASSIGNED",
      creatorId: opsStaff2.id,
      assigneeId: opsStaff1.id,
      requiresApproval: false,
    },
  });

  // Story task
  const storyTask = await prisma.task.create({
    data: {
      projectId: hrProject1.id,
      title: "User Story: New Hire Dashboard",
      description:
        "As a new employee, I want a dashboard showing my onboarding progress",
      priority: "MEDIUM",
      issueType: "STORY",
      status: "DRAFT",
      creatorId: hrManager.id,
      requiresApproval: false,
    },
  });

  // Task with subtasks
  const parentTask = await prisma.task.create({
    data: {
      projectId: opsProject2.id,
      title: "User Authentication Module",
      description: "Complete authentication system",
      priority: "HIGH",
      issueType: "TASK",
      status: "IN_PROGRESS",
      creatorId: opsAdmin.id,
      assigneeId: opsStaff1.id,
      requiresApproval: false,
    },
  });

  const subTask1 = await prisma.task.create({
    data: {
      projectId: opsProject2.id,
      title: "Design Login Screen",
      description: "UI/UX for login page",
      priority: "HIGH",
      issueType: "TASK",
      status: "COMPLETED",
      creatorId: opsAdmin.id,
      assigneeId: opsStaff2.id,
      parentTaskId: parentTask.id,
      requiresApproval: false,
    },
  });

  const subTask2 = await prisma.task.create({
    data: {
      projectId: opsProject2.id,
      title: "Implement JWT Authentication",
      description: "Backend JWT token handling",
      priority: "HIGH",
      issueType: "TASK",
      status: "IN_PROGRESS",
      creatorId: opsAdmin.id,
      assigneeId: opsStaff1.id,
      parentTaskId: parentTask.id,
      requiresApproval: false,
    },
  });

  console.log("✅ Created 12 tasks");

  // Create Comments
  console.log("💬 Creating comments...");
  await prisma.taskComment.create({
    data: {
      taskId: ceoTask.id,
      userId: opsAdmin.id,
      message: "I've completed the requirements gathering. Ready for review.",
    },
  });

  await prisma.taskComment.create({
    data: {
      taskId: hooTask.id,
      userId: opsStaff1.id,
      message:
        "Working on the architecture diagram. @Sarah HOO can you review the database design?",
    },
  });

  await prisma.taskComment.create({
    data: {
      taskId: approvedTask.id,
      userId: hoo.id,
      message: "Approved! Please proceed with the implementation.",
    },
  });

  await prisma.taskComment.create({
    data: {
      taskId: rejectedTask.id,
      userId: hrManager.id,
      message:
        "Rejected due to budget constraints. Please revise the proposal for Q2.",
    },
  });

  await prisma.taskComment.create({
    data: {
      taskId: pendingTask1.id,
      userId: opsStaff1.id,
      message:
        "I need approval before I can start working on this. @Mike OPS Admin",
    },
  });

  await prisma.taskComment.create({
    data: {
      taskId: bugTask.id,
      userId: opsStaff1.id,
      message:
        "I've identified the issue. It's related to responsive CSS. Will fix today.",
    },
  });

  console.log("✅ Created 6 comments");

  // Create Activity Logs
  console.log("📝 Creating activity logs...");
  await prisma.taskActivityLog.create({
    data: {
      taskId: ceoTask.id,
      userId: ceo.id,
      action: "CREATE",
      newStatus: "ASSIGNED",
    },
  });

  await prisma.taskActivityLog.create({
    data: {
      taskId: ceoTask.id,
      userId: opsAdmin.id,
      action: "STATUS_UPDATE",
      previousStatus: "ASSIGNED",
      newStatus: "IN_PROGRESS",
    },
  });

  await prisma.taskActivityLog.create({
    data: {
      taskId: ceoTask.id,
      userId: opsAdmin.id,
      action: "STATUS_UPDATE",
      previousStatus: "IN_PROGRESS",
      newStatus: "COMPLETED",
    },
  });

  await prisma.taskActivityLog.create({
    data: {
      taskId: approvedTask.id,
      userId: opsAdmin.id,
      action: "CREATE",
      newStatus: "ASSIGNED",
    },
  });

  await prisma.taskActivityLog.create({
    data: {
      taskId: approvedTask.id,
      userId: hoo.id,
      action: "APPROVE",
      metadata: {
        comment: "Approved! Please proceed with the implementation.",
      },
    },
  });

  await prisma.taskActivityLog.create({
    data: {
      taskId: approvedTask.id,
      userId: opsStaff2.id,
      action: "STATUS_UPDATE",
      previousStatus: "ASSIGNED",
      newStatus: "IN_PROGRESS",
    },
  });

  await prisma.taskActivityLog.create({
    data: {
      taskId: rejectedTask.id,
      userId: hrAdmin.id,
      action: "CREATE",
      newStatus: "ASSIGNED",
    },
  });

  await prisma.taskActivityLog.create({
    data: {
      taskId: rejectedTask.id,
      userId: hrManager.id,
      action: "REJECT",
      previousStatus: "ASSIGNED",
      newStatus: "REJECTED",
      metadata: { reason: "Budget not allocated for this quarter" },
    },
  });

  await prisma.taskActivityLog.create({
    data: {
      taskId: hooTask.id,
      userId: hoo.id,
      action: "CREATE",
      newStatus: "ASSIGNED",
    },
  });

  await prisma.taskActivityLog.create({
    data: {
      taskId: hooTask.id,
      userId: opsStaff1.id,
      action: "STATUS_UPDATE",
      previousStatus: "ASSIGNED",
      newStatus: "IN_PROGRESS",
    },
  });

  console.log("✅ Created 10 activity logs");

  // Create Notifications
  console.log("🔔 Creating notifications...");
  await prisma.notification.create({
    data: {
      userId: opsAdmin.id,
      type: "TASK_ASSIGNED",
      payload: {
        taskId: ceoTask.id,
        taskTitle: "Define Website Requirements",
        assignedBy: "John CEO",
      },
      read: true,
    },
  });

  await prisma.notification.create({
    data: {
      userId: opsStaff1.id,
      type: "TASK_ASSIGNED",
      payload: {
        taskId: hooTask.id,
        taskTitle: "Mobile App Architecture Design",
        assignedBy: "Sarah HOO",
      },
      read: false,
    },
  });

  await prisma.notification.create({
    data: {
      userId: opsStaff1.id,
      type: "TASK_ASSIGNED",
      payload: {
        taskId: pendingTask1.id,
        taskTitle: "Implement Homepage Design",
        assignedBy: "Mike OPS Admin",
      },
      read: false,
    },
  });

  await prisma.notification.create({
    data: {
      userId: opsStaff1.id,
      type: "APPROVAL_REQUIRED",
      payload: {
        taskId: pendingTask1.id,
        taskTitle: "Implement Homepage Design",
        message:
          "This task requires approval before you can start working on it",
      },
      read: false,
    },
  });

  await prisma.notification.create({
    data: {
      userId: opsStaff2.id,
      type: "APPROVED",
      payload: {
        taskId: approvedTask.id,
        taskTitle: "Setup Development Environment",
        approvedBy: "Sarah HOO",
      },
      read: false,
    },
  });

  await prisma.notification.create({
    data: {
      userId: hrStaff1.id,
      type: "REJECTED",
      payload: {
        taskId: rejectedTask.id,
        taskTitle: "Purchase New HR Software",
        rejectedBy: "Emily HR Manager",
        reason: "Budget not allocated for this quarter",
      },
      read: false,
    },
  });

  await prisma.notification.create({
    data: {
      userId: hoo.id,
      type: "MENTION",
      payload: {
        taskId: hooTask.id,
        taskTitle: "Mobile App Architecture Design",
        mentionedBy: "David OPS Staff",
        message: "can you review the database design?",
      },
      read: false,
    },
  });

  await prisma.notification.create({
    data: {
      userId: opsAdmin.id,
      type: "MENTION",
      payload: {
        taskId: pendingTask1.id,
        taskTitle: "Implement Homepage Design",
        mentionedBy: "David OPS Staff",
        message: "I need approval before I can start working on this.",
      },
      read: false,
    },
  });

  console.log("✅ Created 8 notifications");

  console.log("\n🎉 Database seeding completed successfully!");
  console.log("\n📊 Summary:");
  console.log("   - 9 Users (CEO, HOO, HR Manager, 2 Admins, 4 Staff)");
  console.log("   - 4 Projects (2 OPS, 2 HR)");
  console.log(
    "   - 12 Tasks (various statuses, 2 pending approval, 1 approved, 1 rejected)"
  );
  console.log("   - 6 Comments (with @mentions)");
  console.log("   - 10 Activity Logs");
  console.log("   - 8 Notifications");
  console.log("\n🔑 All users have password: password123");
  console.log("\n👤 Test Accounts:");
  console.log("   CEO:       ceo@company.com");
  console.log("   HOO:       hoo@company.com");
  console.log("   HR:        hr@company.com");
  console.log("   OPS Admin: ops.admin@company.com");
  console.log("   HR Admin:  hr.admin@company.com");
  console.log("   OPS Staff: ops.staff1@company.com, ops.staff2@company.com");
  console.log("   HR Staff:  hr.staff1@company.com, hr.staff2@company.com");
}

main()
  .catch((e) => {
    console.error("❌ Error during seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });

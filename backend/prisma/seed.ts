import { PrismaClient, Prisma } from "@prisma/client";
import * as bcrypt from "bcryptjs";
import * as dotenv from "dotenv";
import * as readline from "readline";

dotenv.config();

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
});

// ============================================================================
// CONFIGURATION
// ============================================================================

interface SeedConfig {
  environment: string;
  clearExistingData: boolean;
  superAdminPassword: string;
  superAdminEmails: string[];
}

const CONFIG: SeedConfig = {
  environment: process.env.NODE_ENV || "development",
  clearExistingData: process.env.CLEAR_EXISTING_DATA !== "false",
  superAdminPassword:
    process.env.SUPER_ADMIN_PASSWORD || "SuperAdmin@2025!SecurePass#MAR",
  superAdminEmails: [
    process.env.SUPER_ADMIN_1_EMAIL || "m.a.r.abuproperties6@gmail.com",
    process.env.SUPER_ADMIN_2_EMAIL || "adejaretaye33@gmail.com",
  ],
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Prompt user for confirmation in production
 */
async function confirmProduction(): Promise<boolean> {
  if (CONFIG.environment !== "production") return true;
  if (!CONFIG.clearExistingData) return true;

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(
      "\n⚠️  WARNING: Running seed in PRODUCTION with CLEAR_EXISTING_DATA=true!\n" +
        "This will DELETE ALL existing data. Type 'YES' to continue: ",
      (answer) => {
        rl.close();
        resolve(answer === "YES");
      }
    );
  });
}

/**
 * Validate configuration
 */
function validateConfig(): void {
  const errors: string[] = [];

  // Check for default password in production
  if (
    CONFIG.environment === "production" &&
    CONFIG.superAdminPassword === "password123"
  ) {
    errors.push(
      "❌ SUPER_ADMIN_PASSWORD must be changed from default in production"
    );
  }

  // Check password strength
  if (CONFIG.superAdminPassword.length < 8) {
    errors.push("❌ SUPER_ADMIN_PASSWORD must be at least 8 characters");
  }

  // Check email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  CONFIG.superAdminEmails.forEach((email, index) => {
    if (!emailRegex.test(email)) {
      errors.push(
        `❌ Invalid email format for Super Admin ${index + 1}: ${email}`
      );
    }
  });

  if (errors.length > 0) {
    console.error("\n🚨 Configuration Errors:\n");
    errors.forEach((err) => console.error(`   ${err}`));
    console.error("\n");
    process.exit(1);
  }
}

/**
 * Clear existing data with transaction safety
 */
async function clearDatabase(): Promise<void> {
  if (!CONFIG.clearExistingData) {
    return;
  }

  try {
    await prisma.$transaction(
      async (tx) => {
        // Order matters due to foreign key constraints
        await tx.notification.deleteMany();
        await tx.taskActivityLog.deleteMany();
        await tx.taskComment.deleteMany();
        await tx.timeEntry.deleteMany();
        await tx.taskAttachment.deleteMany();
        await tx.taskDependency.deleteMany();
        await tx.task.deleteMany();
        await tx.sprint.deleteMany();
        await tx.projectMember.deleteMany();
        await tx.board.deleteMany();
        await tx.workflowTransition.deleteMany();
        await tx.workflowScheme.deleteMany();
        await tx.project.deleteMany();
        await tx.user.deleteMany();
      },
      {
        timeout: 30000, // 30 second timeout
      }
    );
  } catch (error) {
    console.error("Failed to clear database:", error);
    throw error;
  }
}

/**
 * Create Super Admin accounts
 */
async function seedSuperAdmins(): Promise<void> {
  const hashedPassword = await bcrypt.hash(
    CONFIG.superAdminPassword,
    CONFIG.environment === "production" ? 12 : 10
  );

  const createdUsers: string[] = [];

  for (let i = 0; i < CONFIG.superAdminEmails.length; i++) {
    const email = CONFIG.superAdminEmails[i];

    // Check if user already exists
    const existing = await prisma.user.findUnique({
      where: { email },
    });

    if (existing) {
      continue;
    }

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash: hashedPassword,
        name: `Super Admin ${i + 1}`,
        role: "SUPER_ADMIN",
        isSuperAdmin: true,
      },
    });

    createdUsers.push(user.id);
  }

  return;
}

/**
 * Display summary and security warnings
 */
function displaySummary(): void {
  console.log("\n" + "=".repeat(60));
  console.log("📊 SEED SUMMARY");
  console.log("=".repeat(60));
  console.log(`Environment:     ${CONFIG.environment}`);
  console.log(`Data Cleared:    ${CONFIG.clearExistingData ? "YES" : "NO"}`);
  console.log("\n✅ Seeded:");
  console.log(`   - ${CONFIG.superAdminEmails.length} Super Admin account(s)`);
  console.log("\n👤 Super Admin Accounts:");
  CONFIG.superAdminEmails.forEach((email, index) => {
    console.log(`   ${index + 1}. ${email}`);
  });
  console.log("=".repeat(60));

  if (CONFIG.environment === "production") {
    console.log("\n⚠️  SECURITY REMINDERS:");
    console.log(
      "   1. Change Super Admin passwords immediately after first login"
    );
    console.log("   2. Enable 2FA for all Super Admin accounts");
    console.log("   3. Implement password rotation every 90 days");
    console.log("   4. Monitor audit logs regularly");
    console.log(
      "   5. Restrict Super Admin access to authorized personnel only"
    );
    console.log("=".repeat(60));
  }
}

// ============================================================================
// MAIN SEED FUNCTION
// ============================================================================

async function main() {
  console.log("🌱 Task Management System - Database Seed");
  console.log("=".repeat(60));

  // Validate configuration
  validateConfig();

  // Production safety check
  if (!(await confirmProduction())) {
    console.log("\n❌ Seed operation cancelled by user");
    process.exit(0);
  }

  try {
    // Execute seeding steps
    await clearDatabase();
    await seedSuperAdmins();

    // Display summary
    displaySummary();

    console.log("\n✅ Database seeding completed successfully!\n");
  } catch (error) {
    console.error("\n❌ Error during seeding:");
    console.error(error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error("\n❌ Fatal error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

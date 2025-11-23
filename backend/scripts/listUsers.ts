import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function listUsers() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        department: true,
        isActive: true,
      },
      orderBy: { email: "asc" },
    });

    console.log("\n=== USERS IN DATABASE ===\n");
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email}`);
      console.log(`   Name: ${user.name}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Department: ${user.department || "N/A"}`);
      console.log(`   Active: ${user.isActive}`);
      console.log("");
    });

    console.log(`Total users: ${users.length}\n`);
  } catch (error) {
    console.error("Error listing users:", error);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

listUsers();

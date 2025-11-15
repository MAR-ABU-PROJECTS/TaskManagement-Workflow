import dotenv from "dotenv";

dotenv.config();

interface Config {
  NODE_ENV: string;
  PORT: number;
  BASE_URL: string;
  DATABASE_URL: string;
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;
  REFRESH_TOKEN_SECRET: string;
  REFRESH_TOKEN_EXPIRES_IN: string;
  LOG_LEVEL: string;
}

const config: Config = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: parseInt(process.env.PORT || "4000", 10),
  BASE_URL: process.env.BASE_URL || "http://localhost:4000",
  DATABASE_URL: process.env.DATABASE_URL || "",
  JWT_SECRET: process.env.JWT_SECRET || "dev-jwt-secret-change-in-production",
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "1h",
  REFRESH_TOKEN_SECRET:
    process.env.REFRESH_TOKEN_SECRET ||
    "dev-refresh-secret-change-in-production",
  REFRESH_TOKEN_EXPIRES_IN: process.env.REFRESH_TOKEN_EXPIRES_IN || "7d",
  LOG_LEVEL: process.env.LOG_LEVEL || "info",
};

// Validate required environment variables
const requiredEnvVars = ["DATABASE_URL", "JWT_SECRET", "REFRESH_TOKEN_SECRET"];

if (config.NODE_ENV === "production") {
  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      throw new Error(`Missing required environment variable: ${envVar}`);
    }
  }
}

// Warn about default secrets in development
if (config.NODE_ENV === "development") {
  if (config.JWT_SECRET === "dev-jwt-secret-change-in-production") {
    console.warn(
      "⚠️  WARNING: Using default JWT_SECRET. Set JWT_SECRET in .env for security."
    );
  }
  if (
    config.REFRESH_TOKEN_SECRET === "dev-refresh-secret-change-in-production"
  ) {
    console.warn(
      "⚠️  WARNING: Using default REFRESH_TOKEN_SECRET. Set REFRESH_TOKEN_SECRET in .env for security."
    );
  }
}

export default config;

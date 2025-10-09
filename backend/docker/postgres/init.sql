-- Create database if it doesn't exist
SELECT 'CREATE DATABASE mar_abu_pm'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'mar_abu_pm')\gexec

-- Create extensions
\c mar_abu_pm;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable full-text search extension
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Create indexes for better performance
-- These will be created after Prisma migrations run
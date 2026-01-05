#!/bin/bash
# Seed script for Railway deployment
# Only runs migrations and seeds if data doesn't exist

npx prisma migrate deploy

# Check if super admin already exists before seeding
ADMIN_EXISTS=$(npx prisma db execute --stdin <<EOF
SELECT COUNT(*) as count FROM "User" WHERE "isSuperAdmin" = true LIMIT 1;
EOF
)

if echo "$ADMIN_EXISTS" | grep -q '"count":0' || echo "$ADMIN_EXISTS" | grep -q 'count.*0'; then
  echo "No super admin found. Running seed..."
  npm run seed
else
  echo "Super admin exists. Skipping seed to preserve data."
fi

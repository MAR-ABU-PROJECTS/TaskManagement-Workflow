#!/bin/bash
# One-time seed script for Railway deployment
# This will be removed after first successful run

npx prisma migrate deploy
npm run seed

#!/usr/bin/env node
require('dotenv').config();
const { spawn } = require('child_process');
const path = require('path');

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ Error: DATABASE_URL environment variable is not set');
  console.error('Please set DATABASE_URL in your .env file');
  process.exit(1);
}

console.log(`🔗 Connecting to database...`);
console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);

// Use cross-platform approach for Windows
const isWindows = process.platform === 'win32';
const command = isWindows ? 'npx.cmd' : 'npx';

const prismaStudio = spawn(command, ['prisma', 'studio', '--url', DATABASE_URL], {
  stdio: 'inherit',
  shell: isWindows
});

prismaStudio.on('close', (code) => {
  process.exit(code);
});

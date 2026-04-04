#!/usr/bin/env node

/**
 * Cross-platform startup script for ClearPath full-stack application
 * Runs both backend (Express on :3000) and frontend (Vite on :5173)
 * 
 * Usage: node start.js
 */

const { spawn } = require('child_process');
const path = require('path');

const projectRoot = __dirname;
const frontendDir = path.join(projectRoot, 'DP world');

console.log('🚀 Starting ClearPath Full Stack Application...\n');

// Backend process
const backend = spawn('nodemon', ['server.js'], {
  cwd: projectRoot,
  stdio: 'inherit',
  shell: true,
});

// Frontend process
const frontend = spawn('npm', ['run', 'dev'], {
  cwd: frontendDir,
  stdio: 'inherit',
  shell: true,
});

// Handle process termination
const exitHandler = () => {
  console.log('\n\n⚠️  Shutting down servers...');
  backend.kill();
  frontend.kill();
  process.exit(0);
};

process.on('SIGINT', exitHandler);
process.on('SIGTERM', exitHandler);

// Log startup information
setTimeout(() => {
  console.log('\n✅ Servers started:');
  console.log('   Backend:  http://localhost:3001');
  console.log('   Frontend: http://localhost:5173\n');
}, 1000);

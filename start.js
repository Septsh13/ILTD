#!/usr/bin/env node

/**
 * Cross-platform startup script for the GSN full-stack application.
 * Runs the backend API on :3001 and the React/Vite client on :5173.
 */

const { spawn } = require('child_process');
const path = require('path');

const projectRoot = __dirname;
const frontendDir = path.join(projectRoot, 'DP world');

console.log('Starting GSN full-stack application...\n');

const backend = spawn('nodemon', ['server.js'], {
  cwd: projectRoot,
  stdio: 'inherit',
  shell: true,
});

const frontend = spawn('npm', ['run', 'dev'], {
  cwd: frontendDir,
  stdio: 'inherit',
  shell: true,
});

const exitHandler = () => {
  console.log('\nShutting down GSN servers...');
  backend.kill();
  frontend.kill();
  process.exit(0);
};

process.on('SIGINT', exitHandler);
process.on('SIGTERM', exitHandler);

setTimeout(() => {
  console.log('\nGSN servers started:');
  console.log('   Backend:  http://localhost:3001');
  console.log('   Frontend: http://localhost:5173\n');
}, 1000);

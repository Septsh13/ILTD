/**
 * ClearPath — Entry Point (Restart trigger)
 * Express server with all routes mounted
 */

require('dotenv').config();

// ▲ CRITICAL: Validate environment BEFORE importing routes
// This ensures encryption keys are properly trimmed/validated
const { validateEnv } = require('./config/env');
validateEnv();

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const { testConnection } = require('./config/db');

// Routes (imported AFTER env validation)
const authRoutes = require('./routes/auth');
const chaRoutes = require('./routes/cha');
const govtRoutes = require('./routes/govt');
const cbiRoutes = require('./routes/cbi');
const complaintRoutes = require('./routes/complaints');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 3000;

// ── Security Middleware ──────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:5174', 'http://127.0.0.1:5174'],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  exposedHeaders: ['Authorization'],
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Health Check ─────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'ClearPath API', timestamp: new Date().toISOString() });
});

// ── API Routes ────────────────────────────────────────────────────────────────
app.use('/auth', authRoutes);
app.use('/cha', chaRoutes);
app.use('/govt', govtRoutes);
app.use('/cbi', cbiRoutes);
app.use('/complaints', complaintRoutes);
app.use('/admin', adminRoutes);

// ── 404 Handler ───────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ── Global Error Handler ─────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('[ERROR]', err.stack);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
  });
});

// ── Start Server ─────────────────────────────────────────────────────────────
const start = async () => {
  await testConnection();
  app.listen(PORT, '127.0.0.1', () => {
    console.log(`\n🚀 ClearPath API running on http://127.0.0.1:${PORT}`);
    console.log(`   Environment : ${process.env.NODE_ENV}`);
    console.log(`   Health check: http://127.0.0.1:${PORT}/health\n`);
  });
};

start();
//

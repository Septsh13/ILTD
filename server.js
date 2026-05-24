/**
 * GSN - Global Success Network API
 */

require('dotenv').config();

const { validateEnv } = require('./config/env');
validateEnv();

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const { testConnection } = require('./config/db');

const authRoutes = require('./routes/auth');
const networkRoutes = require('./routes/network');

const app = express();
const PORT = process.env.PORT || 3000;

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

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'GSN API', timestamp: new Date().toISOString() });
});

app.use('/auth', authRoutes);
app.use('/network', networkRoutes);

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.use((err, req, res, next) => {
  console.error('[ERROR]', err.stack);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
  });
});

const start = async () => {
  await testConnection();
  app.listen(PORT, '127.0.0.1', () => {
    console.log(`\nGSN API running on http://127.0.0.1:${PORT}`);
    console.log(`   Environment : ${process.env.NODE_ENV}`);
    console.log(`   Health check: http://127.0.0.1:${PORT}/health\n`);
  });
};

start();

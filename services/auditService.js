const { pool } = require('../config/db');

const createLog = async ({ userId, role, action, statusCode, metadata, ipAddress }) => {
  try {
    await pool.query(
      `INSERT INTO audit_logs (user_id, role, action, status_code, metadata, ip_address)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        userId || null,
        role || null,
        action,
        statusCode,
        metadata ? JSON.stringify(metadata) : null,
        ipAddress || null,
      ]
    );
  } catch (err) {
    console.error('[AUDIT] create log error:', err.message);
  }
};

module.exports = { createLog };

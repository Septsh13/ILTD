/**
 * Audit Service
 * Centralised helper for creating append-only audit log entries
 */

const { pool } = require('../config/db');

/**
 * Insert a record into audit_logs
 * This is the ONLY way audit logs are written — no updates, no deletes.
 *
 * @param {object} params
 * @param {string|null}  params.userId     - UUID of the acting user (null for public routes)
 * @param {string|null}  params.role       - user_role enum value
 * @param {string}       params.action     - e.g. 'POST /cha/shipments'
 * @param {number}       params.statusCode - HTTP response status code
 * @param {object}       [params.metadata] - Optional extra JSONB context
 * @param {string}       [params.ipAddress]
 */
const createLog = async ({ userId, role, action, statusCode, metadata = null, ipAddress = null }) => {
  try {
    await pool.query(
      `INSERT INTO audit_logs (user_id, role, action, status_code, metadata, ip_address)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [userId || null, role || null, action, statusCode, metadata ? JSON.stringify(metadata) : null, ipAddress]
    );
  } catch (err) {
    // Audit log failure must never crash the main request
    console.error('[AUDIT] Failed to write audit log:', err.message);
  }
};

module.exports = { createLog };

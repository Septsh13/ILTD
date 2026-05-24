/**
 * Admin Controller
 * All endpoints for role: ADMIN
 *
 * GET  /admin/all-complaints       — paginated list of all complaints
 * GET  /admin/audit-logs           — paginated audit log viewer
 * GET  /admin/users                — list all non-admin users
 * GET  /admin/summary              — dashboard metrics
 * POST /admin/flag-user            — flag or unflag a user account
 * GET  /admin/complaints/:id/decrypt — decrypt complainant identity (admin-only)
 */

const { pool } = require('../config/db');
const { decryptIdentity } = require('../services/encryptionService');

// ── All Complaints ────────────────────────────────────────────────────────────
const getAllComplaints = async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  try {
    let query = `
      SELECT c.id, c.tracking_token, c.subject, c.status, c.admin_notes,
             c.related_user_id, u.full_name AS related_user_name,
             u.employee_id AS related_user_emp_id, c.created_at, c.updated_at
      FROM complaints c
      LEFT JOIN users u ON u.id = c.related_user_id
    `;
    const params = [];

    if (status) {
      params.push(status.toUpperCase());
      query += ` WHERE c.status = $${params.length}`;
    }

    query += ` ORDER BY c.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(parseInt(limit), offset);

    const { rows } = await pool.query(query, params);

    // Count
    let countQuery = 'SELECT COUNT(*) FROM complaints';
    const countParams = [];
    if (status) {
      countParams.push(status.toUpperCase());
      countQuery += ' WHERE status = $1';
    }
    const { rows: countRows } = await pool.query(countQuery, countParams);

    return res.status(200).json({
      total:      parseInt(countRows[0].count),
      page:       parseInt(page),
      limit:      parseInt(limit),
      complaints: rows,
    });
  } catch (err) {
    console.error('[ADMIN] getAllComplaints error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

// ── Audit Logs ────────────────────────────────────────────────────────────────
const getAuditLogs = async (req, res) => {
  const { user_id, action, role, page = 1, limit = 50 } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  try {
    const conditions = [];
    const params     = [];

    if (user_id) { params.push(user_id);           conditions.push(`al.user_id = $${params.length}`); }
    if (role)    { params.push(role.toUpperCase()); conditions.push(`al.role = $${params.length}`);    }
    if (action)  { params.push(`%${action}%`);      conditions.push(`al.action ILIKE $${params.length}`); }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const query = `
      SELECT al.*, u.full_name, u.employee_id
      FROM audit_logs al
      LEFT JOIN users u ON u.id = al.user_id
      ${where}
      ORDER BY al.created_at DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;
    params.push(parseInt(limit), offset);

    const { rows } = await pool.query(query, params);

    return res.status(200).json({
      page:       parseInt(page),
      limit:      parseInt(limit),
      audit_logs: rows,
    });
  } catch (err) {
    console.error('[ADMIN] getAuditLogs error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

// ── Flag / Unflag User ────────────────────────────────────────────────────────
const flagUser = async (req, res) => {
  const { user_id, flag, reason } = req.body;
  // flag: true = flag the user, false = unflag

  // Prevent admin from flagging themselves
  if (user_id === req.user.id) {
    return res.status(400).json({ error: 'You cannot flag your own account.' });
  }

  try {
    const { rows } = await pool.query(
      `UPDATE users
       SET is_flagged = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING id, employee_id, full_name, role, is_flagged`,
      [flag === true || flag === 'true', user_id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }

    return res.status(200).json({
      message: rows[0].is_flagged ? 'User flagged successfully.' : 'User unflagged successfully.',
      user:    rows[0],
      reason:  reason || null,
    });
  } catch (err) {
    console.error('[ADMIN] flagUser error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

// ── Users ─────────────────────────────────────────────────────────────────────
const getAllUsers = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, employee_id, full_name, role, is_active, is_flagged, created_at
       FROM users
       WHERE role != 'ADMIN'
       ORDER BY created_at DESC`
    );

    // To provide a complaint count for each user (for AdminUsers.jsx)
    const { rows: statsRows } = await pool.query(`
      SELECT related_user_id, COUNT(*) as count 
      FROM complaints 
      GROUP BY related_user_id
    `);

    const users = rows.map(u => {
      const p = statsRows.find(s => s.related_user_id === u.id);
      return {
        ...u,
        complaints_count: p ? parseInt(p.count) : 0,
      };
    });

    return res.status(200).json({ users });
  } catch (err) {
    console.error('[ADMIN] getAllUsers error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

// ── Dashboard Summary ─────────────────────────────────────────────────────────
const getAdminSummary = async (req, res) => {
  try {
    const totalUsers = await pool.query(`SELECT COUNT(*) FROM users WHERE role != 'ADMIN'`);
    const activeComplaints = await pool.query(`SELECT COUNT(*) FROM complaints WHERE status NOT IN ('RESOLVED', 'CLOSED')`);
    const flaggedUsers = await pool.query(`SELECT COUNT(*) FROM users WHERE is_flagged = TRUE`);
    const totalShipments = await pool.query(`SELECT COUNT(*) FROM shipments`);

    return res.status(200).json({
      metrics: {
        totalUsers: parseInt(totalUsers.rows[0].count),
        activeComplaints: parseInt(activeComplaints.rows[0].count),
        flaggedUsers: parseInt(flaggedUsers.rows[0].count),
        totalShipments: parseInt(totalShipments.rows[0].count),
      }
    });
  } catch (err) {
    console.error('[ADMIN] getAdminSummary error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

// ── Decrypt Complaint Identity (Admin-Only) ───────────────────────────────────
const getComplaintDecrypted = async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ error: 'complaint_id is required.' });
  }

  try {
    // Get complaint details
    const { rows: complaintRows } = await pool.query(
      `SELECT id, tracking_token, subject, status, admin_notes, created_at, updated_at
       FROM complaints
       WHERE id = $1`,
      [id]
    );

    if (complaintRows.length === 0) {
      return res.status(404).json({ error: 'Complaint not found.' });
    }

    const complaint = complaintRows[0];

    // Get encrypted identity
    const { rows: identityRows } = await pool.query(
      `SELECT encrypted_name, encrypted_email, encrypted_phone, iv
       FROM complaint_identity
       WHERE complaint_id = $1`,
      [id]
    );

    if (identityRows.length === 0) {
      return res.status(404).json({ error: 'Complaint identity not found.' });
    }

    const encryptedRecord = identityRows[0];

    // Decrypt the identity using the encryption service
    const decryptedIdentity = decryptIdentity({
      encrypted_name: encryptedRecord.encrypted_name,
      encrypted_email: encryptedRecord.encrypted_email,
      encrypted_phone: encryptedRecord.encrypted_phone,
      iv: encryptedRecord.iv,
    });

    // Return decrypted complaint details (admin eyes only!)
    return res.status(200).json({
      id: complaint.id,
      tracking_token: complaint.tracking_token,
      subject: complaint.subject,
      status: complaint.status,
      admin_notes: complaint.admin_notes,
      created_at: complaint.created_at,
      updated_at: complaint.updated_at,
      decrypted_identity: {
        name: decryptedIdentity.name,
        email: decryptedIdentity.email,
        phone: decryptedIdentity.phone,
      },
      _security_note: '🔐 This data has been decrypted. Log this access for audit purposes.',
    });
  } catch (err) {
    console.error('[ADMIN] getComplaintDecrypted error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

module.exports = { getAllComplaints, getAuditLogs, flagUser, getAllUsers, getAdminSummary, getComplaintDecrypted };

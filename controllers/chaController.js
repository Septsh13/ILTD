/**
 * CHA Controller
 * All endpoints for role: CHA_AGENT
 * GET  /cha/shipments       — list shipments visible to CHA
 */

const { pool } = require('../config/db');

// ── Dashboard Summary ────────────────────────────────────────────────────────
const getChaSummary = async (req, res) => {
  try {
    const totalShipments = await pool.query(`SELECT COUNT(*) FROM shipments`);
    const pendingShipments = await pool.query(`SELECT COUNT(*) FROM shipments WHERE status = 'PENDING'`);
    const approvedShipments = await pool.query(`SELECT COUNT(*) FROM shipments WHERE status = 'APPROVED'`);
    const rejectedShipments = await pool.query(`SELECT COUNT(*) FROM shipments WHERE status = 'REJECTED'`);

    const { rows: recentActivity } = await pool.query(`
      SELECT id as tracking_number, status, updated_at 
      FROM shipments 
      ORDER BY updated_at DESC LIMIT 5
    `);

    return res.status(200).json({
      metrics: {
        totalShipments: parseInt(totalShipments.rows[0].count),
        pendingShipments: parseInt(pendingShipments.rows[0].count),
        approvedShipments: parseInt(approvedShipments.rows[0].count),
        rejectedShipments: parseInt(rejectedShipments.rows[0].count),
      },
      recentActivity
    });
  } catch (err) {
    console.error('[CHA] getChaSummary error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

// ── List Shipments ────────────────────────────────────────────────────────────
const getShipments = async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  try {
    let query = `
      SELECT s.id as shipment_id, s.title, s.status, s.remarks, s.is_cha_accepted, c.status as complaint_status, c.cbi_message, sr.id as review_id
      FROM shipments s
      LEFT JOIN complaints c ON c.shipment_id = s.id
      LEFT JOIN shipment_reviews sr ON sr.shipment_id = s.id
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      params.push(status.toUpperCase());
      query += ` AND s.status = $${params.length}`;
    }

    query += ` ORDER BY s.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(parseInt(limit), offset);

    const { rows } = await pool.query(query, params);

    // Total count
    let countQuery = `SELECT COUNT(*) FROM shipments WHERE 1=1`;
    const countParams = [];
    if (status) {
      countParams.push(status.toUpperCase());
      countQuery += ` AND status = $1`;
    }
    const { rows: countRows } = await pool.query(countQuery, countParams);

    return res.status(200).json({
      total:     parseInt(countRows[0].count),
      page:      parseInt(page),
      limit:     parseInt(limit),
      shipments: rows,
    });
  } catch (err) {
    console.error('[CHA] getShipments error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

// ── Accept Shipment Decision ──────────────────────────────────────────────────
const acceptShipmentDecision = async (req, res) => {
  const { shipment_id } = req.body;
  try {
    const { rows } = await pool.query(
      `UPDATE shipments SET is_cha_accepted = TRUE, updated_at = NOW() WHERE id = $1 RETURNING *`,
      [shipment_id]
    );

    if (rows.length === 0) return res.status(404).json({ error: 'Shipment not found.' });

    return res.status(200).json({ message: 'Decision accepted.', shipment: rows[0] });
  } catch (err) {
    console.error('[CHA] acceptShipmentDecision error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

// ── Submit General Issue ──────────────────────────────────────────────────────
const submitGeneralIssue = async (req, res) => {
  const { shipment_id, message } = req.body;
  const currentUserId = req.user.id;
  try {
    const { rows } = await pool.query(
      `INSERT INTO shipment_reviews (shipment_id, message, created_by)
       VALUES ($1, $2, $3) RETURNING *`,
      [shipment_id, message, currentUserId]
    );
    return res.status(201).json({ message: 'General issue reported to admins successfully.', review: rows[0] });
  } catch (err) {
    console.error('[CHA] submitGeneralIssue error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

module.exports = { getChaSummary, getShipments, acceptShipmentDecision, submitGeneralIssue };

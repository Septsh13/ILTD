/**
 * Govt Controller
 * All endpoints for role: GOVT_OFFICIAL
 *
 * GET  /govt/shipments      — list shipments
 * PUT  /govt/shipments/:id  — approve or reject shipment
 */

const { pool } = require('../config/db');

// ── Dashboard Summary ────────────────────────────────────────────────────────
const getGovtSummary = async (req, res) => {
  try {
    const pendingShipments = await pool.query(`SELECT COUNT(*) FROM shipments WHERE status = 'PENDING'`);
    const approvedShipments = await pool.query(`SELECT COUNT(*) FROM shipments WHERE status = 'APPROVED'`);
    const rejectedShipments = await pool.query(`SELECT COUNT(*) FROM shipments WHERE status = 'REJECTED'`);
    
    // We get the recently updated shipments where decision was possibly made
    const { rows: recentActivity } = await pool.query(`
      SELECT id, title, status, updated_at 
      FROM shipments 
      ORDER BY updated_at DESC LIMIT 5
    `);

    return res.status(200).json({
      metrics: {
        pendingShipments: parseInt(pendingShipments.rows[0].count),
        approvedShipments: parseInt(approvedShipments.rows[0].count),
        rejectedShipments: parseInt(rejectedShipments.rows[0].count),
        totalProcessed: parseInt(approvedShipments.rows[0].count) + parseInt(rejectedShipments.rows[0].count),
      },
      recentActivity
    });
  } catch (err) {
    console.error('[GOVT] getGovtSummary error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

// ── Get Shipments ─────────────────────────────────────────────────────────────
const getShipments = async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  try {
    let query = `
      SELECT s.*, u.full_name AS created_by_name
      FROM shipments s
      JOIN users u ON u.id = s.created_by
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

    return res.status(200).json({
      page:      parseInt(page),
      limit:     parseInt(limit),
      shipments: rows,
    });
  } catch (err) {
    console.error('[GOVT] getShipments error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

// ── Approve/Reject Shipment ───────────────────────────────────────────────────
const decideShipment = async (req, res) => {
  const { id } = req.params;
  const { decision, remarks } = req.body;
  const currentUserId = req.user.id;

  try {
    const { rows: shipRows } = await pool.query(
      `SELECT id, status FROM shipments WHERE id = $1`,
      [id]
    );

    if (shipRows.length === 0) {
      return res.status(404).json({ error: 'Shipment not found.' });
    }

    if (shipRows[0].status !== 'PENDING') {
      return res.status(409).json({ error: `Shipment is already ${shipRows[0].status}.` });
    }

    const { rows } = await pool.query(
      `UPDATE shipments 
       SET status = $1::shipment_status, decision = $1, remarks = $2, approved_by = $3, updated_at = NOW() 
       WHERE id = $4
       RETURNING *`,
      [decision, remarks || null, currentUserId, id]
    );

    return res.status(200).json({
      message: `Shipment ${decision.toLowerCase()}.`,
      shipment: rows[0],
    });
  } catch (err) {
    console.error('[GOVT] decideShipment error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

module.exports = { getGovtSummary, getShipments, decideShipment };

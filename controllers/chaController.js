/**
 * CHA Controller
 * All endpoints for role: CHA_AGENT
 *
 * POST /cha/shipments       — create shipment
 * GET  /cha/shipments       — list own shipments
 * POST /cha/documents       — attach document to shipment
 * POST /cha/interactions    — log interaction with govt official
 * POST /cha/mark-suspicious — flag a shipment as suspicious
 */

const { v4: uuidv4 } = require('uuid');
const { pool } = require('../config/db');

// ── Dashboard Summary ────────────────────────────────────────────────────────
const getChaSummary = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const activeShipments = await pool.query(`SELECT COUNT(*) FROM shipments WHERE cha_user_id = $1 AND status NOT IN ('APPROVED', 'REJECTED')`, [userId]);
    const pendingSla = await pool.query(`SELECT COUNT(*) FROM shipments WHERE cha_user_id = $1 AND status = 'PENDING'`, [userId]);
    const suspiciousFlags = await pool.query(`SELECT COUNT(*) FROM shipments WHERE cha_user_id = $1 AND is_suspicious = TRUE`, [userId]);
    const clearedToday = await pool.query(`SELECT COUNT(*) FROM shipments WHERE cha_user_id = $1 AND status = 'APPROVED' AND updated_at >= CURRENT_DATE`, [userId]);

    const { rows: recentActivity } = await pool.query(`
      SELECT tracking_number, status, updated_at 
      FROM shipments 
      WHERE cha_user_id = $1 
      ORDER BY updated_at DESC LIMIT 5
    `, [userId]);

    return res.status(200).json({
      metrics: {
        activeShipments: parseInt(activeShipments.rows[0].count),
        pendingSla: parseInt(pendingSla.rows[0].count),
        suspiciousFlags: parseInt(suspiciousFlags.rows[0].count),
        clearedToday: parseInt(clearedToday.rows[0].count),
      },
      recentActivity
    });
  } catch (err) {
    console.error('[CHA] getChaSummary error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

// ── Create Shipment ───────────────────────────────────────────────────────────
const createShipment = async (req, res) => {
  const {
    shipper_name,
    consignee_name,
    origin_port,
    destination_port,
    cargo_description,
    gross_weight_kg,
  } = req.body;

  const tracking_number = `CLP-${Date.now()}-${uuidv4().slice(0, 6).toUpperCase()}`;

  try {
    const { rows } = await pool.query(
      `INSERT INTO shipments
         (cha_user_id, tracking_number, shipper_name, consignee_name,
          origin_port, destination_port, cargo_description, gross_weight_kg)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       RETURNING *`,
      [
        req.user.id,
        tracking_number,
        shipper_name,
        consignee_name,
        origin_port,
        destination_port,
        cargo_description || null,
        gross_weight_kg   || null,
      ]
    );

    return res.status(201).json({
      message: 'Shipment created successfully.',
      shipment: rows[0],
    });
  } catch (err) {
    console.error('[CHA] createShipment error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

// ── List Own Shipments ────────────────────────────────────────────────────────
const getShipments = async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  try {
    let query = `SELECT * FROM shipments WHERE cha_user_id = $1`;
    const params = [req.user.id];

    if (status) {
      params.push(status.toUpperCase());
      query += ` AND status = $${params.length}`;
    }

    query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(parseInt(limit), offset);

    const { rows } = await pool.query(query, params);

    // Total count
    const countParams = [req.user.id];
    let countQuery = `SELECT COUNT(*) FROM shipments WHERE cha_user_id = $1`;
    if (status) {
      countParams.push(status.toUpperCase());
      countQuery += ` AND status = $2`;
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

// ── Add Document ──────────────────────────────────────────────────────────────
const addDocument = async (req, res) => {
  const { shipment_id, document_type, file_name, file_url, assigned_to } = req.body;

  try {
    // Verify shipment belongs to this CHA agent
    const { rows: shipRows } = await pool.query(
      'SELECT id FROM shipments WHERE id = $1 AND cha_user_id = $2',
      [shipment_id, req.user.id]
    );

    if (shipRows.length === 0) {
      return res.status(404).json({ error: 'Shipment not found or not owned by you.' });
    }

    // Validate assigned_to is a GOVT_OFFICIAL if provided
    if (assigned_to) {
      const { rows: govtRows } = await pool.query(
        `SELECT id FROM users WHERE id = $1 AND role = 'GOVT_OFFICIAL' AND is_active = TRUE`,
        [assigned_to]
      );
      if (govtRows.length === 0) {
        return res.status(400).json({ error: 'assigned_to must be a valid active GOVT_OFFICIAL user ID.' });
      }
    }

    const { rows } = await pool.query(
      `INSERT INTO documents
         (shipment_id, uploaded_by, document_type, file_name, file_url, assigned_to)
       VALUES ($1,$2,$3,$4,$5,$6)
       RETURNING *`,
      [shipment_id, req.user.id, document_type, file_name, file_url, assigned_to || null]
    );

    return res.status(201).json({
      message: 'Document added successfully.',
      document: rows[0],
    });
  } catch (err) {
    console.error('[CHA] addDocument error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

// ── Log Interaction ───────────────────────────────────────────────────────────
const logInteraction = async (req, res) => {
  const { govt_user_id, shipment_id, subject, message } = req.body;

  try {
    // Verify govt_user_id is a GOVT_OFFICIAL
    const { rows: govtRows } = await pool.query(
      `SELECT id FROM users WHERE id = $1 AND role = 'GOVT_OFFICIAL'`,
      [govt_user_id]
    );
    if (govtRows.length === 0) {
      return res.status(400).json({ error: 'govt_user_id must reference a valid GOVT_OFFICIAL.' });
    }

    const { rows } = await pool.query(
      `INSERT INTO interactions (cha_user_id, govt_user_id, shipment_id, subject, message)
       VALUES ($1,$2,$3,$4,$5)
       RETURNING *`,
      [req.user.id, govt_user_id, shipment_id || null, subject, message]
    );

    return res.status(201).json({
      message: 'Interaction logged successfully.',
      interaction: rows[0],
    });
  } catch (err) {
    console.error('[CHA] logInteraction error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

// ── Mark Suspicious ───────────────────────────────────────────────────────────
const markSuspicious = async (req, res) => {
  const { shipment_id, note } = req.body;

  try {
    const { rows } = await pool.query(
      `UPDATE shipments
       SET is_suspicious = TRUE, suspicious_note = $1, status = 'SUSPICIOUS', updated_at = NOW()
       WHERE id = $2 AND cha_user_id = $3
       RETURNING *`,
      [note || null, shipment_id, req.user.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Shipment not found or not owned by you.' });
    }

    return res.status(200).json({
      message: 'Shipment marked as suspicious.',
      shipment: rows[0],
    });
  } catch (err) {
    console.error('[CHA] markSuspicious error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

module.exports = { getChaSummary, createShipment, getShipments, addDocument, logInteraction, markSuspicious };

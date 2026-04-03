/**
 * Govt Controller
 * All endpoints for role: GOVT_OFFICIAL
 *
 * GET  /govt/assigned-documents — list documents assigned to this official
 * POST /govt/approve            — approve a document
 * POST /govt/reject             — reject with a predefined reason
 */

const { pool } = require('../config/db');

// Allowed rejection reasons (must match DB ENUM)
const VALID_REJECTION_REASONS = [
  'INCOMPLETE_DOCUMENTATION',
  'POLICY_VIOLATION',
  'DUPLICATE_SUBMISSION',
  'FRAUDULENT_CLAIM',
  'MISSING_SIGNATURE',
];

// ── Dashboard Summary ────────────────────────────────────────────────────────
const getGovtSummary = async (req, res) => {
  try {
    const userId = req.user.id;

    const pendingDocs = await pool.query(`SELECT COUNT(*) FROM documents WHERE assigned_to = $1 AND status = 'PENDING'`, [userId]);
    const approvedDocs = await pool.query(`SELECT COUNT(*) FROM documents WHERE assigned_to = $1 AND status = 'APPROVED'`, [userId]);
    const rejectedDocs = await pool.query(`SELECT COUNT(*) FROM documents WHERE assigned_to = $1 AND status = 'REJECTED'`, [userId]);
    const totalProcessed = await pool.query(`SELECT COUNT(*) FROM documents WHERE assigned_to = $1 AND status != 'PENDING'`, [userId]);

    const { rows: recentActivity } = await pool.query(`
      SELECT d.id, d.document_type, d.status, d.updated_at, s.tracking_number 
      FROM documents d
      JOIN shipments s ON s.id = d.shipment_id
      WHERE d.assigned_to = $1
      ORDER BY d.updated_at DESC LIMIT 5
    `, [userId]);

    return res.status(200).json({
      metrics: {
        pendingDocs: parseInt(pendingDocs.rows[0].count),
        approvedDocs: parseInt(approvedDocs.rows[0].count),
        rejectedDocs: parseInt(rejectedDocs.rows[0].count),
        totalProcessed: parseInt(totalProcessed.rows[0].count),
      },
      recentActivity
    });
  } catch (err) {
    console.error('[GOVT] getGovtSummary error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

// ── Get Assigned Documents ────────────────────────────────────────────────────
const getAssignedDocuments = async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  try {
    let query = `
      SELECT d.*, s.tracking_number, s.shipper_name, s.consignee_name,
             u.full_name AS uploaded_by_name, u.employee_id AS uploaded_by_emp_id
      FROM documents d
      JOIN shipments s ON s.id = d.shipment_id
      JOIN users u ON u.id = d.uploaded_by
      WHERE d.assigned_to = $1
    `;
    const params = [req.user.id];

    if (status) {
      params.push(status.toUpperCase());
      query += ` AND d.status = $${params.length}`;
    }

    query += ` ORDER BY d.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(parseInt(limit), offset);

    const { rows } = await pool.query(query, params);

    return res.status(200).json({
      page:      parseInt(page),
      limit:     parseInt(limit),
      documents: rows,
    });
  } catch (err) {
    console.error('[GOVT] getAssignedDocuments error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

// ── Approve Document ──────────────────────────────────────────────────────────
const approveDocument = async (req, res) => {
  const { document_id, notes } = req.body;

  try {
    // Verify document is assigned to this official and is PENDING
    const { rows: docRows } = await pool.query(
      `SELECT id, status FROM documents WHERE id = $1 AND assigned_to = $2`,
      [document_id, req.user.id]
    );

    if (docRows.length === 0) {
      return res.status(404).json({ error: 'Document not found or not assigned to you.' });
    }

    if (docRows[0].status !== 'PENDING') {
      return res.status(409).json({ error: `Document is already ${docRows[0].status}.` });
    }

    // Update document status
    await pool.query(
      `UPDATE documents SET status = 'APPROVED', updated_at = NOW() WHERE id = $1`,
      [document_id]
    );

    // Record action
    const { rows } = await pool.query(
      `INSERT INTO document_actions (document_id, acted_by, action, notes)
       VALUES ($1, $2, 'APPROVED', $3)
       RETURNING *`,
      [document_id, req.user.id, notes || null]
    );

    return res.status(200).json({
      message: 'Document approved.',
      action: rows[0],
    });
  } catch (err) {
    console.error('[GOVT] approveDocument error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

// ── Reject Document ───────────────────────────────────────────────────────────
const rejectDocument = async (req, res) => {
  const { document_id, rejection_reason, notes } = req.body;

  // Enforce predefined reasons — no bypass allowed
  if (!VALID_REJECTION_REASONS.includes(rejection_reason)) {
    return res.status(400).json({
      error: 'Invalid rejection reason.',
      allowed_reasons: VALID_REJECTION_REASONS,
    });
  }

  try {
    const { rows: docRows } = await pool.query(
      `SELECT id, status FROM documents WHERE id = $1 AND assigned_to = $2`,
      [document_id, req.user.id]
    );

    if (docRows.length === 0) {
      return res.status(404).json({ error: 'Document not found or not assigned to you.' });
    }

    if (docRows[0].status !== 'PENDING') {
      return res.status(409).json({ error: `Document is already ${docRows[0].status}.` });
    }

    await pool.query(
      `UPDATE documents SET status = 'REJECTED', updated_at = NOW() WHERE id = $1`,
      [document_id]
    );

    const { rows } = await pool.query(
      `INSERT INTO document_actions (document_id, acted_by, action, rejection_reason, notes)
       VALUES ($1, $2, 'REJECTED', $3, $4)
       RETURNING *`,
      [document_id, req.user.id, rejection_reason, notes || null]
    );

    return res.status(200).json({
      message: 'Document rejected.',
      action: rows[0],
    });
  } catch (err) {
    console.error('[GOVT] rejectDocument error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

module.exports = { getGovtSummary, getAssignedDocuments, approveDocument, rejectDocument };

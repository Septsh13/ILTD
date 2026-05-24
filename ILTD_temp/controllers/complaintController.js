/**
 * Complaint Controller
 * Public endpoints — no authentication required
 *
 * POST /complaints        — submit an anonymous complaint (encrypted + sent to Formspree)
 * GET  /complaints/status — check complaint status by tracking token
 */

const crypto = require('crypto');
const axios = require('axios');
const { pool } = require('../config/db');
const { encryptIdentity, decryptIdentity } = require('../services/encryptionService');
const { notifyAllTeamsAboutComplaint } = require('../services/notificationService');

// Formspree endpoint
const FORMSPREE_ENDPOINT = 'https://formspree.io/f/xojpkeap';

// ── Submit Complaint ──────────────────────────────────────────────────────────
const submitComplaint = async (req, res) => {
  const {
    subject,
    description,
    related_user_id,
    // Complainant identity (encrypted before storage)
    complainant_name,
    complainant_email,
    complainant_phone,
  } = req.body;

  // Generate a unique tracking token for the complainant to check status
  const tracking_token = crypto.randomBytes(32).toString('hex');

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Validate related_user_id if provided
    if (related_user_id) {
      const { rows } = await client.query(
        'SELECT id FROM users WHERE id = $1',
        [related_user_id]
      );
      if (rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'related_user_id does not exist.' });
      }
    }

    // Insert complaint
    const { rows: complaintRows } = await client.query(
      `INSERT INTO complaints (tracking_token, subject, description, related_user_id)
       VALUES ($1, $2, $3, $4)
       RETURNING id, tracking_token, status, created_at`,
      [tracking_token, subject, description, related_user_id || null]
    );

    const complaint = complaintRows[0];

    // Encrypt and store complainant identity
    const { encryptedName, encryptedEmail, encryptedPhone, iv } = encryptIdentity({
      name:  complainant_name,
      email: complainant_email,
      phone: complainant_phone || null,
    });

    await client.query(
      `INSERT INTO complaint_identity (complaint_id, encrypted_name, encrypted_email, encrypted_phone, iv)
       VALUES ($1, $2, $3, $4, $5)`,
      [complaint.id, encryptedName, encryptedEmail, encryptedPhone, iv]
    );

    await client.query('COMMIT');

    // ── Send encrypted email to Formspree (non-blocking, fire-and-forget) ────
    try {
      await axios.post(FORMSPREE_ENDPOINT, {
        encrypted_name: encryptedName,
        tracking_token: tracking_token,
        subject: subject,
        complaint_description: description,
        related_user_id: related_user_id || 'ANONYMOUS',
        submitted_at: complaint.created_at,
        // Use encrypted email for admin contact purposes
        encrypted_email: encryptedEmail,
      }, {
        timeout: 5000, // 5 second timeout
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        }
      });
      console.log(`[COMPLAINT] Encrypted email sent to Formspree for tracking token: ${tracking_token}`);
    } catch (formspreeErr) {
      // Log but don't fail the complaint submission
      console.error('[COMPLAINT] Formspree email send failed:', formspreeErr.message);
      // Complaint was already saved to DB, so this is non-critical
    }

    return res.status(201).json({
      message: 'Complaint submitted successfully. Save your tracking token — it cannot be recovered.',
      tracking_token: complaint.tracking_token,
      status:         complaint.status,
      submitted_at:   complaint.created_at,
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[COMPLAINT] submitComplaint error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  } finally {
    client.release();
  }
};

// ── Get Complaint Status ──────────────────────────────────────────────────────
const getComplaintStatus = async (req, res) => {
  const { tracking_token } = req.query;

  if (!tracking_token) {
    return res.status(400).json({ error: 'tracking_token query parameter is required.' });
  }

  try {
    const { rows } = await pool.query(
      `SELECT id, tracking_token, subject, status, admin_notes, created_at, updated_at
       FROM complaints
       WHERE tracking_token = $1`,
      [tracking_token]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Complaint not found. Check your tracking token.' });
    }

    const c = rows[0];
    return res.status(200).json({
      id:           c.id,
      subject:      c.subject,
      status:       c.status,
      admin_notes:  c.admin_notes,
      submitted_at: c.created_at,
      updated_at:   c.updated_at,
    });
  } catch (err) {
    console.error('[COMPLAINT] getComplaintStatus error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

module.exports = { submitComplaint, getComplaintStatus };

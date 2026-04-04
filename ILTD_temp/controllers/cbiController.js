/**
 * CBI Controller (Complaints Bureau of Investigation)
 * Role: CBI - Can view and investigate complaints WITHOUT seeing identity
 *
 * GET  /cbi/complaints        — paginated list of all complaints (anonymized)
 * GET  /cbi/complaints/:id    — complaint details (without identity)
 * PUT  /cbi/complaints/:id    — update status & investigative notes
 */

const { pool } = require('../config/db');

// ── Get All Complaints (CBI View - Anonymized) ─────────────────────────────────
const getAllComplaints = async (req, res) => {
  const { status, page = 1, limit = 20, assigned_to_me } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);
  const currentUserId = req.user.id; // From JWT middleware

  try {
    let query = `
      SELECT c.id, c.tracking_token, c.subject, c.description, 
             c.status, c.cbi_assigned_to, c.cbi_message, 
             c.created_at, c.updated_at,
             u.full_name AS assigned_to_name, u.employee_id AS assigned_to_emp_id
      FROM complaints c
      LEFT JOIN users u ON u.id = c.cbi_assigned_to
    `;
    const params = [];

    // Filter by status if provided
    if (status && status.toUpperCase() !== 'ALL') {
      params.push(status.toUpperCase());
      query += ` WHERE c.status = $${params.length}`;
    } else {
      query += ` WHERE TRUE`;
    }

    // Filter: Only complaints assigned to me
    if (assigned_to_me === 'true') {
      params.push(currentUserId);
      query += ` AND c.cbi_assigned_to = $${params.length}`;
    }

    // Pagination
    query += ` ORDER BY c.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(parseInt(limit), offset);

    const { rows } = await pool.query(query, params);

    // Count for pagination
    let countQuery = `SELECT COUNT(*) FROM complaints c WHERE TRUE`;
    const countParams = [];
    if (status && status.toUpperCase() !== 'ALL') {
      countParams.push(status.toUpperCase());
      countQuery += ` AND c.status = $${countParams.length}`;
    }
    if (assigned_to_me === 'true') {
      countParams.push(currentUserId);
      countQuery += ` AND c.cbi_assigned_to = $${countParams.length}`;
    }

    const { rows: countRows } = await pool.query(countQuery, countParams);

    return res.status(200).json({
      total: parseInt(countRows[0].count),
      page: parseInt(page),
      limit: parseInt(limit),
      complaints: rows.map((c) => ({
        id: c.id,
        tracking_token: c.tracking_token, // Unique identifier
        subject: c.subject,
        description: c.description,
        status: c.status,
        cbi_assigned_to: c.cbi_assigned_to,
        assigned_to_name: c.assigned_to_name,
        assigned_to_emp_id: c.assigned_to_emp_id,
        cbi_message: c.cbi_message, // Investigative notes (CBI-only)
        created_at: c.created_at,
        updated_at: c.updated_at,
        // NOTE: encrypted_name is INTENTIONALLY NOT returned
        // This field is only accessible via /admin/complaints/:id/decrypt
      })),
    });
  } catch (err) {
    console.error('[CBI] getAllComplaints error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

// ── Get One Complaint (CBI View - Without Identity) ──────────────────────────────
const getComplaint = async (req, res) => {
  const { id } = req.params;
  const currentUserId = req.user.id;

  if (!id) {
    return res.status(400).json({ error: 'complaint_id is required.' });
  }

  try {
    const { rows } = await pool.query(
      `SELECT id, tracking_token, subject, description, related_user_id, 
              status, cbi_assigned_to, cbi_message, admin_notes, 
              created_at, updated_at
       FROM complaints
       WHERE id = $1`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Complaint not found.' });
    }

    const complaint = rows[0];

    // Authorization: CBI can only fully view complaints assigned to them
    // But CBI can see ALL complaints in read-only mode (status, description only)
    const canFullyView = complaint.cbi_assigned_to === currentUserId || !complaint.cbi_assigned_to;

    return res.status(200).json({
      id: complaint.id,
      tracking_token: complaint.tracking_token,
      subject: complaint.subject,
      description: complaint.description,
      related_user_id: complaint.related_user_id,
      status: complaint.status,
      cbi_assigned_to: complaint.cbi_assigned_to,
      cbi_message: complaint.cbi_message,
      admin_notes: null, // CBI cannot see admin notes
      created_at: complaint.created_at,
      updated_at: complaint.updated_at,
      _permissions: {
        can_edit: canFullyView,
        can_change_status: canFullyView,
        can_see_identity: false, // ← CBI can NEVER see identity
      },
      // NOTE: encrypted_name NOT returned
    });
  } catch (err) {
    console.error('[CBI] getComplaint error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

// ── Update Complaint Status & CBI Message ──────────────────────────────────────
const updateComplaint = async (req, res) => {
  const { id } = req.params;
  const { status, cbi_message } = req.body;
  const currentUserId = req.user.id;

  if (!id) {
    return res.status(400).json({ error: 'complaint_id is required.' });
  }

  // Validate status if provided
  const validStatuses = ['OPEN', 'UNDER_REVIEW', 'RESOLVED', 'CLOSED'];
  if (status && !validStatuses.includes(status.toUpperCase())) {
    return res.status(400).json({ error: 'Invalid complaint status.' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Get current complaint
    const { rows: complaintRows } = await client.query(
      `SELECT id, cbi_assigned_to FROM complaints WHERE id = $1`,
      [id]
    );

    if (complaintRows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Complaint not found.' });
    }

    const complaint = complaintRows[0];

    // Authorization: Can only update if assigned to me OR unassigned
    if (complaint.cbi_assigned_to && complaint.cbi_assigned_to !== currentUserId) {
      await client.query('ROLLBACK');
      return res.status(403).json({ error: 'You are not assigned to this complaint.' });
    }

    // Build update query
    const updateFields = [];
    const updateParams = [];
    let paramCount = 1;

    // Auto-assign if not assigned and updating
    if (!complaint.cbi_assigned_to && (status || cbi_message)) {
      updateFields.push(`cbi_assigned_to = $${paramCount++}`);
      updateParams.push(currentUserId);
    }

    if (status) {
      updateFields.push(`status = $${paramCount++}`);
      updateParams.push(status.toUpperCase());
    }

    if (cbi_message !== undefined) {
      updateFields.push(`cbi_message = $${paramCount++}`);
      updateParams.push(cbi_message || null);
    }

    if (updateFields.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'No fields to update.' });
    }

    updateParams.push(id);
    const updateQuery = `
      UPDATE complaints
      SET ${updateFields.join(', ')}, updated_at = NOW()
      WHERE id = $${paramCount}
      RETURNING id, status, cbi_message, cbi_assigned_to, updated_at
    `;

    const { rows: updatedRows } = await client.query(updateQuery, updateParams);

    await client.query('COMMIT');

    return res.status(200).json({
      message: 'Complaint updated successfully.',
      complaint: {
        id: updatedRows[0].id,
        status: updatedRows[0].status,
        cbi_message: updatedRows[0].cbi_message,
        cbi_assigned_to: updatedRows[0].cbi_assigned_to,
        updated_at: updatedRows[0].updated_at,
      },
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[CBI] updateComplaint error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  } finally {
    client.release();
  }
};

// ── Get Complaint Count by Status (Dashboard) ──────────────────────────────────
const getComplaintStats = async (req, res) => {
  const currentUserId = req.user.id;

  try {
    const stats = await pool.query(
      `SELECT status, COUNT(*) as count
       FROM complaints
       GROUP BY status`
    );

    const assignedToMe = await pool.query(
      `SELECT COUNT(*) as count
       FROM complaints
       WHERE cbi_assigned_to = $1`,
      [currentUserId]
    );

    return res.status(200).json({
      by_status: stats.rows.reduce((acc, row) => {
        acc[row.status] = parseInt(row.count);
        return acc;
      }, {}),
      assigned_to_me: parseInt(assignedToMe.rows[0].count),
    });
  } catch (err) {
    console.error('[CBI] getComplaintStats error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

module.exports = {
  getAllComplaints,
  getComplaint,
  updateComplaint,
  getComplaintStats,
};

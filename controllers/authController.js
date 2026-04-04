/**
 * Auth Controller
 * POST /auth/login        — request OTP
 * POST /auth/verify-otp  — exchange OTP for JWT
 */

const bcrypt = require('bcryptjs');
const { pool } = require('../config/db');
const { generateOtp, verifyOtp, signToken } = require('../services/authService');

/**
 * POST /auth/login
 * Body: { employee_id, password }
 * Verifies credentials then returns a mock OTP
 */
const login = async (req, res) => {
  const { employee_id, password } = req.body;

  try {
    const { rows } = await pool.query(
      'SELECT id, employee_id, full_name, password_hash, role, is_active, is_flagged FROM users WHERE employee_id = $1',
      [employee_id]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    const user = rows[0];

    if (!user.is_active) {
      return res.status(403).json({ error: 'Account is deactivated. Contact an administrator.' });
    }

    if (user.is_flagged) {
      return res.status(403).json({ error: 'Account has been flagged. Contact an administrator.' });
    }

    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    // Generate and return mock OTP (in production: send via SMS/email)
    const otp = generateOtp(user.employee_id);

    return res.status(200).json({
      message: 'OTP generated. Use POST /auth/verify-otp to complete login.',
      employee_id: user.employee_id,
      // In production: NEVER return OTP in response — send via SMS/email instead
      otp, // ← mock only
    });
  } catch (err) {
    console.error('[AUTH] login error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

/**
 * POST /auth/verify-otp
 * Body: { employee_id, otp }
 * Verifies OTP and returns JWT
 */
const verifyOtpHandler = async (req, res) => {
  const { employee_id, otp } = req.body;

  try {
    const result = verifyOtp(employee_id, otp);

    if (!result.valid) {
      return res.status(401).json({ error: result.reason });
    }

    // Fetch user details for token payload
    const { rows } = await pool.query(
      'SELECT id, employee_id, full_name, role FROM users WHERE employee_id = $1',
      [employee_id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const user = rows[0];
    const token = signToken({
      id:         user.id,
      role:       user.role,
      employeeId: user.employee_id,
    });

    return res.status(200).json({
      message: 'Login successful.',
      token,
      user: {
        id:          user.id,
        employee_id: user.employee_id,
        full_name:   user.full_name,
        role:        user.role,
      },
    });
  } catch (err) {
    console.error('[AUTH] verify-otp error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

const getMe = async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT 
        u.id, u.employee_id, u.full_name, u.email, u.role,
        c.license_number, c.agency_name, c.contact_phone,
        g.department, g.designation, g.office_code
      FROM users u
      LEFT JOIN cha_agents c ON c.user_id = u.id
      LEFT JOIN govt_officials g ON g.user_id = u.id
      WHERE u.id = $1
    `, [req.user.id]);
    
    if (rows.length === 0) return res.status(404).json({ error: 'User not found.' });
    
    return res.status(200).json({ user: rows[0] });
  } catch (err) {
    console.error('[AUTH] getMe error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

const updateMe = async (req, res) => {
  const { full_name, email, contact_phone, agency_name, designation, department } = req.body;
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Update core user details
    await client.query(
      `UPDATE users SET full_name = COALESCE($1, full_name), email = COALESCE($2, email), updated_at = NOW() WHERE id = $3`,
      [full_name, email, req.user.id]
    );

    // Update role specific details if they exist
    if (req.user.role === 'CHA_AGENT') {
      await client.query(
        `UPDATE cha_agents SET contact_phone = COALESCE($1, contact_phone), agency_name = COALESCE($2, agency_name) WHERE user_id = $3`,
        [contact_phone, agency_name, req.user.id]
      );
    } else if (req.user.role === 'GOVT_OFFICIAL') {
      await client.query(
        `UPDATE govt_officials SET designation = COALESCE($1, designation), department = COALESCE($2, department) WHERE user_id = $3`,
        [designation, department, req.user.id]
      );
    }
    
    await client.query('COMMIT');
    return res.status(200).json({ message: 'Profile updated successfully.' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[AUTH] updateMe error:', err);
    return res.status(500).json({ error: 'DB Error: ' + err.message });
  } finally {
    client.release();
  }
};

module.exports = { login, verifyOtpHandler, getMe, updateMe };

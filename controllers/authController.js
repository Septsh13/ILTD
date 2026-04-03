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

module.exports = { login, verifyOtpHandler };

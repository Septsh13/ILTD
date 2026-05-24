/**
 * Auth Service
 * Handles OTP generation/verification and JWT signing
 */

const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// ── In-memory OTP store: { employee_id -> { otp, expiresAt } } ───────────────
// In production, replace with Redis
const otpStore = new Map();
const OTP_TTL_MS = 5 * 60 * 1000; // 5 minutes
const normalizeEmployeeId = (employeeId) => String(employeeId || '').trim().toUpperCase();

/**
 * Generate a 6-digit mock OTP and store it with TTL
 * @param {string} employeeId
 * @returns {string} otp
 */
const generateOtp = (employeeId) => {
  const otp = crypto.randomInt(100000, 999999).toString();
  const key = normalizeEmployeeId(employeeId);
  otpStore.set(key, {
    otp,
    expiresAt: Date.now() + OTP_TTL_MS,
  });

  // Auto-cleanup after TTL
  setTimeout(() => otpStore.delete(key), OTP_TTL_MS);

  console.log(`[OTP] Generated for ${employeeId}: ${otp} (mock — log only in dev)`);
  return otp;
};

/**
 * Verify an OTP for a given employee ID
 * @param {string} employeeId
 * @param {string} otp
 * @returns {{ valid: boolean, reason?: string }}
 */
const verifyOtp = (employeeId, otp) => {
  const key = normalizeEmployeeId(employeeId);
  const record = otpStore.get(key);

  if (!record) {
    return { valid: false, reason: 'No OTP found. Request a new one.' };
  }

  if (Date.now() > record.expiresAt) {
    otpStore.delete(key);
    return { valid: false, reason: 'OTP has expired. Request a new one.' };
  }

  if (record.otp !== otp) {
    return { valid: false, reason: 'Invalid OTP.' };
  }

  // One-time use — delete after successful verification
  otpStore.delete(key);
  return { valid: true };
};

/**
 * Sign a JWT token
 * @param {{ id: string, role: string, employeeId: string }} payload
 * @returns {string} token
 */
const signToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '8h',
    issuer: 'clearpath-api',
  });
};

/**
 * Verify and decode a JWT token
 * @param {string} token
 * @returns {object} decoded payload
 */
const verifyToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET, {
    issuer: 'clearpath-api',
  });
};

module.exports = { generateOtp, verifyOtp, signToken, verifyToken };

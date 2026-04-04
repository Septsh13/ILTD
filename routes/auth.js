/**
 * Auth Routes
 * POST /auth/login
 * POST /auth/verify-otp
 */

const express = require('express');
const { body } = require('express-validator');
const { login, verifyOtpHandler } = require('../controllers/authController');
const { validate } = require('../middleware/validate');
const { auditLogger } = require('../middleware/auditLogger');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
router.use(auditLogger);

// POST /auth/login
router.post(
  '/login',
  [
    body('employee_id').trim().notEmpty().withMessage('employee_id is required.'),
    body('password').notEmpty().withMessage('password is required.'),
  ],
  validate,
  login
);

// POST /auth/verify-otp
router.post(
  '/verify-otp',
  [
    body('employee_id').trim().notEmpty().withMessage('employee_id is required.'),
    body('otp')
      .trim()
      .notEmpty().withMessage('otp is required.')
      .isLength({ min: 6, max: 6 }).withMessage('otp must be 6 digits.')
      .isNumeric().withMessage('otp must be numeric.'),
  ],
  validate,
  verifyOtpHandler
);

// GET /auth/me
router.get('/me', authenticate, require('../controllers/authController').getMe);

// PUT /auth/me
router.put('/me', authenticate, require('../controllers/authController').updateMe);

module.exports = router;

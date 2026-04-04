/**
 * Admin Routes — Role: ADMIN
 * GET  /admin/all-complaints
 * GET  /admin/audit-logs
 * POST /admin/flag-user
 * GET  /admin/complaints/:id/decrypt — decrypt complainant identity (admin-only)
 */

const express = require('express');
const { body, query, param } = require('express-validator');
const { 
  getAllComplaints, 
  getAuditLogs, 
  flagUser, 
  getAllUsers, 
  getAdminSummary,
  getComplaintDecrypted,
  createShipment,
  getShipmentReviews,
} = require('../controllers/adminController');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');
const { validate } = require('../middleware/validate');
const { auditLogger } = require('../middleware/auditLogger');

const router = express.Router();

// Apply auth + ADMIN role guard + audit logger to all admin routes
router.use(authenticate, requireRole('ADMIN'), auditLogger);

// POST /admin/shipments
router.post(
  '/shipments',
  [
    body('title').trim().notEmpty().withMessage('title is required.'),
    body('description').trim().notEmpty().withMessage('description is required.'),
  ],
  validate,
  createShipment
);

// GET /admin/summary
router.get('/summary', getAdminSummary);

// GET /admin/users
router.get('/users', getAllUsers);

// GET /admin/all-complaints
router.get(
  '/all-complaints',
  [
    query('page').optional().isInt({ min: 1 }).withMessage('page must be a positive integer.'),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('status').optional().isIn(['OPEN', 'UNDER_REVIEW', 'RESOLVED', 'CLOSED'])
      .withMessage('Invalid complaint status.'),
  ],
  validate,
  getAllComplaints
);

// GET /admin/reviews
router.get('/reviews', getShipmentReviews);

// GET /admin/audit-logs
router.get(
  '/audit-logs',
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 200 }),
    query('user_id').optional().isUUID().withMessage('user_id must be a valid UUID.'),
    query('role').optional().isIn(['CHA_AGENT', 'GOVT_OFFICIAL', 'ADMIN']).withMessage('Invalid role filter.'),
  ],
  validate,
  getAuditLogs
);

// POST /admin/flag-user
router.post(
  '/flag-user',
  [
    body('user_id').isUUID().withMessage('user_id must be a valid UUID.'),
    body('flag').isBoolean().withMessage('flag must be a boolean (true = flag, false = unflag).'),
    body('reason').optional().isString(),
  ],
  validate,
  flagUser
);

// GET /admin/complaints/:id/decrypt — Decrypt complainant identity (Admin-Only)
router.get(
  '/complaints/:id/decrypt',
  [
    param('id').isUUID().withMessage('id must be a valid complaint UUID.'),
  ],
  validate,
  getComplaintDecrypted
);

module.exports = router;

/**
 * CBI Routes — Role: CBI (Complaints Bureau of Investigation)
 * GET  /cbi/complaints      — list all complaints (no identity shown)
 * GET  /cbi/complaints/:id  — complaint details (no identity shown)
 * PUT  /cbi/complaints/:id  — update status & investigative notes
 * GET  /cbi/stats           — complaint statistics
 */

const express = require('express');
const { body, query, param } = require('express-validator');
const {
  getAllComplaints,
  getComplaint,
  updateComplaint,
  getComplaintStats,
} = require('../controllers/cbiController');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');
const { validate } = require('../middleware/validate');
const { auditLogger } = require('../middleware/auditLogger');

const router = express.Router();

// ── Apply auth + CBI role guard + audit logger to all CBI routes
router.use(authenticate, requireRole('CBI'), auditLogger);

// ── GET /cbi/stats — Complaint statistics for CBI dashboard
router.get('/stats', getComplaintStats);

// ── GET /cbi/complaints — List all complaints (no identity)
router.get(
  '/complaints',
  [
    query('page').optional().isInt({ min: 1 }).withMessage('page must be a positive integer.'),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('status').optional().isIn(['OPEN', 'UNDER_REVIEW', 'RESOLVED', 'CLOSED', 'ALL'])
      .withMessage('Invalid complaint status.'),
    query('assigned_to_me').optional().isBoolean()
      .withMessage('assigned_to_me must be true or false.'),
  ],
  validate,
  getAllComplaints
);

// ── GET /cbi/complaints/:id — Get one complaint (no identity)
router.get(
  '/complaints/:id',
  [
    param('id').isUUID().withMessage('id must be a valid complaint UUID.'),
  ],
  validate,
  getComplaint
);

// ── PUT /cbi/complaints/:id — Update status & CBI message
router.put(
  '/complaints/:id',
  [
    param('id').isUUID().withMessage('id must be a valid complaint UUID.'),
    body('status').optional().isIn(['OPEN', 'UNDER_REVIEW', 'RESOLVED', 'CLOSED'])
      .withMessage('Invalid status.'),
    body('cbi_message').optional().isString()
      .withMessage('cbi_message must be a string.'),
  ],
  validate,
  updateComplaint
);

module.exports = router;

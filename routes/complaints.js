/**
 * Complaint Routes — Public (no authentication required)
 * POST /complaints
 * GET  /complaints/status
 */

const express = require('express');
const { body, query } = require('express-validator');
const { submitComplaint, getComplaintStatus } = require('../controllers/complaintController');
const { validate } = require('../middleware/validate');
const { auditLogger } = require('../middleware/auditLogger');

const router = express.Router();
router.use(auditLogger);

// POST /complaints
router.post(
  '/',
  [
    body('subject').optional().trim().isString(),
    body('complaint').trim().notEmpty().withMessage('complaint description is required.'),
    body('type').equals('BRIBERY').withMessage('Only BRIBERY type is allowed for complaints.'),
    body('shipment_id').optional().isString(),
    body('complainant_name').optional().trim().isString(),
    body('complainant_email').optional().trim().isEmail(),
    body('complainant_phone').optional().trim().isString(),
    body('related_user_id').optional().isUUID(),
  ],
  validate,
  submitComplaint
);

// GET /complaints/status?tracking_token=...
router.get(
  '/status',
  [
    query('tracking_token').notEmpty().withMessage('tracking_token query parameter is required.'),
  ],
  validate,
  getComplaintStatus
);

module.exports = router;

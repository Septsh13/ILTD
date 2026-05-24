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
    body('subject').trim().notEmpty().withMessage('subject is required.'),
    body('description').trim().notEmpty().withMessage('description is required.'),
    body('complainant_name').trim().notEmpty().withMessage('complainant_name is required.'),
    body('complainant_email').trim().isEmail().withMessage('complainant_email must be a valid email.'),
    body('complainant_phone').optional().trim().isLength({ min: 5 }).withMessage('complainant_phone must be at least 5 characters.'),
    body('related_user_id').optional().isUUID().withMessage('related_user_id must be a valid UUID.'),
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

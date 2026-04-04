/**
 * Govt Routes — Role: GOVT_OFFICIAL
 * GET  /govt/assigned-documents
 * POST /govt/approve
 * POST /govt/reject
 */

const express = require('express');
const { body, query } = require('express-validator');
const { getGovtSummary, getAssignedDocuments, approveDocument, rejectDocument } = require('../controllers/govtController');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');
const { validate } = require('../middleware/validate');
const { auditLogger } = require('../middleware/auditLogger');

const VALID_REJECTION_REASONS = [
  'INCOMPLETE_DOCUMENTATION',
  'POLICY_VIOLATION',
  'DUPLICATE_SUBMISSION',
  'FRAUDULENT_CLAIM',
  'MISSING_SIGNATURE',
];

const router = express.Router();

// Apply auth + role guard + audit logger to all Govt routes
router.use(authenticate, requireRole('GOVT_OFFICIAL'), auditLogger);

// GET /govt/summary
router.get('/summary', getGovtSummary);

// GET /govt/assigned-documents
router.get(
  '/assigned-documents',
  [
    query('page').optional().isInt({ min: 1 }).withMessage('page must be a positive integer.'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('limit must be 1–100.'),
    query('status').optional().isIn(['PENDING', 'APPROVED', 'REJECTED']).withMessage('Invalid status.'),
  ],
  validate,
  getAssignedDocuments
);

// POST /govt/approve
router.post(
  '/approve',
  [
    body('document_id').isUUID().withMessage('document_id must be a valid UUID.'),
    body('notes').optional().isString(),
  ],
  validate,
  approveDocument
);

// POST /govt/reject
router.post(
  '/reject',
  [
    body('document_id').isUUID().withMessage('document_id must be a valid UUID.'),
    body('rejection_reason')
      .notEmpty().withMessage('rejection_reason is required.')
      .isIn(VALID_REJECTION_REASONS).withMessage(`rejection_reason must be one of: ${VALID_REJECTION_REASONS.join(', ')}`),
    body('notes').optional().isString(),
  ],
  validate,
  rejectDocument
);

module.exports = router;

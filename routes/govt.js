/**
 * Govt Routes — Role: GOVT_OFFICIAL
 * GET  /govt/shipments
 * PUT  /govt/shipments/:id
 */

const express = require('express');
const { body, query, param } = require('express-validator');
const { getGovtSummary, getShipments, decideShipment } = require('../controllers/govtController');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');
const { validate } = require('../middleware/validate');
const { auditLogger } = require('../middleware/auditLogger');

const router = express.Router();

// Apply auth + role guard + audit logger to all Govt routes
router.use(authenticate, requireRole('GOVT_OFFICIAL'), auditLogger);

// GET /govt/summary
router.get('/summary', getGovtSummary);

// GET /govt/shipments
router.get(
  '/shipments',
  [
    query('page').optional().isInt({ min: 1 }).withMessage('page must be a positive integer.'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('limit must be 1–100.'),
    query('status').optional().isIn(['PENDING', 'APPROVED', 'REJECTED']).withMessage('Invalid status.'),
  ],
  validate,
  getShipments
);

// PUT /govt/shipments/:id
router.put(
  '/shipments/:id',
  [
    param('id').notEmpty().withMessage('id is required.'),
    body('decision').isIn(['APPROVED', 'REJECTED']).withMessage('decision must be APPROVED or REJECTED.'),
    body('remarks').optional().isString(),
  ],
  validate,
  decideShipment
);

module.exports = router;

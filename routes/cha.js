/**
 * CHA Routes — Role: CHA_AGENT
 * GET  /cha/shipments
 */

const express = require('express');
const { query, body } = require('express-validator');
const { getChaSummary, getShipments, acceptShipmentDecision, submitGeneralIssue } = require('../controllers/chaController');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');
const { validate } = require('../middleware/validate');
const { auditLogger } = require('../middleware/auditLogger');

const router = express.Router();

router.use(authenticate, requireRole('CHA_AGENT'), auditLogger);

// GET /cha/summary
router.get('/summary', getChaSummary);

// GET /cha/shipments
router.get(
  '/shipments',
  [
    query('page').optional().isInt({ min: 1 }).withMessage('page must be a positive integer.'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('limit must be 1–100.'),
    query('status').optional().isIn(['PENDING','IN_REVIEW','APPROVED','REJECTED','SUSPICIOUS'])
      .withMessage('Invalid status value.'),
  ],
  validate,
  getShipments
);

// POST /cha/accept
router.post(
  '/accept',
  [
    body('shipment_id').notEmpty().withMessage('shipment_id is required.'),
  ],
  validate,
  acceptShipmentDecision
);

// POST /cha/reviews
router.post(
  '/reviews',
  [
    body('shipment_id').notEmpty().withMessage('shipment_id is required.'),
    body('message').trim().notEmpty().withMessage('message is required.'),
  ],
  validate,
  submitGeneralIssue
);

module.exports = router;

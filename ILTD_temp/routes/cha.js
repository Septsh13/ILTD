/**
 * CHA Routes — Role: CHA_AGENT
 * POST /cha/shipments
 * GET  /cha/shipments
 * POST /cha/documents
 * POST /cha/interactions
 * POST /cha/mark-suspicious
 */

const express = require('express');
const { body, query } = require('express-validator');
const {
  getChaSummary, createShipment, getShipments, addDocument, logInteraction, markSuspicious,
} = require('../controllers/chaController');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');
const { validate } = require('../middleware/validate');
const { auditLogger } = require('../middleware/auditLogger');

const router = express.Router();

// Apply auth + role guard + audit logger to all CHA routes
router.use(authenticate, requireRole('CHA_AGENT'), auditLogger);

// GET /cha/summary
router.get('/summary', getChaSummary);

// POST /cha/shipments
router.post(
  '/shipments',
  [
    body('shipper_name').trim().notEmpty().withMessage('shipper_name is required.'),
    body('consignee_name').trim().notEmpty().withMessage('consignee_name is required.'),
    body('origin_port').trim().notEmpty().withMessage('origin_port is required.'),
    body('destination_port').trim().notEmpty().withMessage('destination_port is required.'),
    body('gross_weight_kg').optional().isFloat({ min: 0 }).withMessage('gross_weight_kg must be a positive number.'),
  ],
  validate,
  createShipment
);

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

// POST /cha/documents
router.post(
  '/documents',
  [
    body('shipment_id').isUUID().withMessage('shipment_id must be a valid UUID.'),
    body('document_type').trim().notEmpty().withMessage('document_type is required.'),
    body('file_name').trim().notEmpty().withMessage('file_name is required.'),
    body('file_url').trim().notEmpty().isURL().withMessage('file_url must be a valid URL.'),
    body('assigned_to').optional().isUUID().withMessage('assigned_to must be a valid UUID.'),
  ],
  validate,
  addDocument
);

// POST /cha/interactions
router.post(
  '/interactions',
  [
    body('govt_user_id').isUUID().withMessage('govt_user_id must be a valid UUID.'),
    body('subject').trim().notEmpty().withMessage('subject is required.'),
    body('message').trim().notEmpty().withMessage('message is required.'),
    body('shipment_id').optional().isUUID().withMessage('shipment_id must be a valid UUID.'),
  ],
  validate,
  logInteraction
);

// POST /cha/mark-suspicious
router.post(
  '/mark-suspicious',
  [
    body('shipment_id').isUUID().withMessage('shipment_id must be a valid UUID.'),
    body('note').optional().isString(),
  ],
  validate,
  markSuspicious
);

module.exports = router;

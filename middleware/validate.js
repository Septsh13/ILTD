/**
 * Validation Middleware
 * Wraps express-validator to return consistent 400 errors
 */

const { validationResult } = require('express-validator');

/**
 * Call after a chain of express-validator checks.
 * Returns 400 with a structured error list if validation fails.
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array().map((e) => ({
        field:   e.path,
        message: e.msg,
      })),
    });
  }
  next();
};

module.exports = { validate };

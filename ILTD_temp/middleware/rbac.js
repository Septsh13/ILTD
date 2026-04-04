/**
 * RBAC Middleware
 * Role-based access control — factory function returning middleware
 */

/**
 * Restrict access to specific roles.
 * Must be used AFTER the authenticate middleware.
 *
 * @param {...string} allowedRoles - e.g. requireRole('ADMIN', 'CHA_AGENT')
 * @returns Express middleware
 *
 * @example
 *   router.get('/shipments', authenticate, requireRole('CHA_AGENT'), handler)
 */
const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated.' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Access denied.',
        required: allowedRoles,
        yourRole: req.user.role,
      });
    }

    next();
  };
};

module.exports = { requireRole };

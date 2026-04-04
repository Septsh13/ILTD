/**
 * Audit Logger Middleware
 * Fires after every response and logs the action to audit_logs
 */

const { createLog } = require('../services/auditService');

/**
 * Attach this to any router that needs auditing.
 * Hooks into the response 'finish' event so the log is written
 * after the response is sent — no latency added to the request.
 */
const auditLogger = (req, res, next) => {
  res.on('finish', () => {
    const user    = req.user || null;
    const action  = `${req.method} ${req.route ? req.route.path : req.path}`;
    const ipAddr  = req.ip || req.headers['x-forwarded-for'] || null;

    createLog({
      userId:     user ? user.id   : null,
      role:       user ? user.role : null,
      action,
      statusCode: res.statusCode,
      metadata:   {
        params: req.params,
        query:  req.query,
      },
      ipAddress: ipAddr,
    });
  });

  next();
};

module.exports = { auditLogger };

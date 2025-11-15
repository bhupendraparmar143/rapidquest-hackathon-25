/**
 * Role-Based Access Control (RBAC) Middleware
 * Restricts access based on user roles
 */

/**
 * Check if user has required role(s)
 * @param {string|Array} allowedRoles - Role(s) allowed to access
 * @returns {Function} Express middleware
 */
const requireRole = (allowedRoles) => {
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const userRole = req.user.role || req.userRole;

    if (!roles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role: ${roles.join(' or ')}`
      });
    }

    next();
  };
};

/**
 * Require admin role
 */
const requireAdmin = requireRole('admin');

/**
 * Require manager or admin
 */
const requireManager = requireRole(['admin', 'manager']);

/**
 * Require lead, manager, or admin
 */
const requireLead = requireRole(['admin', 'manager', 'lead']);

/**
 * Check if user can access resource (owner or admin)
 */
const requireOwnerOrAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }

  const userRole = req.user.role || req.userRole;
  const userId = req.user._id.toString() || req.userId;

  // Admin can access anything
  if (userRole === 'admin') {
    return next();
  }

  // Check if user is the owner
  const resourceUserId = req.params.userId || req.body.userId || req.query.userId;
  
  if (resourceUserId && resourceUserId === userId) {
    return next();
  }

  return res.status(403).json({
    success: false,
    message: 'Access denied. You can only access your own resources.'
  });
};

module.exports = {
  requireRole,
  requireAdmin,
  requireManager,
  requireLead,
  requireOwnerOrAdmin
};


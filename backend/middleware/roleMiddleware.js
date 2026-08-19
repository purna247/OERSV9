function roleMiddleware(allowedRoles) {
  const allowed = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

  return function roleGuard(req, res, next) {
    if (!req.user || !req.user.role) {
      return res.status(401).json({ error: true, message: 'Unauthorized' });
    }
    if (!allowed.includes(req.user.role)) {
      return res.status(403).json({ error: true, message: 'Forbidden' });
    }
    return next();
  };
}

module.exports = roleMiddleware;


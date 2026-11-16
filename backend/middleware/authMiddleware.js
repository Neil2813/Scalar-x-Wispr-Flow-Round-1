import jwt from 'jsonwebtoken';

const getJwtSecret = () => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET must be configured before handling authenticated requests.');
  }
  return process.env.JWT_SECRET;
};

/**
 * Strict route protection: Requires valid Bearer JWT token
 */
export const protect = (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      if (!token || token === 'null' || token === 'undefined') {
        return res.status(401).json({ error: 'Not authorized, token missing' });
      }
      const decoded = jwt.verify(token, getJwtSecret());
      req.user = decoded;
      return next();
    } catch (error) {
      return res.status(401).json({ error: 'Not authorized, token invalid or expired' });
    }
  }

  return res.status(401).json({ error: 'Not authorized, no token provided' });
};

/**
 * Optional authentication middleware:
 * If valid Bearer token provided, attaches authenticated user to req.user.
 * If no token provided, defaults to guest walk-in patient (preserves kiosk intake workflow).
 */
export const optionalAuth = (req, res, next) => {
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      const token = req.headers.authorization.split(' ')[1];
      if (token && token !== 'null' && token !== 'undefined') {
        const decoded = jwt.verify(token, getJwtSecret());
        req.user = decoded;
        return next();
      }
    } catch (error) {
      // If token is invalid on optional route, fallback to guest gracefully
    }
  }

  req.user = { id: 'guest', role: 'guest', name: 'Walk-in Patient' };
  next();
};

/**
 * Role-Based Access Control (RBAC) middleware
 * e.g., authorize('doctor')
 */
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    if (roles.length === 0) return next();

    const userRole = (req.user.role || '').toUpperCase();
    const normalizedAllowed = roles.map((role) => role.toUpperCase());

    if (!normalizedAllowed.includes(userRole)) {
      return res.status(403).json({
        error: `Access denied. Role '${req.user?.role || 'anonymous'}' is not authorized to access this resource.`
      });
    }
    next();
  };
};

export const generateToken = (user, extra = {}) => {
  return jwt.sign(
    {
      id: user.id || user._id,
      email: user.email,
      role: user.role,
      name: extra.name || user.name || '',
      ...extra
    },
    getJwtSecret(),
    { expiresIn: '7d' }
  );
};


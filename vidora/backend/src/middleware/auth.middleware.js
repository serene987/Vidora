const { verifyAccessToken } = require('../utils/jwt');
const db = require('../config/db');

const authenticate = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      res.status(401).json({ error: 'Access denied. No token provided.' });
      return;
    }

    const decoded = verifyAccessToken(token);
    const [users] = await db.execute(
      'SELECT id, fullName, email, emailVerified, role, stripeCustomerId FROM users WHERE id = ?',
      [decoded.userId]
    );
    
    if (users.length === 0) {
      res.status(401).json({ error: 'Invalid token.' });
      return;
    }

    req.user = users[0];
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token.' });
  }
};

const requireAdmin = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    res.status(403).json({ error: 'Admin access required.' });
    return;
  }
  next();
};

const requireEmailVerified = (req, res, next) => {
  if (!req.user?.emailVerified) {
    res.status(403).json({ error: 'Email verification required.' });
    return;
  }
  next();
};

module.exports = {
  authenticate,
  requireAdmin,
  requireEmailVerified
};
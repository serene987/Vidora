const db = require('../config/db');

const requireActiveSubscription = async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    // Check for active subscription
    const [subscriptions] = await db.execute(
      'SELECT id FROM subscriptions WHERE userId = ? AND status = "active"',
      [userId]
    );
    
    if (subscriptions.length === 0) {
      return res.status(403).json({ 
        error: 'Active subscription required',
        redirect: '/plans'
      });
    }
    
    next();
  } catch (error) {
    console.error('Subscription check error:', error);
    res.status(500).json({ error: 'Failed to verify subscription' });
  }
};

module.exports = {
  requireActiveSubscription
};
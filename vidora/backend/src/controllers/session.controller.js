const db = require('../config/db');

const checkSession = async (req, res) => {
  try {
    console.log('🔄 SESSION CHECK: Checking session...', {
      sessionExists: !!req.session,
      userExists: !!req.session?.user
    });
    
    if (!req.session.user) {
      console.log('❌ SESSION CHECK: No user in session');
      return res.status(401).json({ message: 'Not logged in' });
    }

    console.log('✅ SESSION CHECK: User found in session:', req.session.user.email);
    res.json({ user: req.session.user });
  } catch (error) {
    console.error('❌ SESSION CHECK: Error:', error);
    res.status(500).json({ error: 'Failed to check session' });
  }
};

const refreshSession = async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({ message: 'Not logged in' });
    }

    const userId = req.session.user.id;
    console.log('🔄 SESSION REFRESH: Refreshing session for user:', userId);

    // Get updated user data
    const [users] = await db.execute(
      'SELECT id, fullName, email, emailVerified, role, stripeCustomerId FROM users WHERE id = ?',
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = users[0];

    // Check if user has paid (has stripeSubscriptionId)
    const [subscriptions] = await db.execute(
      'SELECT stripeSubscriptionId FROM subscriptions WHERE userId = ? AND stripeSubscriptionId IS NOT NULL LIMIT 1',
      [userId]
    );
    const hasPaid = subscriptions.length > 0;

    // Update session with fresh data
    req.session.user = {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      emailVerified: user.emailVerified,
      role: user.role,
      stripeCustomerId: user.stripeCustomerId,
      hasPaid
    };

    console.log('✅ SESSION REFRESH: Session updated with hasPaid:', hasPaid);
    res.json({ user: req.session.user });
  } catch (error) {
    console.error('❌ SESSION REFRESH: Error:', error);
    res.status(500).json({ error: 'Failed to refresh session' });
  }
};

module.exports = {
  checkSession,
  refreshSession
};
const db = require('../config/db');

const testStripeData = async (req, res) => {
  try {
    console.log('🧪 TEST: Checking Stripe data in database...');
    
    // Get all users with their Stripe customer IDs
    const [users] = await db.execute(`
      SELECT id, email, fullName, stripeCustomerId, createdAt 
      FROM users 
      ORDER BY createdAt DESC
    `);
    
    // Get all subscriptions with their Stripe subscription IDs
    const [subscriptions] = await db.execute(`
      SELECT s.id, s.userId, s.planId, s.status, s.stripeSubscriptionId, s.startDate,
             u.email, u.fullName, p.title as planTitle
      FROM subscriptions s
      JOIN users u ON s.userId = u.id
      JOIN plans p ON s.planId = p.id
      ORDER BY s.createdAt DESC
    `);
    
    console.log('📊 TEST: Users found:', users.length);
    console.log('📊 TEST: Subscriptions found:', subscriptions.length);
    
    // Count users with/without Stripe customer IDs
    const usersWithStripeId = users.filter(u => u.stripeCustomerId).length;
    const usersWithoutStripeId = users.filter(u => !u.stripeCustomerId).length;
    
    // Count subscriptions with/without Stripe subscription IDs
    const subsWithStripeId = subscriptions.filter(s => s.stripeSubscriptionId).length;
    const subsWithoutStripeId = subscriptions.filter(s => !s.stripeSubscriptionId).length;
    
    const testResults = {
      users: {
        total: users.length,
        withStripeCustomerId: usersWithStripeId,
        withoutStripeCustomerId: usersWithoutStripeId,
        data: users.map(u => ({
          id: u.id,
          email: u.email,
          fullName: u.fullName,
          stripeCustomerId: u.stripeCustomerId || 'NOT SET',
          createdAt: u.createdAt
        }))
      },
      subscriptions: {
        total: subscriptions.length,
        withStripeSubscriptionId: subsWithStripeId,
        withoutStripeSubscriptionId: subsWithoutStripeId,
        data: subscriptions.map(s => ({
          id: s.id,
          userId: s.userId,
          userEmail: s.email,
          planTitle: s.planTitle,
          status: s.status,
          stripeSubscriptionId: s.stripeSubscriptionId || 'NOT SET',
          startDate: s.startDate
        }))
      }
    };
    
    console.log('✅ TEST: Results compiled');
    console.log('📝 TEST: Users with Stripe ID:', usersWithStripeId, '/', users.length);
    console.log('📝 TEST: Subscriptions with Stripe ID:', subsWithStripeId, '/', subscriptions.length);
    
    res.json(testResults);
  } catch (error) {
    console.error('❌ TEST: Error checking Stripe data:', error);
    res.status(500).json({ error: 'Failed to check Stripe data', details: error.message });
  }
};

module.exports = {
  testStripeData
};
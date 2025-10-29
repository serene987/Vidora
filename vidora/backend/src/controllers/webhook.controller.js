const db = require('../config/db');
const stripeService = require('../services/stripe.service');

const handleStripeWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  
  try {
    console.log('Webhook received, verifying signature...');
    const event = await stripeService.constructEvent(req.body, sig);
    console.log('Webhook verified, event type:', event.type);

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      console.log('Checkout session completed:', session.id);

      // Find pending user by session ID
      const [pendingUsers] = await db.execute(
        'SELECT * FROM pending_users WHERE stripePaymentIntentId = ?',
        [session.id]
      );

      if (pendingUsers.length === 0) {
        console.log('No pending user found for session:', session.id);
        res.status(200).json({ received: true });
        return;
      }

      const pendingUser = pendingUsers[0];
      console.log('Found pending user:', pendingUser.email);

      // Check if user already exists (idempotency)
      const [existingUsers] = await db.execute(
        'SELECT id FROM users WHERE email = ?',
        [pendingUser.email]
      );

      if (existingUsers.length > 0) {
        console.log('User already exists, cleaning up pending user');
        await db.execute('DELETE FROM pending_users WHERE id = ?', [pendingUser.id]);
        res.status(200).json({ received: true });
        return;
      }

      // Create user account
      console.log('Creating user account...');
      const [userResult] = await db.execute(
        'INSERT INTO users (fullName, email, passwordHash, emailVerified, stripeCustomerId) VALUES (?, ?, ?, ?, ?)',
        [pendingUser.fullName, pendingUser.email, pendingUser.passwordHash, true, session.customer]
      );
      console.log('User created with ID:', userResult.insertId);

      // Create subscription
      console.log('Creating subscription...');
      const nextBillingDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      await db.execute(
        'INSERT INTO subscriptions (userId, planId, status, stripeSubscriptionId, startDate, nextBillingDate) VALUES (?, ?, ?, ?, ?, ?)',
        [userResult.insertId, pendingUser.planId, 'active', session.subscription, new Date(), nextBillingDate]
      );
      console.log('Subscription created');

      // Clean up pending user
      await db.execute('DELETE FROM pending_users WHERE id = ?', [pendingUser.id]);
      console.log('Pending user cleaned up');

      console.log('User signup completed successfully for:', pendingUser.email);
    } else {
      console.log('Unhandled webhook event type:', event.type);
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(400).json({ error: 'Webhook signature verification failed' });
  }
};

module.exports = {
  handleStripeWebhook
};
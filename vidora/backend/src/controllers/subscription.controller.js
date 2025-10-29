const db = require('../config/db');
const stripeService = require('../services/stripe.service');

const createSubscription = async (req, res) => {
  try {
    const { planId } = req.body;
    const user = req.user;

    const [plans] = await db.execute('SELECT * FROM plans WHERE id = ? AND isActive = TRUE', [planId]);
    if (plans.length === 0) {
      res.status(404).json({ error: 'Plan not found' });
      return;
    }
    const plan = plans[0];

    // Check for existing active subscription
    const [existingSubscriptions] = await db.execute(
      'SELECT id FROM subscriptions WHERE userId = ? AND status = "active"',
      [user.id]
    );

    if (existingSubscriptions.length > 0) {
      res.status(400).json({ error: 'User already has an active subscription' });
      return;
    }

    // Create or get Stripe customer
    let stripeCustomerId = user.stripeCustomerId;
    if (!stripeCustomerId) {
      const customer = await stripeService.createCustomer(user.email, user.fullName);
      stripeCustomerId = customer.id;
      await db.execute('UPDATE users SET stripeCustomerId = ? WHERE id = ?', [stripeCustomerId, user.id]);
    }

    // Create Stripe subscription (you'll need to create price IDs in Stripe dashboard)
    const priceId = `price_${plan.id}_${plan.billingCycle}`;
    const stripeSubscription = await stripeService.createSubscription(stripeCustomerId, priceId);

    // Create local subscription
    const nextBillingDate = new Date(Date.now() + (plan.billingCycle === 'monthly' ? 30 : 365) * 24 * 60 * 60 * 1000);
    
    const [result] = await db.execute(
      'INSERT INTO subscriptions (userId, planId, status, stripeSubscriptionId, startDate, nextBillingDate) VALUES (?, ?, ?, ?, ?, ?)',
      [user.id, plan.id, 'trialing', stripeSubscription.id, new Date(), nextBillingDate]
    );

    const [subscriptions] = await db.execute('SELECT * FROM subscriptions WHERE id = ?', [result.insertId]);

    res.status(201).json({
      subscription: subscriptions[0],
      clientSecret: stripeSubscription.latest_invoice?.payment_intent?.client_secret
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create subscription' });
  }
};

const getSubscriptions = async (req, res) => {
  try {
    const [subscriptions] = await db.execute(`
      SELECT s.*, p.title, p.description, p.price, p.billingCycle, p.channelCount
      FROM subscriptions s
      JOIN plans p ON s.planId = p.id
      WHERE s.userId = ?
      ORDER BY s.createdAt DESC
    `, [req.user.id]);
    
    // Transform to match expected format
    const formattedSubscriptions = subscriptions.map(sub => ({
      id: sub.id,
      userId: sub.userId,
      planId: sub.planId,
      status: sub.status,
      stripeSubscriptionId: sub.stripeSubscriptionId,
      startDate: sub.startDate,
      endDate: sub.endDate,
      nextBillingDate: sub.nextBillingDate,
      createdAt: sub.createdAt,
      updatedAt: sub.updatedAt,
      Plan: {
        title: sub.title,
        description: sub.description,
        price: sub.price,
        billingCycle: sub.billingCycle,
        channelCount: sub.channelCount
      }
    }));
    
    res.json(formattedSubscriptions);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch subscriptions' });
  }
};

const cancelSubscription = async (req, res) => {
  try {
    const [subscriptions] = await db.execute(
      'SELECT * FROM subscriptions WHERE id = ? AND userId = ?',
      [req.params.id, req.user.id]
    );

    if (subscriptions.length === 0) {
      res.status(404).json({ error: 'Subscription not found' });
      return;
    }

    const subscription = subscriptions[0];
    if (subscription.stripeSubscriptionId) {
      await stripeService.cancelSubscription(subscription.stripeSubscriptionId);
    }

    await db.execute(
      'UPDATE subscriptions SET status = "cancelled", endDate = CURRENT_TIMESTAMP, updatedAt = CURRENT_TIMESTAMP WHERE id = ?',
      [req.params.id]
    );

    res.json({ message: 'Subscription cancelled successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to cancel subscription' });
  }
};

const handleStripeWebhook = async (req, res) => {
  try {
    const signature = req.headers['stripe-signature'];
    const event = await stripeService.constructEvent(req.body, signature);

    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object;
        if (session.mode === 'subscription' && session.metadata) {
          // Handle new user signup with subscription
          const { email, password, planId } = session.metadata;
          
          // Check if user already exists
          const [existingUsers] = await db.execute('SELECT id FROM users WHERE email = ?', [email]);
          if (existingUsers.length === 0) {
            // Create user
            const [userResult] = await db.execute(
              'INSERT INTO users (fullName, email, passwordHash, emailVerified, stripeCustomerId) VALUES (?, ?, ?, ?, ?)',
              [email.split('@')[0], email, password, true, session.customer]
            );

            // Create subscription
            const nextBillingDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
            await db.execute(
              'INSERT INTO subscriptions (userId, planId, status, stripeSubscriptionId, startDate, nextBillingDate) VALUES (?, ?, ?, ?, ?, ?)',
              [userResult.insertId, planId, 'active', session.subscription, new Date(), nextBillingDate]
            );

            console.log(`New user and subscription created: ${email}`);
          }
        }
        break;

      case 'invoice.payment_succeeded':
        const invoice = event.data.object;
        await db.execute(
          'UPDATE subscriptions SET status = "active", updatedAt = CURRENT_TIMESTAMP WHERE stripeSubscriptionId = ?',
          [invoice.subscription]
        );
        break;

      case 'invoice.payment_failed':
        const failedInvoice = event.data.object;
        await db.execute(
          'UPDATE subscriptions SET status = "cancelled", updatedAt = CURRENT_TIMESTAMP WHERE stripeSubscriptionId = ?',
          [failedInvoice.subscription]
        );
        break;
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(400).json({ error: 'Webhook error' });
  }
};

module.exports = {
  createSubscription,
  getSubscriptions,
  cancelSubscription,
  handleStripeWebhook
};
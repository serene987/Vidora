const db = require('../config/db');
const { hashPassword } = require('../utils/crypto');
const stripeService = require('../services/stripe.service');

const createExistingUserCheckout = async (req, res) => {
  try {
    const userId = req.user.id;
    const { planId } = req.body;
    console.log('🚀 EXISTING USER CHECKOUT: Starting for user:', userId, 'plan:', planId);
    console.log('📝 EXISTING USER CHECKOUT: User object:', req.user);
    
    if (!planId) {
      console.log('❌ EXISTING USER CHECKOUT: Missing planId');
      return res.status(400).json({ error: 'Plan ID is required' });
    }

    // Get plan details
    console.log('🔄 EXISTING USER CHECKOUT: Fetching plan details...');
    const [plans] = await db.execute('SELECT * FROM plans WHERE id = ? AND isActive = TRUE', [planId]);
    console.log('📊 EXISTING USER CHECKOUT: Plans found:', plans.length);
    if (plans.length === 0) {
      console.log('❌ EXISTING USER CHECKOUT: Plan not found');
      return res.status(404).json({ error: 'Plan not found' });
    }
    const plan = plans[0];
    console.log('✅ EXISTING USER CHECKOUT: Plan details:', { id: plan.id, title: plan.title, price: plan.price });

    // Create Stripe checkout session
    console.log('🔄 EXISTING USER CHECKOUT: Creating Stripe session...');
    const sessionData = {
      email: req.user.email,
      planId: plan.id,
      planTitle: plan.title,
      planPrice: plan.price,
      billingCycle: plan.billingCycle,
      metadata: {
        userId: userId.toString(),
        planId: planId.toString(),
        existingUser: 'true'
      }
    };
    console.log('📝 EXISTING USER CHECKOUT: Session data:', sessionData);
    
    const session = await stripeService.createCheckoutSession(sessionData);
    console.log('✅ EXISTING USER CHECKOUT: Stripe session created:', { id: session.id, url: session.url });

    res.json({ url: session.url });
  } catch (error) {
    console.error('❌ EXISTING USER CHECKOUT ERROR:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    res.status(500).json({ error: 'Failed to create checkout session', details: error.message });
  }
};

const createCheckoutSession = async (req, res) => {
  console.log('🚀 BACKEND: createCheckoutSession endpoint hit!');
  console.log('🚀 BACKEND: Request method:', req.method);
  console.log('🚀 BACKEND: Request headers:', req.headers);
  console.log('🚀 BACKEND: Request body:', req.body);
  
  try {
    const { email, password, planId, fullName } = req.body;
    console.log('🔄 STEP 1: Received checkout request:', { email, password: '***', planId, fullName });
    
    if (!email || !password || !planId) {
      console.log('❌ STEP 1 FAILED: Missing fields:', { email: !!email, password: !!password, planId: !!planId });
      res.status(400).json({ error: 'Missing required fields', details: 'Email, password, and planId are required' });
      return;
    }
    console.log('✅ STEP 1: All required fields present');

    // Check if user already exists
    console.log('🔄 STEP 2: Checking if user exists...');
    const [existingUsers] = await db.execute('SELECT id FROM users WHERE email = ?', [email]);
    if (existingUsers.length > 0) {
      console.log('❌ STEP 2 FAILED: User already exists');
      res.status(400).json({ error: 'User already exists', details: `User with email ${email} already exists` });
      return;
    }
    console.log('✅ STEP 2: User does not exist, proceeding');

    // Validate plan
    console.log('🔄 STEP 3: Validating plan ID:', planId);
    const [plans] = await db.execute('SELECT * FROM plans WHERE id = ? AND isActive = TRUE', [planId]);
    console.log('📊 STEP 3: Plans query result:', plans.length, 'plans found');
    if (plans.length === 0) {
      console.log('❌ STEP 3 FAILED: Plan not found or inactive');
      res.status(404).json({ error: 'Plan not found', details: `No active plan found with ID ${planId}` });
      return;
    }
    const plan = plans[0];
    console.log('✅ STEP 3: Plan found:', { id: plan.id, title: plan.title, price: plan.price });

    // Hash password
    console.log('🔄 STEP 4: Hashing password...');
    const passwordHash = await hashPassword(password);
    console.log('✅ STEP 4: Password hashed successfully');

    // Create Stripe checkout session
    console.log('🔄 STEP 5: Creating Stripe checkout session...');
    console.log('📋 STEP 5: Session data:', {
      email,
      planId: plan.id,
      planTitle: plan.title,
      planPrice: plan.price,
      billingCycle: plan.billingCycle
    });
    
    const session = await stripeService.createCheckoutSession({
      email,
      planId: plan.id,
      planTitle: plan.title,
      planPrice: plan.price,
      billingCycle: plan.billingCycle,
      metadata: {
        email,
        planId: planId.toString()
      }
    });
    console.log('✅ STEP 5: Stripe session created:', { id: session.id, url: session.url });

    // Store in pending_users with session ID
    console.log('🔄 STEP 6: Storing pending user...');
    console.log('📝 STEP 6: Storing session ID:', session.id);
    await db.execute(
      'INSERT INTO pending_users (fullName, email, passwordHash, planId, stripePaymentIntentId) VALUES (?, ?, ?, ?, ?)',
      [fullName || email.split('@')[0], email, passwordHash, planId, session.id]
    );
    console.log('✅ STEP 6: Pending user stored with session ID:', session.id);

    console.log('🎉 SUCCESS: All steps completed, returning session URL');
    res.json({ url: session.url });
  } catch (error) {
    console.error('❌ CHECKOUT SESSION ERROR:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      code: error.code
    });
    res.status(500).json({ 
      error: 'Failed to create checkout session', 
      details: error.message,
      errorType: error.name
    });
  }
};

const handleCheckoutSuccess = async (req, res) => {
  try {
    const { session_id } = req.query;
    console.log('🚀 CHECKOUT SUCCESS: Processing session:', session_id);

    if (!session_id) {
      res.status(400).json({ error: 'Session ID required' });
      return;
    }

    // Retrieve session from Stripe first to get proper IDs
    console.log('🔄 CHECKOUT SUCCESS: Retrieving session from Stripe...');
    const session = await stripeService.retrieveSession(session_id);
    
    // Check if this session was already processed (use session_id for this check)
    const [existingSubscriptions] = await db.execute(
      'SELECT id FROM subscriptions WHERE stripeSubscriptionId = ? OR stripeSubscriptionId = ?',
      [session.subscription || 'none', session_id]
    );
    
    if (existingSubscriptions.length > 0) {
      console.log('✅ CHECKOUT SUCCESS: Session already processed, subscription exists');
      return res.json({ success: true, message: 'Subscription already exists' });
    }

    console.log('📝 CHECKOUT SUCCESS: Full Stripe session object:', JSON.stringify(session, null, 2));
    console.log('📝 CHECKOUT SUCCESS: Key session details:', {
      id: session.id,
      payment_status: session.payment_status,
      customer: session.customer,
      subscription: session.subscription,
      mode: session.mode
    });
    
    if (session.payment_status !== 'paid') {
      console.log('❌ CHECKOUT SUCCESS: Payment not completed, status:', session.payment_status);
      res.status(400).json({ error: 'Payment not completed' });
      return;
    }
    console.log('✅ CHECKOUT SUCCESS: Payment confirmed as paid');

    // Check if this is an existing user subscription
    console.log('🔄 CHECKOUT SUCCESS: Checking session metadata:', session.metadata);
    if (session.metadata && session.metadata.existingUser === 'true') {
      console.log('🚀 CHECKOUT SUCCESS: Processing existing user subscription');
      const userId = parseInt(session.metadata.userId);
      const planId = parseInt(session.metadata.planId);
      console.log('📝 CHECKOUT SUCCESS: User ID:', userId, 'Plan ID:', planId);
      
      try {
        // Get user details
        const [userRows] = await db.execute('SELECT email, fullName, stripeCustomerId FROM users WHERE id = ?', [userId]);
        if (userRows.length === 0) {
          return res.status(404).json({ error: 'User not found' });
        }
        const user = userRows[0];
        console.log('📝 CHECKOUT SUCCESS: User details:', { email: user.email, hasStripeId: !!user.stripeCustomerId });
        
        // Create Stripe customer if doesn't exist
        let stripeCustomerId = user.stripeCustomerId;
        if (!stripeCustomerId) {
          console.log('🔄 CHECKOUT SUCCESS: Creating Stripe customer...');
          const customer = await stripeService.createCustomer(user.email, user.fullName);
          stripeCustomerId = customer.id;
          console.log('✅ CHECKOUT SUCCESS: Stripe customer created:', stripeCustomerId);
          
          // Save customer ID to database
          await db.execute('UPDATE users SET stripeCustomerId = ? WHERE id = ?', [stripeCustomerId, userId]);
          console.log('✅ CHECKOUT SUCCESS: Stripe customer ID saved to database');
        }
        
        // Create subscription for existing user
        const startDate = new Date();
        const nextBillingDate = new Date();
        nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);
        console.log('📝 CHECKOUT SUCCESS: Subscription dates:', { startDate, nextBillingDate });

        // Get the actual Stripe subscription ID from the session
        let stripeSubscriptionId = null;
        if (session.subscription) {
          stripeSubscriptionId = session.subscription;
          console.log('✅ CHECKOUT SUCCESS: Found Stripe subscription ID:', stripeSubscriptionId);
        } else {
          console.log('⚠️ CHECKOUT SUCCESS: No subscription ID in session, using session ID as fallback');
          stripeSubscriptionId = session.id;
        }
        
        const [result] = await db.execute(
          'INSERT INTO subscriptions (userId, planId, status, stripeSubscriptionId, startDate, nextBillingDate) VALUES (?, ?, ?, ?, ?, ?)',
          [userId, planId, 'active', stripeSubscriptionId, startDate, nextBillingDate]
        );
        console.log('✅ CHECKOUT SUCCESS: Subscription created with ID:', result.insertId);
      } catch (dbError) {
        console.error('❌ CHECKOUT SUCCESS: Database error:', dbError);
        return res.status(500).json({ error: 'Failed to create subscription' });
      }

      console.log('✅ CHECKOUT SUCCESS: Subscription completed for existing user:', userId);
      return res.json({ success: true, message: 'Subscription completed successfully' });
    }
    console.log('🔄 CHECKOUT SUCCESS: Not an existing user, processing as new user...');

    // 1️⃣ Fetch pending user using session ID (for new users)
    console.log('🔄 STEP A: Fetching pending user...');
    console.log('🔍 STEP A: Looking for session ID:', session_id);
    try {
      const [pendingUserRows] = await db.execute(
        'SELECT * FROM pending_users WHERE stripePaymentIntentId = ?',
        [session_id]
      );
      console.log('📊 STEP A: Found pending users:', pendingUserRows.length);
      
      if (!pendingUserRows.length) {
        console.error('❌ STEP A: No pending user found for session:', session_id);
        console.log('🔍 STEP A: Checking all pending users...');
        const [allPending] = await db.execute('SELECT id, email, stripePaymentIntentId FROM pending_users');
        console.log('📝 STEP A: All pending users:', allPending);
        return res.status(404).json({ error: 'Pending user not found' });
      }
      
      var pendingUser = pendingUserRows[0];
      console.log('✅ STEP A: Found pending user for email:', pendingUser.email);
    } catch (dbError) {
      console.error('❌ STEP A: Database error fetching pending user:', {
        message: dbError.message,
        code: dbError.code,
        sqlMessage: dbError.sqlMessage
      });
      return res.status(500).json({ error: 'Database error fetching pending user' });
    }



    // 2️⃣ Extract data from the pending user
    const { fullName, email, passwordHash, planId } = pendingUser;

    // Check if user was already created (prevent duplicate creation)
    console.log('🔄 STEP A2: Checking if user already exists for email:', email);
    try {
      const [existingUsers] = await db.execute('SELECT id FROM users WHERE email = ?', [email]);
      console.log('📊 STEP A2: Existing users found:', existingUsers.length);
      
      if (existingUsers.length > 0) {
        console.log('⚠️ STEP A2: User already exists, cleaning up pending user');
        await db.execute('DELETE FROM pending_users WHERE id = ?', [pendingUser.id]);
        console.log('✅ STEP A2: Pending user cleaned up');
        return res.json({ message: 'User already exists', redirect: '/login?message=account_exists' });
      }
      console.log('✅ STEP A2: User does not exist, proceeding with creation');
    } catch (dbError) {
      console.error('❌ STEP A2: Database error checking existing user:', {
        message: dbError.message,
        code: dbError.code
      });
      return res.status(500).json({ error: 'Database error checking existing user' });
    }

    // 3️⃣ Create Stripe customer
    console.log('🔄 STEP B: Creating Stripe customer...');
    let stripeCustomerId = null;
    try {
      const customer = await stripeService.createCustomer(email, fullName || email.split('@')[0]);
      stripeCustomerId = customer.id;
      console.log('✅ STEP B: Stripe customer created:', stripeCustomerId);
    } catch (stripeError) {
      console.error('❌ STEP B: Stripe customer creation failed:', {
        message: stripeError.message,
        type: stripeError.type,
        code: stripeError.code
      });
      // Continue without customer ID - can be created later
    }
    
    // 4️⃣ Create the actual user record
    console.log('🧩 STEP C: Creating real user from pending...');
    console.log('📝 STEP C: User data to insert:', {
      fullName,
      email,
      emailVerified: true,
      role: 'user',
      stripeCustomerId
    });
    
    let userId;
    try {
      const [userResult] = await db.execute(
        'INSERT INTO users (fullName, email, passwordHash, emailVerified, role, stripeCustomerId) VALUES (?, ?, ?, ?, ?, ?)',
        [fullName, email, passwordHash, true, 'user', stripeCustomerId]
      );
      userId = userResult.insertId;
      console.log('✅ STEP C: User created with ID:', userId, 'Stripe ID:', stripeCustomerId);
    } catch (dbError) {
      console.error('❌ STEP C: Database error creating user:', {
        message: dbError.message,
        code: dbError.code,
        sqlMessage: dbError.sqlMessage
      });
      return res.status(500).json({ error: 'Database error creating user' });
    }
    
    // Verify the user was created with stripeCustomerId
    const [verifyUser] = await db.execute('SELECT stripeCustomerId FROM users WHERE id = ?', [userId]);
    console.log('🔍 STEP C: Verification - User stripeCustomerId in DB:', verifyUser[0]?.stripeCustomerId);

    // 5️⃣ Create a subscription entry
    console.log('🪙 STEP D: Creating subscription...');
    const startDate = new Date();
    const nextBillingDate = new Date();
    nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);

    // Get the actual Stripe subscription ID from the session
    let stripeSubscriptionId = null;
    if (session.subscription) {
      stripeSubscriptionId = session.subscription;
      console.log('✅ STEP D: Found Stripe subscription ID:', stripeSubscriptionId);
    } else {
      console.log('⚠️ STEP D: No subscription ID in session, using session ID as fallback');
      stripeSubscriptionId = session.id;
    }
    
    try {
      await db.execute(
        'INSERT INTO subscriptions (userId, planId, status, stripeSubscriptionId, startDate, nextBillingDate) VALUES (?, ?, ?, ?, ?, ?)',
        [userId, planId, 'active', stripeSubscriptionId, startDate, nextBillingDate]
      );
      console.log('✅ STEP D: Subscription created for user:', userId, 'plan:', planId);
    } catch (dbError) {
      console.error('❌ STEP D: Database error creating subscription:', {
        message: dbError.message,
        code: dbError.code,
        sqlMessage: dbError.sqlMessage,
        userId,
        planId,
        stripeSubscriptionId
      });
      return res.status(500).json({ error: 'Database error creating subscription' });
    }

    // 6️⃣ Clean up the pending user only after success
    await db.execute('DELETE FROM pending_users WHERE id = ?', [pendingUser.id]);
    console.log('🧹 STEP E: Deleted pending user record');

    // 7️⃣ Log completion and respond
    console.log('🎉 STEP F: User + Subscription created successfully for plan:', planId);
    return res.json({ success: true, message: 'Subscription completed successfully' });
  } catch (error) {
    console.error('❌ Checkout success error:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      code: error.code
    });
    res.status(500).json({ error: 'Failed to process payment success' });
  }
};

const cancelCheckout = async (req, res) => {
  try {
    const { session_id } = req.query;
    
    if (session_id) {
      // Clean up pending user
      await db.execute('DELETE FROM pending_users WHERE stripePaymentIntentId = ?', [session_id]);
      console.log('Cleaned up pending user for cancelled session:', session_id);
    }
    
    res.json({ message: 'Checkout cancelled' });
  } catch (error) {
    console.error('Cancel checkout error:', error);
    res.status(500).json({ error: 'Failed to cancel checkout' });
  }
};

module.exports = {
  createCheckoutSession,
  createExistingUserCheckout,
  handleCheckoutSuccess,
  cancelCheckout
};
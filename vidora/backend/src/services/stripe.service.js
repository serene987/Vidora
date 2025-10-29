const Stripe = require('stripe');

class StripeService {
  constructor() {
    if (process.env.STRIPE_SECRET_KEY) {
      this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
        apiVersion: '2024-06-20'
      });
    } else {
      console.warn('Stripe not initialized - STRIPE_SECRET_KEY not provided');
      this.stripe = null;
    }
  }

  async createCustomer(email, name) {
    console.log('🔄 STRIPE SERVICE: Creating customer:', { email, name });
    if (!this.stripe) {
      console.error('❌ STRIPE SERVICE: Stripe not configured for createCustomer');
      throw new Error('Stripe not configured');
    }
    try {
      const customer = await this.stripe.customers.create({
        email,
        name
      });
      console.log('✅ STRIPE SERVICE: Customer created successfully:', customer.id);
      return customer;
    } catch (error) {
      console.error('❌ STRIPE SERVICE: Failed to create customer:', {
        email,
        message: error.message,
        type: error.type,
        code: error.code
      });
      throw error;
    }
  }

  async createSubscription(customerId, priceId) {
    if (!this.stripe) throw new Error('Stripe not configured');
    return this.stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      payment_behavior: 'default_incomplete',
      payment_settings: { save_default_payment_method: 'on_subscription' },
      expand: ['latest_invoice.payment_intent']
    });
  }

  async cancelSubscription(subscriptionId) {
    if (!this.stripe) throw new Error('Stripe not configured');
    return this.stripe.subscriptions.cancel(subscriptionId);
  }

  async constructEvent(payload, signature) {
    if (!this.stripe) throw new Error('Stripe not configured');
    return this.stripe.webhooks.constructEvent(
      payload,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  }

  async createCheckoutSession({ email, planId, planTitle, planPrice, billingCycle, metadata }) {
    console.log('🔄 STRIPE SERVICE: createCheckoutSession called');
    console.log('📋 STRIPE SERVICE: Input params:', { email, planId, planTitle, planPrice, billingCycle, metadata });
    
    if (!this.stripe) {
      console.error('❌ STRIPE SERVICE: Stripe not configured - missing STRIPE_SECRET_KEY');
      throw new Error('Stripe not configured');
    }
    console.log('✅ STRIPE SERVICE: Stripe client initialized');
    
    const sessionData = {
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: planTitle,
              description: `${planTitle} - ${billingCycle} subscription`
            },
            unit_amount: Math.round(planPrice * 100),
            recurring: {
              interval: billingCycle === 'monthly' ? 'month' : 'year'
            }
          },
          quantity: 1
        }
      ],
      mode: 'subscription',
      customer_email: email,
      success_url: `${process.env.FRONTEND_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/plans?cancelled=true`,
      metadata
    };
    
    console.log('📋 STRIPE SERVICE: Session data to send to Stripe:', JSON.stringify(sessionData, null, 2));
    
    try {
      const session = await this.stripe.checkout.sessions.create(sessionData);
      console.log('✅ STRIPE SERVICE: Session created successfully:', { id: session.id, url: session.url });
      return session;
    } catch (stripeError) {
      console.error('❌ STRIPE SERVICE: Stripe API error:', {
        message: stripeError.message,
        type: stripeError.type,
        code: stripeError.code,
        statusCode: stripeError.statusCode
      });
      throw stripeError;
    }
  }

  async retrieveSession(sessionId) {
    console.log('🔄 STRIPE SERVICE: Retrieving session:', sessionId);
    if (!this.stripe) {
      console.error('❌ STRIPE SERVICE: Stripe not configured for retrieveSession');
      throw new Error('Stripe not configured');
    }
    try {
      const session = await this.stripe.checkout.sessions.retrieve(sessionId, {
        expand: ['subscription', 'customer']
      });
      console.log('✅ STRIPE SERVICE: Session retrieved successfully:', {
        id: session.id,
        payment_status: session.payment_status,
        customer: session.customer?.id,
        subscription: session.subscription?.id || session.subscription
      });
      return session;
    } catch (error) {
      console.error('❌ STRIPE SERVICE: Failed to retrieve session:', {
        sessionId,
        message: error.message,
        type: error.type,
        code: error.code
      });
      throw error;
    }
  }


}

module.exports = new StripeService();
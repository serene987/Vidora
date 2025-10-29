const { Router } = require('express');
const stripeService = require('../services/stripe.service');
const { testStripeData } = require('../controllers/test.controller');

const router = Router();

// Test Stripe data in database
router.get('/stripe-data', testStripeData);

// Test Stripe connection
router.get('/stripe-test', async (req, res) => {
  try {
    if (!stripeService.stripe) {
      res.status(500).json({ 
        error: 'Stripe not configured',
        hasSecretKey: !!process.env.STRIPE_SECRET_KEY 
      });
      return;
    }

    // Test creating a simple product to verify connection
    const testProduct = await stripeService.stripe.products.create({
      name: 'Test Product',
      type: 'service'
    });

    // Clean up test product
    await stripeService.stripe.products.del(testProduct.id);

    res.json({ 
      status: 'Stripe connection successful',
      apiVersion: stripeService.stripe.getApiField('version')
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Stripe connection failed',
      message: error.message 
    });
  }
});

module.exports = router;
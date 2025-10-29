const { Router } = require('express');
const { createCheckoutSession, createExistingUserCheckout, handleCheckoutSuccess, cancelCheckout } = require('../controllers/checkout.controller');
const { authenticate } = require('../middleware/auth.middleware');

const router = Router();

// Test route
router.get('/test-checkout', (req, res) => {
  res.json({ message: 'Checkout routes working' });
});

router.post('/create-checkout-session', createCheckoutSession);
router.post('/existing-user', authenticate, createExistingUserCheckout);
router.get('/checkout-success', handleCheckoutSuccess);
router.post('/checkout-cancel', cancelCheckout);

module.exports = router;
const { Router } = require('express');
const { handleStripeWebhook } = require('../controllers/webhook.controller');

const router = Router();

router.post('/stripe', handleStripeWebhook);

module.exports = router;
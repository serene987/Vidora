const { Router } = require('express');
const { createSubscription, getSubscriptions, cancelSubscription } = require('../controllers/subscription.controller');
const { authenticate, requireEmailVerified } = require('../middleware/auth.middleware');

const router = Router();

router.use(authenticate);
router.use(requireEmailVerified);

router.post('/', createSubscription);
router.get('/', getSubscriptions);
router.post('/:id/cancel', cancelSubscription);

module.exports = router;
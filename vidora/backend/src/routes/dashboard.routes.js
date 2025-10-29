const { Router } = require('express');
const { getDashboardData, changePassword, cancelPlan } = require('../controllers/dashboard.controller');
const { authenticate } = require('../middleware/session.middleware');

const router = Router();

// Test route without auth
router.get('/test', (req, res) => {
  console.log('🧪 DASHBOARD TEST: Route hit successfully');
  res.json({ message: 'Dashboard routes working', timestamp: new Date().toISOString() });
});

router.get('/dashboard', authenticate, getDashboardData);
router.post('/password', authenticate, changePassword);
router.post('/subscriptions/cancel', authenticate, cancelPlan);

module.exports = router;
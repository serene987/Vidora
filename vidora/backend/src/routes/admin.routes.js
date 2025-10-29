const { Router } = require('express');
const { createPlan, updatePlan } = require('../controllers/plan.controller');
const { authenticate, requireAdmin } = require('../middleware/auth.middleware');

const router = Router();

router.use(authenticate);
router.use(requireAdmin);

router.post('/plans', createPlan);
router.patch('/plans/:id', updatePlan);

module.exports = router;
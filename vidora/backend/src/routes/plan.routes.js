const { Router } = require('express');
const { getPlans, getPlan } = require('../controllers/plan.controller');

const router = Router();

router.get('/', getPlans);
router.get('/:id', getPlan);

module.exports = router;
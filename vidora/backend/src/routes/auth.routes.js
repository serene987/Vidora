const { Router } = require('express');
const { register, verifyEmail, login, logout, checkSession, continuePendingPlan } = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/session.middleware');

const router = Router();

router.post('/register', register);
router.get('/verify-email', verifyEmail);
router.post('/login', login);
router.post('/logout', logout);
router.get('/check-session', checkSession);
router.post('/continue-pending', continuePendingPlan);

module.exports = router;
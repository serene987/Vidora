const { Router } = require('express');
const { getProfile, updateProfile, deleteAccount, exportData, getDashboard, updatePassword, cancelSubscription } = require('../controllers/user.controller');
const { authenticate } = require('../middleware/session.middleware');

const router = Router();

router.use(authenticate);

router.get('/me', getProfile);
router.patch('/me', updateProfile);
router.delete('/me', deleteAccount);
router.delete('/delete', deleteAccount);
router.get('/me/export', exportData);


module.exports = router;
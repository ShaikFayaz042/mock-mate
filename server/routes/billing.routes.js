const router = require('express').Router();
const authMiddleware = require('../middleware/auth.middleware');
const { createOrder, verifyPayment, getPlans } = require('../controllers/billing.controller');

router.use(authMiddleware);
router.post('/create-order', createOrder);
router.post('/verify', verifyPayment);
router.get('/plans', getPlans);

module.exports = router;
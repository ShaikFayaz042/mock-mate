const router = require('express').Router();
const authMiddleware = require('../middleware/auth.middleware');
const { getFeedback } = require('../controllers/feedback.controller');

router.use(authMiddleware);
router.get('/:interviewId', getFeedback);

module.exports = router;
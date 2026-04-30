const router = require('express').Router();
const authMiddleware = require('../middleware/auth.middleware');
const { startInterview, submitAnswer, getInterview, getUserInterviews, completeInterview } = require('../controllers/interview.controller');
router.use(authMiddleware); // all routes protected

router.post('/start', startInterview);
router.post('/:id/answer', submitAnswer);
router.get('/:id', getInterview);
router.get('/user/all', getUserInterviews);
router.post('/:id/complete', completeInterview);
module.exports = router;
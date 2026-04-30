const router = require('express').Router();
const authMiddleware = require('../middleware/auth.middleware');
const { upload, verifyFileType } = require('../middleware/upload.middleware');
const {
  updateProfile,
  getProfile,
  uploadResume,
  changePassword,
  deleteAccount,
  updatePlan
} = require('../controllers/user.controller');

router.use(authMiddleware);

router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.post('/resume', upload.single('resume'), verifyFileType, uploadResume);
router.put('/change-password', changePassword);
router.delete('/account', deleteAccount);
router.put('/update-plan', updatePlan);

module.exports = router;
const router = require('express').Router();
const jwt = require('jsonwebtoken');
const { register, login, forgotPassword, resetPassword } = require('../controllers/auth.controller');
const passport = require('passport');

router.post('/register', register);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
// Google Auth routes
router.get('/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: '/login' }),
  (req, res) => {
    // Successful authentication, redirect to frontend with user data
    const user = req.user;
    // Generate JWT token for frontend
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '1h' }
    );
    
    // Redirect to frontend with token and user data
    const frontendUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    res.redirect(`${frontendUrl}/oauth-redirect?token=${token}&user=${encodeURIComponent(JSON.stringify({
      id: user._id,
      name: user.name,
      email: user.email,
      plan: user.plan,
      isProfileComplete: user.isProfileComplete
    }))}`);
  }
);

module.exports = router;
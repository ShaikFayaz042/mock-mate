require('dotenv').config();
const express = require('express');
const rateLimit = require('express-rate-limit');
const cors = require('cors');
const session = require('express-session');
const passport = require('passport');
const connectDB = require('./config/db');
const ttsRoutes = require('./routes/tts.routes'); // ✅ import TTS routes

const app = express();
connectDB();

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' }
});

// Apply rate limiter only to auth routes
app.use('/api/auth', limiter);

// ✅ 1. CORS (pehle)
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true }));

// ✅ 2. Body parser
app.use(express.json());

// ✅ 3. Static files (uploads)
app.use('/uploads', express.static('uploads'));

// ✅ 4. Session (passport ke liye jaroori)
app.use(session({
  secret: process.env.SESSION_SECRET || 'your_session_secret',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false } // localhost ke liye false, production mein true with https
}));

// ✅ 5. Passport
app.use(passport.initialize());
app.use(passport.session());

// ✅ 6. Load passport config
require('./config/passport');

// ✅ 7. Routes (sab kuch set hone ke baad – BEFORE app.listen)
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/user', require('./routes/user.routes'));
app.use('/api/interview', require('./routes/interview.routes'));
app.use('/api/feedback', require('./routes/feedback.routes'));
app.use('/api/billing', require('./routes/billing.routes'));
app.use('/api', ttsRoutes);  // ✅ TTS route added correctly

// ✅ 8. Start server (last step)
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
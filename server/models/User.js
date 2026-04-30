const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  plan: { type: String, enum: ['free', 'pro', 'premium'], default: 'free' },
  creditsRemaining: { type: Number, default: 100 },
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  profile: {
    phone: String,
    location: String,
    currentRole: String,
    targetRole: String,
    experienceLevel: String,
    skills: [String],
    targetCompanyType: String,
    resumeUrl: String,
    resumeParsed: {
      skills: [String],
      experience: [String],
      education: [String],
      projects: [String]
    }
  },
  isProfileComplete: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);
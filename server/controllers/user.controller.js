const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const { extractTextWithOCR } = require('../utils/ocrSpace');
const { parseResumeWithGemini } = require('../utils/resumeParser');
const User = require('../models/User');
const Interview = require('../models/Interview');
const Report = require('../models/Report');

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { name, phone, location, currentRole, targetRole, experienceLevel, skills, targetCompanyType } = req.body;
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (name) user.name = name;
    if (!user.profile) user.profile = {};

    if (phone !== undefined) user.profile.phone = phone;
    if (location !== undefined) user.profile.location = location;
    if (currentRole !== undefined) user.profile.currentRole = currentRole;
    if (targetRole !== undefined) user.profile.targetRole = targetRole;
    if (experienceLevel !== undefined) user.profile.experienceLevel = experienceLevel;
    if (targetCompanyType !== undefined) user.profile.targetCompanyType = targetCompanyType;

    if (skills !== undefined) {
      user.profile.skills = Array.isArray(skills)
        ? skills.filter(s => s && typeof s === 'string').map(s => s.trim())
        : [];
    }

    user.isProfileComplete = true;
    await user.save();

    res.json({
      message: 'Profile updated',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        plan: user.plan,
        profile: user.profile
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.uploadResume = async (req, res) => {
  let filePath = null;
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    filePath = req.file.path;

    let extractedText;
    try {
      extractedText = await extractTextWithOCR(filePath);
    } catch (ocrError) {
      console.error('OCR failed:', ocrError);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      return res.status(400).json({ error: 'Could not read PDF. Try a different file or add skills manually.' });
    }

    if (!extractedText || extractedText.trim().length < 50) {
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      return res.status(400).json({ error: 'PDF has very little text. Please add skills manually.' });
    }

    let parsed;
    try {
      parsed = await parseResumeWithGemini(extractedText);
    } catch (geminiError) {
      console.error('Gemini parsing error:', geminiError);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      return res.status(500).json({ error: 'AI parsing failed. Please add skills manually.' });
    }

    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (!user.profile) user.profile = {};
    const existingSkills = user.profile.skills || [];
    const newSkills = (parsed.skills || []).filter(s => !existingSkills.includes(s));

    user.profile.skills = [...existingSkills, ...newSkills];
    user.profile.resumeParsed = {
      skills: parsed.skills || [],
      experience: parsed.experience || [],
      education: parsed.education || [],
      projects: parsed.projects || []
    };

    // Store resume file permanently
    const fileName = `${user._id}_resume.pdf`;
    const permanentPath = path.join(__dirname, '../uploads', fileName);
    if (fs.existsSync(permanentPath)) fs.unlinkSync(permanentPath);
    fs.renameSync(filePath, permanentPath);
    user.profile.resumeUrl = `/uploads/${fileName}`;

    await user.save();

    res.json({
      message: 'Resume parsed successfully',
      data: {
        skills: newSkills,
        experience: parsed.experience,
        education: parsed.education,
        projects: parsed.projects,
        resumeUrl: user.profile.resumeUrl
      }
    });
  } catch (error) {
    console.error('Resume upload error:', error);
    if (filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath);
    res.status(500).json({ error: 'Failed to process resume. Please add skills manually.' });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) return res.status(401).json({ error: 'Current password is incorrect' });

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters' });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Failed to change password' });
  }
};

exports.deleteAccount = async (req, res) => {
  try {
    const userId = req.userId;
    await Interview.deleteMany({ userId });
    await Report.deleteMany({ userId });
    await User.findByIdAndDelete(userId);
    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({ error: 'Failed to delete account' });
  }
};

exports.updatePlan = async (req, res) => {
  try {
    const { plan } = req.body;
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    user.plan = plan;
    if (plan === 'free') {
      user.creditsRemaining = 100;
    } else if (plan === 'pro' || plan === 'premium') {
      user.creditsRemaining = 999999;
    }
    await user.save();
    res.json({ plan: user.plan, creditsRemaining: user.creditsRemaining });
  } catch (error) {
    console.error('Update plan error:', error);
    res.status(500).json({ error: 'Failed to update plan' });
  }
};

// ⚠️ The startInterview function has been removed because it belongs in interview.controller.js.
// Using it here would cause duplicate endpoints and missing imports.
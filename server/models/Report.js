const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  interviewId: { type: mongoose.Schema.Types.ObjectId, ref: 'Interview' },
  overallScore: Number,
  strengths: [String],
  improvements: [String],
  roadmap: String,
  pdfUrl: String,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Report', reportSchema);
const mongoose = require('mongoose');

const interviewSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  category: String,
  difficulty: String,
  mode: String,
  questionCount: Number,
  status: { type: String, enum: ['ongoing', 'completed'], default: 'ongoing' },
  questions: [
    {
      questionText: String,
      userAnswer: String,
      aiScore: Number,
      aiFeedback: String,
      duration: Number, // time taken to answer (seconds)
    }
  ],
  overallScore: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Interview', interviewSchema);
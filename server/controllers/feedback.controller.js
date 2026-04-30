const Interview = require('../models/Interview');
const User = require('../models/User');
const { generateFinalFeedback } = require('../utils/gemini');

/**
 * GET /api/feedback/:interviewId
 * Returns final feedback report for a completed interview
 */
exports.getFeedback = async (req, res) => {
  try {
    const { interviewId } = req.params;
    const userId = req.userId;

    // Fetch interview
    const interview = await Interview.findOne({ _id: interviewId, userId });
    if (!interview) return res.status(404).json({ error: 'Interview not found' });

    if (interview.status !== 'completed') {
      return res.status(400).json({ error: 'Interview not completed yet' });
    }

    // Fetch user profile
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Prepare questions with answers for Gemini
    const questionsWithAnswers = interview.questions.map(q => ({
      question: q.questionText,
      userAnswer: q.userAnswer || '(No answer provided)',
      aiScore: q.aiScore || 0,
      aiFeedback: q.aiFeedback || 'No feedback'
    }));

    // Generate final feedback using Gemini
    const feedbackData = await generateFinalFeedback(questionsWithAnswers, user.profile || {});

    // Also include overall score and question-wise details
    res.json({
      interviewId: interview._id,
      overallScore: interview.overallScore || 0,
      category: interview.category,
      difficulty: interview.difficulty,
      mode: interview.mode,
      completedAt: interview.createdAt,
      questions: questionsWithAnswers,
      summary: feedbackData.summary,
      strengths: feedbackData.strengths,
      improvements: feedbackData.improvements,
      roadmap: feedbackData.roadmap
    });
  } catch (error) {
    console.error('Feedback generation error:', error);
    res.status(500).json({ error: 'Failed to generate feedback' });
  }
};
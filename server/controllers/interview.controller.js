const Interview = require('../models/Interview');
const User = require('../models/User');
const { generateQuestions, evaluateAnswer } = require('../utils/gemini');

/**
 * POST /api/interview/start
 */
exports.startInterview = async (req, res) => {
  try {
    const { category, difficulty, mode, questionCount = 5, topic = 'general' } = req.body;
    const userId = req.userId;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Check credits
    if (user.creditsRemaining <= 0) {
      return res.status(403).json({ error: 'Insufficient credits. Please upgrade your plan.' });
    }

    // Generate questions – will throw if Gemini fails
    let questionsText;
    try {
      questionsText = await generateQuestions(
        user.profile || { targetRole: 'developer', skills: [] },
        category,
        difficulty,
        parseInt(questionCount) || 5
      );
    } catch (geminiError) {
      console.error('Gemini generation error:', geminiError);
      return res.status(503).json({ error: 'Question generation failed. Gemini is busy. Please try again later.' });
    }

    // Validate returned questions
    if (!questionsText || !Array.isArray(questionsText) || questionsText.length === 0) {
      return res.status(503).json({ error: 'Gemini returned no questions. Please try again later.' });
    }

    const questions = questionsText.map(q => ({
      questionText: q,
      userAnswer: '',
      aiScore: null,
      aiFeedback: '',
      duration: 0
    }));

    // Deduct credit
    user.creditsRemaining -= 1;
    await user.save();

    const interview = new Interview({
      userId,
      category,
      difficulty,
      mode,
      questionCount: questions.length,
      status: 'ongoing',
      questions
    });

    await interview.save();

    res.status(201).json({
      interviewId: interview._id,
      questions: questionsText,
      creditsRemaining: user.creditsRemaining
    });
  } catch (error) {
    console.error('Start interview error:', error);
    res.status(500).json({ error: 'Failed to start interview' });
  }
};

/**
 * POST /api/interview/:id/answer
 * Body: { questionIndex, userAnswer, duration }
 */
exports.submitAnswer = async (req, res) => {
  try {
    const { id } = req.params;
    const { questionIndex, userAnswer, duration } = req.body;
    const userId = req.userId;

    const interview = await Interview.findOne({ _id: id, userId });
    if (!interview) return res.status(404).json({ error: 'Interview not found' });
    if (interview.status === 'completed') return res.status(400).json({ error: 'Interview already completed' });

    const question = interview.questions[questionIndex];
    if (!question) return res.status(400).json({ error: 'Invalid question index' });

    // Get user profile for evaluation
    const user = await User.findById(userId);
    const evaluation = await evaluateAnswer(question.questionText, userAnswer, user.profile || {});

    // Update question fields
    question.userAnswer = userAnswer;
    question.aiScore = evaluation.score;
    question.aiFeedback = evaluation.feedback;
    question.duration = duration || 0;

    // Check if this was the last question
    const isLast = questionIndex === interview.questions.length - 1;
    if (isLast) {
      // Calculate overall average score
      const totalScore = interview.questions.reduce((sum, q) => sum + (q.aiScore || 0), 0);
      interview.overallScore = Math.round(totalScore / interview.questions.length);
      interview.status = 'completed';
    }

    await interview.save();

    res.json({ score: evaluation.score, feedback: evaluation.feedback });
  } catch (error) {
    console.error('Submit answer error:', error);
    res.status(500).json({ error: 'Failed to submit answer' });
  }
};

/**
 * POST /api/interview/:id/complete
 * Force complete the interview (calculate score based on existing answers)
 */
exports.completeInterview = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const interview = await Interview.findOne({ _id: id, userId });
    if (!interview) return res.status(404).json({ error: 'Interview not found' });
    if (interview.status === 'completed') {
      return res.status(400).json({ error: 'Interview already completed' });
    }

    // Calculate overall score: average of aiScore (null becomes 0)
    const totalScore = interview.questions.reduce((sum, q) => sum + (q.aiScore || 0), 0);
    interview.overallScore = Math.round(totalScore / interview.questions.length);
    interview.status = 'completed';

    await interview.save();

    res.json({ message: 'Interview completed', overallScore: interview.overallScore });
  } catch (error) {
    console.error('Complete interview error:', error);
    res.status(500).json({ error: 'Failed to complete interview' });
  }
};

/**
 * GET /api/interview/:id
 * Fetch interview details (for results page)
 */
exports.getInterview = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const interview = await Interview.findOne({ _id: id, userId });
    if (!interview) return res.status(404).json({ error: 'Interview not found' });

    res.json(interview);
  } catch (error) {
    console.error('Get interview error:', error);
    res.status(500).json({ error: 'Failed to fetch interview' });
  }
};

/**
 * GET /api/interview/user/all
 * Fetch all interviews of the logged-in user (for history page)
 */
exports.getUserInterviews = async (req, res) => {
  try {
    const userId = req.userId;
    const interviews = await Interview.find({ userId, status: 'completed' })
      .sort({ createdAt: -1 })
      .select('_id category mode difficulty overallScore createdAt');

    res.json(interviews);
  } catch (error) {
    console.error('Get user interviews error:', error);
    res.status(500).json({ error: 'Failed to fetch interviews' });
  }
};
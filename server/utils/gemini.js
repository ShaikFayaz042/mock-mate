const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
// Use a stable model – change if needed
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });

/**
 * Generate interview questions – THROWS ERROR on failure (no fallback)
 * Uses full user profile, resume parsed data, and dashboard settings.
 */
async function generateQuestions(userProfile, category, difficulty, count = 5) {
  // ----- 1. Build profile section -----
  let profileSection = `
- Current Role: ${userProfile.currentRole || 'Not specified'}
- Target Role: ${userProfile.targetRole || 'Software Developer'}
- Experience Level: ${userProfile.experienceLevel || 'entry level'}
- Skills: ${userProfile.skills?.join(', ') || 'general programming'}
- Target Company Type: ${userProfile.targetCompanyType || 'Any (General IT Company)'}
`;

  // ----- 2. Add resume parsed data if available -----
  const resume = userProfile.resumeParsed;
  if (resume && (resume.skills?.length || resume.experience?.length || resume.education?.length || resume.projects?.length)) {
    profileSection += `\n--- Parsed from Resume ---\n`;
    if (resume.skills?.length) profileSection += `- Extracted Skills: ${resume.skills.join(', ')}\n`;
    if (resume.experience?.length) profileSection += `- Experience: ${resume.experience.join('; ')}\n`;
    if (resume.education?.length) profileSection += `- Education: ${resume.education.join('; ')}\n`;
    if (resume.projects?.length) profileSection += `- Projects: ${resume.projects.join('; ')}\n`;
  }

  // ----- 3. Category instruction -----
  let categoryInstruction = '';
  if (category === 'hr') {
    categoryInstruction = 'Generate ONLY HR/behavioral interview questions (e.g., teamwork, conflict resolution, leadership, strengths/weaknesses, situational questions). NO technical questions.';
  } else if (category === 'mix') {
    categoryInstruction = 'Generate a balanced MIX of technical and HR/behavioral questions. About 50% technical, 50% HR, alternating randomly.';
  } else {
    categoryInstruction = 'Generate ONLY technical interview questions (coding, algorithms, system design, programming concepts, etc.). NO HR questions.';
  }

  // ----- 4. Full prompt -----
  const prompt = `You are an expert interviewer. ${categoryInstruction}
Generate exactly ${count} ${difficulty} level interview questions for a candidate with the following profile:
${profileSection}

Return ONLY a JSON array of strings. Example: ["Question 1", "Question 2"]
No extra text, no markdown.`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const clean = text.replace(/```json|```/g, '').trim();
    const questions = JSON.parse(clean);
    if (!Array.isArray(questions) || questions.length === 0) {
      throw new Error('Gemini returned invalid or empty questions');
    }
    return questions.slice(0, count);
  } catch (error) {
    console.error('Gemini question generation error:', error);
    throw new Error('Gemini API failed: ' + error.message);
  }
}

/**
 * Evaluate a single answer – always returns a score on error (to avoid breaking flow)
 */
async function evaluateAnswer(question, userAnswer, userProfile) {
  const prompt = `You are an interviewer. Evaluate this answer.

Question: "${question}"
User's answer: "${userAnswer}"
Target role: ${userProfile.targetRole || 'Software Developer'}

Return ONLY JSON: {"score": 0-100, "feedback": "short constructive feedback (max 30 words)"}
No extra text.`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const clean = text.replace(/```json|```/g, '').trim();
    const evaluation = JSON.parse(clean);
    return {
      score: Math.min(100, Math.max(0, evaluation.score || 70)),
      feedback: evaluation.feedback || 'Good answer, keep practicing!'
    };
  } catch (error) {
    console.error('Gemini evaluation error:', error);
    return { score: 70, feedback: 'Could not evaluate. Good effort!' };
  }
}

/**
 * Generate final feedback report – includes fallback for resilience
 */
async function generateFinalFeedback(questionsWithAnswers, userProfile) {
  const prompt = `You are a career coach. Analyze this interview performance and generate feedback.

Candidate: ${userProfile.targetRole || 'Developer'} with skills: ${userProfile.skills?.join(', ') || 'general'}

Interview Q&A:
${questionsWithAnswers.map((q, i) => `
Q${i+1}: ${q.question}
Answer: ${q.userAnswer}
Score: ${q.aiScore}/100
Feedback: ${q.aiFeedback}
`).join('\n')}

Return ONLY valid JSON with this structure:
{
  "summary": "Overall assessment (2-3 sentences)",
  "strengths": ["strength1", "strength2", "strength3"],
  "improvements": ["improvement1", "improvement2", "improvement3"],
  "roadmap": "3-week improvement plan as paragraph"
}`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const clean = text.replace(/```json|```/g, '').trim();
    return JSON.parse(clean);
  } catch (error) {
    console.error('Final feedback error:', error);
    return {
      summary: "You showed good effort. Keep practicing to improve.",
      strengths: ["Good communication", "Tried to answer all questions"],
      improvements: ["Provide more specific examples", "Structure answers better"],
      roadmap: "Week 1: Review core concepts. Week 2: Practice common questions. Week 3: Take mock interviews."
    };
  }
}

module.exports = { generateQuestions, evaluateAnswer, generateFinalFeedback };
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });

function safeJSONParse(text) {
  try {
    return JSON.parse(text);
  } catch (e) {
    let cleaned = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    try {
      return JSON.parse(cleaned);
    } catch (err) {
      console.error('JSON parse failed:', err.message);
      return null;
    }
  }
}

async function parseResumeWithGemini(pdfText) {
  // Check API key (optional but helpful)
  if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_gemini_api_key_here') {
    throw new Error('Gemini API key not configured. Please add skills manually.');
  }

  const prompt = `Extract structured information from this resume text.

Return ONLY valid JSON. No explanation, no extra text.

Use this exact format:
{
  "skills": ["skill1", "skill2"],
  "experience": ["role1", "role2"],
  "education": ["degree1", "degree2"],
  "projects": ["project1", "project2"]
}

Rules:
- skills: technical skills, programming languages, tools
- experience: job titles/roles only (not full descriptions)
- education: degrees, certifications, institutions
- projects: project names only
- If a category has no data, use empty array []

Resume text:
${pdfText.substring(0, 10000)}`; // limit length

  try {
    // Timeout wrapper (30 sec)
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Gemini API timeout')), 30000)
    );
    const resultPromise = model.generateContent(prompt);
    const result = await Promise.race([resultPromise, timeoutPromise]);
    const response = await result.response;
    const text = response.text().trim();
    const parsed = safeJSONParse(text);

    if (parsed && Array.isArray(parsed.skills) && Array.isArray(parsed.experience) &&
        Array.isArray(parsed.education) && Array.isArray(parsed.projects)) {
      return parsed;
    }
    throw new Error('Invalid JSON structure from Gemini');
  } catch (error) {
    console.error('Gemini parsing error:', error);
    throw error;
  }
}

module.exports = { parseResumeWithGemini };
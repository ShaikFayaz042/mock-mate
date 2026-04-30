import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import api from '../../utils/api';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, login } = useAuth();
  const { showToast } = useToast();

  // ========== INTERVIEW CUSTOMIZATION STATE ==========
  const [category, setCategory] = useState('technical');
  const [difficulty, setDifficulty] = useState('medium');
  const [mode, setMode] = useState('text');
  const [topic, setTopic] = useState('skills');
  const [questionCount, setQuestionCount] = useState(10);
  const [loadingInterview, setLoadingInterview] = useState(false);

  // ========== DASHBOARD STATS STATE ==========
  const [stats, setStats] = useState({
    totalInterviews: 0,
    avgScore: 0,
    bestScore: 0,
    creditsLeft: user?.creditsRemaining || 0,
  });
  const [recentInterviews, setRecentInterviews] = useState([]);
  const [loadingStats, setLoadingStats] = useState(true);

  // Fetch real user interview data from backend
  useEffect(() => {
    if (!user) return;

    const fetchDashboardData = async () => {
      try {
        // First, fetch fresh user profile to get credits
        const profileRes = await api.get('/user/profile');
        const freshUser = profileRes.data;
        // Update local storage and context
        localStorage.setItem('mockmate_user', JSON.stringify(freshUser));
        login(freshUser); // update auth context

        // Then fetch interviews
        const interviewsRes = await api.get('/interview/user/all');
        const interviews = interviewsRes.data;
        const total = interviews.length;
        const scores = interviews.map((i) => i.overallScore || 0);
        const avg = total > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / total) : 0;
        const best = total > 0 ? Math.max(...scores) : 0;

        setStats({
          totalInterviews: total,
          avgScore: avg,
          bestScore: best,
          creditsLeft: freshUser.creditsRemaining || 0,
        });
        setRecentInterviews(interviews.slice(0, 3));
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
        showToast('Could not load dashboard data', 'error');
      } finally {
        setLoadingStats(false);
      }
    };

    fetchDashboardData();
  }, [user, showToast]);

  // Start interview – save settings and navigate to interview room
  const handleStartInterview = async () => {
    setLoadingInterview(true);
    const settings = { category, difficulty, mode, topic, questionCount };

    try {
      const res = await api.post('/interview/start', settings);
      const { interviewId, questions, creditsRemaining } = res.data;

      // Update local storage with new credits
      const currentUser = JSON.parse(localStorage.getItem('mockmate_user'));
      currentUser.creditsRemaining = creditsRemaining;
      localStorage.setItem('mockmate_user', JSON.stringify(currentUser));

      // Also update auth context
      login(currentUser);

      navigate(`/interview/${interviewId}`, { state: { mode, questions } });
    } catch (err) {
      if (err.response?.status === 403) {
        showToast(err.response.data.error, 'error');
        // Optionally redirect to plans page
        setTimeout(() => navigate('/plans'), 2000);
      } else {
        showToast('Questions generation failed, Gemini is busy. Please try again later.', 'error');
      }
    } finally {
      setLoadingInterview(false);
    }
  };

  // Logout handler (clears local storage and context)
  const handleLogout = () => {
    localStorage.removeItem('mockmate_token');
    localStorage.removeItem('mockmate_user');
    window.location.href = '/login';
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center text-white">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-[#0f0f15] border-r border-[#2d2d3d] min-h-screen p-6 hidden md:block">
          <h2 className="text-xl font-bold bg-gradient-to-r from-[#7c3aed] to-[#3b82f6] bg-clip-text text-transparent mb-8">
            MockMate
          </h2>
          <nav className="space-y-4">
            <a href="#" className="block text-purple-400">
              Dashboard
            </a>
            <Link to="/history" className="block text-[#9ca3af] hover:text-white">
              My Interviews
            </Link>
            <Link to="/settings" className="block text-[#9ca3af] hover:text-white">
              Settings
            </Link>
            <Link to="/plans" className="block text-[#9ca3af] hover:text-white">
              Upgrade Plan
            </Link>
            <button
              onClick={handleLogout}
              className="block text-[#9ca3af] hover:text-white w-full text-left"
            >
              Logout
            </button>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6 md:p-8">
          {/* Welcome + Credits */}
          <div className="flex justify-between items-center mb-8 flex-wrap gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">
                Welcome back, {user?.name?.split(' ')[0] || 'User'} 👋
              </h1>
              <p className="text-[#9ca3af]">Ready to practice today?</p>
            </div>
            <div className="bg-[#13131a] border border-[#2d2d3d] rounded-lg px-4 py-2">
              <span className="text-[#9ca3af]">Credits: </span>
              <span className="text-purple-400 font-bold">{stats.creditsLeft}</span>
            </div>
          </div>

          {/* Stats Cards – Real data */}
          {loadingStats ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-[#13131a] border border-[#2d2d3d] rounded-xl p-4 animate-pulse">
                  <div className="h-4 bg-[#2d2d3d] rounded w-24 mb-2"></div>
                  <div className="h-8 bg-[#2d2d3d] rounded w-12"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
              <div className="bg-[#13131a] border border-[#2d2d3d] rounded-xl p-4">
                <p className="text-[#9ca3af] text-sm">Total Interviews</p>
                <p className="text-2xl font-bold">{stats.totalInterviews}</p>
              </div>
              <div className="bg-[#13131a] border border-[#2d2d3d] rounded-xl p-4">
                <p className="text-[#9ca3af] text-sm">Average Score</p>
                <p className="text-2xl font-bold">{stats.avgScore}%</p>
              </div>
              <div className="bg-[#13131a] border border-[#2d2d3d] rounded-xl p-4">
                <p className="text-[#9ca3af] text-sm">Best Score</p>
                <p className="text-2xl font-bold">{stats.bestScore}%</p>
              </div>
              <div className="bg-[#13131a] border border-[#2d2d3d] rounded-xl p-4">
                <p className="text-[#9ca3af] text-sm">Credits Left</p>
                <p className="text-2xl font-bold">{stats.creditsLeft}</p>
              </div>
            </div>
          )}

          {/* Interview Customization Section */}
          <div className="bg-[#13131a] border border-[#2d2d3d] rounded-2xl p-6 mb-10">
            <h2 className="text-xl font-bold mb-6">Customize Your Interview</h2>

            {/* Category Cards */}
            <div className="mb-8">
              <p className="text-[#9ca3af] mb-3">Interview Category</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {['technical', 'hr', 'mix'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategory(cat)}
                    className={`p-4 rounded-xl border-2 transition ${category === cat
                      ? 'border-purple-500 bg-purple-500/10'
                      : 'border-[#2d2d3d] hover:border-purple-500'
                      }`}
                  >
                    <div className="text-3xl mb-2">
                      {cat === 'technical' && '🖥️'}
                      {cat === 'hr' && '🤝'}
                      {cat === 'mix' && '🔀'}
                    </div>
                    <div className="font-semibold capitalize">{cat}</div>
                    <div className="text-xs text-[#9ca3af] mt-1">
                      {cat === 'technical' && 'Coding, DSA, System Design'}
                      {cat === 'hr' && 'Behavioral, Cultural Fit'}
                      {cat === 'mix' && 'Both Technical & HR'}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Difficulty Level */}
            <div className="mb-8">
              <p className="text-[#9ca3af] mb-3">Difficulty Level</p>
              <div className="flex gap-3">
                {['easy', 'medium', 'hard'].map((diff) => (
                  <button
                    key={diff}
                    onClick={() => setDifficulty(diff)}
                    className={`px-5 py-2 rounded-lg font-medium transition ${difficulty === diff
                      ? 'bg-purple-600 text-white'
                      : 'bg-[#1c1c27] text-[#9ca3af] hover:bg-purple-500/20'
                      }`}
                  >
                    {diff.charAt(0).toUpperCase() + diff.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Interview Mode */}
            <div className="mb-8">
              <p className="text-[#9ca3af] mb-3">Interview Mode</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { id: 'text', icon: '📝', title: 'Text Based', desc: 'Type your answers' },
                  { id: 'voice', icon: '🎤', title: 'Voice Based', desc: 'Speak into mic' },
                  { id: 'video', icon: '📹', title: 'Video Based', desc: 'Face + voice analysis' },
                ].map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setMode(m.id)}
                    className={`p-4 rounded-xl border-2 transition ${mode === m.id
                      ? 'border-purple-500 bg-purple-500/10'
                      : 'border-[#2d2d3d] hover:border-purple-500'
                      }`}
                  >
                    <div className="text-2xl mb-1">{m.icon}</div>
                    <div className="font-semibold">{m.title}</div>
                    <div className="text-xs text-[#9ca3af]">{m.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Topic Specific */}
            <div className="mb-8">
              <p className="text-[#9ca3af] mb-3">Topic Specific</p>
              <div className="flex flex-wrap gap-3">
                {[
                  { key: 'skills', label: '🧠 Interview on Your Skills' },
                  { key: 'communication', label: '🗣️ Communication Skills' },
                  { key: 'problem-solving', label: '🔧 Problem Solving' },
                  { key: 'leadership', label: '👔 Leadership & Situational' },
                  { key: 'domain', label: '🎯 Domain Specific' },
                ].map((t) => (
                  <button
                    key={t.key}
                    onClick={() => setTopic(t.key)}
                    className={`px-3 py-1.5 rounded-full text-sm transition ${topic === t.key
                      ? 'bg-purple-600 text-white'
                      : 'bg-[#1c1c27] text-[#9ca3af] hover:bg-purple-500/20'
                      }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Number of Questions Slider */}
            <div className="mb-8">
              <div className="flex justify-between items-center mb-2">
                <p className="text-[#9ca3af]">Number of Questions</p>
                <p className="text-purple-400 font-bold">{questionCount}</p>
              </div>
              <input
                type="range"
                min="5"
                max="20"
                step="1"
                value={questionCount}
                onChange={(e) => setQuestionCount(parseInt(e.target.value))}
                className="w-full h-2 bg-[#2d2d3d] rounded-lg appearance-none cursor-pointer accent-purple-500"
              />
              <div className="flex justify-between text-xs text-[#6b7280] mt-1">
                <span>5</span>
                <span>10</span>
                <span>15</span>
                <span>20</span>
              </div>
            </div>

            {/* Start Interview Button */}
            <button
              onClick={handleStartInterview}
              className="w-full py-3 bg-gradient-to-r from-[#7c3aed] to-[#3b82f6] rounded-xl font-bold text-lg shadow-lg shadow-purple-500/30 hover:scale-[1.02] transition"
            >
              🚀 Start Interview
            </button>
          </div>

          {/* Recent Interviews Table – Real Data */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Recent Interviews</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="border-b border-[#2d2d3d]">
                  <tr className="text-[#9ca3af] text-sm">
                    <th className="pb-2">Date</th>
                    <th className="pb-2">Type</th>
                    <th className="pb-2">Mode</th>
                    <th className="pb-2">Score</th>
                    <th className="pb-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {loadingStats ? (
                    <tr>
                      <td colSpan="5" className="py-4 text-center text-[#9ca3af]">
                        Loading...
                      </td>
                    </tr>
                  ) : recentInterviews.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="py-4 text-center text-[#9ca3af]">
                        No interviews yet. Start your first interview!
                      </td>
                    </tr>
                  ) : (
                    recentInterviews.map((item) => (
                      <tr key={item._id} className="border-b border-[#1c1c27]">
                        <td className="py-3">{new Date(item.createdAt).toLocaleDateString()}</td>
                        <td className="capitalize">{item.category || 'General'}</td>
                        <td>{item.mode || 'Text'}</td>
                        <td>
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs ${item.overallScore >= 70
                              ? 'bg-green-500/20 text-green-400'
                              : item.overallScore >= 50
                                ? 'bg-yellow-500/20 text-yellow-400'
                                : 'bg-red-500/20 text-red-400'
                              }`}
                          >
                            {item.overallScore || 0}%
                          </span>
                        </td>
                        <td>
                          <button
                            onClick={() => navigate(`/results/${item._id}`)}
                            className="text-purple-400 text-sm hover:underline"
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
      {loadingInterview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="text-center">
            <div className="text-4xl mb-4">🤖</div>
            <h2 className="text-xl font-bold text-white mb-2">Generating Questions</h2>
            <p className="text-[#9ca3af]">Please wait while AI creates personalized questions...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../context/ToastContext';
import api from '../../utils/api';

const History = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [interviews, setInterviews] = useState([]);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchInterviews = async () => {
      try {
        const res = await api.get('/interview/user/all');
        setInterviews(res.data);
      } catch (err) {
        console.error(err);
        showToast('Failed to load interview history', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchInterviews();
  }, [showToast]);

  // Filter logic
  const filtered = interviews.filter((item) => {
    if (filter !== 'all' && item.category?.toLowerCase() !== filter) return false;
    if (search && !item.category?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const getScoreBadge = (score) => {
    if (score >= 70) return 'bg-green-500/20 text-green-400';
    if (score >= 50) return 'bg-yellow-500/20 text-yellow-400';
    return 'bg-red-500/20 text-red-400';
  };

  // Calculate stats
  const totalInterviews = interviews.length;
  const avgScore = totalInterviews > 0
    ? Math.round(interviews.reduce((acc, i) => acc + (i.overallScore || 0), 0) / totalInterviews)
    : 0;
  const bestScore = totalInterviews > 0
    ? Math.max(...interviews.map(i => i.overallScore || 0))
    : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] text-white flex items-center justify-center">
        Loading your interview history...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-[#7c3aed] to-[#3b82f6] bg-clip-text text-transparent mb-2">
          My Interviews
        </h1>
        <p className="text-[#9ca3af] mb-8">Track your progress over time</p>

        {/* Stats Cards */}
        <div className="bg-[#13131a] border border-[#2d2d3d] rounded-2xl p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-[#9ca3af] text-sm">Total Interviews</p>
              <p className="text-2xl font-bold">{totalInterviews}</p>
            </div>
            <div>
              <p className="text-[#9ca3af] text-sm">Average Score</p>
              <p className="text-2xl font-bold">{avgScore}%</p>
            </div>
            <div>
              <p className="text-[#9ca3af] text-sm">Best Score</p>
              <p className="text-2xl font-bold">{bestScore}%</p>
            </div>
          </div>
          {totalInterviews > 1 && (
            <div className="mt-4 pt-4 border-t border-[#2d2d3d]">
              <p className="text-sm text-[#9ca3af]">
                📈 Progress trend:
                {interviews[0]?.overallScore > interviews[interviews.length - 1]?.overallScore
                  ? ' Improving! ✅'
                  : ' Keep practicing 💪'}
              </p>
            </div>
          )}
      </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-6">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="bg-[#1c1c27] border border-[#2d2d3d] rounded-lg px-3 py-2 text-sm"
          >
            <option value="all">All Types</option>
            <option value="technical">Technical</option>
            <option value="hr">HR</option>
            <option value="mix">Mix</option>
          </select>
          <input
            type="text"
            placeholder="Search by type..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-[#1c1c27] border border-[#2d2d3d] rounded-lg px-3 py-2 text-sm flex-1"
          />
        </div>

        {/* Interviews Table */}
        <div className="bg-[#13131a] border border-[#2d2d3d] rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-[#1c1c27] border-b border-[#2d2d3d]">
                <tr className="text-[#9ca3af] text-sm">
                  <th className="p-4">Date</th>
                  <th className="p-4">Type</th>
                  <th className="p-4">Mode</th>
                  <th className="p-4">Difficulty</th>
                  <th className="p-4">Score</th>
                  <th className="p-4"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => (
                  <tr key={item._id} className="border-b border-[#1c1c27] hover:bg-[#1c1c27]/50">
                    <td className="p-4">{new Date(item.createdAt).toLocaleDateString()}</td>
                    <td className="p-4 capitalize">{item.category || 'General'}</td>
                    <td className="p-4">{item.mode || 'Text'}</td>
                    <td className="p-4 capitalize">{item.difficulty || 'Medium'}</td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded-full text-xs ${getScoreBadge(item.overallScore || 0)}`}>
                        {item.overallScore || 0}%
                      </span>
                    </td>
                    <td className="p-4">
                      <button
                        onClick={() => navigate(`/results/${item._id}`)}
                        className="text-purple-400 text-sm hover:underline"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
                    </tbody>
                  </table>
          </div>
          </div>

          {filtered.length === 0 && (
            <div className="text-center text-[#9ca3af] py-10">
              No interviews found. Start your first interview from dashboard!
            </div>
          )}

          <div className="mt-6 text-center">
            <button onClick={() => navigate('/dashboard')} className="text-purple-400 underline">
              ← Back to Dashboard
            </button>
          </div>
        </div>
      </div>
      );
};

      export default History;
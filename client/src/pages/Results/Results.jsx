import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useToast } from '../../context/ToastContext';
import api from '../../utils/api';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const Results = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState(null);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const res = await api.get(`/feedback/${id}`);
        setReport(res.data);
      } catch (err) {
        console.error(err);
        showToast('Failed to load results', 'error');
        navigate('/dashboard');
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, [id, showToast, navigate]);

  const generatePDF = () => {
    if (!report) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Title
    doc.setFontSize(22);
    doc.setTextColor(124, 58, 237); // purple
    doc.text('MockMate Interview Report', pageWidth / 2, 20, { align: 'center' });

    // Date
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated: ${new Date().toLocaleString()}`, pageWidth / 2, 30, { align: 'center' });

    // Overall Score
    const overallScore = report.overallScore ||
      Math.round(report.questions.reduce((sum, q) => sum + (q.aiScore || 0), 0) / report.questions.length);
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text(`Overall Score: ${overallScore}%`, 14, 45);

    // Summary
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text('AI Summary:', 14, 60);
    const summaryLines = doc.splitTextToSize(report.summary || 'No summary available', pageWidth - 28);
    doc.text(summaryLines, 14, 68);

    let yPos = 68 + (summaryLines.length * 5);

    // Strengths
    doc.setFontSize(12);
    doc.setTextColor(0, 150, 0);
    doc.text('Strengths:', 14, yPos);
    yPos += 6;
    (report.strengths || []).forEach(s => {
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      doc.text(`• ${s}`, 20, yPos);
      yPos += 5;
    });
    yPos += 4;

    // Improvements
    doc.setFontSize(12);
    doc.setTextColor(200, 100, 0);
    doc.text('Areas to Improve:', 14, yPos);
    yPos += 6;
    (report.improvements || []).forEach(imp => {
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      doc.text(`• ${imp}`, 20, yPos);
      yPos += 5;
    });
    yPos += 8;

    // Question-wise table
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text('Question-wise Analysis:', 14, yPos);
    yPos += 6;

    const tableData = (report.questions || []).map((q, idx) => [
      idx + 1,
      q.question.length > 40 ? q.question.substring(0, 40) + '...' : q.question,
      q.aiScore || 0,
      q.aiFeedback || ''
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [['#', 'Question', 'Score', 'Feedback']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [124, 58, 237] },
      margin: { left: 14, right: 14 }
    });

    // Roadmap on new page if needed
    doc.addPage();
    doc.setFontSize(14);
    doc.setTextColor(124, 58, 237);
    doc.text('Improvement Roadmap', 14, 20);
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    const roadmap = report.roadmap || 'No roadmap provided.';
    const roadmapLines = doc.splitTextToSize(roadmap, pageWidth - 28);
    doc.text(roadmapLines, 14, 35);

    // Save PDF
    doc.save(`MockMate_Report_${new Date().toISOString().slice(0, 19)}.pdf`);
    showToast('PDF downloaded!', 'success');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] text-white flex items-center justify-center">
        Loading your results...
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] text-white flex items-center justify-center">
        No data found
      </div>
    );
  }

  const overallScore = report.overallScore ||
    Math.round(report.questions.reduce((sum, q) => sum + (q.aiScore || 0), 0) / report.questions.length);

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white py-8 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-[#7c3aed] to-[#3b82f6] bg-clip-text text-transparent">
            Interview Results
          </h1>
          <p className="text-[#9ca3af] mt-2">
            {report.category?.toUpperCase()} • {report.difficulty} • {report.mode} mode
          </p>
        </div>

        {/* Score Summary Card */}
        <div className="bg-[#13131a] border border-[#2d2d3d] rounded-2xl p-8 mb-8 text-center">
          <div className="text-6xl font-bold text-purple-400 mb-2">{overallScore}%</div>
          <div className="flex justify-center gap-2 mb-4">
            {'⭐'.repeat(Math.floor(overallScore / 20))}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
            <div className="bg-[#1c1c27] p-3 rounded-lg">
              <p className="text-[#9ca3af] text-sm">Questions Answered</p>
              <p className="text-2xl font-bold">
                {report.questions.filter(q => q.userAnswer && q.userAnswer !== '(No answer provided)').length}/{report.questions.length}
              </p>
            </div>
            <div className="bg-[#1c1c27] p-3 rounded-lg">
              <p className="text-[#9ca3af] text-sm">Avg Score</p>
              <p className="text-2xl font-bold">{overallScore}%</p>
            </div>
            <div className="bg-[#1c1c27] p-3 rounded-lg">
              <p className="text-[#9ca3af] text-sm">Completed</p>
              <p className="text-2xl font-bold">{new Date(report.completedAt).toLocaleDateString()}</p>
            </div>
          </div>
        </div>

        {/* Personalized Summary */}
        <div className="bg-[#13131a] border border-[#2d2d3d] rounded-2xl p-6 mb-8">
          <h2 className="text-xl font-bold mb-3">📝 AI Personalized Feedback</h2>
          <p className="text-[#9ca3af] mb-4">{report.summary}</p>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-green-400 font-semibold mb-2">✅ Strengths</h3>
              <ul className="list-disc list-inside text-sm text-[#9ca3af] space-y-1">
                {report.strengths?.map((s, i) => <li key={i}>{s}</li>)}
              </ul>
            </div>
            <div>
              <h3 className="text-yellow-400 font-semibold mb-2">📈 Areas to Improve</h3>
              <ul className="list-disc list-inside text-sm text-[#9ca3af] space-y-1">
                {report.improvements?.map((imp, i) => <li key={i}>{imp}</li>)}
              </ul>
            </div>
          </div>
        </div>

        {/* Per Question Breakdown (Accordion) */}
        <div className="bg-[#13131a] border border-[#2d2d3d] rounded-2xl p-6 mb-8">
          <h2 className="text-xl font-bold mb-4">📋 Question-wise Analysis</h2>
          <div className="space-y-3">
            {report.questions.map((q, idx) => (
              <details key={idx} className="bg-[#1c1c27] rounded-lg p-3">
                <summary className="cursor-pointer font-medium flex justify-between">
                  <span>Q{idx+1}: {q.question.substring(0, 60)}...</span>
                  <span className={`${q.aiScore >= 70 ? 'text-green-400' : 'text-yellow-400'}`}>{q.aiScore || 0}%</span>
                </summary>
                <div className="mt-3 pl-4 border-l-2 border-purple-500">
                  <p className="text-sm text-[#9ca3af]"><span className="text-white">Your answer:</span> {q.userAnswer}</p>
                  <p className="text-sm text-purple-300 mt-2">🤖 AI Feedback: {q.aiFeedback}</p>
                </div>
              </details>
            ))}
          </div>
        </div>

        {/* Improvement Roadmap */}
        <div className="bg-[#13131a] border border-[#2d2d3d] rounded-2xl p-6 mb-8">
          <h2 className="text-xl font-bold mb-3">🗓️ Improvement Roadmap</h2>
          <p className="text-[#9ca3af] whitespace-pre-line">{report.roadmap}</p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-4 justify-center">
          <button onClick={generatePDF} className="px-6 py-2 bg-purple-600 rounded-lg hover:bg-purple-700 transition">
            📄 Download Report (PDF)
          </button>
          <button onClick={() => navigate('/dashboard')} className="px-6 py-2 bg-gradient-to-r from-[#7c3aed] to-[#3b82f6] rounded-lg hover:scale-[1.02] transition">
            🔁 New Interview
          </button>
        </div>
      </div>
    </div>
  );
};

export default Results;
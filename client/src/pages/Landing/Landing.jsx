import { Link } from 'react-router-dom';
import Navbar from '../../components/Navbar/Navbar';
import Footer from '../../components/Footer/Footer';
import { useToast } from '../../context/ToastContext';

const Landing = () => {
  const { showToast } = useToast();
  return (
    <div className="bg-[#0a0a0f] text-white min-h-screen">
      <Navbar />

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 text-center relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-600/20 rounded-full blur-[100px] -z-10" />
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-bold leading-tight">
            Practice Interviews with{' '}
            <span className="bg-gradient-to-r from-[#7c3aed] to-[#3b82f6] bg-clip-text text-transparent">
              Real AI
            </span>
            .<br /> Get Real Results.
          </h1>
          <p className="text-[#9ca3af] text-lg md:text-xl mt-6 max-w-2xl mx-auto">
            AI-powered mock interviews that analyze your voice, confidence, and answers
            to help you land your dream job.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4 mt-8">
            <Link to="/signup" className="px-6 py-3 bg-gradient-to-r from-[#7c3aed] to-[#3b82f6] rounded-lg font-semibold shadow-lg shadow-purple-500/30 hover:scale-105 transition">
              🚀 Start Interview — Free
            </Link>
            <button onClick={() => showToast('Demo video coming soon!', 'info')} className="px-6 py-3 border border-[#2d2d3d] rounded-lg font-semibold hover:border-purple-500 transition">
              ▶ Watch Demo
            </button>
          </div>
          <div className="flex flex-wrap justify-center gap-4 mt-8 text-sm text-[#6b7280]">
            <span>✓ Free to start</span>
            <span>✓ No credit card</span>
            <span>✓ Instant</span>
          </div>
          <div className="flex justify-center gap-6 mt-8 text-[#9ca3af] text-sm">
            <span><strong className="text-white">10,000+</strong> Users</span>
            <span>•</span>
            <span><strong className="text-white">50,000+</strong> Interviews</span>
            <span>•</span>
            <span><strong className="text-white">4.8★</strong> Rating</span>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 max-w-7xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">Why MockMate?</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((f, i) => (
            <div key={i} className="bg-[#13131a] border border-[#2d2d3d] rounded-xl p-6 hover:border-purple-500 hover:-translate-y-1 transition duration-300">
              <div className="text-4xl mb-4">{f.icon}</div>
              <h3 className="text-xl font-semibold mb-2">{f.title}</h3>
              <p className="text-[#9ca3af] text-sm">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 max-w-7xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">How It Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {steps.map((step, i) => (
            <div key={i} className="text-center relative">
              <div className="w-16 h-16 bg-gradient-to-r from-[#7c3aed] to-[#3b82f6] rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4 relative z-10">
                {i+1}
              </div>
              <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
              <p className="text-[#9ca3af] text-sm">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Interview Modes */}
      <section className="py-20 px-4 max-w-7xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">Choose How You Want to Practice</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {modes.map((mode, i) => (
            <div key={i} className={`bg-[#13131a] border rounded-xl p-6 hover:border-purple-500 transition ${mode.recommended ? 'border-purple-500 shadow-lg shadow-purple-500/10' : 'border-[#2d2d3d]'}`}>
              <div className="text-4xl mb-3">{mode.icon}</div>
              <h3 className="text-xl font-bold mb-2">{mode.title}</h3>
              <p className="text-[#9ca3af] text-sm mb-3">{mode.desc}</p>
              <ul className="text-sm space-y-1">
                {mode.features.map((feat, j) => (
                  <li key={j} className="text-green-400">✓ {feat}</li>
                ))}
              </ul>
              {mode.recommended && <span className="inline-block mt-3 text-xs bg-purple-500/20 text-purple-300 px-2 py-1 rounded">★ Recommended</span>}
            </div>
          ))}
        </div>
      </section>

      {/* Pricing Preview */}
      <section id="pricing" className="py-20 px-4 max-w-7xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">Simple, Transparent Pricing</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan, i) => (
            <div key={i} className={`bg-[#13131a] border rounded-xl p-6 text-center ${plan.popular ? 'border-purple-500 shadow-xl relative' : 'border-[#2d2d3d]'}`}>
              {plan.popular && <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-purple-500 text-xs px-3 py-1 rounded-full">Most Popular</span>}
              <h3 className="text-2xl font-bold mt-2">{plan.name}</h3>
              <div className="text-3xl font-bold mt-4">{plan.price}<span className="text-sm text-[#9ca3af]">{plan.per}</span></div>
              <ul className="mt-6 space-y-2 text-sm text-left">
                {plan.features.map((feat, j) => (
                  <li key={j} className={feat.includes('✗') ? 'text-[#6b7280]' : 'text-green-400'}>{feat}</li>
                ))}
              </ul>
              <button className="w-full mt-6 py-2 rounded-lg border border-purple-500 text-purple-400 hover:bg-purple-500/10 transition">
                {plan.button}
              </button>
            </div>
          ))}
        </div>
      </section>

      <Footer />
    </div>
  );
};

// Data arrays
const features = [
  { icon: "🎯", title: "Personalized Questions", desc: "AI uses your profile to ask the right questions" },
  { icon: "📊", title: "Confidence Score", desc: "Real-time scoring based on your answers" },
  { icon: "🎤", title: "Voice & Face Analysis", desc: "Eye contact, expressions, speaking rate tracked" },
  { icon: "📄", title: "Download Report", desc: "PDF report with your roadmap to improve" }
];

const steps = [
  { title: "Setup Your Profile", desc: "Add your skills, upload resume, target role" },
  { title: "Practice with AI", desc: "Answer 10 questions by text/voice/video" },
  { title: "Get Detailed Feedback", desc: "AI gives scores, tips, roadmap, download report" }
];

const modes = [
  { icon: "📝", title: "Text Based", desc: "Type your answers in a chat window. Great for beginners.", features: ["Easy to start", "No mic needed"], recommended: false },
  { icon: "🎤", title: "Voice Based", desc: "Speak your answers into mic. AI speaks questions to you.", features: ["Realistic feel", "Voice analysis"], recommended: false },
  { icon: "📹", title: "Video Based", desc: "Full interview with camera on. AI avatar + voice + face tracking.", features: ["Most realistic", "Full analysis"], recommended: true }
];

const plans = [
  { name: "FREE", price: "₹0", per: "", features: ["✓ 100 credits", "✓ Text mode", "✗ No recording", "✗ No download"], button: "Get Started", popular: false },
  { name: "PRO", price: "₹299", per: "/month", features: ["✓ Unlimited credits", "✓ All modes", "✓ Recording", "✓ PDF Report", "✓ Confidence Score"], button: "Start Free Trial", popular: true },
  { name: "PREMIUM", price: "₹599", per: "/month", features: ["✓ Everything in Pro", "✓ Priority AI", "✓ Industry Qs", "✓ Roadmap"], button: "Go Premium", popular: false }
];

export default Landing;
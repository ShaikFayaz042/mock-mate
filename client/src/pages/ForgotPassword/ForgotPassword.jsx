import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useToast } from '../../context/ToastContext';
import api from '../../utils/api';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      showToast('Reset link sent! Check your email.', 'success');
    } catch (err) {
      showToast('Failed to send reset link', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-[#13131a] border border-[#2d2d3d] rounded-2xl p-8">
        <h2 className="text-2xl font-bold text-white text-center mb-6">Forgot Password?</h2>
        <p className="text-[#9ca3af] text-sm text-center mb-6">
          Enter your email and we'll send you a link to reset your password.
        </p>
        <form onSubmit={handleSubmit} className="space-y-5">
          <input
            type="email"
            placeholder="your@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2 bg-[#1c1c27] border border-[#2d2d3d] rounded-lg text-white"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 bg-gradient-to-r from-[#7c3aed] to-[#3b82f6] rounded-lg font-semibold"
          >
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>
        <p className="text-center text-[#9ca3af] text-sm mt-4">
          <Link to="/login" className="text-purple-400 hover:underline">Back to Login</Link>
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;
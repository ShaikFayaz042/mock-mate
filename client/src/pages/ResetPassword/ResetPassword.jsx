import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useToast } from '../../context/ToastContext';
import api from '../../utils/api';

const ResetPassword = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState('');
  const [email, setEmail] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    setToken(params.get('token') || '');
    setEmail(params.get('email') || '');
  }, [location]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      showToast('Passwords do not match', 'error');
      return;
    }
    if (password.length < 6) {
      showToast('Password must be at least 6 characters', 'error');
      return;
    }
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { email, token, newPassword: password });
      showToast('Password reset successful! Please login.', 'success');
      navigate('/login');
    } catch (err) {
      showToast(err.response?.data?.error || 'Reset failed. Try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-[#13131a] border border-[#2d2d3d] rounded-2xl p-8">
        <h2 className="text-2xl font-bold text-white text-center mb-6">Set New Password</h2>
        <form onSubmit={handleSubmit} className="space-y-5">
          <input
            type="password"
            placeholder="New Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2 bg-[#1c1c27] border border-[#2d2d3d] rounded-lg text-white"
            required
          />
          <input
            type="password"
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full px-4 py-2 bg-[#1c1c27] border border-[#2d2d3d] rounded-lg text-white"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 bg-gradient-to-r from-[#7c3aed] to-[#3b82f6] rounded-lg font-semibold"
          >
            {loading ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
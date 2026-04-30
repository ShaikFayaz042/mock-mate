import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import api from '../../utils/api';

const Signup = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();
  const { showToast } = useToast();

  const handleGoogleLogin = () => {
    window.location.href = 'https://mock-mate-api.onrender.com/api/auth/google';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      showToast('Passwords do not match!', 'error');
      return;
    }
    if (password.length < 6) {
      showToast('Password must be at least 6 characters', 'error');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/auth/register', { name, email, password });
      const { token, user } = res.data;
      localStorage.setItem('mockmate_token', token);
      localStorage.setItem('mockmate_user', JSON.stringify(user));
      login(user);
      showToast('Account created successfully!', 'success');
      
      // ✅ New user always goes to plans page
      navigate('/plans');
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Signup failed. Try again.';
      showToast(errorMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const getPasswordStrength = () => {
    if (password.length === 0) return 0;
    if (password.length < 6) return 1;
    if (password.length < 8) return 2;
    return 3;
  };
  const strength = getPasswordStrength();
  const strengthText = ['', 'Weak', 'Medium', 'Strong'][strength];
  const strengthColor = ['', 'bg-red-500', 'bg-yellow-500', 'bg-green-500'][strength];

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center px-4 py-8">
      <div className="max-w-md w-full bg-[#13131a] border border-[#2d2d3d] rounded-2xl p-8 shadow-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#7c3aed] to-[#3b82f6] bg-clip-text text-transparent">
            MockMate
          </h1>
          <p className="text-[#9ca3af] mt-2">Create your account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-[#9ca3af] mb-1">Full Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 bg-[#1c1c27] border border-[#2d2d3d] rounded-lg text-white focus:outline-none focus:border-purple-500 transition"
              placeholder="Rahul Sharma"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#9ca3af] mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 bg-[#1c1c27] border border-[#2d2d3d] rounded-lg text-white focus:outline-none focus:border-purple-500 transition"
              placeholder="you@example.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#9ca3af] mb-1">Password</label>
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 bg-[#1c1c27] border border-[#2d2d3d] rounded-lg text-white focus:outline-none focus:border-purple-500 transition"
              placeholder="••••••••"
              required
            />
            {password.length > 0 && (
              <div className="mt-1">
                <div className="h-1 w-full bg-[#2d2d3d] rounded-full overflow-hidden">
                  <div className={`h-full ${strengthColor} transition-all duration-300`} style={{ width: `${(strength / 3) * 100}%` }}></div>
                </div>
                <p className="text-xs text-[#9ca3af] mt-1">Strength: {strengthText}</p>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-[#9ca3af] mb-1">Confirm Password</label>
            <input
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-2 bg-[#1c1c27] border border-[#2d2d3d] rounded-lg text-white focus:outline-none focus:border-purple-500 transition"
              placeholder="••••••••"
              required
            />
          </div>

          <div className="flex items-center gap-2">
            <input type="checkbox" id="showPass" onChange={() => setShowPassword(!showPassword)} />
            <label htmlFor="showPass" className="text-sm text-[#9ca3af]">Show password</label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 bg-gradient-to-r from-[#7c3aed] to-[#3b82f6] rounded-lg font-semibold shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transition disabled:opacity-70"
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[#2d2d3d]"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-[#13131a] text-[#9ca3af]">OR</span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleGoogleLogin}
          className="w-full py-2 border border-[#2d2d3d] rounded-lg flex items-center justify-center gap-2 hover:border-purple-500 transition"
        >
          <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
          Continue with Google
        </button>

        <p className="text-center text-[#9ca3af] text-sm mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-purple-400 hover:underline">Login</Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;
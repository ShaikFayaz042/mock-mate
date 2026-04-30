import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import api from '../../utils/api';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();
  const { showToast } = useToast();

  const handleGoogleLogin = () => {
    window.location.href = 'http://localhost:5000/api/auth/google';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { email, password });
      const { token, user } = res.data;
      localStorage.setItem('mockmate_token', token);
      localStorage.setItem('mockmate_user', JSON.stringify(user));
      login(user);
      showToast('Login successful!', 'success');

      // ✅ Redirect based on profile completion
      if (user.isProfileComplete) {
        navigate('/dashboard');
      } else {
        navigate('/profile/setup');
      }
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Invalid credentials';
      showToast(errorMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-[#13131a] border border-[#2d2d3d] rounded-2xl p-8 shadow-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#7c3aed] to-[#3b82f6] bg-clip-text text-transparent">
            MockMate
          </h1>
          <p className="text-[#9ca3af] mt-2">Welcome Back 👋</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
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
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 bg-[#1c1c27] border border-[#2d2d3d] rounded-lg text-white focus:outline-none focus:border-purple-500 transition"
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9ca3af] text-sm"
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          <div className="text-right">
            <Link to="/forgot-password" className="text-sm text-purple-400 hover:underline">
              Forgot Password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 bg-gradient-to-r from-[#7c3aed] to-[#3b82f6] rounded-lg font-semibold shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transition disabled:opacity-70"
          >
            {loading ? 'Logging in...' : 'Login'}
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
          New to MockMate?{' '}
          <Link to="/signup" className="text-purple-400 hover:underline">Sign up</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
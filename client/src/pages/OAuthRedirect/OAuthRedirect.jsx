import { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

const OAuthRedirect = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { login } = useAuth();
  const { showToast } = useToast();
  const hasRedirected = useRef(false); // prevent multiple runs

  useEffect(() => {
    // already handled once
    if (hasRedirected.current) return;
    
    const params = new URLSearchParams(location.search);
    const token = params.get('token');
    const userParam = params.get('user');

    if (token && userParam) {
      try {
        const user = JSON.parse(decodeURIComponent(userParam));
        localStorage.setItem('mockmate_token', token);
        localStorage.setItem('mockmate_user', JSON.stringify(user));
        login(user);
        showToast('Google login successful!', 'success');
        
        hasRedirected.current = true;
        
        // ✅ CORRECT REDIRECT
        if (user.isProfileComplete) {
          navigate('/dashboard', { replace: true });
        } else {
          // new user goes to plans page first
          navigate('/plans', { replace: true });
        }
      } catch (err) {
        console.error('OAuth parse error', err);
        showToast('Authentication failed', 'error');
        hasRedirected.current = true;
        navigate('/login', { replace: true });
      }
    } else {
      showToast('Authentication failed: missing data', 'error');
      hasRedirected.current = true;
      navigate('/login', { replace: true });
    }
  }, [location.search]); // ✅ only depends on location.search

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p>Processing Google login...</p>
      </div>
    </div>
  );
};

export default OAuthRedirect;
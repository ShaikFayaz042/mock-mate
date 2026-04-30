import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Landing from './pages/Landing/Landing';
import Login from './pages/Login/Login';
import Signup from './pages/Signup/Signup';
import Plans from './pages/Plans/Plans';  // <-- add this
import ProfileSetup from './pages/ProfileSetup/ProfileSetup';
import Dashboard from './pages/Dashboard/Dashboard';
import Payment from './pages/Payment/Payment';
import InterviewRoom from './pages/InterviewRoom/InterviewRoom';
import Results from './pages/Results/Results';
import History from './pages/History/History';
import NotFound from './pages/NotFound/NotFound';
import Settings from './pages/Settings/Settings';
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute';
import OAuthRedirect from './pages/OAuthRedirect/OAuthRedirect';
import ForgotPassword from './pages/ForgotPassword/ForgotPassword';
import ResetPassword from './pages/ResetPassword/ResetPassword';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/plans" element={<Plans />} />
        <Route path="/payment" element={<Payment />} />
        <Route path="*" element={<NotFound />} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/history" element={<ProtectedRoute><History /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
        <Route path="/interview/:id" element={<ProtectedRoute><InterviewRoom /></ProtectedRoute>} />
        <Route path="/results/:id" element={<ProtectedRoute><Results /></ProtectedRoute>} />
        <Route path="/profile/setup" element={<ProtectedRoute><ProfileSetup /></ProtectedRoute>} />
        <Route path="/oauth-redirect" element={<OAuthRedirect />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
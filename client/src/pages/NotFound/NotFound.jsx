import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center px-4">
      <div className="text-center">
        <div className="text-8xl md:text-9xl font-bold bg-gradient-to-r from-[#7c3aed] to-[#3b82f6] bg-clip-text text-transparent mb-4">
          404
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">Page Not Found</h1>
        <p className="text-[#9ca3af] mb-8">
          Oops! The page you are looking for doesn't exist or has been moved.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/"
            className="px-6 py-2 bg-gradient-to-r from-[#7c3aed] to-[#3b82f6] rounded-lg font-semibold shadow-lg hover:scale-105 transition"
          >
            🏠 Go Home
          </Link>
          <Link
            to="/dashboard"
            className="px-6 py-2 border border-[#2d2d3d] rounded-lg font-semibold hover:border-purple-500 transition"
          >
            📊 Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
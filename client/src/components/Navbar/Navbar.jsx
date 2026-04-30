import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${
      scrolled ? 'bg-[#0a0a0f]/90 backdrop-blur-md border-b border-[#2d2d3d]' : 'bg-transparent'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center gap-2">
            <span className="text-2xl font-bold bg-gradient-to-r from-[#7c3aed] to-[#3b82f6] bg-clip-text text-transparent">
              MockMate
            </span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-[#9ca3af] hover:text-white">Features</a>
            <a href="#pricing" className="text-[#9ca3af] hover:text-white">Pricing</a>
            <Link to="/login" className="text-[#9ca3af] hover:text-white">Login</Link>
            <Link to="/signup" className="px-4 py-2 bg-gradient-to-r from-[#7c3aed] to-[#3b82f6] rounded-lg text-white shadow-lg">
              Get Started
            </Link>
          </div>

          {/* Mobile burger */}
          <button className="md:hidden text-white" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            ☰
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-[#13131a] border border-[#2d2d3d] rounded-lg p-4 mt-2 flex flex-col gap-3">
            <a href="#features" className="text-[#9ca3af] hover:text-white">Features</a>
            <a href="#pricing" className="text-[#9ca3af] hover:text-white">Pricing</a>
            <Link to="/login" className="text-[#9ca3af] hover:text-white">Login</Link>
            <Link to="/signup" className="text-purple-400">Get Started</Link>
          </div>
        )}
      </div>
    </nav>
  );
};
export default Navbar;
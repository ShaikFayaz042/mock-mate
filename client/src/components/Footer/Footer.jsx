import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-[#0a0a0f] border-t border-[#2d2d3d] py-12 px-4 mt-auto">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
        <div>
          <h3 className="text-xl font-bold bg-gradient-to-r from-[#7c3aed] to-[#3b82f6] bg-clip-text text-transparent">
            MockMate
          </h3>
          <p className="text-[#9ca3af] text-sm mt-2">AI-powered interview prep platform</p>
        </div>
        <div>
          <h4 className="font-semibold text-white mb-3">Product</h4>
          <ul className="space-y-1 text-sm text-[#9ca3af]">
            <li><a href="#features" className="hover:text-white">Features</a></li>
            <li><Link to="/plans" className="hover:text-white">Pricing</Link></li>
            <li><a href="#" className="hover:text-white">How it works</a></li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold text-white mb-3">Company</h4>
          <ul className="space-y-1 text-sm text-[#9ca3af]">
            <li><a href="#" className="hover:text-white">About</a></li>
            <li><a href="#" className="hover:text-white">Blog</a></li>
            <li><a href="#" className="hover:text-white">Contact</a></li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold text-white mb-3">Connect</h4>
          <ul className="space-y-1 text-sm text-[#9ca3af]">
            <li><a href="#" className="hover:text-white">Twitter</a></li>
            <li><a href="#" className="hover:text-white">LinkedIn</a></li>
            <li><a href="#" className="hover:text-white">GitHub</a></li>
          </ul>
        </div>
      </div>
      <div className="text-center text-[#6b7280] text-xs pt-8 border-t border-[#2d2d3d] mt-8">
        © 2025 MockMate. All rights reserved.
      </div>
    </footer>
  );
};

export default Footer;
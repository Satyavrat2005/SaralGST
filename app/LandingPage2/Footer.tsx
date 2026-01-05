import React from 'react';
import { Twitter, Linkedin, Instagram, Github } from 'lucide-react';
import RevealOnScroll from './RevealOnScroll';

const Footer: React.FC = () => {
  return (
    <footer className="bg-white pt-4 pb-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <RevealOnScroll>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-12 mb-16">
            
            {/* Brand Column */}
            <div className="lg:col-span-2">
              <span className="text-brand-700 font-bold text-xl tracking-tight mb-4 block">Ask Johnny</span>
              <p className="text-gray-500 text-sm leading-relaxed max-w-xs mb-8">
                Your 24/7 AI-receptionist that answers, books, and delights while you focus on growing your business.
              </p>
              <div className="flex gap-4">
                <a href="#" className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-brand-50 hover:text-brand-600 transition-all">
                  <Twitter size={18} />
                </a>
                <a href="#" className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-brand-50 hover:text-brand-600 transition-all">
                  <Linkedin size={18} />
                </a>
                <a href="#" className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-brand-50 hover:text-brand-600 transition-all">
                  <Instagram size={18} />
                </a>
              </div>
            </div>
            
            {/* Links Column 1 */}
            <div>
              <h4 className="font-bold text-gray-900 mb-6">Product</h4>
              <ul className="space-y-4 text-sm text-gray-600">
                <li><a href="#" className="hover:text-brand-600 transition-colors">How it works</a></li>
                <li><a href="#" className="hover:text-brand-600 transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-brand-600 transition-colors">Demo</a></li>
                <li><a href="#" className="hover:text-brand-600 transition-colors">Features</a></li>
              </ul>
            </div>

            {/* Links Column 2 */}
            <div>
              <h4 className="font-bold text-gray-900 mb-6">Company</h4>
              <ul className="space-y-4 text-sm text-gray-600">
                <li><a href="#" className="hover:text-brand-600 transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-brand-600 transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-brand-600 transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-brand-600 transition-colors">Contact</a></li>
              </ul>
            </div>
            
            {/* Links Column 3 */}
            <div>
              <h4 className="font-bold text-gray-900 mb-6">Resources</h4>
              <ul className="space-y-4 text-sm text-gray-600">
                <li><a href="#" className="hover:text-brand-600 transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-brand-600 transition-colors">API Docs</a></li>
                <li><a href="#" className="hover:text-brand-600 transition-colors">Community</a></li>
                <li><a href="#" className="hover:text-brand-600 transition-colors">Status</a></li>
              </ul>
            </div>

            {/* Links Column 4 */}
             <div>
              <h4 className="font-bold text-gray-900 mb-6">Legal</h4>
              <ul className="space-y-4 text-sm text-gray-600">
                <li><a href="#" className="hover:text-brand-600 transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-brand-600 transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-brand-600 transition-colors">Cookie Policy</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-100 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-400">
            <p>&copy; {new Date().getFullYear()} AskJohnny AI. All rights reserved.</p>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500"></span>
              <span>All Systems Operational</span>
            </div>
          </div>
        </RevealOnScroll>
      </div>
    </footer>
  );
};

export default Footer;
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SignInButton } from '@clerk/clerk-react';

const Navbar: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-in-out animate-fade-in-down ${
        isScrolled
          ? 'bg-white shadow-sm py-3 md:py-4'
          : 'bg-transparent py-4 md:py-6'
      }`}
    >
      <div className="max-w-[1600px] mx-auto px-4 sm:px-8 lg:px-16 flex justify-between items-center">
        <div className="flex items-center cursor-pointer">
          <span className="text-brand-700 font-bold text-lg md:text-xl tracking-tight">Ask Johnny</span>
        </div>
        <div className="flex items-center gap-3 md:gap-4">
          <SignInButton mode="modal">
            <button className="px-4 py-2 md:px-8 md:py-2.5 font-medium hover:opacity-80 transition-opacity text-xs md:text-sm btn-secondary-custom">
              Login
            </button>
          </SignInButton>
          <button
            onClick={() => {
              console.log('🔘 Sign Up button clicked in Navbar - navigating to /new-onboarding');
              navigate('/new-onboarding');
            }}
            className="px-4 py-2 md:px-8 md:py-2.5 font-medium hover:opacity-90 transition-opacity text-xs md:text-sm btn-primary-custom"
          >
            Sign Up
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
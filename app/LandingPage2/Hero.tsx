import React from 'react';
import { Phone, Clock, CheckCircle, MoreHorizontal, Mic, Play } from 'lucide-react';

interface HeroProps {
  businessName: string;
  handleInputChange: (value: string) => void;
  handleSubmit: (e: React.FormEvent) => void;
}

const Hero: React.FC<HeroProps> = ({ businessName, handleInputChange, handleSubmit }) => {
  return (
    <section className="relative pt-24 pb-12 md:pt-32 md:pb-24 px-4 sm:px-6 lg:px-8 flex flex-col items-center text-center overflow-hidden hero-bg-custom">
      
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Large gradient orbs */}
        <div className="absolute top-0 left-[10%] w-[500px] h-[500px] bg-emerald-200/30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-[20%] right-[5%] w-[600px] h-[600px] bg-teal-200/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute bottom-[10%] left-[15%] w-[400px] h-[400px] bg-green-300/25 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        
        {/* Animated grid pattern */}
        <div className="absolute inset-0 opacity-[0.03]" 
             style={{ 
               backgroundImage: 'linear-gradient(rgba(16,185,129,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(16,185,129,0.4) 1px, transparent 1px)', 
               backgroundSize: '60px 60px',
             }}>
        </div>
        
        {/* Floating dots pattern */}
        <div className="absolute top-[15%] left-[20%] w-2 h-2 bg-emerald-400/40 rounded-full"></div>
        <div className="absolute top-[25%] right-[25%] w-3 h-3 bg-emerald-500/30 rounded-full"></div>
        <div className="absolute top-[40%] left-[15%] w-2 h-2 bg-teal-400/40 rounded-full"></div>
        <div className="absolute top-[60%] right-[15%] w-3 h-3 bg-green-400/30 rounded-full"></div>
        <div className="absolute bottom-[20%] left-[30%] w-2 h-2 bg-emerald-500/40 rounded-full"></div>
        <div className="absolute bottom-[30%] right-[35%] w-2 h-2 bg-teal-500/30 rounded-full"></div>
        
        {/* Subtle geometric shapes */}
        <div className="absolute top-[30%] right-[10%] w-20 h-20 border-2 border-emerald-300/20 rounded-lg rotate-45"></div>
        <div className="absolute bottom-[40%] left-[8%] w-16 h-16 border-2 border-teal-300/20 rounded-full"></div>
      </div>
      
      <div className=" mx-auto mt-4 mb-8 md:mb-12 relative z-10 animate-fade-in-up">
        <div className="flex  items-center justify-center gap-1.5 md:gap-2 text-[9px] sm:text-[10px] md:text-xs font-semibold text-gray-500 mb-2 md:mb-6 uppercase tracking-wide opacity-0 animate-fade-in-up animation-delay-200" style={{ animationFillMode: 'forwards' }}>
          <span>Instant setup</span>
          <span className="text-gray-300">•</span>
          <span>No interruptions</span>
          <span className="text-gray-300">•</span>
          <span>Real conversations</span>
        </div>
        
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-semibold text-gray-900 leading-[1.1] mb-3 md:mb-6 opacity-0 animate-fade-in-up animation-delay-200" style={{ animationFillMode: 'forwards' }}>
          Give your callers a  
          <span className="text-gradient"> Smart First </span>
           Impression
        </h1>
        
        <p className="text-sm sm:text-base md:text-lg text-gray-600 max-w-2xl mx-auto mb-6 md:mb-10 opacity-0 animate-fade-in-up animation-delay-400" style={{ animationFillMode: 'forwards' }}>
          Your 24/7 AI-receptionist that answers, books and delights while you focus on growing your business
        </p>

        {/* Search Bar */}
        <form onSubmit={handleSubmit} className="bg-white p-1 md:p-2 rounded-2xl shadow-xl shadow-brand-100/50 flex items-center max-w-lg mx-auto border border-gray-100 opacity-0 animate-fade-in-up animation-delay-600" style={{ animationFillMode: 'forwards' }}>
          <input
            type="text"
            value={businessName}
            onChange={(e) => handleInputChange(e.target.value)}
            placeholder="Enter your business name..."
            className="flex-1 px-3 py-2 md:px-6 md:py-3 rounded-full text-gray-700 placeholder-gray-400 focus:outline-none text-xs md:text-sm"
            autoComplete="organization"
          />
          <button
            type="submit"
            disabled={!businessName.trim()}
            className="btn-primary-custom px-3 py-2 md:px-8 md:py-3 font-medium transition-opacity hover:opacity-90 text-xs md:text-sm whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Get Started
          </button>
        </form>
      </div>

      {/* Hero Visual - Dashboard Preview */}
      <div className="w-full max-w-5xl mx-auto relative z-10 px-2 md:px-4 opacity-0 animate-zoom-in animation-delay-600" style={{ animationFillMode: 'forwards' }}>
        {/* Background Container with specific styles including blur */}
        <div className="relative rounded-[1.5rem] md:rounded-[2.1875rem] p-2">
            {/* The blur and gradient background layer */}
            <div className="absolute inset-0 dashboard-preview-bg"></div>
            
            {/* The Content Layer - High Fidelity Mockup */}
            <div className="relative bg-white rounded-[1.2rem] md:rounded-[1.8rem] shadow-sm overflow-hidden border border-white/50">
                
                {/* Header Bar */}
                <div className="bg-gray-50/50 border-b border-gray-100 px-4 md:px-6 py-3 md:py-4 flex items-center justify-between">
                    <div className="flex items-center gap-2 md:gap-3">
                        <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-red-500"></div>
                        <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-yellow-500"></div>
                        <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-green-500"></div>
                    </div>
                    <div className="text-[10px] md:text-xs font-medium text-gray-400 uppercase tracking-wider">Live Call Dashboard</div>
                    <MoreHorizontal className="w-4 h-4 md:w-5 md:h-5 text-gray-400" />
                </div>

                {/* Main Interface Content */}
                <div className="flex flex-col md:flex-row h-[350px] md:h-[500px]">
                    
                    {/* Left Sidebar - Stats */}
                    <div className="w-full md:w-64 bg-gray-50 border-r border-gray-100 p-6 flex flex-col gap-6 hidden md:flex">
                        <div>
                            <div className="text-xs text-gray-500 font-medium mb-2">Status</div>
                            <div className="flex items-center gap-2 text-green-600 bg-green-50 px-3 py-1.5 rounded-lg w-fit">
                                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                <span className="text-sm font-bold">Active</span>
                            </div>
                        </div>
                        <div>
                             <div className="text-xs text-gray-500 font-medium mb-2">Today's Volume</div>
                             <div className="text-2xl font-bold text-gray-800">42 Calls</div>
                             <div className="text-xs text-green-600 mt-1 flex items-center gap-1">
                                <CheckCircle size={12} /> All answered
                             </div>
                        </div>
                        <div className="mt-auto">
                            <div className="p-4 bg-brand-50 rounded-xl border border-brand-100">
                                <div className="text-brand-800 font-bold mb-1">AskJohnny AI</div>
                                <div className="text-xs text-brand-600">Version 2.0 Connected</div>
                            </div>
                        </div>
                    </div>

                    {/* Right Main - Chat/Transcript */}
                    <div className="flex-1 flex flex-col bg-white">
                        <div className="p-4 md:p-6 border-b border-gray-50 flex justify-between items-center">
                            <div>
                                <h3 className="font-bold text-gray-800 text-base md:text-lg flex items-center gap-2">
                                    Incoming Call
                                    <span className="bg-gray-100 text-gray-600 text-[10px] md:text-xs px-2 py-1 rounded-md font-normal hidden sm:inline-block">+1 (555) 012-3456</span>
                                </h3>
                                <p className="text-xs md:text-sm text-gray-500">00:42 • Recording...</p>
                            </div>
                            <button className="btn-primary-custom px-3 py-1.5 md:px-4 md:py-2 text-[10px] md:text-xs font-bold rounded-lg shadow-sm">
                                Take Over
                            </button>
                        </div>

                        <div className="flex-1 p-4 md:p-6 space-y-4 md:space-y-6 overflow-y-auto bg-gradient-to-b from-white to-gray-50/30">
                            {/* AI Message */}
                            <div className="flex gap-3 md:gap-4 max-w-[90%] md:max-w-[80%]">
                                <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-brand-100 flex items-center justify-center flex-shrink-0 border border-brand-200">
                                    <span className="font-bold text-brand-600 text-[10px] md:text-xs">AI</span>
                                </div>
                                <div className="bg-brand-50 p-3 md:p-4 rounded-2xl rounded-tl-none border border-brand-100 shadow-sm">
                                    <p className="text-gray-700 text-xs md:text-sm leading-relaxed">
                                        Hello! Thanks for calling Downtown Dental. I'm Johnny, the AI receptionist. How can I help you today?
                                    </p>
                                </div>
                            </div>

                            {/* User Message */}
                            <div className="flex gap-3 md:gap-4 max-w-[90%] md:max-w-[80%] ml-auto flex-row-reverse">
                                <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                                    <span className="font-bold text-gray-500 text-[10px] md:text-xs">Caller</span>
                                </div>
                                <div className="bg-white p-3 md:p-4 rounded-2xl rounded-tr-none border border-gray-100 shadow-md">
                                    <p className="text-gray-700 text-xs md:text-sm leading-relaxed">
                                        Hi, I'd like to schedule a cleaning for sometime next week. Do you have anything available on Tuesday?
                                    </p>
                                </div>
                            </div>

                            {/* AI Typing Indicator */}
                            <div className="flex gap-3 md:gap-4 max-w-[80%]">
                                <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-brand-100 flex items-center justify-center flex-shrink-0 border border-brand-200">
                                    <span className="font-bold text-brand-600 text-[10px] md:text-xs">AI</span>
                                </div>
                                <div className="flex items-center gap-1 bg-white p-2 md:p-3 rounded-2xl rounded-tl-none border border-gray-100 shadow-sm w-12 md:w-16 justify-center">
                                    <div className="w-1 md:w-1.5 h-1 md:h-1.5 bg-brand-400 rounded-full animate-bounce"></div>
                                    <div className="w-1 md:w-1.5 h-1 md:h-1.5 bg-brand-400 rounded-full animate-bounce delay-100"></div>
                                    <div className="w-1 md:w-1.5 h-1 md:h-1.5 bg-brand-400 rounded-full animate-bounce delay-200"></div>
                                </div>
                            </div>
                        </div>

                        {/* Action Bar */}
                        <div className="p-3 md:p-4 border-t border-gray-100 bg-gray-50 flex items-center gap-2 md:gap-3">
                            <button className="flex-1 bg-white border border-gray-200 p-2 md:p-3 rounded-xl text-xs md:text-sm font-medium text-gray-600 flex items-center justify-center gap-2 hover:bg-gray-50">
                                <Clock size={14} className="md:w-4 md:h-4" /> Check Calendar
                            </button>
                            <button className="flex-1 bg-white border border-gray-200 p-2 md:p-3 rounded-xl text-xs md:text-sm font-medium text-gray-600 flex items-center justify-center gap-2 hover:bg-gray-50">
                                <Phone size={14} className="md:w-4 md:h-4" /> Forward Call
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </div>

      {/* Trust Bar */}
      <div className="mt-10 md:mt-16 w-full max-w-6xl mx-auto relative z-10 px-4 animate-fade-in-up animation-delay-600" style={{ animationFillMode: 'forwards', opacity: 0 }}>
        <p className="text-gray-500 text-xs md:text-sm mb-4 md:mb-8 font-medium uppercase tracking-widest text-center opacity-70">Trusted by over 90% of Fortune 100 companies</p>
        <div className="flex flex-wrap justify-center items-center gap-x-6 gap-y-4 md:gap-x-12 md:gap-y-8 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
            {/* Simple text logos for now, matching the look */}
            <h3 className="text-base md:text-xl font-bold font-serif">Heineken</h3>
            <h3 className="text-base md:text-xl font-bold tracking-tight">MERCK</h3>
            <h3 className="text-base md:text-xl font-bold italic">SAP</h3>
            <h3 className="text-base md:text-xl font-bold text-blue-500">zoom</h3>
            <h3 className="text-base md:text-xl font-bold font-serif">Mondelēz</h3>
            <h3 className="text-base md:text-xl font-bold tracking-widest">BOSCH</h3>
        </div>
      </div>
    </section>
  );
};

export default Hero;
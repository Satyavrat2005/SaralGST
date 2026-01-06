'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, X, FileText, Calculator, Bell, Shield, TrendingUp, Users, Building2, ShoppingBag, Truck, Wrench, Plus, Minus, Twitter, Linkedin, Instagram } from 'lucide-react';
import RevealOnScroll from './LandingPage2/RevealOnScroll';

export default function LandingPage() {
  const router = useRouter();
  const [businessName, setBusinessName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (businessName.trim()) {
      router.push('/auth');
    }
  };

  const handleInputChange = (value: string) => {
    setBusinessName(value);
  };

  return (
    <div className="min-h-screen bg-white">
      <SaralNavbar router={router} />
      <SaralHero 
        businessName={businessName}
        handleInputChange={handleInputChange}
        handleSubmit={handleSubmit}
        router={router}
      />
      <SaralBenefits />
      <SaralHowItWorks />
      <SaralComparison />
      <SaralTestimonials />
      <SaralPricing router={router} />
      <SaralFAQ />
      <SaralFooter />
    </div>
  );
}

// Navbar Component
function SaralNavbar({ router }: { router: any }) {
  const [isScrolled, setIsScrolled] = React.useState(false);

  React.useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-in-out animate-fade-in-down ${
        isScrolled ? 'bg-white shadow-sm py-3 md:py-4' : 'bg-transparent py-4 md:py-6'
      }`}
    >
      <div className="max-w-[1600px] mx-auto px-4 sm:px-8 lg:px-16 flex justify-between items-center">
        <div className="flex items-center cursor-pointer" onClick={() => router.push('/')}>
          <span className="text-emerald-700 font-bold text-lg md:text-xl tracking-tight">
            Saral<span className="text-emerald-600">GST</span>
          </span>
        </div>
        <div className="flex items-center gap-3 md:gap-4">
          <button 
            onClick={() => router.push('/auth')}
            className="px-4 py-2 md:px-8 md:py-2.5 font-medium hover:opacity-80 transition-opacity text-xs md:text-sm btn-secondary-custom"
          >
            Login
          </button>
          <button
            onClick={() => router.push('/auth')}
            className="px-4 py-2 md:px-8 md:py-2.5 font-medium hover:opacity-90 transition-opacity text-xs md:text-sm btn-primary-custom"
          >
            Get Started
          </button>
        </div>
      </div>
    </nav>
  );
}

// Hero Component
function SaralHero({ businessName, handleInputChange, handleSubmit, router }: any) {
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
      
      <div className="mx-auto mt-4 mb-8 md:mb-12 relative z-10 animate-fade-in-up max-w-6xl">
        <div className="flex items-center justify-center gap-1.5 md:gap-2 text-[9px] sm:text-[10px] md:text-xs font-semibold text-gray-500 mb-2 md:mb-6 uppercase tracking-wide opacity-0 animate-fade-in-up animation-delay-200" style={{ animationFillMode: 'forwards' }}>
          <span>XAI-Powered</span>
          <span className="text-gray-300">•</span>
          <span>Auto Reconciliation</span>
          <span className="text-gray-300">•</span>
          <span>ITC Maximization</span>
        </div>
        
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-semibold text-gray-900 leading-normal tracking-tighter mb-3 md:mb-6 opacity-0 animate-fade-in-up animation-delay-200" style={{ animationFillMode: 'forwards' }}>
          The 
          <span className="text-gradient"> Intelligent Edge </span>
          in  GST Management  
        </h1>
        
        <p className="text-sm sm:text-base md:text-lg text-gray-600 max-w-2xl mx-auto mb-6 md:mb-10 opacity-0 animate-fade-in-up animation-delay-400" style={{ animationFillMode: 'forwards' }}>
          Automate GSTR-1, 2B & 3B filing with XAI-powered reconciliation. Never miss ITC claims or deadlines again.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-center opacity-0 animate-fade-in-up animation-delay-600 mb-12" style={{ animationFillMode: 'forwards' }}>
          <button
            onClick={() => router.push('/auth')}
            className="btn-primary-custom px-6 py-3 md:px-8 md:py-3 font-medium transition-opacity hover:opacity-90 text-sm md:text-base whitespace-nowrap"
          >
            Get Started
          </button>
          <button
            onClick={() => router.push('/dashboard/sme/stimulator')}
            className="btn-secondary-custom px-6 py-3 md:px-8 md:py-3 font-medium hover:opacity-90 text-sm md:text-base whitespace-nowrap"
          >
            Try Simulator
          </button>
        </div>
      </div>

      {/* Dashboard Preview */}
      <div className="w-full max-w-5xl mx-auto relative z-10 px-2 md:px-4 opacity-0 animate-zoom-in animation-delay-600" style={{ animationFillMode: 'forwards' }}>
        <div className="relative rounded-[1.5rem] md:rounded-[2.1875rem] p-2">
          <div className="absolute inset-0 dashboard-preview-bg"></div>
          
          <div className="relative bg-white rounded-[1.2rem] md:rounded-[1.8rem] shadow-sm overflow-hidden border border-white/50">
            {/* Header */}
            <div className="bg-gray-50/50 border-b border-gray-100 px-4 md:px-6 py-3 md:py-4 flex items-center justify-between">
              <div className="flex items-center gap-2 md:gap-3">
                <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-red-500"></div>
                <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-yellow-500"></div>
                <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-green-500"></div>
              </div>
              <div className="text-[10px] md:text-xs font-medium text-gray-400 uppercase tracking-wider">GST Dashboard</div>
            </div>

            {/* Main Content */}
            <div className="p-6 md:p-10 bg-gradient-to-br from-emerald-50 to-white">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white rounded-xl p-4 shadow-sm border border-emerald-100">
                  <div className="text-xs text-gray-500 mb-1">ITC Claimed</div>
                  <div className="text-xl md:text-2xl font-bold text-emerald-600">₹12.4L</div>
                  <div className="text-xs text-green-600 mt-1">+24% this month</div>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-sm border border-emerald-100">
                  <div className="text-xs text-gray-500 mb-1">Auto Matched</div>
                  <div className="text-xl md:text-2xl font-bold text-gray-900">94%</div>
                  <div className="text-xs text-green-600 mt-1">2,847 invoices</div>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-sm border border-amber-100">
                  <div className="text-xs text-gray-500 mb-1">Days to Deadline</div>
                  <div className="text-xl md:text-2xl font-bold text-amber-600">3</div>
                  <div className="text-xs text-amber-600 mt-1">GSTR-3B Due</div>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-sm border border-emerald-100">
                  <div className="text-xs text-gray-500 mb-1">Compliance</div>
                  <div className="text-xl md:text-2xl font-bold text-emerald-600">100%</div>
                  <div className="text-xs text-green-600 mt-1">All on track</div>
                </div>
              </div>
              
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold text-gray-700">Recent Activity</span>
                  <span className="text-xs text-emerald-600 font-medium">Live</span>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    <span>342 invoices auto-reconciled</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                    <span>GSTR-2B downloaded & analyzed</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                    <span>₹45K ITC optimization suggested</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// Benefits Section
function SaralBenefits() {
  return (
    <section className="py-16 md:py-20 px-4 sm:px-6 lg:px-8 bg-white mb-8 md:mb-12">
      <div className="max-w-7xl mx-auto">
        <RevealOnScroll>
          <h2 className="text-3xl md:text-4xl font-semibold text-gray-900 mb-10 md:mb-12 max-w-2xl">
            Four ways we make your <br/>
            GST <span className="text-emerald-600">Effortless</span>
          </h2>
        </RevealOnScroll>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-auto md:h-[600px]">
          
          {/* Card 1: Large Left - Primary Gradient */}
          <div className="md:col-span-1 md:row-span-2 h-[350px] md:h-auto">
            <RevealOnScroll className="h-full">
              <div className="overflow-hidden relative group benefit-card-primary h-full">
                <div className="absolute inset-0 bg-gradient-to-t from-emerald-700/95 via-emerald-600/70 to-emerald-500/40"></div>
                <div className="absolute inset-0 p-6 md:p-8 flex flex-col justify-end">
                  <div className="relative z-10">
                      <FileText className="w-12 h-12 text-white mb-4" />
                      <h3 className="text-white text-xl md:text-2xl font-bold mb-3">XAI-Powered Invoice Processing</h3>
                      <p className="text-white/90 text-xs md:text-sm leading-relaxed">
                        Our AI extracts and validates every invoice detail with 99% accuracy, even from handwritten bills
                      </p>
                  </div>
                  <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
                </div>
              </div>
            </RevealOnScroll>
          </div>

          {/* Right Column Grid */}
          <div className="md:col-span-2 md:row-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Card 2: Wide Top Right - Secondary Gradient */}
            <div className="md:col-span-2 h-[280px] md:h-auto">
              <RevealOnScroll delay={100} className="h-full">
                <div className="benefit-card-secondary p-6 md:p-8 flex flex-col justify-between relative h-full">
                  <div className="relative z-10">
                    <Calculator className="w-10 h-10 text-emerald-600 mb-3" />
                    <h3 className="text-gray-900 text-xl md:text-2xl font-bold mb-3">Automated Reconciliation</h3>
                    <p className="text-gray-600 text-xs md:text-sm leading-relaxed">
                      Match 2A, 2B, and your purchase records automatically. Find discrepancies before they cost you ITC
                    </p>
                  </div>
                </div>
              </RevealOnScroll>
            </div>

            {/* Card 3: Bottom Left of Right Col */}
            <div className="h-[280px] md:h-auto">
              <RevealOnScroll delay={200} className="h-full">
                <div className="benefit-card-secondary p-6 md:p-8 flex flex-col justify-between h-full relative">
                  <div className="relative z-10">
                    <Bell className="w-10 h-10 text-emerald-600 mb-3" />
                    <h3 className="text-gray-900 text-xl md:text-2xl font-bold mb-3">Deadline Guardian</h3>
                    <p className="text-gray-600 text-xs md:text-sm leading-relaxed">
                      Never miss filing deadlines with smart alerts and automated reminders
                    </p>
                  </div>
                </div>
              </RevealOnScroll>
            </div>

            {/* Card 4: Bottom Right of Right Col */}
            <div className="h-[280px] md:h-auto">
              <RevealOnScroll delay={300} className="h-full">
                <div className="benefit-card-secondary p-6 md:p-8 flex flex-col justify-between h-full relative">
                  <div className="relative z-10">
                    <TrendingUp className="w-10 h-10 text-emerald-600 mb-3" />
                    <h3 className="text-gray-900 text-xl md:text-2xl font-bold mb-3">ITC Maximization</h3>
                    <p className="text-gray-600 text-xs md:text-sm leading-relaxed">
                      Our AI finds every eligible credit opportunity you're missing
                    </p>
                  </div>
                </div>
              </RevealOnScroll>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}

// How It Works Section
function SaralHowItWorks() {
  return (
    <section className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 bg-white relative overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <RevealOnScroll>
          <div className="text-center mb-16 md:mb-20">
            <h2 className="text-emerald-600 font-bold tracking-widest uppercase text-xs mb-3">How it works</h2>
            <h3 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4">
              Easy setup. <span className="text-gradient">Ready in minutes.</span>
            </h3>
            <p className="text-gray-500 max-w-2xl mx-auto text-base md:text-lg">
              Get your GST compliance automated in 3 simple steps. No technical knowledge required.
            </p>
          </div>
        </RevealOnScroll>

        <div className="flex flex-col gap-16 md:gap-24">
          
          {/* Step 1 */}
          <div className="flex flex-col lg:flex-row items-center gap-8 md:gap-12 lg:gap-20">
            <div className="flex-1 w-full">
              <div 
                className="rounded-[2rem] md:rounded-[2.5rem] p-4 md:p-6 relative overflow-hidden group hover:scale-[1.02] transition-transform duration-500 industry-card-1"
              >
                <div className="rounded-2xl md:rounded-3xl overflow-hidden shadow-xl bg-white p-8">
                  <div className="flex items-center gap-4 mb-4">
                    <Shield className="w-12 h-12 text-emerald-600" />
                    <div className="text-2xl font-bold text-gray-900">Connect GSTIN</div>
                  </div>
                  <div className="space-y-3">
                    <div className="h-3 bg-emerald-100 rounded w-full"></div>
                    <div className="h-3 bg-emerald-100 rounded w-3/4"></div>
                    <div className="h-3 bg-emerald-100 rounded w-5/6"></div>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex-1 space-y-4 md:space-y-6">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-full border border-gray-200 flex items-center justify-center text-base md:text-lg font-bold text-gray-400 mb-2">1</div>
              <h3 className="text-2xl md:text-3xl font-bold text-gray-900">
                Secure <span className="text-gradient">GSTIN Connection</span>
              </h3>
              <p className="text-base md:text-lg text-gray-600 leading-relaxed">
                Simply connect your GSTIN. We use bank-level encryption to securely access your GST portal and automate everything.
              </p>
              <div className="bg-gray-50 border border-gray-100 rounded-2xl p-5 md:p-6 hover:shadow-sm transition-shadow">
                <h4 className="text-sm font-bold text-gray-800 uppercase tracking-wide mb-4">We'll automatically:</h4>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {['Download GSTR-2A/2B', 'Fetch filing history', 'Import vendor data', 'Sync your returns'].map((item, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-gray-600">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400"></div>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
          
          {/* Step 2 - Reversed */}
          <div className="flex flex-col lg:flex-row-reverse items-center gap-8 md:gap-12 lg:gap-20">
            <div className="flex-1 w-full">
              <div 
                className="rounded-[2rem] md:rounded-[2.5rem] p-4 md:p-6 relative overflow-hidden group hover:scale-[1.02] transition-transform duration-500 industry-card-2"
              >
                <div className="rounded-2xl md:rounded-3xl overflow-hidden shadow-xl bg-white p-8">
                  <div className="flex items-center justify-between mb-6">
                    <div className="text-sm font-semibold text-gray-700">Upload Invoices</div>
                    <div className="text-xs text-emerald-600">Auto-processing</div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="aspect-square bg-emerald-50 rounded-lg border-2 border-dashed border-emerald-200 flex items-center justify-center">
                        <FileText className="w-6 h-6 text-emerald-400" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="flex-1 space-y-4 md:space-y-6">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-full border border-gray-200 flex items-center justify-center text-base md:text-lg font-bold text-gray-400 mb-2">2</div>
              <h3 className="text-2xl md:text-3xl font-bold text-gray-900">
                Upload <span className="text-gradient">Invoices</span>
              </h3>
              <p className="text-base md:text-lg text-gray-600 leading-relaxed">
                Bulk upload your purchase and sales invoices. Our XAI extracts every detail automatically, even from photos or PDFs.
              </p>
              <div className="bg-gray-50 border border-gray-100 rounded-2xl p-5 md:p-6 hover:shadow-sm transition-shadow">
                <h4 className="text-sm font-bold text-gray-800 uppercase tracking-wide mb-4">Supported formats:</h4>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {['PDF documents', 'Excel sheets', 'Scanned images', 'Email invoices'].map((item, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-gray-600">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400"></div>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex flex-col lg:flex-row items-center gap-8 md:gap-12 lg:gap-20">
            <div className="flex-1 w-full">
              <div 
                className="rounded-[2rem] md:rounded-[2.5rem] p-4 md:p-6 relative overflow-hidden group hover:scale-[1.02] transition-transform duration-500 industry-card-1"
              >
                <div className="rounded-2xl md:rounded-3xl overflow-hidden shadow-xl bg-white p-8">
                  <div className="flex items-center justify-between mb-6">
                    <div className="text-lg font-bold text-gray-900">Auto-Filing Active</div>
                    <div className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">Live</div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                        <Check className="w-4 h-4 text-green-600" />
                      </div>
                      <div className="text-sm text-gray-600">2,847 invoices reconciled</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                        <Check className="w-4 h-4 text-green-600" />
                      </div>
                      <div className="text-sm text-gray-600">₹12.4L ITC claimed</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center animate-pulse">
                        <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                      </div>
                      <div className="text-sm text-gray-600">GSTR-3B ready to file</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex-1 space-y-4 md:space-y-6">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-full border border-gray-200 flex items-center justify-center text-base md:text-lg font-bold text-gray-400 mb-2">3</div>
              <h3 className="text-2xl md:text-3xl font-bold text-gray-900">
                Relax & <span className="text-gradient">Let AI Work</span>
              </h3>
              <p className="text-base md:text-lg text-gray-600 leading-relaxed">
                We reconcile everything, find ITC opportunities, and keep you ahead of deadlines. Just review and file with one click.
              </p>
              <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5 md:p-6">
                <h4 className="text-sm font-bold text-emerald-800 uppercase tracking-wide mb-4">What happens automatically:</h4>
                <ul className="space-y-3">
                  {[
                    'Invoice reconciliation with 2A/2B',
                    'ITC eligibility validation',
                    'Deadline tracking & alerts',
                    'One-click GSTR filing'
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-emerald-900">
                      <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}

// Comparison Section
function SaralComparison() {
  return (
    <section className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <RevealOnScroll>
          <div className="text-center mb-10 md:mb-16">
             <h2 className="text-3xl md:text-5xl font-semibold text-gray-900 mb-4 md:mb-6">
              Why SaralGST outperforms <br/>
              <span className="text-gradient">manual compliance</span>—every single time.
             </h2>
          </div>
        </RevealOnScroll>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 lg:gap-12">
           {/* Manual Process */}
           <RevealOnScroll delay={100} className="h-full">
             <div 
                className="h-full rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-12 relative overflow-hidden group border border-gray-100"
                style={{ background: 'linear-gradient(145deg, #FFFFFF 0%, #F3F4F6 100%)' }}
             >
                <div className="relative z-10">
                    <div className="w-14 h-14 md:w-16 md:h-16 bg-white rounded-2xl shadow-sm border border-gray-100 flex items-center justify-center mb-6 text-red-500">
                        <X size={28} className="md:w-8 md:h-8" />
                    </div>
                    <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">Manual GST Compliance</h3>
                    <p className="text-red-600 font-bold uppercase tracking-wide text-xs mb-6 md:mb-8">Time-Consuming & Error-Prone</p>
                    
                    <ul className="space-y-4 md:space-y-6 mb-8 md:mb-10">
                        {[
                            "Hours spent manually matching invoices with GSTR-2A/2B",
                            "Excel hell - prone to formula errors and data loss",
                            "Miss ITC claims due to human oversight",
                            "Last-minute panic before filing deadlines",
                            "No visibility into compliance status"
                        ].map((item, i) => (
                            <li key={i} className="flex items-start gap-3 md:gap-4">
                                <div className="mt-1 flex-shrink-0 text-red-500/80">
                                    <X size={18} className="md:w-5 md:h-5" />
                                </div>
                                <span className="text-gray-600 text-sm leading-relaxed font-medium">{item}</span>
                            </li>
                        ))}
                    </ul>

                    <div className="bg-white border border-gray-200 rounded-2xl p-5 md:p-6 mt-auto shadow-sm">
                        <span className="block text-xs font-bold text-red-600 uppercase tracking-wider mb-2">Result</span>
                        <p className="text-gray-800 font-bold leading-snug text-sm md:text-base">Lost ITC, compliance penalties, and countless wasted hours.</p>
                    </div>
                </div>
             </div>
           </RevealOnScroll>

           {/* SaralGST */}
           <RevealOnScroll delay={300} className="h-full">
             <div 
                className="h-full rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-12 relative overflow-hidden shadow-xl shadow-emerald-100/50 border border-emerald-100/20 industry-card-1"
             >
                <div className="relative z-10 h-full flex flex-col">
                    <div className="w-14 h-14 md:w-16 md:h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-6 text-emerald-600">
                        <Check size={28} className="md:w-8 md:h-8" />
                    </div>
                    <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">SaralGST Platform</h3>
                    <p className="text-emerald-600 font-bold uppercase tracking-wide text-xs mb-6 md:mb-8">Intelligent & Automated</p>
                    
                    <ul className="space-y-4 md:space-y-6 mb-8 md:mb-10">
                        {[
                            "Auto-reconcile 1000s of invoices in minutes with 99% accuracy",
                            "XAI validates every invoice and finds hidden ITC opportunities",
                            "Never miss eligible credits - our AI catches what humans miss",
                            "Deadline Guardian sends smart alerts days in advance",
                            "Real-time compliance dashboard with full visibility"
                        ].map((item, i) => (
                            <li key={i} className="flex items-start gap-3 md:gap-4">
                                <div className="mt-1 flex-shrink-0 text-emerald-600">
                                    <Check size={18} className="md:w-5 md:h-5" />
                                </div>
                                <span className="text-gray-800 text-sm leading-relaxed font-medium">{item}</span>
                            </li>
                        ))}
                    </ul>

                     <div className="bg-white/60 border border-emerald-200 rounded-2xl p-5 md:p-6 backdrop-blur-md mt-auto shadow-sm">
                        <span className="block text-xs font-bold text-emerald-700 uppercase tracking-wider mb-2">Result</span>
                        <p className="text-gray-900 font-bold leading-snug text-sm md:text-base">Maximum ITC, zero penalties, and 90% time saved every month.</p>
                    </div>
                </div>
             </div>
           </RevealOnScroll>
        </div>
      </div>
    </section>
  );
}

// Testimonials Section
function SaralTestimonials() {
  return (
    <section className="py-12 md:py-16 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-7xl mx-auto">
        <RevealOnScroll>
          <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-12 md:mb-16">
            Trusted by <span className="text-emerald-600">1000+</span> Indian Businesses
          </h2>
        </RevealOnScroll>

        <RevealOnScroll delay={200}>
          <div className="flex flex-col md:flex-row justify-center items-center gap-6 mb-8 md:mb-12">
              
              <div className="hidden md:block w-full md:w-1/4 h-64 bg-emerald-50 rounded-3xl opacity-50 transform scale-90"></div>

              <div className="w-full md:w-[500px] h-[350px] md:h-[400px] relative rounded-3xl overflow-hidden shadow-2xl group transition-transform hover:scale-[1.01]">
                  <div className="w-full h-full bg-gradient-to-br from-emerald-600 to-emerald-800"></div>
                  <div className="absolute top-6 left-6">
                      <span className="bg-white/20 backdrop-blur-md text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border border-white/10">
                          Manufacturing
                      </span>
                  </div>
                  <div className="absolute top-6 right-6">
                      <span className="text-white font-bold text-xl tracking-widest">SME</span>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
                      <p className="text-white text-xl md:text-2xl font-bold leading-tight mb-4">
                          "Saved ₹8 lakhs in ITC that we would have missed. Worth every rupee."
                      </p>
                      <div className="flex flex-col">
                          <span className="text-white font-semibold">Rajesh Kumar</span>
                          <span className="text-white/70 text-sm">Director, Kumar Industries</span>
                      </div>
                  </div>
              </div>

              <div className="hidden md:block w-full md:w-1/4 h-64 bg-emerald-50 rounded-3xl opacity-50 transform scale-90"></div>
          </div>
        </RevealOnScroll>

        <RevealOnScroll delay={400}>
          <div className="flex justify-center">
              <div className="bg-white border border-gray-200 shadow-lg rounded-2xl px-6 py-3 md:px-8 md:py-4 flex items-center gap-3">
                  <div className="text-base md:text-lg text-gray-800">
                      Rated <span className="font-bold text-emerald-600">4.8/5</span> from 1000+ businesses
                  </div>
              </div>
          </div>
        </RevealOnScroll>
      </div>
    </section>
  );
}

// Pricing Section
function SaralPricing({ router }: { router: any }) {
  return (
    <section className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 bg-gray-50/50" id="pricing">
      <div className="max-w-7xl mx-auto">
        <RevealOnScroll>
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Choose Your <span className="text-emerald-600">Plan</span></h2>
            <p className="text-base md:text-lg text-gray-600 max-w-2xl mx-auto">
              Select the plan that best fits your business needs. Start with 14 days free trial.
            </p>
          </div>
        </RevealOnScroll>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 max-w-5xl mx-auto items-start">
          
          {/* Starter Plan */}
          <RevealOnScroll className="h-full">
            <div className="bg-white rounded-[1.5rem] md:rounded-[2rem] p-6 md:p-10 border border-gray-100 shadow-sm hover:shadow-md transition-shadow flex flex-col relative h-full">
              <div className="mb-6 md:mb-8">
                  <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-2">Starter</h3>
                  <div className="flex items-baseline gap-1 mb-2">
                      <span className="text-4xl md:text-5xl font-bold text-gray-900">₹4,999</span>
                      <span className="text-gray-500 font-medium">/ month</span>
                  </div>
                  <p className="text-xs md:text-sm text-gray-500">Up to 1000 invoices/month</p>
              </div>

              <div className="bg-green-50 text-green-700 text-xs md:text-sm font-bold px-3 py-1.5 md:px-4 md:py-2 rounded-xl w-fit mb-6 md:mb-8 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-green-500 animate-pulse"></span>
                  14 Days FREE Trial
              </div>

              <div className="flex-1 space-y-4 md:space-y-5 mb-8 md:mb-10">
                  {[
                      "Auto invoice reconciliation",
                      "GSTR-1, 2B & 3B filing",
                      "Basic ITC analysis",
                      "Deadline alerts",
                      "Email support",
                      "Up to 1000 invoices/month",
                      "Dashboard access",
                      "Mobile app access"
                  ].map((feature, i) => (
                      <div key={i} className="flex items-start gap-3">
                          <div className="mt-1 w-4 h-4 md:w-5 md:h-5 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                              <Check size={10} className="text-gray-600 md:w-3 md:h-3" />
                          </div>
                          <span className="text-gray-600 text-sm leading-relaxed">{feature}</span>
                      </div>
                  ))}
              </div>

              <button 
                onClick={() => router.push('/auth')}
                className="w-full py-3 md:py-4 rounded-xl border border-gray-200 font-bold text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all text-sm md:text-base"
              >
                  Start Free Trial
              </button>
            </div>
          </RevealOnScroll>

          {/* Business PRO Plan */}
          <RevealOnScroll delay={200} className="h-full">
            <div className="bg-white rounded-[1.5rem] md:rounded-[2rem] p-6 md:p-10 border-2 border-emerald-500 shadow-xl shadow-emerald-100 relative flex flex-col h-full transform md:-translate-y-2">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-emerald-600 text-white px-4 py-1 md:px-6 md:py-1.5 rounded-full text-xs md:text-sm font-bold tracking-wide uppercase shadow-md whitespace-nowrap">
                  Most Popular
              </div>

              <div className="mb-6 md:mb-8 mt-2">
                  <h3 className="text-lg md:text-xl font-bold text-emerald-600 mb-2">Business PRO</h3>
                  <div className="flex items-baseline gap-1 mb-2">
                      <span className="text-4xl md:text-5xl font-bold text-gray-900">₹9,999</span>
                      <span className="text-gray-500 font-medium">/ month</span>
                  </div>
                  <p className="text-xs md:text-sm text-gray-500">Up to 5000 invoices/month</p>
              </div>

              <div className="bg-emerald-50 text-emerald-700 text-xs md:text-sm font-bold px-3 py-1.5 md:px-4 md:py-2 rounded-xl w-fit mb-6 md:mb-8 flex items-center gap-2 border border-emerald-100">
                  <span className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  14 Days FREE Trial
              </div>

              <div className="flex-1 space-y-4 md:space-y-5 mb-8 md:mb-10">
                  {[
                      "Everything in Starter",
                      "Advanced ITC maximization",
                      "XAI-powered insights",
                      "Vendor management",
                      "Priority support (24/7)",
                      "Up to 5000 invoices/month",
                      "API access",
                      "Dedicated account manager"
                  ].map((feature, i) => (
                      <div key={i} className="flex items-start gap-3">
                          <div className="mt-1 w-4 h-4 md:w-5 md:h-5 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                              <Check size={10} className="text-emerald-600 md:w-3 md:h-3" />
                          </div>
                          <span className="text-gray-800 text-sm font-medium leading-relaxed">{feature}</span>
                      </div>
                  ))}
              </div>

              <button 
                onClick={() => router.push('/auth')}
                className="w-full py-3 md:py-4 rounded-xl font-bold text-white btn-primary-custom hover:opacity-90 transition-all text-sm md:text-base"
              >
                  Start Free Trial
              </button>
            </div>
          </RevealOnScroll>

        </div>
      </div>
    </section>
  );
}

// FAQ Section
function SaralFAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      question: "How does SaralGST automate my GST compliance?",
      answer: "Our XAI engine connects to your GST portal, downloads your GSTR-2A/2B, and auto-reconciles it with your uploaded invoices. It finds discrepancies, validates ITC eligibility, and prepares your returns - all automatically."
    },
    {
      question: "Is my GST data secure?",
      answer: "Absolutely. We use bank-level 256-bit encryption and are ISO 27001 certified. Your credentials are never stored - we use secure token-based authentication. All data is encrypted at rest and in transit."
    },
    {
      question: "How accurate is the XAI invoice processing?",
      answer: "Our AI achieves 99%+ accuracy in extracting invoice data, even from handwritten bills and photos. It's trained on millions of Indian invoices and understands GST-specific fields perfectly."
    },
    {
      question: "Can I try it before committing?",
      answer: "Yes! We offer a 14-day free trial with full access to all features. No credit card required. Experience the platform and see how much time and ITC you can save."
    },
    {
      question: "What if I need help or have questions?",
      answer: "Our support team is available via email, chat, and phone. Pro plan customers get 24/7 priority support and a dedicated account manager who understands your business."
    }
  ];

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 bg-white" id="faq">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-24">
          
          <div className="lg:col-span-5">
            <RevealOnScroll>
              <div className="lg:sticky lg:top-32">
                <span className="text-emerald-600 font-bold tracking-widest uppercase text-xs mb-3 block">FAQ</span>
                <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4 md:mb-6">
                  Frequently Asked <br/><span className="text-gradient">Questions</span>
                </h2>
                <p className="text-base md:text-lg text-gray-600 mb-8 md:mb-12 leading-relaxed">
                  Everything you need to know about using SaralGST for your business.
                </p>
              </div>
            </RevealOnScroll>
          </div>

          <div className="lg:col-span-7 flex flex-col gap-4">
            {faqs.map((item, index) => {
                const isOpen = openIndex === index;
                return (
                    <RevealOnScroll key={index} delay={index * 100}>
                      <div 
                          onClick={() => toggleFAQ(index)}
                          className={`border rounded-2xl transition-all duration-300 cursor-pointer overflow-hidden ${
                              isOpen 
                              ? 'bg-emerald-50/30 border-emerald-200 shadow-sm' 
                              : 'bg-white border-gray-100 hover:border-gray-200'
                          }`}
                      >
                          <div className="p-5 md:p-6 flex justify-between items-center gap-4">
                              <h3 className={`text-base md:text-lg font-bold transition-colors ${isOpen ? 'text-emerald-800' : 'text-gray-900'}`}>
                                  {item.question}
                              </h3>
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${isOpen ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-50 text-gray-400'}`}>
                                  {isOpen ? <Minus size={16} /> : <Plus size={16} />}
                              </div>
                          </div>
                          <div 
                              className={`grid transition-[grid-template-rows] duration-300 ease-out ${
                                  isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                              }`}
                          >
                              <div className="overflow-hidden">
                                  <p className="px-5 md:px-6 pb-5 md:pb-6 text-gray-600 text-sm md:text-base leading-relaxed">
                                      {item.answer}
                                  </p>
                              </div>
                          </div>
                      </div>
                    </RevealOnScroll>
                );
            })}
          </div>

        </div>
      </div>
    </section>
  );
}

// Footer Component
function SaralFooter() {
  return (
    <footer className="bg-white pt-4 pb-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <RevealOnScroll>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-12 mb-16">
            
            <div className="lg:col-span-2">
              <span className="text-emerald-700 font-bold text-xl tracking-tight mb-4 block">
                Saral<span className="text-emerald-600">GST</span>
              </span>
              <p className="text-gray-500 text-sm leading-relaxed max-w-xs mb-8">
                India's most intelligent GST compliance platform. Automate filing, maximize ITC, and never miss a deadline.
              </p>
              <div className="flex gap-4">
                <a href="#" className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-emerald-50 hover:text-emerald-600 transition-all">
                  <Twitter size={18} />
                </a>
                <a href="#" className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-emerald-50 hover:text-emerald-600 transition-all">
                  <Linkedin size={18} />
                </a>
                <a href="#" className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-emerald-50 hover:text-emerald-600 transition-all">
                  <Instagram size={18} />
                </a>
              </div>
            </div>
            
            <div>
              <h4 className="font-bold text-gray-900 mb-6">Product</h4>
              <ul className="space-y-4 text-sm text-gray-600">
                <li><a href="#" className="hover:text-emerald-600 transition-colors">How it works</a></li>
                <li><a href="#pricing" className="hover:text-emerald-600 transition-colors">Pricing</a></li>
                <li><a href="/demo" className="hover:text-emerald-600 transition-colors">Demo</a></li>
                <li><a href="#" className="hover:text-emerald-600 transition-colors">Features</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-gray-900 mb-6">Company</h4>
              <ul className="space-y-4 text-sm text-gray-600">
                <li><a href="#" className="hover:text-emerald-600 transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-emerald-600 transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-emerald-600 transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-emerald-600 transition-colors">Contact</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-bold text-gray-900 mb-6">Resources</h4>
              <ul className="space-y-4 text-sm text-gray-600">
                <li><a href="#" className="hover:text-emerald-600 transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-emerald-600 transition-colors">API Docs</a></li>
                <li><a href="#" className="hover:text-emerald-600 transition-colors">Community</a></li>
                <li><a href="#faq" className="hover:text-emerald-600 transition-colors">FAQs</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-gray-900 mb-6">Legal</h4>
              <ul className="space-y-4 text-sm text-gray-600">
                <li><a href="#" className="hover:text-emerald-600 transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-emerald-600 transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-emerald-600 transition-colors">Cookie Policy</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-100 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-400">
            <p>&copy; {new Date().getFullYear()} SaralGST. All rights reserved.</p>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500"></span>
              <span>All Systems Operational</span>
            </div>
          </div>
        </RevealOnScroll>
      </div>
    </footer>
  );
}

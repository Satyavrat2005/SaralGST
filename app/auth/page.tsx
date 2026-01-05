'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Building2, Briefcase, CheckCircle2, Sparkles } from 'lucide-react';

export default function AuthPage() {
  const router = useRouter();
  const [role, setRole] = useState<'sme' | 'ca'>('sme');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (role === 'sme') {
      router.push('/dashboard/sme');
    } else {
      router.push('/dashboard/ca');
    }
  };

  return (
    <div className="h-screen w-full flex overflow-hidden hero-bg-custom">
      {/* Left Side - Immersive Visual with Emerald Theme */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden flex-col justify-between p-8 xl:p-10 demo-emerald-bg">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(16,185,129,0.2),transparent_50%)]"></div>
        <div className="absolute right-0 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-emerald-400/20 to-transparent"></div>
        
        {/* Animated floating elements */}
        <div className="absolute top-[10vh] left-[10%] w-24 h-24 xl:w-32 xl:h-32 bg-emerald-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-[20vh] right-[10%] w-32 h-32 xl:w-40 xl:h-40 bg-emerald-400/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        
        {/* 3D Mesh Grid Effect */}
        <div className="absolute inset-0 opacity-10" 
             style={{ 
               backgroundImage: 'linear-gradient(rgba(52,211,153,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(52,211,153,0.3) 1px, transparent 1px)', 
               backgroundSize: '50px 50px',
               transform: 'perspective(600px) rotateX(25deg) translateY(60px) scale(1.3)'
             }}>
        </div>

        <div className="relative z-10 opacity-0 animate-fade-in-up" style={{ animationFillMode: 'forwards' }}>
          <div className="h-10 w-10 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-emerald-500/50">
             <Sparkles className="h-5 w-5 text-white" />
          </div>
          <h1 className="text-4xl xl:text-5xl font-bold text-white mb-3 leading-tight">
            GST Compliance <br/>
            <span className="text-gradient">Made Simple</span>
          </h1>
          <p className="text-emerald-100/80 text-base xl:text-lg">Join 10,000+ businesses maximizing their ITC with SaralGST.</p>
        </div>

        <div className="relative z-10 space-y-3 opacity-0 animate-fade-in-up animation-delay-400" style={{ animationFillMode: 'forwards' }}>
          <div className="flex items-center gap-3 text-sm xl:text-base text-emerald-100/90 bg-white/5 backdrop-blur-sm rounded-lg p-3.5 border border-emerald-400/20">
            <CheckCircle2 className="h-5 w-5 text-emerald-400 flex-shrink-0" />
            <span>AI-driven Reconciliation Engine</span>
          </div>
          <div className="flex items-center gap-3 text-sm xl:text-base text-emerald-100/90 bg-white/5 backdrop-blur-sm rounded-lg p-3.5 border border-emerald-400/20">
            <CheckCircle2 className="h-5 w-5 text-emerald-400 flex-shrink-0" />
            <span>Real-time Vendor Compliance Scoring</span>
          </div>
          <div className="flex items-center gap-3 text-sm xl:text-base text-emerald-100/90 bg-white/5 backdrop-blur-sm rounded-lg p-3.5 border border-emerald-400/20">
            <CheckCircle2 className="h-5 w-5 text-emerald-400 flex-shrink-0" />
            <span>Automated GSTR Filing</span>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form with Modern Design */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-4 sm:px-6 relative bg-white overflow-hidden">
        {/* Decorative gradient orbs */}
        <div className="absolute top-0 right-0 w-64 h-64 xl:w-96 xl:h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 xl:w-96 xl:h-96 bg-emerald-400/5 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="w-full max-w-md space-y-4 relative z-10 opacity-0 animate-fade-in-up animation-delay-200" style={{ animationFillMode: 'forwards' }}>
          
          <div className="text-center space-y-1.5">
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full">
              <Sparkles className="h-3 w-3" />
              Secure Login
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-gray-900">Welcome back</h2>
            <p className="text-sm text-gray-600">
              {role === 'sme' ? "Manage your business finances seamlessly" : "Access your client portfolio instantly"}
            </p>
          </div>

          {/* Role Selection Switcher - Updated Design */}
          {/* <div className="grid grid-cols-2 p-1.5 bg-gray-100 rounded-xl border border-gray-200">
            <button 
              onClick={() => setRole('sme')}
              className={`flex items-center justify-center gap-2 py-2.5 text-xs font-semibold rounded-lg transition-all duration-200 ${role === 'sme' ? 'bg-white text-emerald-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <Building2 className="h-4 w-4" />
              <span className="hidden sm:inline">SME / Business</span>
              <span className="sm:hidden">SME</span>
            </button>
            <button 
              onClick={() => setRole('ca')}
              className={`flex items-center justify-center gap-2 py-2.5 text-xs font-semibold rounded-lg transition-all duration-200 ${role === 'ca' ? 'bg-white text-emerald-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <Briefcase className="h-4 w-4" />
              <span className="hidden sm:inline">Accountant / CA</span>
              <span className="sm:hidden">CA</span>
            </button>
          </div> */}

          <form onSubmit={handleLogin} className="space-y-3.5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email address</label>
              <input 
                type="email" 
                required 
                className="w-full h-11 px-4 rounded-xl bg-white border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all text-gray-900 placeholder:text-gray-400 text-sm"
                placeholder="name@company.com"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-semibold text-gray-700">Password</label>
                <button type="button" className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 transition-colors">
                  Forgot password?
                </button>
              </div>
              <input 
                type="password" 
                required 
                className="w-full h-11 px-4 rounded-xl bg-white border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all text-gray-900 placeholder:text-gray-400 text-sm"
                placeholder="••••••••"
              />
            </div>

            <button type="submit" className="w-full h-11 flex items-center justify-center gap-2 btn-primary-custom font-semibold text-sm transition-all hover:shadow-lg hover:shadow-emerald-500/30 hover:-translate-y-0.5 mt-5">
              Sign In
              <ArrowRight className="h-4 w-4" />
            </button>

            {/* <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-4 bg-white text-gray-500 font-medium">Or continue with</span>
              </div>
            </div>

            <button type="button" className="w-full h-11 flex items-center justify-center gap-2 btn-secondary-custom font-semibold text-sm transition-all hover:shadow-md hover:-translate-y-0.5">
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Google
            </button> */}
          </form>

          <p className="text-center text-xs text-gray-500 pt-1">
            Don't have an account?{' '}
            <button className="font-semibold text-emerald-600 hover:text-emerald-700 transition-colors">
              Sign up now
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

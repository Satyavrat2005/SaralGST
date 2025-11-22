import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Building2, Briefcase, CheckCircle2 } from 'lucide-react';

const AuthPage: React.FC = () => {
  const navigate = useNavigate();
  const [role, setRole] = useState<'sme' | 'ca'>('sme');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (role === 'sme') {
      navigate('/dashboard/sme');
    } else {
      navigate('/dashboard/ca');
    }
  };

  return (
    <div className="h-screen w-full flex overflow-hidden bg-background">
      {/* Left Side - Immersive Visual */}
      <div className="hidden lg:flex w-1/2 bg-zinc-950 relative overflow-hidden flex-col justify-between p-12">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(16,185,129,0.15),transparent_40%)]"></div>
        <div className="absolute right-0 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-white/10 to-transparent"></div>
        
        {/* 3D Mesh Grid Effect */}
        <div className="absolute inset-0 opacity-20" 
             style={{ 
               backgroundImage: 'linear-gradient(rgba(16,185,129,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(16,185,129,0.2) 1px, transparent 1px)', 
               backgroundSize: '40px 40px',
               transform: 'perspective(500px) rotateX(20deg) translateY(50px) scale(1.2)'
             }}>
        </div>

        <div className="relative z-10">
          <div className="h-10 w-10 bg-primary rounded-lg flex items-center justify-center mb-6">
             <div className="h-4 w-4 bg-white rotate-45"></div>
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">Financial Intelligence <br/> Reimagined.</h1>
          <p className="text-muted-foreground text-lg">Join 10,000+ businesses maximizing their ITC with SaralGST.</p>
        </div>

        <div className="relative z-10 space-y-4">
          <div className="flex items-center gap-3 text-sm text-zinc-300">
            <CheckCircle2 className="h-5 w-5 text-primary" />
            <span>AI-driven Reconciliation Engine</span>
          </div>
          <div className="flex items-center gap-3 text-sm text-zinc-300">
            <CheckCircle2 className="h-5 w-5 text-primary" />
            <span>Real-time Vendor Compliance Scoring</span>
          </div>
          <div className="flex items-center gap-3 text-sm text-zinc-300">
            <CheckCircle2 className="h-5 w-5 text-primary" />
            <span>Automated GSTR Filing</span>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 bg-background relative">
        <div className="w-full max-w-md space-y-8">
          
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-foreground">Welcome back</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {role === 'sme' ? "Manage your business finances" : "Access your client portfolio"}
            </p>
          </div>

          {/* Role Selection Switcher */}
          <div className="grid grid-cols-2 p-1 bg-secondary rounded-xl mb-8">
            <button 
              onClick={() => setRole('sme')}
              className={`flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-lg transition-all ${role === 'sme' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <Building2 className="h-4 w-4" />
              SME / Business
            </button>
            <button 
              onClick={() => setRole('ca')}
              className={`flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-lg transition-all ${role === 'ca' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <Briefcase className="h-4 w-4" />
              Accountant / CA
            </button>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1.5">Email address</label>
              <input 
                type="email" 
                required 
                className="w-full h-11 px-4 rounded-lg bg-secondary/30 border border-border focus:border-primary/50 focus:ring-1 focus:ring-primary/50 outline-none transition-all text-foreground"
                placeholder="name@company.com"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-medium text-muted-foreground">Password</label>
                <button type="button" className="text-sm font-medium text-primary hover:text-primary/80">Forgot password?</button>
              </div>
              <input 
                type="password" 
                required 
                className="w-full h-11 px-4 rounded-lg bg-secondary/30 border border-border focus:border-primary/50 focus:ring-1 focus:ring-primary/50 outline-none transition-all text-foreground"
                placeholder="••••••••"
              />
            </div>

            <button type="submit" className="w-full h-11 flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-lg transition-all shadow-[0_0_20px_rgba(16,185,129,0.25)]">
              Sign In
              <ArrowRight className="h-4 w-4" />
            </button>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border"></div></div>
              <div className="relative flex justify-center text-sm"><span className="px-2 bg-background text-muted-foreground">Or continue with</span></div>
            </div>

            <button type="button" className="w-full h-11 flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-foreground font-medium rounded-lg transition-all backdrop-blur-sm">
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Google
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
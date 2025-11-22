import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ShieldCheck, Clock, FileCheck, LineChart, Sparkles, Zap } from 'lucide-react';
import BentoCard from '../components/ui/BentoCard';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart as ReLineChart, Line } from 'recharts';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  // Mock data for the 3D-style floating card
  const taxData = [
    { month: 'Jan', saved: 4000 },
    { month: 'Feb', saved: 3000 },
    { month: 'Mar', saved: 6000 },
    { month: 'Apr', saved: 8000 },
    { month: 'May', saved: 5000 },
    { month: 'Jun', saved: 9000 },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Navbar */}
      <nav className="w-full px-6 py-4 flex justify-between items-center glass-panel border-b-0 rounded-none sticky top-0 z-50">
        <div className="flex items-center gap-2">
           <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
             <Zap className="h-5 w-5 text-white fill-white" />
           </div>
           <span className="text-xl font-bold tracking-tight">Saral<span className="text-primary">GST</span></span>
        </div>
        <div className="flex gap-4">
          <button onClick={() => navigate('/auth')} className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Log In</button>
          <button onClick={() => navigate('/auth')} className="px-5 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-all shadow-lg shadow-primary/20">Get Started</button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-20 pb-32 overflow-hidden">
        {/* Abstract Background Elements */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-primary/20 blur-[120px] rounded-full opacity-30 pointer-events-none"></div>
        
        <div className="container mx-auto px-6 flex flex-col md:flex-row items-center gap-12 relative z-10">
          <div className="flex-1 space-y-8 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold tracking-wide uppercase">
              <Sparkles className="h-3 w-3" />
              New: XAI Engine v2.0 Live
            </div>
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-[1.1]">
              Intelligent GST <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-emerald-300">Compliance</span> & <br />
              ITC Maximization.
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto md:mx-0 leading-relaxed">
              Automate GSTR-1 & 3B filing with XAI-powered reconciliation and Deadline Guardian technology. Stop losing money to unclaimed credits.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
              <button onClick={() => navigate('/auth')} className="h-12 px-8 rounded-lg bg-primary text-white font-medium text-lg hover:bg-primary/90 transition-all shadow-[0_0_20px_rgba(16,185,129,0.4)] flex items-center justify-center gap-2">
                Start Free Trial <ArrowRight className="h-5 w-5" />
              </button>
              <button className="h-12 px-8 rounded-lg bg-secondary text-secondary-foreground font-medium text-lg hover:bg-secondary/80 transition-all border border-white/5">
                Watch Demo
              </button>
            </div>
          </div>

          {/* 3D Visual */}
          <div className="flex-1 w-full relative">
            <div className="relative mx-auto w-full max-w-[500px] aspect-square">
               <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-transparent rounded-3xl rotate-6 blur-xl"></div>
               <div className="absolute inset-0 bg-card border border-white/10 rounded-2xl shadow-2xl p-6 flex flex-col backdrop-blur-xl bg-opacity-80">
                  <div className="flex justify-between items-center mb-8">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Tax Saved</p>
                      <h3 className="text-3xl font-bold text-white">₹ 12,45,000</h3>
                    </div>
                    <div className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-sm font-medium">+24%</div>
                  </div>
                  <div className="flex-1 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={taxData}>
                        <defs>
                          <linearGradient id="colorSaved" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#71717a'}} />
                        <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.05)" />
                        <Area type="monotone" dataKey="saved" stroke="#10B981" strokeWidth={3} fillOpacity={1} fill="url(#colorSaved)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
               </div>
               {/* Floating Badge */}
               <div className="absolute -bottom-6 -left-6 p-4 bg-zinc-900/90 backdrop-blur border border-white/10 rounded-xl shadow-xl flex items-center gap-3">
                 <div className="h-10 w-10 rounded-full bg-green-500/20 flex items-center justify-center">
                   <ShieldCheck className="h-6 w-6 text-green-500" />
                 </div>
                 <div>
                   <p className="text-xs text-muted-foreground">Compliance Status</p>
                   <p className="text-sm font-bold text-white">100% Compliant</p>
                 </div>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* Bento Grid Features */}
      <section className="container mx-auto px-6 pb-32">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[minmax(180px,auto)]">
          
          {/* Card 1: Deadline Guardian (Large) */}
          <BentoCard className="md:col-span-2 md:row-span-1 relative overflow-hidden group" title="Deadline Guardian">
             <div className="absolute top-0 right-0 p-6 opacity-50 group-hover:opacity-100 transition-opacity">
               <Clock className="h-16 w-16 text-primary/20" />
             </div>
             <div className="flex flex-col justify-center h-full z-10 relative">
               <div className="flex items-baseline gap-2 mb-2">
                 <span className="text-5xl font-mono font-bold text-white">03</span>
                 <span className="text-xl text-muted-foreground">Days Remaining</span>
               </div>
               <div className="w-full max-w-md h-2 bg-secondary rounded-full overflow-hidden">
                 <div className="h-full w-3/4 bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]"></div>
               </div>
               <p className="mt-4 text-lg font-medium text-amber-400">GSTR-3B Filing Due</p>
               <p className="text-sm text-muted-foreground">Automated WhatsApp reminders enabled for all stakeholders.</p>
             </div>
          </BentoCard>

          {/* Card 2: XAI Explainability */}
          <BentoCard className="bg-red-500/5 border-red-500/20 hover:border-red-500/40" title="XAI Explainability">
            <div className="flex flex-col gap-4">
              <div className="p-3 bg-red-500/10 rounded-lg border border-red-500/20">
                <div className="flex items-center gap-2 mb-1">
                  <ShieldCheck className="h-4 w-4 text-red-500" />
                  <span className="text-xs font-bold text-red-500 uppercase">Blocked Claim</span>
                </div>
                <p className="text-sm font-medium text-white">Invoice #INV-2024-001</p>
                <p className="text-xs text-red-300 mt-1">Reason: Section 17(5) - Food & Beverages (Ineligible ITC)</p>
              </div>
              <div className="h-2 w-full bg-zinc-800 rounded-full animate-pulse"></div>
            </div>
          </BentoCard>

          {/* Card 3: Smart Invoice */}
          <BentoCard title="Smart Invoice">
             <div className="flex items-center justify-center h-full pb-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full"></div>
                  <div className="relative h-20 w-20 bg-zinc-900 border border-white/10 rounded-xl flex items-center justify-center">
                    <div className="grid grid-cols-2 gap-1">
                      <div className="h-3 w-3 bg-white rounded-sm"></div>
                      <div className="h-3 w-3 bg-primary rounded-sm"></div>
                      <div className="h-3 w-3 bg-primary rounded-sm"></div>
                      <div className="h-3 w-3 bg-white rounded-sm"></div>
                    </div>
                  </div>
                  <div className="absolute -right-4 -bottom-2 px-2 py-1 bg-primary text-white text-[10px] font-bold rounded shadow-lg">IRN GEN</div>
                </div>
             </div>
          </BentoCard>

          {/* Card 4: Cashflow Sim */}
          <BentoCard className="md:col-span-2" title="Cashflow Simulator">
             <div className="flex flex-row items-center gap-8 h-full">
               <div className="flex-1">
                 <p className="text-sm text-muted-foreground mb-1">ITC Utilization Order</p>
                 <h4 className="text-2xl font-bold text-white">Optimal Path Found</h4>
                 <p className="text-xs text-emerald-400 mt-1">Saves ₹45,000 in cash payout</p>
               </div>
               <div className="flex-1 h-24">
                 <ResponsiveContainer width="100%" height="100%">
                    <ReLineChart data={[{v:10}, {v:30}, {v:20}, {v:50}, {v:40}, {v:70}, {v:60}]}>
                      <Line type="monotone" dataKey="v" stroke="#10B981" strokeWidth={2} dot={false} />
                    </ReLineChart>
                 </ResponsiveContainer>
               </div>
             </div>
          </BentoCard>

        </div>
      </section>
    </div>
  );
};

export default LandingPage;
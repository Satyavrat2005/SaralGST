'use client';

import React, { useState } from 'react';
import { 
  Building2, 
  Globe, 
  Users, 
  Bell, 
  Zap, 
  Database, 
  Lock, 
  Code,
  Save,
  RotateCcw,
  Download,
  CheckCircle2,
  Eye,
  EyeOff,
  Upload,
  Plus,
  Trash2,
  Edit2,
  AlertTriangle,
  ShieldCheck
} from 'lucide-react';
import GlassPanel from '../../../../components/ui/GlassPanel';
import BentoCard from '../../../../components/ui/BentoCard';

type SettingsSection = 'profile' | 'integration' | 'users' | 'notifications' | 'automation' | 'data' | 'security' | 'advanced';

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState<SettingsSection>('profile');
  
  // Integration State
  const [gstPassword, setGstPassword] = useState('');
  const [showGstPassword, setShowGstPassword] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  const navItems: { id: SettingsSection; label: string; icon: any }[] = [
    { id: 'profile', label: 'Company Profile', icon: Building2 },
    { id: 'integration', label: 'GST Portal Integration', icon: Globe },
    { id: 'users', label: 'User Management', icon: Users },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'automation', label: 'Automation Rules', icon: Zap },
    { id: 'data', label: 'Data & Backup', icon: Database },
    { id: 'security', label: 'Security & Compliance', icon: Lock },
    { id: 'advanced', label: 'Advanced', icon: Code },
  ];

  return (
    <div className="space-y-6 pb-20 h-[calc(100vh-80px)] flex flex-col">
      {/* 1. HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Settings</h1>
          <p className="text-muted-foreground text-sm mt-1">Configure your GST automation system</p>
        </div>
        <div className="flex items-center gap-3">
           <button className="px-4 py-2 bg-zinc-900 border border-white/10 rounded-lg text-sm text-zinc-300 hover:text-white hover:bg-zinc-800 transition-all flex items-center gap-2">
             <Download className="h-4 w-4" /> Export Settings
           </button>
           <button className="px-4 py-2 bg-zinc-900 border border-white/10 rounded-lg text-sm text-zinc-300 hover:text-white hover:bg-zinc-800 transition-all flex items-center gap-2">
             <RotateCcw className="h-4 w-4" /> Reset Defaults
           </button>
           <button className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-medium shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2">
             <Save className="h-4 w-4" /> Save All Changes
           </button>
        </div>
      </div>

      {/* 2. SPLIT LAYOUT */}
      <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0">
         
         {/* SIDEBAR NAVIGATION */}
         <div className="w-full lg:w-64 shrink-0 space-y-1">
            {navItems.map((item) => (
               <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id)}
                  className={`
                     w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all
                     ${activeSection === item.id 
                        ? 'bg-primary/10 text-primary border border-primary/20 shadow-sm' 
                        : 'text-zinc-400 hover:text-white hover:bg-white/5 border border-transparent'}
                  `}
               >
                  <item.icon className="h-5 w-5" />
                  {item.label}
               </button>
            ))}
         </div>

         {/* CONTENT AREA */}
         <div className="flex-1 bg-zinc-900/30 border border-white/5 rounded-xl overflow-y-auto p-6 custom-scrollbar">
            
            {/* PROFILE SECTION */}
            {activeSection === 'profile' && (
               <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div>
                     <h2 className="text-xl font-bold text-white mb-1">Company Profile</h2>
                     <p className="text-sm text-zinc-400">Basic company information for GST compliance</p>
                  </div>

                  {/* Basic Info */}
                  <GlassPanel className="p-6 space-y-6">
                     <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider border-b border-white/5 pb-2">Basic Information</h3>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                           <label className="text-xs text-zinc-500">Company Name</label>
                           <input type="text" defaultValue="Your Company Pvt Ltd" className="w-full bg-zinc-950 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-primary outline-none" />
                        </div>
                        <div className="space-y-2">
                           <label className="text-xs text-zinc-500">Legal Name</label>
                           <input type="text" defaultValue="Your Company Private Limited" className="w-full bg-zinc-950 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-primary outline-none" />
                        </div>
                        <div className="space-y-2">
                           <label className="text-xs text-zinc-500">GSTIN</label>
                           <input type="text" defaultValue="27ABCDE1234F1Z5" className="w-full bg-zinc-950 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-primary outline-none uppercase" />
                        </div>
                        <div className="space-y-2">
                           <label className="text-xs text-zinc-500">PAN</label>
                           <input type="text" defaultValue="ABCDE1234F" className="w-full bg-zinc-950 border border-white/10 rounded-lg px-3 py-2 text-sm text-zinc-400 focus:border-primary outline-none uppercase" readOnly />
                        </div>
                        <div className="space-y-2">
                           <label className="text-xs text-zinc-500">Registration Date</label>
                           <input type="date" defaultValue="2018-04-15" className="w-full bg-zinc-950 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-primary outline-none" />
                        </div>
                        <div className="space-y-2">
                           <label className="text-xs text-zinc-500">Filing Frequency</label>
                           <div className="flex gap-4 pt-1">
                              <label className="flex items-center gap-2 text-sm text-white cursor-pointer">
                                 <input type="radio" name="freq" defaultChecked className="text-primary focus:ring-primary bg-zinc-900 border-white/10" /> Monthly
                              </label>
                              <label className="flex items-center gap-2 text-sm text-white cursor-pointer">
                                 <input type="radio" name="freq" className="text-primary focus:ring-primary bg-zinc-900 border-white/10" /> Quarterly
                              </label>
                           </div>
                        </div>
                     </div>
                  </GlassPanel>

                  {/* Address */}
                  <GlassPanel className="p-6 space-y-6">
                     <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider border-b border-white/5 pb-2">Registered Address</h3>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2 space-y-2">
                           <label className="text-xs text-zinc-500">Address Line 1</label>
                           <input type="text" defaultValue="123, Business Tower" className="w-full bg-zinc-950 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-primary outline-none" />
                        </div>
                        <div className="space-y-2">
                           <label className="text-xs text-zinc-500">City</label>
                           <input type="text" defaultValue="Mumbai" className="w-full bg-zinc-950 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-primary outline-none" />
                        </div>
                        <div className="space-y-2">
                           <label className="text-xs text-zinc-500">State</label>
                           <select className="w-full bg-zinc-950 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-primary outline-none">
                              <option>Maharashtra</option>
                              <option>Karnataka</option>
                              <option>Delhi</option>
                           </select>
                        </div>
                        <div className="space-y-2">
                           <label className="text-xs text-zinc-500">PIN Code</label>
                           <input type="text" defaultValue="400001" className="w-full bg-zinc-950 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-primary outline-none" />
                        </div>
                     </div>
                  </GlassPanel>
               </div>
            )}

            {/* INTEGRATION SECTION */}
            {activeSection === 'integration' && (
               <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div>
                     <h2 className="text-xl font-bold text-white mb-1">GST Portal Integration</h2>
                     <p className="text-sm text-zinc-400">Connect to GST portal for auto-fetch of GSTR-2B and filing</p>
                  </div>

                  <GlassPanel className="p-6 space-y-6">
                     <div className="flex justify-between items-center border-b border-white/5 pb-4">
                        <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">API Credentials</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${isConnected ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'}`}>
                           {isConnected ? 'Connected' : 'Not Connected'}
                        </span>
                     </div>
                     
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                           <label className="text-xs text-zinc-500">GST Portal Username</label>
                           <input type="text" placeholder="Enter username" className="w-full bg-zinc-950 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-primary outline-none" />
                        </div>
                        <div className="space-y-2">
                           <label className="text-xs text-zinc-500">GST Portal Password</label>
                           <div className="relative">
                              <input 
                                 type={showGstPassword ? "text" : "password"} 
                                 value={gstPassword}
                                 onChange={(e) => setGstPassword(e.target.value)}
                                 placeholder="Enter password" 
                                 className="w-full bg-zinc-950 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-primary outline-none pr-10" 
                              />
                              <button 
                                 onClick={() => setShowGstPassword(!showGstPassword)}
                                 className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
                              >
                                 {showGstPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              </button>
                           </div>
                        </div>
                     </div>

                     <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 flex items-start gap-3">
                        <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />
                        <p className="text-sm text-amber-200">Credentials are encrypted and stored securely. They are never shared with third parties.</p>
                     </div>

                     <div className="flex gap-3">
                        <button onClick={() => setIsConnected(true)} className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">Test Connection</button>
                        {isConnected && <button onClick={() => setIsConnected(false)} className="px-4 py-2 border border-red-500/30 text-red-400 rounded-lg text-sm font-medium hover:bg-red-500/10 transition-colors">Disconnect</button>}
                     </div>
                  </GlassPanel>

                  <GlassPanel className="p-6 space-y-6">
                     <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider border-b border-white/5 pb-2">Auto-Fetch Settings</h3>
                     <div className="flex items-center justify-between p-4 bg-zinc-950 rounded-xl border border-white/5">
                        <div>
                           <h4 className="text-sm font-medium text-white">GSTR-2B Auto-Fetch</h4>
                           <p className="text-xs text-zinc-500 mt-1">Automatically fetch GSTR-2B on 14th of every month</p>
                        </div>
                        <div className="relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in">
                           <input type="checkbox" name="toggle" id="toggle" className="toggle-checkbox absolute block w-5 h-5 rounded-full bg-white border-4 appearance-none cursor-pointer" defaultChecked/>
                           <label htmlFor="toggle" className="toggle-label block overflow-hidden h-5 rounded-full bg-primary cursor-pointer"></label>
                        </div>
                     </div>
                     <div className="flex items-center justify-between p-4 bg-zinc-950 rounded-xl border border-white/5">
                        <div>
                           <h4 className="text-sm font-medium text-white">GSTR-2A Auto-Fetch</h4>
                           <p className="text-xs text-zinc-500 mt-1">Fetch GSTR-2A for additional comparison (Optional)</p>
                        </div>
                        <div className="relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in">
                           <input type="checkbox" name="toggle2" id="toggle2" className="toggle-checkbox absolute block w-5 h-5 rounded-full bg-zinc-400 border-4 appearance-none cursor-pointer"/>
                           <label htmlFor="toggle2" className="toggle-label block overflow-hidden h-5 rounded-full bg-zinc-700 cursor-pointer"></label>
                        </div>
                     </div>
                  </GlassPanel>
               </div>
            )}

            {/* USER MANAGEMENT SECTION */}
            {activeSection === 'users' && (
               <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="flex justify-between items-end">
                     <div>
                        <h2 className="text-xl font-bold text-white mb-1">User Management</h2>
                        <p className="text-sm text-zinc-400">Manage team members and access levels</p>
                     </div>
                     <button className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-medium flex items-center gap-2 shadow-lg shadow-emerald-500/20">
                        <Plus className="h-4 w-4" /> Add Team Member
                     </button>
                  </div>

                  <GlassPanel className="p-0 overflow-hidden">
                     <table className="w-full text-left text-sm">
                        <thead className="bg-white/5 text-zinc-500 font-medium">
                           <tr>
                              <th className="px-6 py-3">Name</th>
                              <th className="px-6 py-3">Email</th>
                              <th className="px-6 py-3">Role</th>
                              <th className="px-6 py-3">Status</th>
                              <th className="px-6 py-3">Last Active</th>
                              <th className="px-6 py-3 text-right">Actions</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                           {[
                              { name: 'Rahul Sharma', email: 'rahul@company.com', role: 'Owner', status: 'Active', last: '2 mins ago' },
                              { name: 'Priya Gupta', email: 'priya@company.com', role: 'Accountant', status: 'Active', last: '1 hour ago' },
                              { name: 'Amit Singh', email: 'amit@company.com', role: 'Data Entry', status: 'Invited', last: '-' },
                           ].map((user, i) => (
                              <tr key={i} className="hover:bg-white/5 transition-colors">
                                 <td className="px-6 py-4 text-white font-medium">{user.name}</td>
                                 <td className="px-6 py-4 text-zinc-400">{user.email}</td>
                                 <td className="px-6 py-4">
                                    <span className={`text-xs px-2 py-1 rounded border ${user.role === 'Owner' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' : 'bg-blue-500/10 text-blue-400 border-blue-500/20'}`}>{user.role}</span>
                                 </td>
                                 <td className="px-6 py-4">
                                    <span className={`text-xs px-2 py-1 rounded ${user.status === 'Active' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>{user.status}</span>
                                 </td>
                                 <td className="px-6 py-4 text-zinc-500">{user.last}</td>
                                 <td className="px-6 py-4 text-right">
                                    {user.role !== 'Owner' && (
                                       <div className="flex justify-end gap-2">
                                          <button className="p-1.5 hover:bg-white/10 rounded text-zinc-400 hover:text-white"><Edit2 className="h-4 w-4" /></button>
                                          <button className="p-1.5 hover:bg-white/10 rounded text-zinc-400 hover:text-red-400"><Trash2 className="h-4 w-4" /></button>
                                       </div>
                                    )}
                                 </td>
                              </tr>
                           ))}
                        </tbody>
                     </table>
                  </GlassPanel>

                  <GlassPanel className="p-6">
                     <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider border-b border-white/5 pb-4 mb-4">Role Definitions</h3>
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="p-4 rounded-xl bg-zinc-950 border border-white/10">
                           <h4 className="text-white font-bold mb-2">Owner</h4>
                           <p className="text-xs text-zinc-500 mb-4">Full access to all features, billing, and settings.</p>
                           <div className="flex flex-wrap gap-2">
                              <span className="px-2 py-0.5 bg-zinc-800 rounded text-[10px] text-zinc-300">Admin</span>
                              <span className="px-2 py-0.5 bg-zinc-800 rounded text-[10px] text-zinc-300">Billing</span>
                              <span className="px-2 py-0.5 bg-zinc-800 rounded text-[10px] text-zinc-300">Settings</span>
                           </div>
                        </div>
                        <div className="p-4 rounded-xl bg-zinc-950 border border-white/10">
                           <h4 className="text-white font-bold mb-2">Accountant</h4>
                           <p className="text-xs text-zinc-500 mb-4">Can manage invoices, reconciliation, and filing.</p>
                           <div className="flex flex-wrap gap-2">
                              <span className="px-2 py-0.5 bg-zinc-800 rounded text-[10px] text-zinc-300">Invoices</span>
                              <span className="px-2 py-0.5 bg-zinc-800 rounded text-[10px] text-zinc-300">Reconciliation</span>
                              <span className="px-2 py-0.5 bg-zinc-800 rounded text-[10px] text-zinc-300">Filing</span>
                           </div>
                        </div>
                        <div className="p-4 rounded-xl bg-zinc-950 border border-white/10">
                           <h4 className="text-white font-bold mb-2">Data Entry</h4>
                           <p className="text-xs text-zinc-500 mb-4">Restricted to uploading invoices and viewing list.</p>
                           <div className="flex flex-wrap gap-2">
                              <span className="px-2 py-0.5 bg-zinc-800 rounded text-[10px] text-zinc-300">Upload</span>
                              <span className="px-2 py-0.5 bg-zinc-800 rounded text-[10px] text-zinc-300">View Only</span>
                           </div>
                        </div>
                     </div>
                  </GlassPanel>
               </div>
            )}

            {/* NOTIFICATIONS SECTION */}
            {activeSection === 'notifications' && (
               <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div>
                     <h2 className="text-xl font-bold text-white mb-1">Notification Settings</h2>
                     <p className="text-sm text-zinc-400">Configure alerts for critical events</p>
                  </div>

                  <GlassPanel className="p-6 space-y-6">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="p-4 rounded-xl bg-zinc-950 border border-white/10">
                           <div className="flex justify-between items-start mb-4">
                              <div>
                                 <h4 className="text-white font-medium">Email Alerts</h4>
                                 <p className="text-xs text-zinc-500">rahul@company.com</p>
                              </div>
                              <div className="relative inline-block w-10 align-middle select-none">
                                 <input type="checkbox" defaultChecked className="toggle-checkbox absolute block w-5 h-5 rounded-full bg-white border-4 appearance-none cursor-pointer"/>
                                 <label className="toggle-label block overflow-hidden h-5 rounded-full bg-primary cursor-pointer"></label>
                              </div>
                           </div>
                           <div className="space-y-2">
                              {['Filing Reminders', 'Reconciliation Reports', 'System Alerts'].map(item => (
                                 <label key={item} className="flex items-center gap-2 text-sm text-zinc-300 cursor-pointer">
                                    <input type="checkbox" defaultChecked className="rounded bg-zinc-800 border-zinc-600 text-primary" />
                                    {item}
                                 </label>
                              ))}
                           </div>
                        </div>

                        <div className="p-4 rounded-xl bg-zinc-950 border border-white/10">
                           <div className="flex justify-between items-start mb-4">
                              <div>
                                 <h4 className="text-white font-medium">WhatsApp Alerts</h4>
                                 <p className="text-xs text-zinc-500">+91 98765 43210</p>
                              </div>
                              <div className="relative inline-block w-10 align-middle select-none">
                                 <input type="checkbox" defaultChecked className="toggle-checkbox absolute block w-5 h-5 rounded-full bg-white border-4 appearance-none cursor-pointer"/>
                                 <label className="toggle-label block overflow-hidden h-5 rounded-full bg-primary cursor-pointer"></label>
                              </div>
                           </div>
                           <div className="space-y-2">
                              {['Critical Deadlines', 'ITC at Risk', 'Vendor Non-Compliance'].map(item => (
                                 <label key={item} className="flex items-center gap-2 text-sm text-zinc-300 cursor-pointer">
                                    <input type="checkbox" defaultChecked className="rounded bg-zinc-800 border-zinc-600 text-primary" />
                                    {item}
                                 </label>
                              ))}
                           </div>
                        </div>
                     </div>
                  </GlassPanel>

                  <GlassPanel className="p-6">
                     <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider border-b border-white/5 pb-2 mb-4">Preferences</h3>
                     <div className="flex items-center justify-between mb-4">
                        <div>
                           <h4 className="text-sm font-medium text-white">Quiet Hours</h4>
                           <p className="text-xs text-zinc-500">Pause notifications between 10 PM and 8 AM</p>
                        </div>
                        <div className="relative inline-block w-10 align-middle select-none">
                           <input type="checkbox" defaultChecked className="toggle-checkbox absolute block w-5 h-5 rounded-full bg-white border-4 appearance-none cursor-pointer"/>
                           <label className="toggle-label block overflow-hidden h-5 rounded-full bg-primary cursor-pointer"></label>
                        </div>
                     </div>
                     <div className="flex items-center justify-between">
                        <div>
                           <h4 className="text-sm font-medium text-white">Daily Digest</h4>
                           <p className="text-xs text-zinc-500">Receive a summary email every morning at 9 AM</p>
                        </div>
                        <div className="relative inline-block w-10 align-middle select-none">
                           <input type="checkbox" defaultChecked className="toggle-checkbox absolute block w-5 h-5 rounded-full bg-white border-4 appearance-none cursor-pointer"/>
                           <label className="toggle-label block overflow-hidden h-5 rounded-full bg-primary cursor-pointer"></label>
                        </div>
                     </div>
                  </GlassPanel>
               </div>
            )}

            {/* Placeholder for other sections */}
            {['automation', 'data', 'security', 'advanced'].includes(activeSection) && (
               <div className="h-full flex flex-col items-center justify-center text-zinc-500 space-y-4 animate-in fade-in zoom-in-95 duration-300">
                  <ShieldCheck className="h-16 w-16 opacity-20" />
                  <div className="text-center">
                     <h2 className="text-xl font-bold text-white">Section Under Construction</h2>
                     <p className="text-sm mt-2">This settings module will be available in the next update.</p>
                  </div>
               </div>
            )}

         </div>
      </div>
    </div>
  );
}

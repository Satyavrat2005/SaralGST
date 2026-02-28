'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
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
  Eye,
  EyeOff,
  Plus,
  Trash2,
  Edit2,
  AlertTriangle,
  ShieldCheck,
  CheckCircle2,
  Loader2
} from 'lucide-react';

interface BusinessProfile {
  legal_name: string;
  trade_name: string;
  constitution: string;
  business_pan: string;
  email: string;
  phone_number: string;
  gstin: string;
  portal_username: string;
  portal_password: string;
  nature_of_business: string;
  hsn_codes: string;
  sac_codes: string;
  state: string;
  date_of_registration: string;
  filing_frequency: string;
  annual_turnover_range: string;
  registered_address: string;
  is_profile_complete: boolean;
}

type SettingsSection = 'profile' | 'integration' | 'users' | 'notifications' | 'automation' | 'data' | 'security' | 'advanced';

export default function SettingsPage() {
  const router = useRouter();
  const supabase = createClient();
  const [activeSection, setActiveSection] = useState<SettingsSection>('profile');
  const [gstPassword, setGstPassword] = useState('');
  const [showGstPassword, setShowGstPassword] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [profile, setProfile] = useState<BusinessProfile | null>(null);
  const [formData, setFormData] = useState<Partial<BusinessProfile>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [userEmail, setUserEmail] = useState<string>('');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { router.push('/auth'); return; }
        setUserEmail(user.email || '');

        const { data } = await supabase
          .from('business_profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (data) {
          setProfile(data as BusinessProfile);
          setFormData(data as BusinessProfile);
          if (data.portal_password) setGstPassword(data.portal_password);
        }
      } catch (err) {
        console.error('Failed to fetch profile:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setSaveMessage(null);
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveMessage(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const updateData = {
        ...formData,
        portal_password: gstPassword || formData.portal_password,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('business_profiles')
        .update(updateData)
        .eq('user_id', user.id);

      if (error) throw error;
      setProfile(updateData as BusinessProfile);
      setSaveMessage({ type: 'success', text: 'Settings saved successfully!' });
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (err: any) {
      setSaveMessage({ type: 'error', text: err.message || 'Failed to save settings' });
    } finally {
      setSaving(false);
    }
  };

  const val = (field: keyof BusinessProfile): string => {
    const v = formData[field];
    return typeof v === 'string' ? v : '';
  };

  const navItems: { id: SettingsSection; label: string; icon: any }[] = [
    { id: 'profile', label: 'Company Profile', icon: Building2 },
    { id: 'integration', label: 'GST Portal', icon: Globe },
    { id: 'users', label: 'Team', icon: Users },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'automation', label: 'Automation', icon: Zap },
    { id: 'data', label: 'Data & Backup', icon: Database },
    { id: 'security', label: 'Security', icon: Lock },
    { id: 'advanced', label: 'Advanced', icon: Code },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-emerald-50 to-teal-50">
      <div className="max-w-[1400px] mx-auto px-8 py-6">
        
        {/* HEADER */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 border border-emerald-200 rounded-full mb-3">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                <span className="text-[11px] font-semibold text-emerald-700">System Configuration</span>
              </div>
              <h1 className="text-[28px] font-semibold text-gray-900 tracking-tight mb-1">Settings</h1>
              <p className="text-sm text-gray-600">Manage your account settings and preferences</p>
            </div>
            <div className="flex items-center gap-3">
              <button className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 hover:shadow-sm transition-all">
                <Download className="h-4 w-4 inline mr-2" />
                Export
              </button>
              <button onClick={() => { setFormData(profile || {}); setSaveMessage(null); }} className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 hover:shadow-sm transition-all">
                <RotateCcw className="h-4 w-4 inline mr-2" />
                Reset
              </button>
              <button onClick={handleSave} disabled={saving} className="btn-primary-custom px-6 py-2.5 text-sm font-medium shadow-lg shadow-emerald-500/20 hover:shadow-xl hover:shadow-emerald-500/30 transition-all disabled:opacity-50">
                {saving ? <Loader2 className="h-4 w-4 inline mr-2 animate-spin" /> : <Save className="h-4 w-4 inline mr-2" />}
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
          {saveMessage && (
            <div className={`mt-3 px-4 py-2.5 rounded-xl text-sm font-medium ${saveMessage.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
              {saveMessage.text}
            </div>
          )}
        </div>

        {/* LAYOUT */}
        <div className="flex gap-8">
          
          {/* SIDEBAR */}
          <div className="w-[260px] flex-shrink-0">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-3 sticky top-8">
              <nav className="space-y-1">
                {navItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveSection(item.id)}
                    className={`
                      w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all
                      ${activeSection === item.id 
                        ? 'bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-700 shadow-sm border border-emerald-200' 
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 border border-transparent'}
                    `}
                  >
                    <item.icon className="h-[18px] w-[18px]" />
                    {item.label}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* CONTENT */}
          <div className="flex-1">
            
            {/* PROFILE */}
            {activeSection === 'profile' && (
               <div className="space-y-8">
                  {loading ? (
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-16 flex flex-col items-center justify-center">
                      <Loader2 className="h-8 w-8 text-emerald-500 animate-spin mb-3" />
                      <p className="text-sm text-gray-500">Loading profile...</p>
                    </div>
                  ) : (
                  <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-8">
                     <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/30">
                           <Building2 className="h-5 w-5 text-white" />
                        </div>
                        <div>
                           <h2 className="text-xl font-semibold text-gray-900">Company Profile</h2>
                           <p className="text-sm text-gray-500">Manage your company information and GST details</p>
                        </div>
                     </div>

                     <div className="space-y-8">
                        <div>
                           <div className="flex items-center gap-2 mb-5">
                              <div className="h-1 w-1 bg-emerald-500 rounded-full"></div>
                              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Basic Information</h3>
                           </div>
                           <div className="grid grid-cols-2 gap-6">
                              <div>
                                 <label className="block text-sm font-medium text-gray-700 mb-2">Trade Name</label>
                                 <input 
                                    type="text" 
                                    value={val('trade_name')}
                                    onChange={(e) => updateField('trade_name', e.target.value)}
                                    placeholder="Enter trade name"
                                    className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-sm text-gray-900 shadow-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none transition-all hover:border-gray-400" 
                                 />
                              </div>
                              <div>
                                 <label className="block text-sm font-medium text-gray-700 mb-2">Legal Name</label>
                                 <input 
                                    type="text" 
                                    value={val('legal_name')}
                                    onChange={(e) => updateField('legal_name', e.target.value)}
                                    placeholder="Enter legal name"
                                    className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-sm text-gray-900 shadow-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none transition-all hover:border-gray-400" 
                                 />
                              </div>
                              <div>
                                 <label className="block text-sm font-medium text-gray-700 mb-2">GSTIN</label>
                                 <input 
                                    type="text" 
                                    value={val('gstin')}
                                    onChange={(e) => updateField('gstin', e.target.value.toUpperCase())}
                                    placeholder="e.g. 27ABCDE1234F1Z5"
                                    className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-sm text-gray-900 uppercase shadow-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none transition-all hover:border-gray-400" 
                                 />
                              </div>
                              <div>
                                 <label className="block text-sm font-medium text-gray-700 mb-2">PAN</label>
                                 <input 
                                    type="text" 
                                    value={val('business_pan')}
                                    onChange={(e) => updateField('business_pan', e.target.value.toUpperCase())}
                                    placeholder="e.g. ABCDE1234F"
                                    className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 text-sm text-gray-700 uppercase shadow-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none transition-all" 
                                 />
                              </div>
                              <div>
                                 <label className="block text-sm font-medium text-gray-700 mb-2">Constitution</label>
                                 <select 
                                    value={val('constitution')}
                                    onChange={(e) => updateField('constitution', e.target.value)}
                                    className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-sm text-gray-900 shadow-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none transition-all hover:border-gray-400"
                                 >
                                    <option value="">Select constitution</option>
                                    <option value="Proprietorship">Proprietorship</option>
                                    <option value="Partnership">Partnership</option>
                                    <option value="LLP">LLP</option>
                                    <option value="Private Limited">Private Limited</option>
                                    <option value="Public Limited">Public Limited</option>
                                    <option value="HUF">HUF</option>
                                    <option value="Trust">Trust</option>
                                    <option value="Society">Society</option>
                                 </select>
                              </div>
                              <div>
                                 <label className="block text-sm font-medium text-gray-700 mb-2">Nature of Business</label>
                                 <select 
                                    value={val('nature_of_business')}
                                    onChange={(e) => updateField('nature_of_business', e.target.value)}
                                    className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-sm text-gray-900 shadow-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none transition-all hover:border-gray-400"
                                 >
                                    <option value="">Select nature</option>
                                    <option value="Manufacturer">Manufacturer</option>
                                    <option value="Trader">Trader</option>
                                    <option value="Service Provider">Service Provider</option>
                                    <option value="Manufacturer & Trader">Manufacturer & Trader</option>
                                    <option value="Manufacturer & Service Provider">Manufacturer & Service Provider</option>
                                    <option value="Trader & Service Provider">Trader & Service Provider</option>
                                    <option value="All">All (Manufacturer, Trader & Service Provider)</option>
                                 </select>
                              </div>
                              <div>
                                 <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                                 <input 
                                    type="email" 
                                    value={val('email') || userEmail}
                                    onChange={(e) => updateField('email', e.target.value)}
                                    className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-sm text-gray-900 shadow-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none transition-all hover:border-gray-400" 
                                 />
                              </div>
                              <div>
                                 <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                                 <input 
                                    type="tel" 
                                    value={val('phone_number')}
                                    onChange={(e) => updateField('phone_number', e.target.value)}
                                    placeholder="+91 98765 43210"
                                    className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-sm text-gray-900 shadow-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none transition-all hover:border-gray-400" 
                                 />
                              </div>
                              <div>
                                 <label className="block text-sm font-medium text-gray-700 mb-2">Registration Date</label>
                                 <input 
                                    type="date" 
                                    value={val('date_of_registration')}
                                    onChange={(e) => updateField('date_of_registration', e.target.value)}
                                    className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-sm text-gray-900 shadow-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none transition-all hover:border-gray-400" 
                                 />
                              </div>
                              <div>
                                 <label className="block text-sm font-medium text-gray-700 mb-2">Filing Frequency</label>
                                 <div className="flex gap-6 pt-2">
                                    <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer group">
                                       <input type="radio" name="freq" checked={val('filing_frequency') === 'Monthly'} onChange={() => updateField('filing_frequency', 'Monthly')} className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 border-gray-300" /> 
                                       <span className="group-hover:text-emerald-600 transition-colors">Monthly</span>
                                    </label>
                                    <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer group">
                                       <input type="radio" name="freq" checked={val('filing_frequency') === 'Quarterly'} onChange={() => updateField('filing_frequency', 'Quarterly')} className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 border-gray-300" /> 
                                       <span className="group-hover:text-emerald-600 transition-colors">Quarterly</span>
                                    </label>
                                 </div>
                              </div>
                              <div>
                                 <label className="block text-sm font-medium text-gray-700 mb-2">Annual Turnover Range</label>
                                 <select 
                                    value={val('annual_turnover_range')}
                                    onChange={(e) => updateField('annual_turnover_range', e.target.value)}
                                    className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-sm text-gray-900 shadow-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none transition-all hover:border-gray-400"
                                 >
                                    <option value="">Select range</option>
                                    <option value="Below 20 Lakhs">Below 20 Lakhs</option>
                                    <option value="20 Lakhs - 1 Crore">20 Lakhs - 1 Crore</option>
                                    <option value="1 Crore - 5 Crore">1 Crore - 5 Crore</option>
                                    <option value="5 Crore - 10 Crore">5 Crore - 10 Crore</option>
                                    <option value="Above 10 Crore">Above 10 Crore</option>
                                 </select>
                              </div>
                              <div>
                                 <label className="block text-sm font-medium text-gray-700 mb-2">HSN Codes</label>
                                 <input 
                                    type="text" 
                                    value={val('hsn_codes')}
                                    onChange={(e) => updateField('hsn_codes', e.target.value)}
                                    placeholder="e.g. 8471, 6109"
                                    className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-sm text-gray-900 shadow-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none transition-all hover:border-gray-400" 
                                 />
                              </div>
                              <div>
                                 <label className="block text-sm font-medium text-gray-700 mb-2">SAC Codes</label>
                                 <input 
                                    type="text" 
                                    value={val('sac_codes')}
                                    onChange={(e) => updateField('sac_codes', e.target.value)}
                                    placeholder="e.g. 998314, 997212"
                                    className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-sm text-gray-900 shadow-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none transition-all hover:border-gray-400" 
                                 />
                              </div>
                           </div>
                        </div>

                        <div className="border-t border-gray-200 pt-8">
                           <div className="flex items-center gap-2 mb-5">
                              <div className="h-1 w-1 bg-emerald-500 rounded-full"></div>
                              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Registered Address</h3>
                           </div>
                           <div className="grid grid-cols-2 gap-6">
                              <div className="col-span-2">
                                 <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                                 <input 
                                    type="text" 
                                    value={val('registered_address')}
                                    onChange={(e) => updateField('registered_address', e.target.value)}
                                    placeholder="Enter registered address"
                                    className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-sm text-gray-900 shadow-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none transition-all hover:border-gray-400" 
                                 />
                              </div>
                              <div>
                                 <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
                                 <select 
                                    value={val('state')}
                                    onChange={(e) => updateField('state', e.target.value)}
                                    className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-sm text-gray-900 shadow-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none transition-all hover:border-gray-400"
                                 >
                                    <option value="">Select State</option>
                                    {['Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat','Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh','Uttarakhand','West Bengal','Delhi','Jammu & Kashmir','Ladakh','Chandigarh','Puducherry','Dadra & Nagar Haveli','Andaman & Nicobar'].map(s => (
                                       <option key={s} value={s}>{s}</option>
                                    ))}
                                 </select>
                              </div>
                           </div>
                        </div>
                     </div>
                  </div>
                  )}
               </div>
            )}

            {/* INTEGRATION */}
            {activeSection === 'integration' && (
               <div className="space-y-6">
                  <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-8">
                     <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/30">
                           <Globe className="h-5 w-5 text-white" />
                        </div>
                        <div>
                           <h2 className="text-xl font-semibold text-gray-900">GST Portal Integration</h2>
                           <p className="text-sm text-gray-500">Connect your GST portal for automated data fetching</p>
                        </div>
                     </div>

                     <div className="space-y-6">
                        <div>
                           <div className="flex items-center justify-between mb-5">
                              <div className="flex items-center gap-2">
                                 <div className="h-1 w-1 bg-emerald-500 rounded-full"></div>
                                 <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">API Credentials</h3>
                              </div>
                              <span className={`px-3 py-1.5 rounded-full text-xs font-semibold border shadow-sm ${isConnected ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                                 {isConnected ? '● Connected' : '○ Not Connected'}
                              </span>
                           </div>
                           <div className="grid grid-cols-2 gap-6">
                              <div>
                                 <label className="block text-sm font-medium text-gray-700 mb-2">GST Username</label>
                                 <input 
                                    type="text" 
                                    value={val('portal_username')}
                                    onChange={(e) => updateField('portal_username', e.target.value)}
                                    placeholder="Enter your GST portal username" 
                                    className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 shadow-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none transition-all hover:border-gray-400" 
                                 />
                              </div>
                              <div>
                                 <label className="block text-sm font-medium text-gray-700 mb-2">GST Password</label>
                                 <div className="relative">
                                    <input 
                                       type={showGstPassword ? "text" : "password"} 
                                       value={gstPassword}
                                       onChange={(e) => setGstPassword(e.target.value)}
                                       placeholder="Enter your GST portal password" 
                                       className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 shadow-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none transition-all hover:border-gray-400 pr-10" 
                                    />
                                    <button 
                                       onClick={() => setShowGstPassword(!showGstPassword)}
                                       className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                    >
                                       {showGstPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                 </div>
                              </div>
                           </div>

                           <div className="mt-5 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3 shadow-sm">
                              <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                              <p className="text-sm text-amber-900">Your credentials are encrypted and stored securely. We never share them with third parties.</p>
                           </div>

                           <div className="mt-5 flex gap-3">
                              <button onClick={() => setIsConnected(true)} className="btn-primary-custom px-6 py-2.5 text-sm font-medium shadow-lg shadow-emerald-500/20 hover:shadow-xl hover:shadow-emerald-500/30 transition-all">
                                 <CheckCircle2 className="h-4 w-4 inline mr-2" />
                                 Test Connection
                              </button>
                              {isConnected && (
                                 <button onClick={() => setIsConnected(false)} className="px-6 py-2.5 bg-white border-2 border-red-200 text-red-600 rounded-xl text-sm font-medium hover:bg-red-50 transition-all shadow-sm">
                                    Disconnect
                                 </button>
                              )}
                           </div>
                        </div>
                     </div>
                  </div>

                  <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-8">
                     <div className="flex items-center gap-2 mb-6">
                        <div className="h-1 w-1 bg-emerald-500 rounded-full"></div>
                        <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Auto-Fetch Settings</h3>
                     </div>
                     <div className="space-y-3">
                        <div className="flex items-center justify-between p-5 bg-gradient-to-br from-gray-50 to-emerald-50/30 rounded-xl border border-gray-200 hover:border-emerald-200 hover:shadow-md transition-all">
                           <div>
                              <h4 className="text-sm font-semibold text-gray-900">GSTR-2B Auto-Fetch</h4>
                              <p className="text-xs text-gray-500 mt-1">Automatically fetch GSTR-2B on 14th of every month</p>
                           </div>
                           <label className="relative inline-flex items-center cursor-pointer">
                              <input type="checkbox" className="sr-only peer" defaultChecked />
                              <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all after:shadow-sm peer-checked:bg-gradient-to-r peer-checked:from-emerald-500 peer-checked:to-emerald-600"></div>
                           </label>
                        </div>
                        <div className="flex items-center justify-between p-5 bg-gradient-to-br from-gray-50 to-emerald-50/30 rounded-xl border border-gray-200 hover:border-emerald-200 hover:shadow-md transition-all">
                           <div>
                              <h4 className="text-sm font-semibold text-gray-900">GSTR-2A Auto-Fetch</h4>
                              <p className="text-xs text-gray-500 mt-1">Fetch GSTR-2A for additional comparison</p>
                           </div>
                           <label className="relative inline-flex items-center cursor-pointer">
                              <input type="checkbox" className="sr-only peer" />
                              <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all after:shadow-sm peer-checked:bg-gradient-to-r peer-checked:from-emerald-500 peer-checked:to-emerald-600"></div>
                           </label>
                        </div>
                     </div>
                  </div>
               </div>
            )}

            {/* USERS */}
            {activeSection === 'users' && (
               <div className="space-y-6">
                  <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-8">
                     <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                           <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/30">
                              <Users className="h-5 w-5 text-white" />
                           </div>
                           <div>
                              <h2 className="text-xl font-semibold text-gray-900">Team Members</h2>
                              <p className="text-sm text-gray-500">Manage your team and their permissions</p>
                           </div>
                        </div>
                        <button className="btn-primary-custom px-5 py-2.5 text-sm font-medium shadow-lg shadow-emerald-500/20 hover:shadow-xl hover:shadow-emerald-500/30 transition-all flex items-center gap-2">
                           <Plus className="h-4 w-4" /> Add Member
                        </button>
                     </div>

                     <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                        <table className="w-full">
                           <thead className="bg-gradient-to-r from-gray-50 to-emerald-50/30 border-b border-gray-200">
                           <tr>
                              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Name</th>
                              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Email</th>
                              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Role</th>
                              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Last Active</th>
                              <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 bg-white">
                           {[
                              { name: 'Rahul Sharma', email: 'rahul@company.com', role: 'Owner', status: 'Active', last: '2 mins ago' },
                              { name: 'Priya Gupta', email: 'priya@company.com', role: 'Accountant', status: 'Active', last: '1 hour ago' },
                              { name: 'Amit Singh', email: 'amit@company.com', role: 'Data Entry', status: 'Invited', last: '-' },
                           ].map((user, i) => (
                              <tr key={i} className="hover:bg-gray-50 transition-colors">
                                 <td className="px-6 py-4 text-sm font-medium text-gray-900">{user.name}</td>
                                 <td className="px-6 py-4 text-sm text-gray-600">{user.email}</td>
                                 <td className="px-6 py-4">
                                    <span className={`inline-flex px-2.5 py-1 rounded-md text-xs font-medium ${user.role === 'Owner' ? 'bg-purple-50 text-purple-700' : 'bg-blue-50 text-blue-700'}`}>
                                       {user.role}
                                    </span>
                                 </td>
                                 <td className="px-6 py-4">
                                    <span className={`inline-flex px-2.5 py-1 rounded-md text-xs font-medium ${user.status === 'Active' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                                       {user.status}
                                    </span>
                                 </td>
                                 <td className="px-6 py-4 text-sm text-gray-500">{user.last}</td>
                                 <td className="px-6 py-4 text-right">
                                    {user.role !== 'Owner' && (
                                       <div className="flex justify-end gap-2">
                                          <button className="p-1.5 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600 transition-colors">
                                             <Edit2 className="h-4 w-4" />
                                          </button>
                                          <button className="p-1.5 hover:bg-red-50 rounded text-gray-400 hover:text-red-600 transition-colors">
                                             <Trash2 className="h-4 w-4" />
                                          </button>
                                       </div>
                                    )}
                                 </td>
                              </tr>
                           ))}
                        </tbody>
                     </table>
                  </div>

                  </div>

                  <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-8">
                     <div className="flex items-center gap-2 mb-6">
                        <div className="h-1 w-1 bg-emerald-500 rounded-full"></div>
                        <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Role Permissions</h3>
                     </div>
                     <div className="grid grid-cols-3 gap-6">
                        {[
                           { title: 'Owner', desc: 'Full access to all features and settings', tags: ['Admin', 'Billing', 'Settings'] },
                           { title: 'Accountant', desc: 'Manage invoices and reconciliation', tags: ['Invoices', 'Reconciliation', 'Filing'] },
                           { title: 'Data Entry', desc: 'Upload and view invoices only', tags: ['Upload', 'View Only'] },
                        ].map((role) => (
                           <div key={role.title} className="bg-gradient-to-br from-gray-50 to-emerald-50/30 border border-gray-200 rounded-xl p-5 hover:border-emerald-200 hover:shadow-md transition-all">
                              <h4 className="font-semibold text-gray-900 mb-2">{role.title}</h4>
                              <p className="text-xs text-gray-600 mb-4">{role.desc}</p>
                              <div className="flex flex-wrap gap-2">
                                 {role.tags.map((tag) => (
                                    <span key={tag} className="px-2 py-1 bg-gray-100 rounded text-[11px] font-medium text-gray-700">{tag}</span>
                                 ))}
                              </div>
                           </div>
                        ))}
                     </div>
                  </div>
               </div>
            )}

            {/* NOTIFICATIONS */}
            {activeSection === 'notifications' && (
               <div className="space-y-6">
                  <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-8">
                     <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/30">
                           <Bell className="h-5 w-5 text-white" />
                        </div>
                        <div>
                           <h2 className="text-xl font-semibold text-gray-900">Notifications</h2>
                           <p className="text-sm text-gray-500">Configure how you receive alerts and updates</p>
                        </div>
                     </div>

                     <div className="space-y-6">
                        <div>
                           <div className="flex items-center gap-2 mb-5">
                              <div className="h-1 w-1 bg-emerald-500 rounded-full"></div>
                              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Notification Channels</h3>
                           </div>
                           <div className="grid grid-cols-2 gap-6">
                              <div className="bg-gradient-to-br from-gray-50 to-emerald-50/30 border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md hover:border-emerald-200 transition-all">
                              <div className="flex items-start justify-between mb-5">
                                 <div>
                                    <h4 className="font-medium text-gray-900">Email Notifications</h4>
                                    <p className="text-xs text-gray-500 mt-0.5">rahul@company.com</p>
                                 </div>
                                 <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" className="sr-only peer" defaultChecked />
                                    <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                                 </label>
                              </div>
                              <div className="space-y-3">
                                 {['Filing Reminders', 'Reconciliation Reports', 'System Alerts'].map(item => (
                                    <label key={item} className="flex items-center gap-3 text-sm text-gray-700 cursor-pointer">
                                       <input type="checkbox" defaultChecked className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500" />
                                       {item}
                                    </label>
                                 ))}
                              </div>
                           </div>

                              <div className="bg-gradient-to-br from-gray-50 to-emerald-50/30 border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md hover:border-emerald-200 transition-all">
                                 <div className="flex items-start justify-between mb-5">
                                    <div>
                                       <h4 className="font-medium text-gray-900">WhatsApp Alerts</h4>
                                    <p className="text-xs text-gray-500 mt-0.5">+91 98765 43210</p>
                                 </div>
                                 <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" className="sr-only peer" defaultChecked />
                                    <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                                 </label>
                              </div>
                              <div className="space-y-3">
                                 {['Critical Deadlines', 'ITC at Risk', 'Vendor Non-Compliance'].map(item => (
                                    <label key={item} className="flex items-center gap-3 text-sm text-gray-700 cursor-pointer">
                                       <input type="checkbox" defaultChecked className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500" />
                                       {item}
                                    </label>
                                 ))}
                              </div>
                           </div>
                           </div>
                        </div>
                     </div>
                  </div>

                  <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-8">
                     <div className="flex items-center gap-2 mb-6">
                        <div className="h-1 w-1 bg-emerald-500 rounded-full"></div>
                        <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Preferences</h3>
                     </div>
                     <div className="space-y-3">
                        <div className="flex items-center justify-between p-5 bg-gradient-to-br from-gray-50 to-emerald-50/30 rounded-xl border border-gray-200 hover:border-emerald-200 hover:shadow-md transition-all">
                              <div>
                                 <h4 className="text-sm font-medium text-gray-900">Quiet Hours</h4>
                                 <p className="text-xs text-gray-500 mt-0.5">Pause notifications between 10 PM and 8 AM</p>
                              </div>
                              <label className="relative inline-flex items-center cursor-pointer">
                                 <input type="checkbox" className="sr-only peer" defaultChecked />
                                 <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                              </label>
                           </div>
                        <div className="flex items-center justify-between p-5 bg-gradient-to-br from-gray-50 to-emerald-50/30 rounded-xl border border-gray-200 hover:border-emerald-200 hover:shadow-md transition-all">
                           <div>
                              <h4 className="text-sm font-semibold text-gray-900">Daily Digest</h4>
                              <p className="text-xs text-gray-500 mt-1">Receive a summary email every morning at 9 AM</p>
                           </div>
                           <label className="relative inline-flex items-center cursor-pointer">
                              <input type="checkbox" className="sr-only peer" defaultChecked />
                              <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all after:shadow-sm peer-checked:bg-gradient-to-r peer-checked:from-emerald-500 peer-checked:to-emerald-600"></div>
                           </label>
                        </div>
                     </div>
                  </div>
               </div>
            )}

            {/* COMING SOON */}
            {['automation', 'data', 'security', 'advanced'].includes(activeSection) && (
               <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-16">
                  <div className="flex flex-col items-center justify-center text-center">
                     <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-emerald-50 rounded-2xl flex items-center justify-center mb-6 shadow-sm">
                        <ShieldCheck className="h-10 w-10 text-emerald-600" />
                     </div>
                     <h2 className="text-2xl font-semibold text-gray-900 mb-2">Coming Soon</h2>
                     <p className="text-gray-500 max-w-md">This section is under development and will be available in the next update.</p>
                     <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-xl">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                        <span className="text-xs font-semibold text-emerald-700">In Progress</span>
                     </div>
                  </div>
               </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}

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

type SettingsSection = 'profile' /* | 'integration' | 'users' | 'notifications' | 'automation' | 'data' | 'security' | 'advanced' */;

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
    // ── Commented out — uncomment to restore ──────────────────────────────────
    // { id: 'integration', label: 'GST Portal', icon: Globe },
    // { id: 'users', label: 'Team', icon: Users },
    // { id: 'notifications', label: 'Notifications', icon: Bell },
    // { id: 'automation', label: 'Automation', icon: Zap },
    // { id: 'data', label: 'Data & Backup', icon: Database },
    // { id: 'security', label: 'Security', icon: Lock },
    // { id: 'advanced', label: 'Advanced', icon: Code },
    // ─────────────────────────────────────────────────────────────────────────
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

            {/* ── GST PORTAL (commented out — uncomment to restore) ─────────────────────
            {activeSection === 'integration' && (
               <div className="space-y-6">
                  ... (GST Portal content preserved below original line 428)
               </div>
            )}
            ─────────────────────────────────────────────────────────────────────────── */}

            {/* ── TEAM (commented out — uncomment to restore) ──────────────────────────
            {activeSection === 'users' && (
               ... (Team / Users content preserved)
            )}
            ─────────────────────────────────────────────────────────────────────────── */}

            {/* ── NOTIFICATIONS, AUTOMATION, DATA, SECURITY, ADVANCED (commented out — uncomment to restore)
            {activeSection === 'notifications' && (
               ... (Notifications content preserved)
            )}

            {['automation', 'data', 'security', 'advanced'].includes(activeSection) && (
               ... (Coming Soon block preserved)
            )}
            ─────────────────────────────────────────────────────────────────────────── */}

          </div>
        </div>
      </div>
    </div>
  );
}

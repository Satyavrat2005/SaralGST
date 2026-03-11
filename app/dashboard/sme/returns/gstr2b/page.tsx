'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Calendar, Download, RefreshCw, CheckCircle2, AlertOctagon, 
  ChevronRight, Loader2, X, AlertTriangle, FileText, Search,
  KeyRound, ShieldCheck, Send
} from 'lucide-react';

type FetchState = 'not_fetched' | 'fetching' | 'success' | 'failed';
type TabType = 'b2b' | 'cdnr' | 'isd' | 'impg';

interface GSTR2BRecord {
  id: string;
  section: string;
  supplier_gstin: string;
  supplier_name: string;
  invoice_number: string;
  invoice_date: string;
  invoice_value: number;
  taxable_value: number;
  igst_amount: number;
  cgst_amount: number;
  sgst_amount: number;
  cess_amount: number;
  place_of_supply: string;
  itc_eligible: boolean;
  itc_type: string;
  match_status: string;
  reverse_charge: boolean;
}

interface ReturnData {
  id: string;
  return_period: string;
  status: string;
  total_taxable_value: number;
  total_igst: number;
  total_cgst: number;
  total_sgst: number;
  total_cess: number;
  total_invoices: number;
  updated_at: string;
}

const PERIODS = (() => {
  const periods: { label: string; value: string }[] = [];
  const now = new Date();
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const month = d.getMonth() + 1;
    const year = d.getFullYear();
    periods.push({
      label: `${d.toLocaleDateString('en-US', { month: 'long' })} ${year}`,
      value: `${month.toString().padStart(2, '0')}${year}`,
    });
  }
  return periods;
})();

const STATE_NAMES: Record<string, string> = {
  '01': 'Jammu & Kashmir', '02': 'Himachal Pradesh', '03': 'Punjab', '04': 'Chandigarh',
  '05': 'Uttarakhand', '06': 'Haryana', '07': 'Delhi', '08': 'Rajasthan',
  '09': 'Uttar Pradesh', '10': 'Bihar', '27': 'Maharashtra', '29': 'Karnataka',
  '32': 'Kerala', '33': 'Tamil Nadu', '36': 'Telangana', '37': 'Andhra Pradesh',
};

export default function GSTR2BFetchPage() {
  const [fetchState, setFetchState] = useState<FetchState>('not_fetched');
  const [activeTab, setActiveTab] = useState<TabType>('b2b');
  const [selectedPeriod, setSelectedPeriod] = useState(PERIODS[0].value);
  const [records, setRecords] = useState<GSTR2BRecord[]>([]);
  const [returnData, setReturnData] = useState<ReturnData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  // OTP authentication flow
  const [showOTPModal, setShowOTPModal] = useState(false);
  const [otpStep, setOtpStep] = useState<'request' | 'verify'>('request');
  const [otpValue, setOtpValue] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const loadExistingData = useCallback(async () => {
    setLoading(true);
    try {
      const retRes = await fetch(`/api/returns?action=list&type=GSTR2B&period=${selectedPeriod}`);
      const retData = await retRes.json();
      if (retData.data && retData.data.length > 0) {
        setReturnData(retData.data[0]);
        const recRes = await fetch(`/api/returns?action=gstr2b-data&id=${retData.data[0].id}`);
        const recData = await recRes.json();
        setRecords(recData.data || []);
        setFetchState('success');
      } else {
        setFetchState('not_fetched');
        setReturnData(null);
        setRecords([]);
      }
    } catch {
      setFetchState('not_fetched');
    } finally {
      setLoading(false);
    }
  }, [selectedPeriod]);

  useEffect(() => { loadExistingData(); }, [loadExistingData]);

  const handleRequestOTP = async () => {
    setOtpLoading(true);
    setOtpError('');
    try {
      const res = await fetch('/api/returns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'request-otp' }),
      });
      const data = await res.json();
      if (data.success) {
        setOtpStep('verify');
      } else {
        setOtpError(data.error || 'Failed to send OTP');
      }
    } catch (err: unknown) {
      setOtpError(err instanceof Error ? err.message : 'Failed to request OTP');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otpValue.trim()) { setOtpError('Please enter the OTP'); return; }
    setOtpLoading(true);
    setOtpError('');
    try {
      const res = await fetch('/api/returns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'verify-otp', otp: otpValue }),
      });
      const data = await res.json();
      if (data.success) {
        setIsAuthenticated(true);
        setShowOTPModal(false);
        setOtpStep('request');
        setOtpValue('');
        setSuccessMsg('GST portal authenticated! You can now fetch GSTR-2B.');
      } else {
        setOtpError(data.error || 'Invalid OTP');
      }
    } catch (err: unknown) {
      setOtpError(err instanceof Error ? err.message : 'OTP verification failed');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleFetchFromPortal = async () => {
    setFetchState('fetching');
    setError('');
    try {
      const res = await fetch('/api/returns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'fetch-gstr2b', period: selectedPeriod }),
      });
      const data = await res.json();
      if (data.error) {
        // If auth error, prompt OTP flow
        if (data.error.includes('authenticated') || data.error.includes('OTP') || data.error.includes('auth')) {
          setFetchState('not_fetched');
          setShowOTPModal(true);
          setOtpStep('request');
        } else {
          setError(data.error);
          setFetchState('failed');
        }
      } else {
        setIsAuthenticated(true);
        setSuccessMsg('GSTR-2B data fetched successfully from portal!');
        await loadExistingData();
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Fetch failed');
      setFetchState('failed');
    }
  };

  const filteredRecords = records
    .filter(r => r.section === activeTab)
    .filter(r => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (r.invoice_number || '').toLowerCase().includes(q) ||
             (r.supplier_name || '').toLowerCase().includes(q) ||
             (r.supplier_gstin || '').toLowerCase().includes(q);
    });

  const sectionCounts = {
    b2b: records.filter(r => r.section === 'b2b').length,
    cdnr: records.filter(r => r.section === 'cdnr').length,
    isd: records.filter(r => r.section === 'isd').length,
    impg: records.filter(r => r.section === 'impg').length,
  };

  const totalITC = records.reduce((s, r) => s + (r.igst_amount || 0) + (r.cgst_amount || 0) + (r.sgst_amount || 0), 0);
  const eligibleITC = records.filter(r => r.itc_eligible).reduce((s, r) => s + (r.igst_amount || 0) + (r.cgst_amount || 0) + (r.sgst_amount || 0), 0);
  const matchedCount = records.filter(r => r.match_status === 'matched').length;
  const matchPct = records.length > 0 ? Math.round((matchedCount / records.length) * 100) : 0;

  const formatCurrency = (val: number) => `₹${val.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  const formatLakhs = (val: number) => `₹${(val / 100000).toFixed(2)} L`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-emerald-50 to-teal-50">
      <div className="max-w-[1400px] mx-auto px-8 py-6 space-y-6">

      {/* OTP AUTHENTICATION MODAL */}
      {showOTPModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-gray-200">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-200">
                  <ShieldCheck className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">GST Portal Authentication</h3>
                  <p className="text-xs text-gray-500">Authenticate with MasterGST to fetch GSTR-2B</p>
                </div>
              </div>
              <button onClick={() => { setShowOTPModal(false); setOtpError(''); setOtpValue(''); setOtpStep('request'); }}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-all">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {otpStep === 'request' ? (
                <>
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-700">
                    <p className="font-semibold mb-1">Step 1: Request OTP</p>
                    <p>An OTP will be sent to your registered GST portal mobile number / email.</p>
                    <p className="mt-1 text-xs text-blue-500">Sandbox mode OTP: <span className="font-mono font-bold">575757</span></p>
                  </div>
                  {otpError && (
                    <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                      <AlertTriangle className="h-4 w-4 shrink-0" />
                      {otpError}
                    </div>
                  )}
                  <button onClick={handleRequestOTP} disabled={otpLoading}
                    className="w-full btn-primary-custom py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50">
                    {otpLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    {otpLoading ? 'Sending OTP...' : 'Send OTP to Registered Mobile'}
                  </button>
                </>
              ) : (
                <>
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-700">
                    <p className="font-semibold mb-1">Step 2: Enter OTP</p>
                    <p>OTP has been sent to your registered mobile number / email.</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Enter OTP</label>
                    <input type="text" value={otpValue} onChange={(e) => setOtpValue(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="Enter 6-digit OTP"
                      className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-center text-2xl font-mono tracking-widest focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                      onKeyDown={(e) => e.key === 'Enter' && handleVerifyOTP()} />
                  </div>
                  {otpError && (
                    <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                      <AlertTriangle className="h-4 w-4 shrink-0" />
                      {otpError}
                    </div>
                  )}
                  <div className="flex gap-3">
                    <button onClick={() => { setOtpStep('request'); setOtpError(''); setOtpValue(''); }}
                      className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-700 hover:bg-gray-50 font-medium">
                      Re-send OTP
                    </button>
                    <button onClick={handleVerifyOTP} disabled={otpLoading || otpValue.length < 4}
                      className="flex-2 flex-grow btn-primary-custom py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50">
                      {otpLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
                      {otpLoading ? 'Verifying...' : 'Verify & Authenticate'}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span className="flex-1">{error}</span>
          <button onClick={() => setError('')}><X className="h-4 w-4" /></button>
        </div>
      )}
      {successMsg && (
        <div className="flex items-center gap-2 px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-700">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span className="flex-1">{successMsg}</span>
          <button onClick={() => setSuccessMsg('')}><X className="h-4 w-4" /></button>
        </div>
      )}

      {/* AUTH STATUS BAR */}
      {!isAuthenticated ? (
        <div className="flex items-center gap-3 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-sm">
          <KeyRound className="h-4 w-4 text-amber-600 shrink-0" />
          <span className="flex-1 text-amber-700">GST Portal authentication required before fetching GSTR-2B data.</span>
          <button onClick={() => { setOtpStep('request'); setOtpError(''); setOtpValue(''); setShowOTPModal(true); }}
            className="px-3 py-1.5 bg-amber-600 text-white rounded-lg text-xs font-semibold hover:bg-amber-700 transition-all flex items-center gap-1.5 shrink-0">
            <ShieldCheck className="h-3.5 w-3.5" /> Authenticate Now
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2 px-4 py-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-700">
          <ShieldCheck className="h-4 w-4 shrink-0" />
          <span className="flex-1">GST Portal authenticated. Ready to fetch GSTR-2B data.</span>
          <button onClick={() => { setIsAuthenticated(false); setOtpStep('request'); }}
            className="text-xs text-emerald-600 hover:underline">Re-authenticate</button>
        </div>
      )}

      {/* PAGE HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 border border-emerald-200 rounded-full mb-3">
            <Download className="h-3.5 w-3.5 text-emerald-600" strokeWidth={2.5} />
            <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">Fetch Returns</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">GSTR-2B Fetch</h1>
          <p className="text-gray-600 text-sm mt-1">Auto-generated ITC statement — fetch from GST portal</p>
        </div>
        <div className="flex items-center gap-3">
           <div className="relative">
             <select value={selectedPeriod} onChange={(e) => setSelectedPeriod(e.target.value)}
               className="appearance-none bg-white border border-gray-200 text-sm rounded-xl pl-9 pr-8 py-2.5 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-gray-900 cursor-pointer hover:border-gray-300 hover:shadow-sm transition-all">
               {PERIODS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
             </select>
             <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
           </div>
           {!isAuthenticated && (
             <button onClick={() => { setOtpStep('request'); setOtpError(''); setOtpValue(''); setShowOTPModal(true); }}
               className="px-4 py-2.5 rounded-xl text-sm font-medium border border-amber-300 text-amber-700 bg-amber-50 hover:bg-amber-100 transition-all flex items-center gap-2">
               <KeyRound className="h-4 w-4" /> Authenticate
             </button>
           )}
           <button onClick={handleFetchFromPortal}
             className="btn-primary-custom px-4 py-2.5 rounded-xl text-sm font-medium shadow-md hover:shadow-lg transition-all flex items-center gap-2"
             disabled={fetchState === 'fetching' || !isAuthenticated}>
             {fetchState === 'fetching' ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />} 
             {fetchState === 'success' ? 'Re-fetch' : 'Fetch from Portal'}
           </button>
        </div>
      </div>

      {/* LOADING */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 text-emerald-600 animate-spin" />
          <span className="ml-3 text-gray-600">Loading...</span>
        </div>
      )}

      {!loading && (
      <div className="w-full">
         {fetchState === 'not_fetched' && (
            <div className="bg-white rounded-2xl border-2 border-dashed border-gray-300 shadow-lg p-8 flex flex-col items-center justify-center text-center min-h-[300px]">
               <div className="h-16 w-16 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center mb-4 shadow-sm">
                  <Download className="h-8 w-8 text-gray-500" strokeWidth={2} />
               </div>
               <h3 className="text-xl font-semibold text-gray-900">GSTR-2B Not Fetched</h3>
               <p className="text-gray-600 max-w-md mt-2 mb-6">Click the button below to fetch GSTR-2B data from the GST portal via MasterGST API.</p>
               <button onClick={handleFetchFromPortal}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-700 border border-emerald-200 hover:from-emerald-100 hover:to-teal-100 transition-all font-semibold shadow-sm hover:shadow-md">
                  Fetch GSTR-2B Data
               </button>
            </div>
         )}

         {fetchState === 'fetching' && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-8 flex flex-col items-center justify-center text-center min-h-[300px]">
               <Loader2 className="h-16 w-16 text-emerald-600 animate-spin mb-6" strokeWidth={2.5} />
               <h3 className="text-xl font-semibold text-gray-900 animate-pulse">Fetching GSTR-2B from GST Portal...</h3>
               <div className="w-full max-w-md mt-6 space-y-2">
                  <div className="flex justify-between text-xs text-gray-600">
                     <span>Authenticating with MasterGST...</span>
                     <span className="text-emerald-600 font-semibold">In Progress</span>
                  </div>
                  <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                     <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 w-[60%] rounded-full transition-all duration-1000"></div>
                  </div>
               </div>
            </div>
         )}

         {fetchState === 'failed' && (
            <div className="bg-white rounded-2xl border border-red-200 shadow-lg p-8 flex flex-col items-center justify-center text-center min-h-[200px]">
               <AlertTriangle className="h-12 w-12 text-red-400 mb-4" />
               <h3 className="text-lg font-semibold text-gray-900">Fetch Failed</h3>
               <p className="text-gray-600 mt-2 mb-4">Could not fetch data from portal. This may happen if OTP authentication is needed or the data is not yet available.</p>
               <button onClick={handleFetchFromPortal}
                 className="px-4 py-2 rounded-xl bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 transition-all font-medium text-sm">
                 Retry Fetch
               </button>
            </div>
         )}

         {fetchState === 'success' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
               {/* Summary Card */}
               <div className="bg-white rounded-2xl border border-emerald-200 shadow-lg overflow-hidden">
                  <div className="flex flex-col md:flex-row justify-between items-center gap-6 p-6">
                     <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/30">
                           <CheckCircle2 className="h-6 w-6" strokeWidth={2.5} />
                        </div>
                        <div>
                           <h3 className="text-lg font-bold text-gray-900">GSTR-2B Fetched</h3>
                           <p className="text-sm text-gray-600">
                             {returnData ? `Updated: ${new Date(returnData.updated_at).toLocaleString()}` : 'Just now'}
                           </p>
                        </div>
                     </div>
                     <div className="flex gap-8 text-center">
                        <div>
                           <p className="text-xs text-gray-600 uppercase font-semibold">Total Invoices</p>
                           <p className="text-2xl font-bold text-gray-900">{records.length}</p>
                        </div>
                        <div>
                           <p className="text-xs text-gray-600 uppercase font-semibold">ITC Available</p>
                           <p className="text-2xl font-bold text-emerald-600">{formatLakhs(eligibleITC)}</p>
                        </div>
                        <div>
                           <p className="text-xs text-gray-600 uppercase font-semibold">Matched</p>
                           <p className="text-2xl font-bold text-blue-600">{matchPct}%</p>
                        </div>
                     </div>
                  </div>
               </div>

               {/* Tabs */}
               <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-2 inline-flex gap-1 overflow-x-auto">
                  {([
                    { id: 'b2b' as TabType, label: `B2B (${sectionCounts.b2b})` },
                    { id: 'cdnr' as TabType, label: `Credit/Debit Notes (${sectionCounts.cdnr})` },
                    { id: 'isd' as TabType, label: `ISD (${sectionCounts.isd})` },
                    { id: 'impg' as TabType, label: `Imports (${sectionCounts.impg})` },
                  ]).map(tab => (
                     <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                        className={`px-4 py-2.5 text-sm font-medium rounded-xl transition-all whitespace-nowrap ${
                          activeTab === tab.id ? 'bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-700 shadow-sm border border-emerald-200' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                        }`}>
                        {tab.label}
                     </button>
                  ))}
               </div>

               {/* Search */}
               <div className="flex items-center px-6 py-3 bg-white border border-gray-200 rounded-xl shadow-sm">
                 <div className="relative flex-1 max-w-sm">
                   <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                   <input type="text" placeholder="Search by invoice, supplier..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                     className="pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none w-full" />
                 </div>
               </div>

               {/* Data Table */}
               {filteredRecords.length === 0 ? (
                 <div className="flex flex-col items-center justify-center h-48 text-gray-400 bg-white border border-gray-200 rounded-2xl shadow-sm">
                   <FileText className="h-10 w-10 mb-3 opacity-20" />
                   <p className="text-gray-500 text-sm">No records found for this section.</p>
                 </div>
               ) : (
               <div className="bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden">
                  <div className="overflow-x-auto">
                     <table className="w-full text-left text-sm">
                        <thead className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-200">
                           <tr>
                              <th className="px-4 py-3 text-xs font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap">Invoice No</th>
                              <th className="px-4 py-3 text-xs font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap">Date</th>
                              <th className="px-4 py-3 text-xs font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap min-w-[180px]">Supplier</th>
                              <th className="px-4 py-3 text-xs font-semibold text-gray-700 uppercase tracking-wider text-right whitespace-nowrap">Taxable</th>
                              <th className="px-4 py-3 text-xs font-semibold text-gray-700 uppercase tracking-wider text-right whitespace-nowrap">Tax</th>
                              <th className="px-4 py-3 text-xs font-semibold text-gray-700 uppercase tracking-wider text-center whitespace-nowrap">ITC Eligible</th>
                              <th className="px-4 py-3 text-xs font-semibold text-gray-700 uppercase tracking-wider text-center whitespace-nowrap">Match Status</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                           {filteredRecords.map((r) => (
                              <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                                 <td className="px-4 py-3 font-semibold text-gray-900 whitespace-nowrap">{r.invoice_number}</td>
                                 <td className="px-4 py-3 text-gray-600 whitespace-nowrap text-xs">{r.invoice_date ? new Date(r.invoice_date).toLocaleDateString('en-IN') : '-'}</td>
                                 <td className="px-4 py-3 min-w-[180px]">
                                    <div className="flex flex-col">
                                       <span className="text-gray-900 font-medium text-xs">{r.supplier_name || '-'}</span>
                                       <span className="text-[10px] text-gray-500 font-mono">{r.supplier_gstin}</span>
                                    </div>
                                 </td>
                                 <td className="px-4 py-3 text-right text-gray-900 font-semibold whitespace-nowrap text-xs">{formatCurrency(r.taxable_value || 0)}</td>
                                 <td className="px-4 py-3 text-right text-gray-700 font-semibold whitespace-nowrap text-xs">{formatCurrency((r.igst_amount || 0) + (r.cgst_amount || 0) + (r.sgst_amount || 0))}</td>
                                 <td className="px-4 py-3 text-center">
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border whitespace-nowrap ${
                                      r.itc_eligible ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'
                                    }`}>
                                      {r.itc_eligible ? 'Eligible' : 'Ineligible'}
                                    </span>
                                 </td>
                                 <td className="px-4 py-3 text-center">
                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border whitespace-nowrap ${
                                      r.match_status === 'matched' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                      r.match_status === 'partial' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                      'bg-red-50 text-red-700 border-red-200'
                                    }`}>
                                       {r.match_status === 'matched' ? <CheckCircle2 className="h-3 w-3" /> : <AlertOctagon className="h-3 w-3" />}
                                       {r.match_status === 'matched' ? 'Matched' : r.match_status === 'partial' ? 'Partial' : 'Unmatched'}
                                    </span>
                                 </td>
                              </tr>
                           ))}
                        </tbody>
                     </table>
                  </div>
                  <div className="bg-gradient-to-r from-gray-50 to-white border-t border-gray-200 px-6 py-3 flex justify-between items-center text-sm font-medium">
                    <span className="text-gray-600">Total: {filteredRecords.length} Records</span>
                    <div className="flex gap-6">
                      <span className="text-gray-700">Taxable: <span className="text-gray-900 font-semibold">{formatCurrency(filteredRecords.reduce((s, r) => s + (r.taxable_value || 0), 0))}</span></span>
                      <span className="text-gray-700">ITC: <span className="text-emerald-700 font-semibold">{formatCurrency(filteredRecords.reduce((s, r) => s + (r.igst_amount || 0) + (r.cgst_amount || 0) + (r.sgst_amount || 0), 0))}</span></span>
                    </div>
                  </div>
               </div>
               )}
            </div>
         )}
      </div>
      )}

    </div>
    </div>
  );
}

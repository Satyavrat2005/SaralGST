'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Calendar, FileText, CheckCircle2, AlertTriangle,
  Clock, Code, Play, Search, RefreshCw, Loader2, X, Send,
  KeyRound, ShieldCheck, ClipboardCheck,
} from 'lucide-react';
import { Gstr1SummaryPanel } from '@/components/gstr1/Gstr1SummaryPanel';
import { Gstr1FilingStepper } from '@/components/gstr1/Gstr1FilingStepper';
import type { Gstr1ReturnData } from '@/lib/gstr1/types';

type TabType = 'b2b' | 'b2cl' | 'b2cs' | 'exports' | 'hsn' | 'docs';
type HsnSubTab = 'b2b' | 'b2c';

interface Invoice {
  id: string;
  section: string;
  invoice_number: string;
  invoice_date: string;
  invoice_value: number;
  place_of_supply: string;
  counterparty_gstin: string;
  counterparty_name: string;
  taxable_value: number;
  igst_amount: number;
  cgst_amount: number;
  sgst_amount: number;
  cess_amount: number;
  tax_rate: number;
  invoice_type: string;
  reverse_charge: boolean;
  hsn_code: string;
  uqc: string;
  quantity: number;
  validation_status: string;
  source: string;
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
  total_tax: number;
  total_invoices: number;
  arn: string;
  filed_date: string;
  created_at: string;
  updated_at: string;
  return_data?: Gstr1ReturnData | null;
  gstin?: string;
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
  '09': 'Uttar Pradesh', '10': 'Bihar', '11': 'Sikkim', '12': 'Arunachal Pradesh',
  '13': 'Nagaland', '14': 'Manipur', '15': 'Mizoram', '16': 'Tripura',
  '17': 'Meghalaya', '18': 'Assam', '19': 'West Bengal', '20': 'Jharkhand',
  '21': 'Odisha', '22': 'Chhattisgarh', '23': 'Madhya Pradesh', '24': 'Gujarat',
  '27': 'Maharashtra', '29': 'Karnataka', '32': 'Kerala', '33': 'Tamil Nadu',
  '36': 'Telangana', '37': 'Andhra Pradesh',
};

export default function GSTR1DraftPage() {
  const [activeTab, setActiveTab] = useState<TabType>('b2b');
  const [selectedPeriod, setSelectedPeriod] = useState(PERIODS[0].value);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [returnData, setReturnData] = useState<ReturnData | null>(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showJsonPreview, setShowJsonPreview] = useState(false);
  const [jsonPreview, setJsonPreview] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [returnSummary, setReturnSummary] = useState<Gstr1ReturnData | null>(null);
  const [hsnSubTab, setHsnSubTab] = useState<HsnSubTab>('b2b');
  const [validationIssues, setValidationIssues] = useState<{ errors: { message: string }[]; warnings: { message: string }[] } | null>(null);
  const [currentAction, setCurrentAction] = useState<string | null>(null);
  const [showOTPModal, setShowOTPModal] = useState(false);
  const [otpStep, setOtpStep] = useState<'request' | 'verify'>('request');
  const [otpValue, setOtpValue] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authChecking, setAuthChecking] = useState(true);
  const [authExpiresAt, setAuthExpiresAt] = useState<string | null>(null);
  const [showFileModal, setShowFileModal] = useState(false);
  const [filePan, setFilePan] = useState('');
  const [fileEvcOtp, setFileEvcOtp] = useState('');
  const [filingLoading, setFilingLoading] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      setAuthChecking(true);
      try {
        const res = await fetch('/api/returns?action=check-auth');
        const data = await res.json();
        if (data.authenticated) {
          setIsAuthenticated(true);
          setAuthExpiresAt(data.expires_at || null);
        }
      } catch {
        /* ignore */
      } finally {
        setAuthChecking(false);
      }
    };
    checkAuth();
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const retRes = await fetch(`/api/returns?action=list&type=GSTR1&period=${selectedPeriod}`);
      const retData = await retRes.json();
      if (retData.data && retData.data.length > 0) {
        const row = retData.data[0] as ReturnData;
        setReturnData(row);
        setReturnSummary((row.return_data as Gstr1ReturnData) || null);
        const invRes = await fetch(`/api/returns?action=gstr1-invoices&period=${selectedPeriod}`);
        const invData = await invRes.json();
        setInvoices(invData.data || []);
        if (row.return_data?.validation) {
          setValidationIssues(row.return_data.validation as typeof validationIssues);
        }
      } else {
        setReturnData(null);
        setReturnSummary(null);
        setInvoices([]);
        setValidationIssues(null);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  }, [selectedPeriod]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleGenerate = async () => {
    setGenerating(true);
    setError('');
    setSuccessMsg('');
    try {
      const res = await fetch(`/api/returns?action=generate-gstr1&period=${selectedPeriod}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || `Failed to generate GSTR-1 (${res.status})`);
        return;
      }
      if (data.success) {
        if (data.totalInvoices === 0) {
          const d = data.diagnostics;
          const range = d?.dateRange ? `${d.dateRange.startDate} to ${d.dateRange.endDate}` : selectedPeriod;
          setError(
            data.message ||
              `No sales invoices found for ${range}. Add invoices under Sales Register for this month, then generate again.`
          );
          setSuccessMsg('');
        } else {
          setSuccessMsg(`GSTR-1 draft generated with ${data.totalInvoices} invoices from sales register.`);
          setError('');
        }
        if (data.returnData) setReturnSummary(data.returnData);
        await fetchData();
      } else {
        setError(data.error || 'Failed to generate GSTR-1');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Generation failed');
    } finally {
      setGenerating(false);
    }
  };

  const handleRequestOTP = async () => {
    setOtpLoading(true);
    setOtpError('');
    setCurrentAction('auth');
    try {
      const res = await fetch('/api/returns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'request-otp' }),
      });
      const data = await res.json();
      if (data.success && data.alreadyAuthenticated) {
        setIsAuthenticated(true);
        setAuthExpiresAt(data.expires_at || null);
        setShowOTPModal(false);
        setSuccessMsg('GST portal session is already active.');
      } else if (data.success) {
        setOtpStep('verify');
      } else {
        setOtpError(data.error || 'Failed to send OTP');
      }
    } catch (err: unknown) {
      setOtpError(err instanceof Error ? err.message : 'Failed to request OTP');
    } finally {
      setOtpLoading(false);
      setCurrentAction(null);
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
        const authRes = await fetch('/api/returns?action=check-auth');
        const authData = await authRes.json();
        if (authData.expires_at) setAuthExpiresAt(authData.expires_at);
        setSuccessMsg('GST portal authenticated. You can save and file GSTR-1.');
      } else {
        setOtpError(data.error || 'Invalid OTP');
      }
    } catch (err: unknown) {
      setOtpError(err instanceof Error ? err.message : 'OTP verification failed');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleValidate = async () => {
    if (!returnData?.id) return;
    setFilingLoading(true);
    setCurrentAction('validate');
    setError('');
    try {
      const res = await fetch('/api/returns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'validate-gstr1', returnId: returnData.id }),
      });
      const data = await res.json();
      if (data.error) setError(data.error);
      else {
        setValidationIssues({ errors: data.errors || [], warnings: data.warnings || [] });
        if (data.success) setSuccessMsg('GSTR-1 validated successfully.');
        else setError('Validation failed. Fix errors before filing.');
        await fetchData();
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Validation failed');
    } finally {
      setFilingLoading(false);
      setCurrentAction(null);
    }
  };

  const handleSaveToPortal = async () => {
    if (!returnData?.id) return;
    if (!isAuthenticated) { setShowOTPModal(true); return; }
    setSaving(true);
    setCurrentAction('save');
    setError('');
    try {
      const res = await fetch('/api/returns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'save-gstr1', returnId: returnData.id, period: selectedPeriod }),
      });
      const data = await res.json();
      if (res.status === 401) {
        setIsAuthenticated(false);
        setShowOTPModal(true);
        setError(data.error || 'Please authenticate with GST portal');
      } else if (data.error) {
        setError(data.error);
      } else {
        setSuccessMsg('GSTR-1 saved to GST portal successfully!');
        await fetchData();
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
      setCurrentAction(null);
    }
  };

  const handleSubmitToPortal = async () => {
    if (!returnData?.id || !isAuthenticated) { setShowOTPModal(true); return; }
    setFilingLoading(true);
    setCurrentAction('submit');
    setError('');
    try {
      const res = await fetch('/api/returns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'submit-gstr1', returnId: returnData.id, period: selectedPeriod }),
      });
      const data = await res.json();
      if (data.error) setError(data.error);
      else {
        setSuccessMsg('GSTR-1 submitted to portal.');
        await fetchData();
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Submit failed');
    } finally {
      setFilingLoading(false);
      setCurrentAction(null);
    }
  };

  const handleFileWithEvc = async () => {
    if (!returnData?.id || !filePan.trim() || !fileEvcOtp.trim()) return;
    setFilingLoading(true);
    setCurrentAction('file');
    setError('');
    try {
      const res = await fetch('/api/returns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'file-gstr1',
          returnId: returnData.id,
          period: selectedPeriod,
          pan: filePan.trim(),
          evcOtp: fileEvcOtp.trim(),
        }),
      });
      const data = await res.json();
      if (data.error) setError(data.error);
      else {
        setSuccessMsg(data.arn ? `GSTR-1 filed. ARN: ${data.arn}` : 'GSTR-1 filed successfully.');
        setShowFileModal(false);
        setFilePan('');
        setFileEvcOtp('');
        await fetchData();
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Filing failed');
    } finally {
      setFilingLoading(false);
      setCurrentAction(null);
    }
  };

  const handleMarkFiled = async () => {
    if (!returnData?.id) return;
    const arn = prompt('Enter ARN (manual override for sandbox):');
    if (!arn) return;
    try {
      await fetch('/api/returns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'mark-filed', returnId: returnData.id, arn }),
      });
      setSuccessMsg('Return marked as filed!');
      await fetchData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to mark as filed');
    }
  };

  const handlePreviewJson = async () => {
    if (!returnSummary || !returnData) return;
    setShowJsonPreview(true);
    setJsonPreview('Loading...');
    try {
      const res = await fetch('/api/returns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'preview-gstr1-json', returnId: returnData.id, period: selectedPeriod }),
      });
      const data = await res.json();
      if (data.payload) {
        setJsonPreview(JSON.stringify(data.payload, null, 2));
      } else {
        setJsonPreview(JSON.stringify({ gstin: returnSummary.header.gstin, fp: selectedPeriod, note: 'Generate draft first' }, null, 2));
      }
    } catch {
      setJsonPreview(JSON.stringify(returnSummary, null, 2));
    }
  };

  const filteredInvoices = invoices
    .filter(inv => inv.section === activeTab)
    .filter(inv => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (inv.invoice_number || '').toLowerCase().includes(q) ||
             (inv.counterparty_name || '').toLowerCase().includes(q) ||
             (inv.counterparty_gstin || '').toLowerCase().includes(q);
    });

  const sectionCounts = {
    b2b: invoices.filter(i => i.section === 'b2b').length,
    b2cl: invoices.filter(i => i.section === 'b2cl').length,
    b2cs: invoices.filter(i => i.section === 'b2cs').length,
    exports: invoices.filter(i => i.section === 'exp').length,
    hsn: 0,
    docs: invoices.filter(i => i.section === 'doc_issue').length,
  };

  const totalValue = invoices.reduce((s, i) => s + (i.invoice_value || 0), 0);
  const formatCurrency = (val: number) => `₹${val.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

  const b2csSummaryData = (() => {
    const map = new Map<string, { pos: string; rate: number; taxable: number; igst: number; cgst: number; sgst: number; count: number }>();
    invoices.filter(i => i.section === 'b2cs').forEach(inv => {
      const key = `${inv.place_of_supply}_${inv.tax_rate}`;
      if (!map.has(key)) map.set(key, { pos: inv.place_of_supply, rate: inv.tax_rate, taxable: 0, igst: 0, cgst: 0, sgst: 0, count: 0 });
      const entry = map.get(key)!;
      entry.taxable += inv.taxable_value || 0;
      entry.igst += inv.igst_amount || 0;
      entry.cgst += inv.cgst_amount || 0;
      entry.sgst += inv.sgst_amount || 0;
      entry.count += 1;
    });
    return Array.from(map.values());
  })();

  const hsnSummaryB2b = returnSummary?.hsn_b2b ?? [];
  const hsnSummaryB2c = returnSummary?.hsn_b2c ?? [];
  const hsnSummary = hsnSubTab === 'b2b' ? hsnSummaryB2b : hsnSummaryB2c;
  const docSeries = returnSummary?.sections?.['13']?.series ?? [];
  const isValidated = returnData?.status === 'validated' || returnData?.status === 'submitted' || returnData?.status === 'filed';
  const canFile =
    invoices.length > 0 &&
    (returnSummary?.sections?.['13']?.net_issued ?? 0) > 0 &&
    (returnSummary?.sections['4A']?.count === 0 || (returnSummary?.sections['12_b2b']?.hsn_rows ?? 0) > 0);

  const getDeadline = () => {
    const m = parseInt(selectedPeriod.substring(0, 2));
    const y = parseInt(selectedPeriod.substring(2));
    const dm = m === 12 ? 1 : m + 1;
    const dy = m === 12 ? y + 1 : y;
    return new Date(dy, dm - 1, 11);
  };
  const deadline = getDeadline();
  const daysLeft = Math.max(0, Math.ceil((deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));

  const completedSections = [
    sectionCounts.b2b > 0,
    sectionCounts.b2cl > 0,
    sectionCounts.b2cs > 0,
    sectionCounts.exports > 0,
    hsnSummaryB2b.length > 0 || hsnSummaryB2c.length > 0,
    (returnSummary?.sections?.['13']?.net_issued ?? 0) > 0,
  ].filter(Boolean).length;

  const statusLabel = returnData?.status === 'filed' ? 'Filed' :
    returnData?.status === 'submitted' ? 'Submitted to Portal' :
    returnData?.status === 'generated' ? 'Draft Ready' :
    returnData?.status === 'validated' ? 'Validated' : 'Not Generated';

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-emerald-50 to-teal-50">
      <div className="max-w-[1400px] mx-auto px-8 py-6 space-y-6">

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

      {/* PAGE HEADER */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 border border-emerald-200 rounded-full mb-3">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
              <span className="text-[11px] font-semibold text-emerald-700">Filing Returns</span>
            </div>
            <h1 className="text-[28px] font-semibold text-gray-900 tracking-tight mb-1">GSTR-1 Draft</h1>
            <p className="text-sm text-gray-600">Outward supplies return — auto-generated from sales register</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <select value={selectedPeriod} onChange={(e) => setSelectedPeriod(e.target.value)}
                className="appearance-none bg-white border border-gray-200 text-sm rounded-xl pl-9 pr-10 py-2.5 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-gray-700 cursor-pointer hover:border-gray-300 hover:shadow-sm transition-all">
                {PERIODS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            </div>
            <button onClick={handleGenerate} disabled={generating}
              className="btn-primary-custom px-4 py-2.5 rounded-xl text-sm font-medium shadow-md hover:shadow-lg transition-all flex items-center gap-2 disabled:opacity-50">
              {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
              {generating ? 'Generating...' : 'Auto-Generate Draft'}
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 text-emerald-600 animate-spin" />
          <span className="ml-3 text-gray-600">Loading return data...</span>
        </div>
      ) : (
      <>
      <Gstr1FilingStepper
        returnStatus={returnData?.status}
        hasInvoices={invoices.length > 0}
        isAuthenticated={isAuthenticated}
        isValidated={isValidated}
        currentAction={currentAction}
      />

      {/* STATUS CARD */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden">
         <div className="grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-gray-200">
            <div className="p-6 space-y-3">
               <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
                    returnData?.status === 'filed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                    returnData?.status === 'submitted' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                    returnData?.status === 'generated' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                    'bg-gray-50 text-gray-600 border-gray-200'
                  }`}>
                    {returnData?.status === 'filed' ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Clock className="h-3.5 w-3.5" />}
                    {statusLabel}
                  </span>
               </div>
               <div className="text-xs text-gray-500">
                 {returnData ? `Last updated: ${new Date(returnData.updated_at).toLocaleString()}` : 'No draft generated yet'}
               </div>
               <div className="grid grid-cols-2 gap-4 pt-3 border-t border-gray-100">
                 <div>
                   <p className="text-xs text-gray-500">Total Invoices</p>
                   <p className="text-lg font-bold text-gray-900">{invoices.length}</p>
                 </div>
                 <div>
                   <p className="text-xs text-gray-500">Total Value</p>
                   <p className="text-lg font-bold text-gray-900">{formatCurrency(totalValue)}</p>
                 </div>
               </div>
            </div>

            <div className="p-6">
               <p className="text-xs text-gray-600 uppercase tracking-wider font-semibold mb-3">Sections ({completedSections} of 6)</p>
               <div className="space-y-1.5">
                  {[
                    { label: `B2B Invoices (${sectionCounts.b2b})`, done: sectionCounts.b2b > 0 },
                    { label: `B2C Large (${sectionCounts.b2cl})`, done: sectionCounts.b2cl > 0 },
                    { label: `B2C Small (${sectionCounts.b2cs})`, done: sectionCounts.b2cs > 0 },
                    { label: `Exports (${sectionCounts.exports})`, done: sectionCounts.exports > 0 },
                    { label: `HSN B2B (${hsnSummaryB2b.length})`, done: hsnSummaryB2b.length > 0 },
                    { label: `Docs (${returnSummary?.sections?.['13']?.net_issued ?? 0})`, done: (returnSummary?.sections?.['13']?.net_issued ?? 0) > 0 },
                  ].map((item, i) => (
                    <div key={i} className={`flex items-center gap-2 text-xs font-medium ${item.done ? 'text-emerald-600' : 'text-gray-400'}`}>
                      {item.done ? <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={2.5} /> : <Clock className="h-3.5 w-3.5" />}
                      {item.label}
                    </div>
                  ))}
               </div>
            </div>

            <div className="p-6 space-y-4">
               <div>
                  <p className="text-xs text-gray-600 uppercase tracking-wider font-semibold mb-2">Filing Deadline</p>
                  <div className="flex items-center gap-2">
                     <Clock className="h-4 w-4 text-emerald-600" />
                     <span className="text-lg font-bold text-gray-900">{deadline.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  </div>
                  <span className={`inline-block mt-2 text-xs px-2.5 py-1 rounded-full font-semibold border ${
                    daysLeft > 7 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                    daysLeft > 0 ? 'bg-amber-50 text-amber-700 border-amber-200' :
                    'bg-red-50 text-red-700 border-red-200'
                  }`}>
                    {daysLeft > 0 ? `${daysLeft} Days Left` : 'Deadline Passed'}
                  </span>
               </div>
               <div className="flex flex-col gap-2 pt-2">
                  {!authChecking && !isAuthenticated && returnData?.status !== 'filed' && (
                    <button onClick={() => { setShowOTPModal(true); setOtpStep('request'); }}
                      className="w-full px-3 py-2 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800 font-semibold flex items-center justify-center gap-1.5">
                      <KeyRound className="h-3.5 w-3.5" /> Authenticate GST Portal
                    </button>
                  )}
                  {isAuthenticated && authExpiresAt && (
                    <p className="text-[10px] text-emerald-600 text-center">Portal session until {new Date(authExpiresAt).toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit' })}</p>
                  )}
                  <div className="flex gap-2">
                     <button onClick={handlePreviewJson} disabled={invoices.length === 0}
                       className="flex-1 px-3 py-2 rounded-lg bg-white border border-gray-300 text-xs text-gray-700 hover:bg-gray-50 transition-all flex items-center justify-center gap-1.5 font-medium disabled:opacity-40">
                       <Code className="h-3.5 w-3.5" /> Preview JSON
                     </button>
                     <button onClick={fetchData}
                       className="flex-1 px-3 py-2 rounded-lg bg-white border border-gray-300 text-xs text-gray-700 hover:bg-gray-50 transition-all flex items-center justify-center gap-1.5 font-medium">
                       <RefreshCw className="h-3.5 w-3.5" /> Refresh
                     </button>
                  </div>
                  {returnData?.status !== 'filed' && (
                    <>
                      <button onClick={handleValidate} disabled={filingLoading || invoices.length === 0}
                        className="w-full px-4 py-2 rounded-lg bg-white border border-emerald-300 text-emerald-800 text-xs font-bold hover:bg-emerald-50 transition-all disabled:opacity-40 flex items-center justify-center gap-2">
                        {filingLoading && currentAction === 'validate' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ClipboardCheck className="h-3.5 w-3.5" />}
                        Validate Draft
                      </button>
                      <button onClick={handleSaveToPortal} disabled={saving || invoices.length === 0 || !canFile}
                        className="w-full px-4 py-2 rounded-lg bg-blue-600 text-white text-xs font-bold shadow-md hover:shadow-lg hover:bg-blue-700 transition-all disabled:opacity-40 flex items-center justify-center gap-2">
                        {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                        {saving ? 'Saving...' : 'Save to Portal'}
                      </button>
                      <button onClick={handleSubmitToPortal} disabled={filingLoading || !isValidated}
                        className="w-full px-4 py-2 rounded-lg bg-indigo-600 text-white text-xs font-bold shadow-md hover:bg-indigo-700 transition-all disabled:opacity-40 flex items-center justify-center gap-2">
                        {filingLoading && currentAction === 'submit' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ShieldCheck className="h-3.5 w-3.5" />}
                        Submit Return
                      </button>
                      <button onClick={() => setShowFileModal(true)} disabled={filingLoading || returnData?.status !== 'submitted'}
                        className="btn-primary-custom w-full px-4 py-2 rounded-lg text-xs font-bold shadow-md hover:shadow-lg transition-all disabled:opacity-40">
                        File with EVC
                      </button>
                      <button onClick={handleMarkFiled} disabled={invoices.length === 0}
                        className="w-full px-3 py-1.5 rounded-lg text-[10px] text-gray-500 hover:text-gray-700 underline">
                        Manual ARN (sandbox)
                      </button>
                    </>
                  )}
                  {returnData?.arn && (
                    <div className="text-xs text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2 text-center font-mono">
                      ARN: {returnData.arn}
                    </div>
                  )}
               </div>
            </div>
         </div>
      </div>

      {validationIssues && (validationIssues.errors.length > 0 || validationIssues.warnings.length > 0) && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-2">
          {validationIssues.errors.map((e, i) => (
            <p key={`e-${i}`} className="text-xs text-red-700 flex gap-1.5"><AlertTriangle className="h-3.5 w-3.5 shrink-0" />{e.message}</p>
          ))}
          {validationIssues.warnings.map((w, i) => (
            <p key={`w-${i}`} className="text-xs text-amber-700 flex gap-1.5"><AlertTriangle className="h-3.5 w-3.5 shrink-0" />{w.message}</p>
          ))}
        </div>
      )}

      <Gstr1SummaryPanel returnData={returnSummary} formatCurrency={formatCurrency} />

      {/* TAB NAVIGATION */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-2 inline-flex gap-1 overflow-x-auto">
         {([
            { id: 'b2b' as TabType, label: `B2B (${sectionCounts.b2b})` },
            { id: 'b2cl' as TabType, label: `B2C Large (${sectionCounts.b2cl})` },
            { id: 'b2cs' as TabType, label: `B2C Small (${sectionCounts.b2cs})` },
            { id: 'exports' as TabType, label: `Exports (${sectionCounts.exports})` },
            { id: 'hsn' as TabType, label: `HSN Summary` },
            { id: 'docs' as TabType, label: `Documents` },
         ]).map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 text-sm font-medium rounded-xl transition-all whitespace-nowrap ${
                activeTab === tab.id ? 'bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-700 shadow-sm border border-emerald-200' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}>
               {tab.label}
            </button>
         ))}
      </div>

      {/* CONTENT AREA */}
      <div className="min-h-[400px]">

         {/* B2B Tab */}
         {activeTab === 'b2b' && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-200">
               <div className="flex justify-between items-center px-6 py-4 bg-white border border-gray-200 rounded-xl shadow-sm">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                    <input type="text" placeholder="Search invoices..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none w-64" />
                  </div>
                  <button onClick={handleGenerate} disabled={generating}
                    className="px-3 py-2 rounded-lg border border-gray-300 text-gray-700 text-xs font-medium hover:bg-gray-50 transition-all disabled:opacity-50">
                    {generating ? 'Refreshing...' : 'Refresh from Sales'}
                  </button>
               </div>

               {filteredInvoices.length === 0 ? (
                 <div className="flex flex-col items-center justify-center h-64 text-gray-400 bg-white border border-gray-200 rounded-2xl shadow-sm">
                   <FileText className="h-12 w-12 mb-4 opacity-20" />
                   <p className="text-gray-500">No B2B invoices found. Generate draft from sales register.</p>
                 </div>
               ) : (
               <div className="bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden">
                  <div className="overflow-x-auto">
                     <table className="w-full text-left text-sm">
                        <thead className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-200">
                           <tr>
                              <th className="px-4 py-3 text-xs font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap">Invoice No</th>
                              <th className="px-4 py-3 text-xs font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap">Date</th>
                              <th className="px-4 py-3 text-xs font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap min-w-[180px]">Customer</th>
                              <th className="px-4 py-3 text-xs font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap">Place of Supply</th>
                              <th className="px-4 py-3 text-xs font-semibold text-gray-700 uppercase tracking-wider text-right whitespace-nowrap">Value</th>
                              <th className="px-4 py-3 text-xs font-semibold text-gray-700 uppercase tracking-wider text-right whitespace-nowrap">Taxable</th>
                              <th className="px-4 py-3 text-xs font-semibold text-gray-700 uppercase tracking-wider text-right whitespace-nowrap">Tax</th>
                              <th className="px-4 py-3 text-xs font-semibold text-gray-700 uppercase tracking-wider text-center whitespace-nowrap">Status</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                           {filteredInvoices.map((inv) => (
                              <tr key={inv.id} className="hover:bg-gray-50 transition-colors group">
                                 <td className="px-4 py-3 font-semibold text-gray-900 whitespace-nowrap">{inv.invoice_number}</td>
                                 <td className="px-4 py-3 text-gray-600 whitespace-nowrap text-xs">{inv.invoice_date ? new Date(inv.invoice_date).toLocaleDateString('en-IN') : '-'}</td>
                                 <td className="px-4 py-3 min-w-[180px]">
                                    <div className="flex flex-col">
                                       <span className="text-gray-900 font-medium text-xs">{inv.counterparty_name || '-'}</span>
                                       <span className="text-[10px] text-gray-500 font-mono">{inv.counterparty_gstin}</span>
                                    </div>
                                 </td>
                                 <td className="px-4 py-3 text-gray-600 whitespace-nowrap text-xs">{inv.place_of_supply ? `${inv.place_of_supply}-${STATE_NAMES[inv.place_of_supply] || ''}` : '-'}</td>
                                 <td className="px-4 py-3 text-right text-gray-900 font-semibold whitespace-nowrap text-xs">{formatCurrency(inv.invoice_value || 0)}</td>
                                 <td className="px-4 py-3 text-right text-gray-700 font-semibold whitespace-nowrap text-xs">{formatCurrency(inv.taxable_value || 0)}</td>
                                 <td className="px-4 py-3 text-right text-gray-700 font-semibold whitespace-nowrap text-xs">{formatCurrency((inv.igst_amount || 0) + (inv.cgst_amount || 0) + (inv.sgst_amount || 0))}</td>
                                 <td className="px-4 py-3 text-center">
                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border whitespace-nowrap ${
                                      inv.validation_status === 'valid' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                      inv.validation_status === 'warning' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                      inv.validation_status === 'error' ? 'bg-red-50 text-red-700 border-red-200' :
                                      'bg-gray-50 text-gray-600 border-gray-200'
                                    }`}>
                                       {inv.validation_status === 'valid' ? <CheckCircle2 className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
                                       {inv.validation_status === 'valid' ? 'Valid' : inv.validation_status || 'Pending'}
                                    </span>
                                 </td>
                              </tr>
                           ))}
                        </tbody>
                     </table>
                  </div>
                  <div className="bg-gradient-to-r from-gray-50 to-white border-t border-gray-200 px-6 py-3 flex justify-between items-center text-sm font-medium">
                     <span className="text-gray-600">Total: {filteredInvoices.length} Invoices</span>
                     <div className="flex gap-8">
                        <span className="text-gray-700">Taxable: <span className="text-gray-900 font-semibold">{formatCurrency(filteredInvoices.reduce((s, i) => s + (i.taxable_value || 0), 0))}</span></span>
                        <span className="text-gray-700">Tax: <span className="text-gray-900 font-semibold">{formatCurrency(filteredInvoices.reduce((s, i) => s + (i.igst_amount || 0) + (i.cgst_amount || 0) + (i.sgst_amount || 0), 0))}</span></span>
                     </div>
                  </div>
               </div>
               )}
            </div>
         )}

         {/* B2CL Tab */}
         {activeTab === 'b2cl' && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-200">
              <div className="p-4 bg-gradient-to-r from-blue-50 to-white border border-blue-200 rounded-xl text-sm text-blue-700 flex items-center gap-2">
                <FileText className="h-4 w-4" />
                B2C Large: Inter-state invoices with value &gt; ₹2.5 Lakhs to unregistered persons.
              </div>
              {filteredInvoices.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 text-gray-400 bg-white border border-gray-200 rounded-2xl shadow-sm">
                  <FileText className="h-10 w-10 mb-3 opacity-20" />
                  <p className="text-gray-500 text-sm">No B2CL invoices for this period.</p>
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-200">
                        <tr>
                          <th className="px-4 py-3 text-xs font-semibold text-gray-700 uppercase tracking-wider">Invoice No</th>
                          <th className="px-4 py-3 text-xs font-semibold text-gray-700 uppercase tracking-wider">Date</th>
                          <th className="px-4 py-3 text-xs font-semibold text-gray-700 uppercase tracking-wider">Place of Supply</th>
                          <th className="px-4 py-3 text-xs font-semibold text-gray-700 uppercase tracking-wider text-right">Value</th>
                          <th className="px-4 py-3 text-xs font-semibold text-gray-700 uppercase tracking-wider text-right">Taxable</th>
                          <th className="px-4 py-3 text-xs font-semibold text-gray-700 uppercase tracking-wider text-right">IGST</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {filteredInvoices.map(inv => (
                          <tr key={inv.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 font-semibold text-gray-900">{inv.invoice_number}</td>
                            <td className="px-4 py-3 text-gray-600 text-xs">{inv.invoice_date ? new Date(inv.invoice_date).toLocaleDateString('en-IN') : '-'}</td>
                            <td className="px-4 py-3 text-gray-600 text-xs">{inv.place_of_supply}-{STATE_NAMES[inv.place_of_supply] || ''}</td>
                            <td className="px-4 py-3 text-right font-semibold text-gray-900 text-xs">{formatCurrency(inv.invoice_value || 0)}</td>
                            <td className="px-4 py-3 text-right font-semibold text-gray-700 text-xs">{formatCurrency(inv.taxable_value || 0)}</td>
                            <td className="px-4 py-3 text-right font-semibold text-gray-700 text-xs">{formatCurrency(inv.igst_amount || 0)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
         )}

         {/* B2CS Tab */}
         {activeTab === 'b2cs' && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-200">
               <div className="p-4 bg-gradient-to-r from-blue-50 to-white border border-blue-200 rounded-xl text-sm text-blue-700 flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Data aggregated by Place of Supply and Tax Rate for invoices &lt; ₹2.5 Lakhs to unregistered persons.
               </div>
               {b2csSummaryData.length === 0 ? (
                 <div className="flex flex-col items-center justify-center h-48 text-gray-400 bg-white border border-gray-200 rounded-2xl shadow-sm">
                   <FileText className="h-10 w-10 mb-3 opacity-20" />
                   <p className="text-gray-500 text-sm">No B2CS data for this period.</p>
                 </div>
               ) : (
               <div className="bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden">
                  <table className="w-full text-left text-sm">
                     <thead className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-200">
                        <tr>
                           <th className="px-6 py-3 text-xs font-semibold text-gray-700 uppercase tracking-wider">Place of Supply</th>
                           <th className="px-6 py-3 text-xs font-semibold text-gray-700 uppercase tracking-wider text-center">Tax Rate</th>
                           <th className="px-6 py-3 text-xs font-semibold text-gray-700 uppercase tracking-wider text-right">Taxable Value</th>
                           <th className="px-6 py-3 text-xs font-semibold text-gray-700 uppercase tracking-wider text-right">IGST</th>
                           <th className="px-6 py-3 text-xs font-semibold text-gray-700 uppercase tracking-wider text-right">CGST</th>
                           <th className="px-6 py-3 text-xs font-semibold text-gray-700 uppercase tracking-wider text-right">SGST</th>
                           <th className="px-6 py-3 text-xs font-semibold text-gray-700 uppercase tracking-wider text-center">Count</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-gray-100">
                        {b2csSummaryData.map((row, idx) => (
                           <tr key={idx} className="hover:bg-gray-50">
                              <td className="px-6 py-4 text-gray-900 font-medium">{row.pos}-{STATE_NAMES[row.pos] || ''}</td>
                              <td className="px-6 py-4 text-center"><span className="bg-gray-100 px-2.5 py-1 rounded-full text-xs text-gray-700 font-semibold">{row.rate}%</span></td>
                              <td className="px-6 py-4 text-right font-semibold text-gray-700">{formatCurrency(row.taxable)}</td>
                              <td className="px-6 py-4 text-right font-semibold text-gray-600">{formatCurrency(row.igst)}</td>
                              <td className="px-6 py-4 text-right font-semibold text-gray-600">{formatCurrency(row.cgst)}</td>
                              <td className="px-6 py-4 text-right font-semibold text-gray-600">{formatCurrency(row.sgst)}</td>
                              <td className="px-6 py-4 text-center text-gray-900 font-bold">{row.count}</td>
                           </tr>
                        ))}
                     </tbody>
                  </table>
               </div>
               )}
            </div>
         )}

         {/* Exports Tab */}
         {activeTab === 'exports' && (
           <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-200">
             {invoices.filter(i => i.section === 'exp').length === 0 ? (
               <div className="flex flex-col items-center justify-center h-48 text-gray-400 bg-white border border-gray-200 rounded-2xl shadow-sm">
                 <FileText className="h-10 w-10 mb-3 opacity-20" />
                 <p className="text-gray-500 text-sm">No export invoices for this period.</p>
               </div>
             ) : (
               <div className="bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden">
                 <div className="overflow-x-auto">
                   <table className="w-full text-left text-sm">
                     <thead className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-200">
                       <tr>
                         <th className="px-4 py-3 text-xs font-semibold text-gray-700 uppercase">Invoice No</th>
                         <th className="px-4 py-3 text-xs font-semibold text-gray-700 uppercase">Date</th>
                         <th className="px-4 py-3 text-xs font-semibold text-gray-700 uppercase text-right">Value</th>
                         <th className="px-4 py-3 text-xs font-semibold text-gray-700 uppercase text-right">Taxable</th>
                         <th className="px-4 py-3 text-xs font-semibold text-gray-700 uppercase text-right">IGST</th>
                       </tr>
                     </thead>
                     <tbody className="divide-y divide-gray-100">
                       {invoices.filter(i => i.section === 'exp').map(inv => (
                         <tr key={inv.id} className="hover:bg-gray-50">
                           <td className="px-4 py-3 font-semibold text-gray-900">{inv.invoice_number}</td>
                           <td className="px-4 py-3 text-gray-600 text-xs">{inv.invoice_date ? new Date(inv.invoice_date).toLocaleDateString('en-IN') : '-'}</td>
                           <td className="px-4 py-3 text-right font-semibold text-gray-900 text-xs">{formatCurrency(inv.invoice_value || 0)}</td>
                           <td className="px-4 py-3 text-right font-semibold text-gray-700 text-xs">{formatCurrency(inv.taxable_value || 0)}</td>
                           <td className="px-4 py-3 text-right font-semibold text-gray-700 text-xs">{formatCurrency(inv.igst_amount || 0)}</td>
                         </tr>
                       ))}
                     </tbody>
                   </table>
                 </div>
               </div>
             )}
           </div>
         )}

         {/* HSN Summary Tab */}
         {activeTab === 'hsn' && (
           <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-200">
             <div className="inline-flex gap-1 p-1 bg-gray-100 rounded-xl">
               <button onClick={() => setHsnSubTab('b2b')}
                 className={`px-4 py-2 text-xs font-semibold rounded-lg ${hsnSubTab === 'b2b' ? 'bg-white shadow text-emerald-700' : 'text-gray-600'}`}>
                 B2B Supplies ({hsnSummaryB2b.length})
               </button>
               <button onClick={() => setHsnSubTab('b2c')}
                 className={`px-4 py-2 text-xs font-semibold rounded-lg ${hsnSubTab === 'b2c' ? 'bg-white shadow text-emerald-700' : 'text-gray-600'}`}>
                 B2C Supplies ({hsnSummaryB2c.length})
               </button>
             </div>
             {hsnSummary.length === 0 ? (
               <div className="flex flex-col items-center justify-center h-48 text-gray-400 bg-white border border-gray-200 rounded-2xl shadow-sm">
                 <FileText className="h-10 w-10 mb-3 opacity-20" />
                 <p className="text-gray-500 text-sm">No HSN data for {hsnSubTab === 'b2b' ? 'B2B' : 'B2C'} supplies in this period.</p>
               </div>
             ) : (
               <div className="bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden">
                 <table className="w-full text-left text-sm">
                   <thead className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-200">
                     <tr>
                       <th className="px-4 py-3 text-xs font-semibold text-gray-700 uppercase">HSN Code</th>
                       <th className="px-4 py-3 text-xs font-semibold text-gray-700 uppercase">Rate</th>
                       <th className="px-4 py-3 text-xs font-semibold text-gray-700 uppercase">UQC</th>
                       <th className="px-4 py-3 text-xs font-semibold text-gray-700 uppercase text-right">Quantity</th>
                       <th className="px-4 py-3 text-xs font-semibold text-gray-700 uppercase text-right">Taxable</th>
                       <th className="px-4 py-3 text-xs font-semibold text-gray-700 uppercase text-right">IGST</th>
                       <th className="px-4 py-3 text-xs font-semibold text-gray-700 uppercase text-right">CGST</th>
                       <th className="px-4 py-3 text-xs font-semibold text-gray-700 uppercase text-right">SGST</th>
                       <th className="px-4 py-3 text-xs font-semibold text-gray-700 uppercase text-right">Lines</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-gray-100">
                     {hsnSummary.map((row, idx) => (
                       <tr key={idx} className="hover:bg-gray-50">
                         <td className="px-4 py-3 font-semibold text-gray-900">{row.hsn}</td>
                         <td className="px-4 py-3 text-gray-600 text-xs">{row.rate}%</td>
                         <td className="px-4 py-3 text-gray-600 text-xs">{row.uqc}</td>
                         <td className="px-4 py-3 text-right text-gray-700 text-xs">{row.qty}</td>
                         <td className="px-4 py-3 text-right font-semibold text-gray-700 text-xs">{formatCurrency(row.taxable)}</td>
                         <td className="px-4 py-3 text-right font-semibold text-gray-600 text-xs">{formatCurrency(row.igst)}</td>
                         <td className="px-4 py-3 text-right font-semibold text-gray-600 text-xs">{formatCurrency(row.cgst)}</td>
                         <td className="px-4 py-3 text-right font-semibold text-gray-600 text-xs">{formatCurrency(row.sgst)}</td>
                         <td className="px-4 py-3 text-right text-gray-900 font-bold text-xs">{row.count}</td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>
             )}
           </div>
         )}

         {/* Documents Tab */}
         {activeTab === 'docs' && (
           <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-200">
             <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-700">
               Table 13 — Documents issued during the tax period (auto-derived from invoice series).
             </div>
             {docSeries.length === 0 ? (
               <div className="flex flex-col items-center justify-center h-48 text-gray-400 bg-white border border-gray-200 rounded-2xl shadow-sm">
                 <FileText className="h-10 w-10 mb-3 opacity-20" />
                 <p className="text-gray-500 text-sm">Generate draft to populate document summary.</p>
               </div>
             ) : (
               <div className="bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden">
                 <table className="w-full text-left text-sm">
                   <thead className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-200">
                     <tr>
                       <th className="px-4 py-3 text-xs font-semibold text-gray-700 uppercase">Document Type</th>
                       <th className="px-4 py-3 text-xs font-semibold text-gray-700 uppercase">From</th>
                       <th className="px-4 py-3 text-xs font-semibold text-gray-700 uppercase">To</th>
                       <th className="px-4 py-3 text-xs font-semibold text-gray-700 uppercase text-center">Total</th>
                       <th className="px-4 py-3 text-xs font-semibold text-gray-700 uppercase text-center">Cancelled</th>
                       <th className="px-4 py-3 text-xs font-semibold text-gray-700 uppercase text-center">Net Issued</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-gray-100">
                     {docSeries.map((d, idx) => (
                       <tr key={idx} className="hover:bg-gray-50">
                         <td className="px-4 py-3 text-gray-900 font-medium text-xs">{d.doc_type}</td>
                         <td className="px-4 py-3 font-mono text-xs">{d.from}</td>
                         <td className="px-4 py-3 font-mono text-xs">{d.to}</td>
                         <td className="px-4 py-3 text-center font-semibold">{d.totnum}</td>
                         <td className="px-4 py-3 text-center text-gray-600">{d.cancel}</td>
                         <td className="px-4 py-3 text-center font-bold text-emerald-700">{d.net_issue}</td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>
             )}
           </div>
         )}

      </div>
      </>
      )}

      {/* OTP Modal */}
      {showOTPModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowOTPModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-gray-900">GST Portal Authentication</h3>
              <button onClick={() => setShowOTPModal(false)}><X className="h-5 w-5" /></button>
            </div>
            {otpError && <p className="text-sm text-red-600 mb-3">{otpError}</p>}
            {otpStep === 'request' ? (
              <button onClick={handleRequestOTP} disabled={otpLoading}
                className="btn-primary-custom w-full py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2">
                {otpLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
                Request OTP on Registered Mobile
              </button>
            ) : (
              <div className="space-y-3">
                <input type="text" value={otpValue} onChange={(e) => setOtpValue(e.target.value)}
                  placeholder="Enter OTP" maxLength={10}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-center text-lg tracking-widest" />
                <button onClick={handleVerifyOTP} disabled={otpLoading}
                  className="btn-primary-custom w-full py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2">
                  {otpLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                  Verify OTP
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* File with EVC Modal */}
      {showFileModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowFileModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold text-gray-900">File GSTR-1 with EVC</h3>
            <p className="text-xs text-gray-600">Enter signatory PAN and EVC OTP received on registered mobile/email.</p>
            <input type="text" value={filePan} onChange={(e) => setFilePan(e.target.value.toUpperCase())}
              placeholder="PAN (e.g. ABCDE1234F)" maxLength={10}
              className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm" />
            <input type="text" value={fileEvcOtp} onChange={(e) => setFileEvcOtp(e.target.value)}
              placeholder="EVC OTP" maxLength={10}
              className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm text-center tracking-widest" />
            <button onClick={handleFileWithEvc} disabled={filingLoading || !filePan || !fileEvcOtp}
              className="btn-primary-custom w-full py-2.5 rounded-xl text-sm font-bold disabled:opacity-50">
              {filingLoading ? 'Filing...' : 'File Return'}
            </button>
          </div>
        </div>
      )}

      {/* JSON Preview Modal */}
      {showJsonPreview && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowJsonPreview(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[80vh] overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h3 className="font-bold text-gray-900">GSTR-1 JSON Preview</h3>
              <button onClick={() => setShowJsonPreview(false)} className="p-1 hover:bg-gray-100 rounded-lg"><X className="h-5 w-5" /></button>
            </div>
            <div className="p-6 overflow-auto max-h-[60vh]">
              <pre className="text-xs text-gray-700 bg-gray-50 p-4 rounded-xl overflow-auto whitespace-pre-wrap font-mono">{jsonPreview}</pre>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
              <button onClick={() => { navigator.clipboard.writeText(jsonPreview); }} className="px-4 py-2 rounded-lg bg-white border border-gray-300 text-sm text-gray-700 hover:bg-gray-50">Copy</button>
              <button onClick={() => setShowJsonPreview(false)} className="btn-primary-custom px-4 py-2 rounded-lg text-sm font-bold">Close</button>
            </div>
          </div>
        </div>
      )}

    </div>
    </div>
  );
}

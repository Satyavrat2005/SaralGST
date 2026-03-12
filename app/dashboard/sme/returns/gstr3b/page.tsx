'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Calendar, RefreshCw, FileText, CreditCard, CheckCircle2,
  AlertTriangle, Loader2, X, Send, Clock
} from 'lucide-react';

interface Section31Row {
  label: string;
  key: string;
  taxable: number;
  igst: number;
  cgst: number;
  sgst: number;
  cess: number;
}

interface Section4Row {
  label: string;
  key: string;
  type: 'available' | 'reversed';
  igst: number;
  cgst: number;
  sgst: number;
  cess: number;
}

interface GSTR3BData {
  id: string;
  return_id: string;
   sec_3_1_a_taxable: number;
   sec_3_1_a_igst: number;
   sec_3_1_a_cgst: number;
   sec_3_1_a_sgst: number;
   sec_3_1_a_cess: number;
   sec_3_1_b_taxable: number;
   sec_3_1_b_igst: number;
   sec_3_1_c_taxable: number;
   sec_3_1_d_taxable: number;
   sec_3_1_d_igst: number;
   sec_3_1_d_cgst: number;
   sec_3_1_d_sgst: number;
   sec_3_1_d_cess: number;
   sec_3_1_e_taxable: number;
   sec_4_a1_igst: number;
   sec_4_a1_cgst: number;
   sec_4_a1_sgst: number;
   sec_4_a1_cess: number;
   sec_4_a2_igst: number;
   sec_4_a2_cgst: number;
   sec_4_a2_sgst: number;
   sec_4_a2_cess: number;
   sec_4_a3_igst: number;
   sec_4_a3_cgst: number;
   sec_4_a3_sgst: number;
   sec_4_a3_cess: number;
   sec_4_a4_igst: number;
   sec_4_a4_cgst: number;
   sec_4_a4_sgst: number;
   sec_4_a4_cess: number;
   sec_4_a5_igst: number;
   sec_4_a5_cgst: number;
   sec_4_a5_sgst: number;
   sec_4_a5_cess: number;
   sec_4_b1_igst: number;
   sec_4_b1_cgst: number;
   sec_4_b1_sgst: number;
   sec_4_b1_cess: number;
   sec_4_b2_igst: number;
   sec_4_b2_cgst: number;
   sec_4_b2_sgst: number;
   sec_4_b2_cess: number;
   sec_6_1_igst_tax: number;
   sec_6_1_igst_itc: number;
   sec_6_1_igst_cash: number;
   sec_6_1_cgst_tax: number;
   sec_6_1_cgst_itc: number;
   sec_6_1_cgst_cash: number;
   sec_6_1_sgst_tax: number;
   sec_6_1_sgst_itc: number;
   sec_6_1_sgst_cash: number;
   sec_6_1_cess_tax: number;
   sec_6_1_cess_cash: number;
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
  updated_at: string;
  arn: string;
}

function getDisplayErrorMessage(error: unknown, fallback: string): string {
   if (typeof error === 'string' && error.trim()) return error;
   if (error && typeof error === 'object') {
      const maybeError = error as { message?: unknown; error_cd?: unknown };
      if (typeof maybeError.message === 'string' && maybeError.message.trim()) {
         return typeof maybeError.error_cd === 'string' && maybeError.error_cd.trim()
            ? `${maybeError.message} (${maybeError.error_cd})`
            : maybeError.message;
      }
   }
   return fallback;
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

const DEFAULT_31: Section31Row[] = [
  { label: '(a) Outward taxable supplies (other than zero rated, nil rated and exempted)', key: 'a', taxable: 0, igst: 0, cgst: 0, sgst: 0, cess: 0 },
  { label: '(b) Outward taxable supplies (zero rated)', key: 'b', taxable: 0, igst: 0, cgst: 0, sgst: 0, cess: 0 },
  { label: '(c) Other outward supplies (Nil rated, exempted)', key: 'c', taxable: 0, igst: 0, cgst: 0, sgst: 0, cess: 0 },
  { label: '(d) Inward supplies (liable to reverse charge)', key: 'd', taxable: 0, igst: 0, cgst: 0, sgst: 0, cess: 0 },
  { label: '(e) Non-GST outward supplies', key: 'e', taxable: 0, igst: 0, cgst: 0, sgst: 0, cess: 0 },
];

const DEFAULT_4: Section4Row[] = [
  { label: '(1) Import of goods', key: 'import_goods', type: 'available', igst: 0, cgst: 0, sgst: 0, cess: 0 },
  { label: '(2) Import of services', key: 'import_services', type: 'available', igst: 0, cgst: 0, sgst: 0, cess: 0 },
  { label: '(3) Inward supplies liable to reverse charge', key: 'reverse_charge', type: 'available', igst: 0, cgst: 0, sgst: 0, cess: 0 },
  { label: '(4) Inward supplies from ISD', key: 'isd', type: 'available', igst: 0, cgst: 0, sgst: 0, cess: 0 },
  { label: '(5) All other ITC', key: 'all_other', type: 'available', igst: 0, cgst: 0, sgst: 0, cess: 0 },
  { label: '(1) As per rules 38, 42 & 43 of CGST Rules', key: 'rule_reversal', type: 'reversed', igst: 0, cgst: 0, sgst: 0, cess: 0 },
  { label: '(2) Others', key: 'other_reversal', type: 'reversed', igst: 0, cgst: 0, sgst: 0, cess: 0 },
];

function mapSection31(data: GSTR3BData): Section31Row[] {
   return [
      { label: '(a) Outward taxable supplies (other than zero rated, nil rated and exempted)', key: 'a', taxable: data.sec_3_1_a_taxable || 0, igst: data.sec_3_1_a_igst || 0, cgst: data.sec_3_1_a_cgst || 0, sgst: data.sec_3_1_a_sgst || 0, cess: data.sec_3_1_a_cess || 0 },
      { label: '(b) Outward taxable supplies (zero rated)', key: 'b', taxable: data.sec_3_1_b_taxable || 0, igst: data.sec_3_1_b_igst || 0, cgst: 0, sgst: 0, cess: 0 },
      { label: '(c) Other outward supplies (Nil rated, exempted)', key: 'c', taxable: data.sec_3_1_c_taxable || 0, igst: 0, cgst: 0, sgst: 0, cess: 0 },
      { label: '(d) Inward supplies (liable to reverse charge)', key: 'd', taxable: data.sec_3_1_d_taxable || 0, igst: data.sec_3_1_d_igst || 0, cgst: data.sec_3_1_d_cgst || 0, sgst: data.sec_3_1_d_sgst || 0, cess: data.sec_3_1_d_cess || 0 },
      { label: '(e) Non-GST outward supplies', key: 'e', taxable: data.sec_3_1_e_taxable || 0, igst: 0, cgst: 0, sgst: 0, cess: 0 },
   ];
}

function mapSection4(data: GSTR3BData): Section4Row[] {
   return [
      { label: '(1) Import of goods', key: 'import_goods', type: 'available', igst: data.sec_4_a1_igst || 0, cgst: data.sec_4_a1_cgst || 0, sgst: data.sec_4_a1_sgst || 0, cess: data.sec_4_a1_cess || 0 },
      { label: '(2) Import of services', key: 'import_services', type: 'available', igst: data.sec_4_a2_igst || 0, cgst: data.sec_4_a2_cgst || 0, sgst: data.sec_4_a2_sgst || 0, cess: data.sec_4_a2_cess || 0 },
      { label: '(3) Inward supplies liable to reverse charge', key: 'reverse_charge', type: 'available', igst: data.sec_4_a3_igst || 0, cgst: data.sec_4_a3_cgst || 0, sgst: data.sec_4_a3_sgst || 0, cess: data.sec_4_a3_cess || 0 },
      { label: '(4) Inward supplies from ISD', key: 'isd', type: 'available', igst: data.sec_4_a4_igst || 0, cgst: data.sec_4_a4_cgst || 0, sgst: data.sec_4_a4_sgst || 0, cess: data.sec_4_a4_cess || 0 },
      { label: '(5) All other ITC', key: 'all_other', type: 'available', igst: data.sec_4_a5_igst || 0, cgst: data.sec_4_a5_cgst || 0, sgst: data.sec_4_a5_sgst || 0, cess: data.sec_4_a5_cess || 0 },
      { label: '(1) As per rules 38, 42 & 43 of CGST Rules', key: 'rule_reversal', type: 'reversed', igst: data.sec_4_b1_igst || 0, cgst: data.sec_4_b1_cgst || 0, sgst: data.sec_4_b1_sgst || 0, cess: data.sec_4_b1_cess || 0 },
      { label: '(2) Others', key: 'other_reversal', type: 'reversed', igst: data.sec_4_b2_igst || 0, cgst: data.sec_4_b2_cgst || 0, sgst: data.sec_4_b2_sgst || 0, cess: data.sec_4_b2_cess || 0 },
   ];
}

export default function GSTR3BDraftPage() {
  const [activeTab, setActiveTab] = useState('3.1');
  const [selectedPeriod, setSelectedPeriod] = useState(PERIODS[0].value);
  const [returnData, setReturnData] = useState<ReturnData | null>(null);
  const [gstr3bData, setGstr3bData] = useState<GSTR3BData | null>(null);
  const [section31, setSection31] = useState<Section31Row[]>(DEFAULT_31);
  const [section4, setSection4] = useState<Section4Row[]>(DEFAULT_4);
  const [section61, setSection61] = useState({ igst: 0, cgst: 0, sgst: 0, cess: 0, igst_itc: 0, cgst_itc: 0, sgst_itc: 0, cess_itc: 0, igst_cash: 0, cgst_cash: 0, sgst_cash: 0, cess_cash: 0 });
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const retRes = await fetch(`/api/returns?action=list&type=GSTR3B&period=${selectedPeriod}`);
      const retData = await retRes.json();
      if (retData.data && retData.data.length > 0) {
        setReturnData(retData.data[0]);
            const dataRes = await fetch(`/api/returns?action=gstr3b-data&id=${retData.data[0].id}`);
        const result = await dataRes.json();
        if (result.data) {
          setGstr3bData(result.data);
               setSection31(mapSection31(result.data));
               setSection4(mapSection4(result.data));
               setSection61({
                  igst: result.data.sec_6_1_igst_tax || 0,
                  cgst: result.data.sec_6_1_cgst_tax || 0,
                  sgst: result.data.sec_6_1_sgst_tax || 0,
                  cess: result.data.sec_6_1_cess_tax || 0,
                  igst_itc: result.data.sec_6_1_igst_itc || 0,
                  cgst_itc: result.data.sec_6_1_cgst_itc || 0,
                  sgst_itc: result.data.sec_6_1_sgst_itc || 0,
                  cess_itc: result.data.sec_6_1_cess_itc || 0,
                  igst_cash: result.data.sec_6_1_igst_cash || 0,
                  cgst_cash: result.data.sec_6_1_cgst_cash || 0,
                  sgst_cash: result.data.sec_6_1_sgst_cash || 0,
                  cess_cash: result.data.sec_6_1_cess_cash || 0,
               });
        }
      } else {
        setReturnData(null);
        setGstr3bData(null);
        setSection31(DEFAULT_31);
        setSection4(DEFAULT_4);
            setSection61({ igst: 0, cgst: 0, sgst: 0, cess: 0, igst_itc: 0, cgst_itc: 0, sgst_itc: 0, cess_itc: 0, igst_cash: 0, cgst_cash: 0, sgst_cash: 0, cess_cash: 0 });
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to fetch');
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
      const res = await fetch(`/api/returns?action=generate-gstr3b&period=${selectedPeriod}`);
      const data = await res.json();
         if (data.success) {
        setSuccessMsg('GSTR-3B draft generated from sales & purchase registers.');
        await fetchData();
      } else {
            setError(getDisplayErrorMessage(data.error, 'Failed to generate'));
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Generation failed');
    } finally {
      setGenerating(false);
    }
  };

  const handleSaveToPortal = async () => {
    if (!returnData?.id) return;
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/returns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'save-gstr3b', returnId: returnData.id, period: selectedPeriod }),
      });
      const data = await res.json();
      if (data.error) setError(getDisplayErrorMessage(data.error, 'Save failed'));
      else { setSuccessMsg('GSTR-3B saved to portal!'); await fetchData(); }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleMarkFiled = async () => {
    if (!returnData?.id) return;
    const arn = prompt('Enter ARN (Acknowledgment Reference Number):');
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
      setError(err instanceof Error ? err.message : 'Failed');
    }
  };

  const update31 = (index: number, field: string, value: string) => {
    setSection31(prev => prev.map((row, i) => i === index ? { ...row, [field]: parseFloat(value) || 0 } : row));
  };

  const update4 = (index: number, field: string, value: string) => {
    setSection4(prev => prev.map((row, i) => i === index ? { ...row, [field]: parseFloat(value) || 0 } : row));
  };

  const formatCurrency = (val: number) => `₹${val.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

  // Computed totals
  const outputTax = section31.reduce((s, r) => s + r.igst + r.cgst + r.sgst, 0);
  const itcAvailable = section4.filter(r => r.type === 'available').reduce((s, r) => s + r.igst + r.cgst + r.sgst, 0);
  const itcReversed = section4.filter(r => r.type === 'reversed').reduce((s, r) => s + r.igst + r.cgst + r.sgst, 0);
  const netITC = itcAvailable - itcReversed;
  const netPayable = Math.max(0, outputTax - netITC);

  const getDeadline = () => {
    const m = parseInt(selectedPeriod.substring(0, 2));
    const y = parseInt(selectedPeriod.substring(2));
    const dm = m === 12 ? 1 : m + 1;
    const dy = m === 12 ? y + 1 : y;
    return new Date(dy, dm - 1, 20);
  };
  const deadline = getDeadline();
  const daysLeft = Math.max(0, Math.ceil((deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));

  const statusLabel = returnData?.status === 'filed' ? 'Filed' :
    returnData?.status === 'submitted' ? 'Submitted' :
    returnData?.status === 'generated' ? 'Draft Ready' : 'Not Generated';

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

      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 border border-emerald-200 rounded-full mb-3">
            <FileText className="h-3.5 w-3.5 text-emerald-600" strokeWidth={2.5} />
            <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">Monthly Return</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">GSTR-3B Draft</h1>
          <p className="text-gray-600 text-sm mt-1">Monthly self-assessed return with tax liability</p>
        </div>
        <div className="flex items-center gap-3">
           <div className="relative">
             <select value={selectedPeriod} onChange={(e) => setSelectedPeriod(e.target.value)}
               className="appearance-none bg-white border border-gray-200 text-sm rounded-xl pl-9 pr-10 py-2.5 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-gray-900 cursor-pointer hover:border-gray-300 hover:shadow-sm transition-all">
               {PERIODS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
             </select>
             <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
           </div>
           <button onClick={handleGenerate} disabled={generating}
             className="btn-primary-custom px-4 py-2.5 rounded-xl text-sm font-medium shadow-md hover:shadow-lg transition-all flex items-center gap-2 disabled:opacity-50">
             {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
             {generating ? 'Generating...' : 'Auto-Generate'}
           </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 text-emerald-600 animate-spin" />
          <span className="ml-3 text-gray-600">Loading...</span>
        </div>
      ) : (
      <>
      {/* STATUS & SUMMARY */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         <div className="bg-white rounded-2xl border border-gray-200 shadow-lg lg:col-span-2 overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-gray-200">
               <div className="p-6 lg:col-span-2 space-y-6">
                  <div className="flex justify-between items-start">
                     <div>
                        <div className="flex items-center gap-3 mb-2">
                           <h3 className="text-lg font-bold text-gray-900">Tax Liability Summary</h3>
                           <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${
                             returnData?.status === 'filed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                             returnData?.status === 'generated' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                             'bg-gray-50 text-gray-600 border-gray-200'
                           }`}>{statusLabel}</span>
                        </div>
                        <p className="text-sm text-gray-600">Filing Deadline: <span className="text-gray-900 font-semibold">{deadline.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span> <span className={`font-semibold ${daysLeft > 7 ? 'text-emerald-600' : daysLeft > 0 ? 'text-amber-600' : 'text-red-600'}`}>({daysLeft > 0 ? `${daysLeft} days left` : 'Overdue'})</span></p>
                     </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200">
                     <div>
                        <p className="text-xs text-gray-600 font-semibold mb-1">Output Tax (3.1)</p>
                        <p className="text-xl font-bold text-gray-900">{formatCurrency(outputTax)}</p>
                     </div>
                     <div>
                        <p className="text-xs text-gray-600 font-semibold mb-1">ITC Available (4)</p>
                        <p className="text-xl font-bold text-emerald-600">{formatCurrency(netITC)}</p>
                     </div>
                     <div>
                        <p className="text-xs text-gray-600 font-semibold mb-1">Reversals</p>
                        <p className="text-xl font-bold text-red-600">{formatCurrency(itcReversed)}</p>
                     </div>
                  </div>
               </div>
               <div className="p-6 flex flex-col justify-center items-center text-center bg-gradient-to-br from-emerald-50 to-teal-50">
                  <p className="text-xs text-gray-600 uppercase font-semibold mb-2">Net Payable in Cash</p>
                  <p className="text-4xl font-bold text-gray-900">{formatCurrency(netPayable)}</p>
               </div>
            </div>
         </div>

         <div className="space-y-4">
            {returnData?.status !== 'filed' && (
              <>
                <button onClick={handleSaveToPortal} disabled={saving || !returnData}
                  className="w-full p-5 rounded-2xl bg-white border border-gray-200 shadow-lg hover:shadow-xl hover:border-blue-300 transition-all text-left group disabled:opacity-50">
                   <div className="flex items-center gap-3">
                      <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30">
                         {saving ? <Loader2 className="h-6 w-6 animate-spin" /> : <Send className="h-6 w-6" strokeWidth={2.5} />}
                      </div>
                      <div className="flex-1">
                         <h4 className="font-bold text-gray-900 text-base">{saving ? 'Saving...' : 'Save to Portal'}</h4>
                         <p className="text-xs text-gray-600 mt-0.5">Push data to MasterGST</p>
                      </div>
                   </div>
                </button>
                <button onClick={handleMarkFiled} disabled={!returnData}
                  className="w-full p-5 rounded-2xl bg-white border border-emerald-200 shadow-lg hover:shadow-xl hover:border-emerald-300 transition-all text-left group disabled:opacity-50">
                   <div className="flex items-center gap-3">
                      <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/30">
                         <CheckCircle2 className="h-6 w-6" strokeWidth={2.5} />
                      </div>
                      <div className="flex-1">
                         <h4 className="font-bold text-gray-900 text-base">File GSTR-3B</h4>
                         <p className="text-xs text-gray-600 mt-0.5">Mark as filed with ARN</p>
                      </div>
                   </div>
                </button>
              </>
            )}
            {returnData?.arn && (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-center">
                <p className="text-xs text-emerald-600 font-semibold uppercase mb-1">Filed Successfully</p>
                <p className="text-sm font-mono text-emerald-700">ARN: {returnData.arn}</p>
              </div>
            )}
         </div>
      </div>

      {/* TAB NAVIGATION */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-2 inline-flex gap-1 overflow-x-auto">
         {[
            { id: '3.1', label: '3.1 Tax on Supplies' },
            { id: '4', label: '4. ITC Available' },
            { id: '5', label: '5. Exempt/Nil' },
            { id: '6.1', label: '6.1 Payment' },
         ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
               className={`px-4 py-2.5 text-sm font-medium rounded-xl transition-all whitespace-nowrap ${
                 activeTab === tab.id ? 'bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-700 shadow-sm border border-emerald-200' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
               }`}>
               {tab.label}
            </button>
         ))}
      </div>

      {/* FORM CONTENT */}
      <div className="min-h-[400px]">
         {/* Section 3.1 */}
         {activeTab === '3.1' && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden animate-in fade-in slide-in-from-bottom-2">
               <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
                  <h3 className="font-bold text-gray-900 text-sm">3.1 Details of Outward Supplies and Inward Supplies Liable to Reverse Charge</h3>
               </div>
               <div className="p-6 overflow-x-auto">
                  <table className="w-full text-sm text-left">
                     <thead className="text-gray-700 font-semibold border-b border-gray-200 bg-gray-50">
                        <tr>
                           <th className="py-3 pr-4 min-w-[250px] text-xs uppercase tracking-wider">Nature of Supplies</th>
                           <th className="py-3 px-2 text-right min-w-[120px] text-xs uppercase tracking-wider">Total Taxable Value</th>
                           <th className="py-3 px-2 text-right min-w-[120px] text-xs uppercase tracking-wider">Integrated Tax</th>
                           <th className="py-3 px-2 text-right min-w-[120px] text-xs uppercase tracking-wider">Central Tax</th>
                           <th className="py-3 px-2 text-right min-w-[120px] text-xs uppercase tracking-wider">State/UT Tax</th>
                           <th className="py-3 px-2 text-right min-w-[100px] text-xs uppercase tracking-wider">Cess</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-gray-100">
                        {section31.map((row, i) => (
                           <tr key={i} className="hover:bg-gray-50 transition-colors">
                              <td className="py-4 pr-4 text-gray-700 text-xs">{row.label}</td>
                              <td className="px-2 py-2">
                                 <input type="number" value={row.taxable} onChange={(e) => update31(i, 'taxable', e.target.value)}
                                   className="w-full bg-white border border-gray-200 rounded-lg p-2 text-right text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-xs" />
                              </td>
                              <td className="px-2 py-2">
                                 <input type="number" value={row.igst} onChange={(e) => update31(i, 'igst', e.target.value)}
                                   className="w-full bg-white border border-gray-200 rounded-lg p-2 text-right text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-xs" />
                              </td>
                              <td className="px-2 py-2">
                                 <input type="number" value={row.cgst} onChange={(e) => update31(i, 'cgst', e.target.value)}
                                   className="w-full bg-white border border-gray-200 rounded-lg p-2 text-right text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-xs" />
                              </td>
                              <td className="px-2 py-2">
                                 <input type="number" value={row.sgst} onChange={(e) => update31(i, 'sgst', e.target.value)}
                                   className="w-full bg-white border border-gray-200 rounded-lg p-2 text-right text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-xs" />
                              </td>
                              <td className="px-2 py-2">
                                 <input type="number" value={row.cess} onChange={(e) => update31(i, 'cess', e.target.value)}
                                   className="w-full bg-white border border-gray-200 rounded-lg p-2 text-right text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-xs" />
                              </td>
                           </tr>
                        ))}
                     </tbody>
                  </table>
               </div>
            </div>
         )}

         {/* Section 4 */}
         {activeTab === '4' && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden animate-in fade-in slide-in-from-bottom-2">
               <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
                  <h3 className="font-bold text-gray-900 text-sm">4. Eligible ITC</h3>
               </div>
               <div className="p-6 overflow-x-auto">
                  <table className="w-full text-sm text-left">
                     <thead className="text-gray-700 font-semibold border-b border-gray-200 bg-gray-50">
                        <tr>
                           <th className="py-3 pr-4 min-w-[250px] text-xs uppercase tracking-wider">Details</th>
                           <th className="py-3 px-2 text-right min-w-[120px] text-xs uppercase tracking-wider">Integrated Tax</th>
                           <th className="py-3 px-2 text-right min-w-[120px] text-xs uppercase tracking-wider">Central Tax</th>
                           <th className="py-3 px-2 text-right min-w-[120px] text-xs uppercase tracking-wider">State/UT Tax</th>
                           <th className="py-3 px-2 text-right min-w-[100px] text-xs uppercase tracking-wider">Cess</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-gray-100">
                        <tr><td colSpan={5} className="py-2 font-semibold text-emerald-700 text-xs uppercase tracking-wider bg-emerald-50">A. ITC Available (whether in full or part)</td></tr>
                        {section4.filter(r => r.type === 'available').map((row, i) => {
                          const idx = section4.findIndex(r => r.key === row.key);
                          return (
                           <tr key={row.key} className="hover:bg-gray-50 transition-colors">
                              <td className="py-4 pr-4 text-gray-700 pl-4 text-xs">{row.label}</td>
                              <td className="px-2 py-2"><input type="number" value={row.igst} onChange={(e) => update4(idx, 'igst', e.target.value)} className="w-full bg-white border border-gray-200 rounded-lg p-2 text-right text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-xs" /></td>
                              <td className="px-2 py-2"><input type="number" value={row.cgst} onChange={(e) => update4(idx, 'cgst', e.target.value)} className="w-full bg-white border border-gray-200 rounded-lg p-2 text-right text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-xs" /></td>
                              <td className="px-2 py-2"><input type="number" value={row.sgst} onChange={(e) => update4(idx, 'sgst', e.target.value)} className="w-full bg-white border border-gray-200 rounded-lg p-2 text-right text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-xs" /></td>
                              <td className="px-2 py-2"><input type="number" value={row.cess} onChange={(e) => update4(idx, 'cess', e.target.value)} className="w-full bg-white border border-gray-200 rounded-lg p-2 text-right text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-xs" /></td>
                           </tr>
                          );
                        })}
                        <tr><td colSpan={5} className="py-2 pt-4 font-semibold text-red-700 text-xs uppercase tracking-wider bg-red-50">B. ITC Reversed</td></tr>
                        {section4.filter(r => r.type === 'reversed').map((row) => {
                          const idx = section4.findIndex(r => r.key === row.key);
                          return (
                           <tr key={row.key} className="hover:bg-gray-50 transition-colors">
                              <td className="py-4 pr-4 text-gray-700 pl-4 text-xs">{row.label}</td>
                              <td className="px-2 py-2"><input type="number" value={row.igst} onChange={(e) => update4(idx, 'igst', e.target.value)} className="w-full bg-white border border-gray-200 rounded-lg p-2 text-right text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-xs" /></td>
                              <td className="px-2 py-2"><input type="number" value={row.cgst} onChange={(e) => update4(idx, 'cgst', e.target.value)} className="w-full bg-white border border-gray-200 rounded-lg p-2 text-right text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-xs" /></td>
                              <td className="px-2 py-2"><input type="number" value={row.sgst} onChange={(e) => update4(idx, 'sgst', e.target.value)} className="w-full bg-white border border-gray-200 rounded-lg p-2 text-right text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-xs" /></td>
                              <td className="px-2 py-2"><input type="number" value={row.cess} onChange={(e) => update4(idx, 'cess', e.target.value)} className="w-full bg-white border border-gray-200 rounded-lg p-2 text-right text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-xs" /></td>
                           </tr>
                          );
                        })}
                     </tbody>
                  </table>
               </div>
               <div className="px-6 py-4 border-t border-gray-200 flex justify-between items-center bg-gradient-to-r from-gray-50 to-white">
                  <div className="text-sm text-gray-700">Net ITC Available (A - B): <span className="text-emerald-600 font-bold ml-2">{formatCurrency(netITC)}</span></div>
               </div>
            </div>
         )}

         {/* Section 5 */}
         {activeTab === '5' && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden animate-in fade-in slide-in-from-bottom-2">
               <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
                  <h3 className="font-bold text-gray-900 text-sm">5. Values of Exempt, Nil Rated and Non-GST Inward Supplies</h3>
               </div>
               <div className="p-6">
                  <table className="w-full text-sm text-left">
                     <thead className="text-gray-700 font-semibold border-b border-gray-200 bg-gray-50">
                        <tr>
                           <th className="py-3 pr-4 text-xs uppercase tracking-wider">Nature of Supplies</th>
                           <th className="py-3 px-2 text-right text-xs uppercase tracking-wider">Inter-State</th>
                           <th className="py-3 px-2 text-right text-xs uppercase tracking-wider">Intra-State</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-gray-100">
                        <tr className="hover:bg-gray-50">
                           <td className="py-4 pr-4 text-gray-700 text-xs">Exempted Supplies</td>
                           <td className="px-2 py-2"><input type="number" defaultValue={0} className="w-full bg-white border border-gray-200 rounded-lg p-2 text-right text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-xs" /></td>
                           <td className="px-2 py-2"><input type="number" defaultValue={0} className="w-full bg-white border border-gray-200 rounded-lg p-2 text-right text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-xs" /></td>
                        </tr>
                        <tr className="hover:bg-gray-50">
                           <td className="py-4 pr-4 text-gray-700 text-xs">Nil Rated Supplies</td>
                           <td className="px-2 py-2"><input type="number" defaultValue={0} className="w-full bg-white border border-gray-200 rounded-lg p-2 text-right text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-xs" /></td>
                           <td className="px-2 py-2"><input type="number" defaultValue={0} className="w-full bg-white border border-gray-200 rounded-lg p-2 text-right text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-xs" /></td>
                        </tr>
                        <tr className="hover:bg-gray-50">
                           <td className="py-4 pr-4 text-gray-700 text-xs">Non-GST Supplies</td>
                           <td className="px-2 py-2"><input type="number" defaultValue={0} className="w-full bg-white border border-gray-200 rounded-lg p-2 text-right text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-xs" /></td>
                           <td className="px-2 py-2"><input type="number" defaultValue={0} className="w-full bg-white border border-gray-200 rounded-lg p-2 text-right text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-xs" /></td>
                        </tr>
                     </tbody>
                  </table>
               </div>
            </div>
         )}

         {/* Section 6.1 Payment */}
         {activeTab === '6.1' && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden animate-in fade-in slide-in-from-bottom-2">
               <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
                  <h3 className="font-bold text-gray-900 text-sm">6.1 Payment of Tax</h3>
               </div>
               <div className="p-6 overflow-x-auto">
                  <table className="w-full text-sm text-left">
                     <thead className="text-gray-700 font-semibold border-b border-gray-200 bg-gray-50">
                        <tr>
                           <th className="py-3 pr-4 min-w-[180px] text-xs uppercase tracking-wider">Description</th>
                           <th className="py-3 px-2 text-right min-w-[120px] text-xs uppercase tracking-wider">Total Tax</th>
                           <th className="py-3 px-2 text-right min-w-[120px] text-xs uppercase tracking-wider">Paid via ITC</th>
                           <th className="py-3 px-2 text-right min-w-[120px] text-xs uppercase tracking-wider">Paid in Cash</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-gray-100">
                        {[
                          { label: 'Integrated Tax', total: section31.reduce((s, r) => s + r.igst, 0), itc: section4.filter(r => r.type === 'available').reduce((s, r) => s + r.igst, 0) },
                          { label: 'Central Tax', total: section31.reduce((s, r) => s + r.cgst, 0), itc: section4.filter(r => r.type === 'available').reduce((s, r) => s + r.cgst, 0) },
                          { label: 'State/UT Tax', total: section31.reduce((s, r) => s + r.sgst, 0), itc: section4.filter(r => r.type === 'available').reduce((s, r) => s + r.sgst, 0) },
                          { label: 'Cess', total: section31.reduce((s, r) => s + r.cess, 0), itc: section4.filter(r => r.type === 'available').reduce((s, r) => s + r.cess, 0) },
                        ].map((row, i) => (
                           <tr key={i} className="hover:bg-gray-50 transition-colors">
                              <td className="py-4 pr-4 text-gray-900 font-medium text-xs">{row.label}</td>
                              <td className="px-2 py-4 text-right font-semibold text-gray-900 text-xs">{formatCurrency(row.total)}</td>
                              <td className="px-2 py-4 text-right font-semibold text-emerald-600 text-xs">{formatCurrency(Math.min(row.itc, row.total))}</td>
                              <td className="px-2 py-4 text-right font-bold text-blue-700 text-xs">{formatCurrency(Math.max(0, row.total - row.itc))}</td>
                           </tr>
                        ))}
                     </tbody>
                     <tfoot className="border-t-2 border-gray-300 bg-gray-50">
                        <tr className="font-bold">
                           <td className="py-4 pr-4 text-gray-900 text-sm">Total</td>
                           <td className="px-2 py-4 text-right text-gray-900 text-sm">{formatCurrency(outputTax)}</td>
                           <td className="px-2 py-4 text-right text-emerald-600 text-sm">{formatCurrency(Math.min(itcAvailable, outputTax))}</td>
                           <td className="px-2 py-4 text-right text-blue-700 text-sm">{formatCurrency(netPayable)}</td>
                        </tr>
                     </tfoot>
                  </table>
               </div>
            </div>
         )}
      </div>
      </>
      )}

    </div>
    </div>
  );
}

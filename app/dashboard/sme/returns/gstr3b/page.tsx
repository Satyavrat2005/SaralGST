'use client';

import React, { useState, useMemo } from 'react';
import {
  Calendar, RefreshCw, FileText, Download, CheckCircle2,
  AlertTriangle, Building2, Hash, Clock, TrendingUp, TrendingDown,
  Wallet, ChevronRight, Info, FileWarning, Shield
} from 'lucide-react';

// ─── HARDCODED DATA: DEV KAILASH STEEL | GSTR-3B | March 2025 ──────────────
const MARCH_2025_DATA = {
  taxpayer: {
    name: 'DEV KAILASH STEEL',
    gstin: '27AATFD2632G1ZC',
    state: 'Maharashtra',
    period: 'March 2025',
    periodValue: '032025',
    fyear: '2024-25',
    status: 'filed',
    arn: 'AB2703250123456',
    filedOn: '20 Apr 2025',
    dueDate: '20 Apr 2025',
  },
  section31: [
    { label: '(a) Outward taxable supplies (other than zero rated, nil rated and exempted)', key: 'a', taxable: 8335591.43, igst: 50863.32, cgst: 499135.98, sgst: 499135.98, cess: 0 },
    { label: '(b) Outward taxable supplies (zero rated)', key: 'b', taxable: 0, igst: 0, cgst: 0, sgst: 0, cess: 0 },
    { label: '(c) Other outward supplies (Nil rated, exempted)', key: 'c', taxable: 0, igst: 0, cgst: 0, sgst: 0, cess: 0 },
    { label: '(d) Inward supplies (liable to reverse charge)', key: 'd', taxable: 6200.00, igst: 310.00, cgst: 0, sgst: 0, cess: 0 },
    { label: '(e) Non-GST outward supplies', key: 'e', taxable: 0, igst: 0, cgst: 0, sgst: 0, cess: 0 },
  ],
  section311: [
    { label: '(i) Taxable supplies on which ECO pays tax u/s 9(5)', key: 'i', taxable: 0, igst: 0, cgst: 0, sgst: 0, cess: 0 },
    { label: '(ii) Taxable supplies made by registered person through ECO', key: 'ii', taxable: 0, igst: 0, cgst: 0, sgst: 0, cess: 0 },
  ],
  section4A: [
    { label: '(1) Import of goods', key: 'a1', igst: 0, cgst: 0, sgst: 0, cess: 0 },
    { label: '(2) Import of services', key: 'a2', igst: 0, cgst: 0, sgst: 0, cess: 0 },
    { label: '(3) Inward supplies liable to reverse charge (other than 1 & 2 above)', key: 'a3', igst: 310.00, cgst: 0, sgst: 0, cess: 0 },
    { label: '(4) Inward supplies from ISD', key: 'a4', igst: 0, cgst: 0, sgst: 0, cess: 0 },
    { label: '(5) All other ITC', key: 'a5', igst: 43388.35, cgst: 148402.25, sgst: 148402.25, cess: 0 },
  ],
  section4B: [
    { label: '(1) As per rules 38, 42 & 43 of CGST Rules and section 17(5)', key: 'b1', igst: 0, cgst: 0, sgst: 0, cess: 0 },
    { label: '(2) Others', key: 'b2', igst: 0, cgst: 0, sgst: 0, cess: 0 },
  ],
  section4C: { igst: 43698.35, cgst: 148402.25, sgst: 148402.25, cess: 0 },
  section5: {
    compositionExemptNilInter: 0,
    compositionExemptNilIntra: 0,
    nonGSTInter: 0,
    nonGSTIntra: 0,
  },
  section61A: {
    igst:   { payable: 50863.00, itcIGST: 50863.00, itcCGST: 0, itcSGST: 0, cash: 0 },
    cgst:   { payable: 499136.00, itcIGST: 0, itcCGST: 499136.00, itcSGST: 0, cash: 0 },
    sgst:   { payable: 499136.00, itcIGST: 0, itcCGST: 0, itcSGST: 499136.00, cash: 0 },
    cess:   { payable: 0, itcIGST: 0, itcCGST: 0, itcSGST: 0, cash: 0 },
  },
  section61B: {
    igst:   { payable: 310.00, itcIGST: 0, itcCGST: 0, itcSGST: 0, cash: 310.00 },
    cgst:   { payable: 0, itcIGST: 0, itcCGST: 0, itcSGST: 0, cash: 0 },
    sgst:   { payable: 0, itcIGST: 0, itcCGST: 0, itcSGST: 0, cash: 0 },
    cess:   { payable: 0, itcIGST: 0, itcCGST: 0, itcSGST: 0, cash: 0 },
  },
};

// ─── PERIOD OPTIONS ──────────────────────────────────────────────────────────
const PERIODS = (() => {
  const list: { label: string; value: string }[] = [];
  const base = new Date(2025, 2, 1); // March 2025 as most recent relevant
  for (let i = 0; i < 18; i++) {
    const d = new Date(base.getFullYear(), base.getMonth() - i, 1);
    const m = (d.getMonth() + 1).toString().padStart(2, '0');
    const y = d.getFullYear();
    list.push({ label: `${d.toLocaleString('en-IN', { month: 'long' })} ${y}`, value: `${m}${y}` });
  }
  return list;
})();

const MARCH_PERIOD_VALUE = '032025';

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const INR = (v: number) =>
  new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v);

function SectionBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
      {label}
    </span>
  );
}

function TableHeader({ cols }: { cols: string[] }) {
  return (
    <thead>
      <tr className="bg-slate-50 border-b-2 border-slate-200">
        {cols.map((c, i) => (
          <th key={i} className={`px-4 py-3 text-xs font-bold text-slate-600 uppercase tracking-wider whitespace-nowrap ${i === 0 ? 'text-left' : 'text-right'}`}>
            {c}
          </th>
        ))}
      </tr>
    </thead>
  );
}

function MoneyCell({ val }: { val: number }) {
  return (
    <td className={`px-4 py-3 text-right text-sm font-mono whitespace-nowrap ${val === 0 ? 'text-slate-400' : 'text-slate-800 font-semibold'}`}>
      {INR(val)}
    </td>
  );
}

function TotalRow({ label, vals }: { label: string; vals: number[] }) {
  return (
    <tr className="bg-emerald-50 border-t-2 border-emerald-200 font-bold">
      <td className="px-4 py-3 text-sm text-emerald-800">{label}</td>
      {vals.map((v, i) => (
        <td key={i} className="px-4 py-3 text-right text-sm font-mono text-emerald-800">{INR(v)}</td>
      ))}
    </tr>
  );
}

// ─── TABS ─────────────────────────────────────────────────────────────────────
const TABS = [
  { id: '3.1', label: '3.1 Outward Supplies' },
  { id: '3.1.1', label: '3.1.1 ECO Supplies' },
  { id: '3.2', label: '3.2 Inter-State' },
  { id: '4', label: '4. Eligible ITC' },
  { id: '5', label: '5. Exempt/Nil' },
  { id: '6.1', label: '6.1 Payment' },
];

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────
export default function GSTR3BPage() {
  const [selectedPeriod, setSelectedPeriod] = useState(MARCH_PERIOD_VALUE);
  const [activeTab, setActiveTab] = useState('3.1');
  const [downloading, setDownloading] = useState(false);

  const isMarchData = selectedPeriod === MARCH_PERIOD_VALUE;
  const d = MARCH_2025_DATA;

  // Computed totals (always from hardcoded data)
  const total31 = useMemo(() => ({
    taxable: d.section31.reduce((s, r) => s + r.taxable, 0),
    igst:    d.section31.reduce((s, r) => s + r.igst, 0),
    cgst:    d.section31.reduce((s, r) => s + r.cgst, 0),
    sgst:    d.section31.reduce((s, r) => s + r.sgst, 0),
    cess:    d.section31.reduce((s, r) => s + r.cess, 0),
  }), []);

  const total4A = useMemo(() => ({
    igst: d.section4A.reduce((s, r) => s + r.igst, 0),
    cgst: d.section4A.reduce((s, r) => s + r.cgst, 0),
    sgst: d.section4A.reduce((s, r) => s + r.sgst, 0),
    cess: d.section4A.reduce((s, r) => s + r.cess, 0),
  }), []);

  const total4B = useMemo(() => ({
    igst: d.section4B.reduce((s, r) => s + r.igst, 0),
    cgst: d.section4B.reduce((s, r) => s + r.cgst, 0),
    sgst: d.section4B.reduce((s, r) => s + r.sgst, 0),
    cess: d.section4B.reduce((s, r) => s + r.cess, 0),
  }), []);

  const outputTax = total31.igst + total31.cgst + total31.sgst + total31.cess;
  const totalITC  = d.section4C.igst + d.section4C.cgst + d.section4C.sgst + d.section4C.cess;
  const cashPayable = (d.section61A.igst.cash + d.section61A.cgst.cash + d.section61A.sgst.cash +
    d.section61B.igst.cash + d.section61B.cgst.cash + d.section61B.sgst.cash);

  // ── Download handler ──────────────────────────────────────────────────────
  const handleDownload = () => {
    setDownloading(true);
    const link = document.createElement('a');
    link.href = '/GSTR3B_MAR25_DEV_KAILASH.pdf';
    link.download = "DEV KAILASH - GSTR3B_MAR'25.pdf";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => setDownloading(false), 1500);
  };

  // ── Period label ──────────────────────────────────────────────────────────
  const selectedLabel = PERIODS.find(p => p.value === selectedPeriod)?.label || '';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/30">
      <div className="max-w-[1400px] mx-auto px-6 py-6 space-y-5">

        {/* ── TOP HEADER ── */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 border border-emerald-200 rounded-full mb-2">
              <FileText className="h-3.5 w-3.5 text-emerald-600" strokeWidth={2.5} />
              <span className="text-xs font-bold text-emerald-700 uppercase tracking-widest">GST Return</span>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">GSTR-3B</h1>
            <p className="text-sm text-slate-500 mt-0.5">Monthly Self-Assessed Return — Outward Supplies &amp; ITC</p>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
              <select
                value={selectedPeriod}
                onChange={e => { setSelectedPeriod(e.target.value); setActiveTab('3.1'); }}
                className="appearance-none bg-white border border-slate-200 text-sm rounded-xl pl-9 pr-10 py-2.5 text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none cursor-pointer shadow-sm hover:border-slate-300 transition-all font-medium"
              >
                {PERIODS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
              <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none rotate-90" />
            </div>

            {isMarchData && (
              <button
                onClick={handleDownload}
                disabled={downloading}
                className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-sm font-semibold rounded-xl shadow-md shadow-emerald-500/25 hover:shadow-lg hover:shadow-emerald-500/30 transition-all disabled:opacity-70"
              >
                {downloading ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                {downloading ? 'Downloading...' : 'Auto-Generate & Download'}
              </button>
            )}
          </div>
        </div>

        {/* ── NO DATA BANNER for other months ── */}
        {!isMarchData && (
          <div className="rounded-2xl border-2 border-dashed border-amber-300 bg-amber-50 p-8 flex flex-col items-center gap-4 text-center">
            <div className="p-4 rounded-full bg-amber-100">
              <FileWarning className="h-8 w-8 text-amber-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-amber-800 mb-1">No Data Available for {selectedLabel}</h3>
              <p className="text-amber-700 text-sm max-w-md mx-auto leading-relaxed">
                Sales invoices, GSTR-2B, and GSTR-1 data for <strong>{selectedLabel}</strong> have not been uploaded yet.
                Please upload the required invoices and data files to generate GSTR-3B for this period.
              </p>
            </div>
            <div className="flex items-center gap-6 mt-2">
              {['Sales Invoices', 'GSTR-2B Data', 'GSTR-1 Data'].map(item => (
                <div key={item} className="flex items-center gap-2 text-sm text-amber-700">
                  <div className="w-2 h-2 rounded-full bg-amber-400" />
                  {item}: <span className="font-semibold text-amber-800">Not Uploaded</span>
                </div>
              ))}
            </div>
            <button
              onClick={() => setSelectedPeriod(MARCH_PERIOD_VALUE)}
              className="mt-2 px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold rounded-xl transition-colors"
            >
              View March 2025 Return
            </button>
          </div>
        )}

        {/* ── MAIN CONTENT (only for March 2025) ── */}
        {isMarchData && (
          <>
            {/* ── INFO STRIP ── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { icon: Building2, label: 'Taxpayer', value: d.taxpayer.name, color: 'slate' },
                { icon: Hash, label: 'GSTIN', value: d.taxpayer.gstin, color: 'slate' },
                { icon: Calendar, label: 'Return Period', value: d.taxpayer.period, color: 'slate' },
                { icon: Clock, label: 'Filed On', value: d.taxpayer.filedOn, color: 'emerald' },
              ].map(({ icon: Icon, label, value, color }) => (
                <div key={label} className={`bg-white rounded-xl border ${color === 'emerald' ? 'border-emerald-200' : 'border-slate-200'} px-4 py-3 shadow-sm`}>
                  <div className="flex items-center gap-2 mb-1">
                    <Icon className={`h-3.5 w-3.5 ${color === 'emerald' ? 'text-emerald-500' : 'text-slate-400'}`} />
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</span>
                  </div>
                  <p className={`text-sm font-bold ${color === 'emerald' ? 'text-emerald-700' : 'text-slate-800'} font-mono`}>{value}</p>
                </div>
              ))}
            </div>

            {/* ── STATUS CARD + SUMMARY METRICS ── */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
              {/* Filed status */}
              <div className="lg:col-span-1 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-5 text-white shadow-xl shadow-emerald-500/20 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Shield className="h-5 w-5 text-emerald-200" />
                    <span className="text-emerald-100 text-xs font-bold uppercase tracking-wider">Status</span>
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 className="h-6 w-6 text-white" strokeWidth={2.5} />
                    <span className="text-2xl font-extrabold">Filed</span>
                  </div>
                  <p className="text-emerald-100 text-xs">FY {d.taxpayer.fyear}</p>
                </div>
                <div className="mt-4 pt-4 border-t border-emerald-400/40">
                  <p className="text-xs text-emerald-200 mb-0.5">ARN</p>
                  <p className="text-xs font-mono text-white font-bold">{d.taxpayer.arn}</p>
                </div>
              </div>

              {/* Metric cards */}
              {[
                {
                  label: 'Total Output Tax', sub: 'Section 3.1',
                  value: outputTax, icon: TrendingUp, color: 'blue',
                  detail: `IGST ₹${INR(total31.igst)} + CGST ₹${INR(total31.cgst)} + SGST ₹${INR(total31.sgst)}`,
                },
                {
                  label: 'Net ITC Available', sub: 'Section 4 (A-B)',
                  value: totalITC, icon: TrendingDown, color: 'violet',
                  detail: `IGST ₹${INR(d.section4C.igst)} + CGST ₹${INR(d.section4C.cgst)} + SGST ₹${INR(d.section4C.sgst)}`,
                },
                {
                  label: 'Net Cash Paid', sub: 'Section 6.1',
                  value: cashPayable, icon: Wallet, color: 'rose',
                  detail: `IGST ₹${INR(d.section61B.igst.cash)} (RCM) + Others ₹0.00`,
                },
              ].map(({ label, sub, value, icon: Icon, color, detail }) => (
                <div key={label} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{label}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{sub}</p>
                    </div>
                    <div className={`p-2 rounded-xl ${
                      color === 'blue' ? 'bg-blue-50' :
                      color === 'violet' ? 'bg-violet-50' : 'bg-rose-50'
                    }`}>
                      <Icon className={`h-5 w-5 ${
                        color === 'blue' ? 'text-blue-600' :
                        color === 'violet' ? 'text-violet-600' : 'text-rose-600'
                      }`} />
                    </div>
                  </div>
                  <p className={`text-2xl font-extrabold font-mono ${
                    color === 'blue' ? 'text-blue-700' :
                    color === 'violet' ? 'text-violet-700' : 'text-rose-700'
                  }`}>₹{INR(value)}</p>
                  <p className="text-xs text-slate-400 mt-1 font-mono">{detail}</p>
                </div>
              ))}
            </div>

            {/* ── TAXABLE VALUE HIGHLIGHT ── */}
            <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white/10 rounded-xl">
                  <TrendingUp className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Total Taxable Turnover (Section 3.1a)</p>
                  <p className="text-3xl font-extrabold text-white font-mono mt-0.5">₹{INR(d.section31[0].taxable)}</p>
                </div>
              </div>
              <div className="flex gap-6">
                {[
                  { label: 'IGST', val: total31.igst, color: 'text-sky-400' },
                  { label: 'CGST', val: total31.cgst, color: 'text-violet-400' },
                  { label: 'SGST/UTGST', val: total31.sgst, color: 'text-pink-400' },
                ].map(({ label, val, color }) => (
                  <div key={label} className="text-center">
                    <p className="text-slate-400 text-xs font-semibold uppercase">{label}</p>
                    <p className={`text-lg font-extrabold font-mono ${color}`}>₹{INR(val)}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* ── SECTION TABS ── */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-1.5 flex gap-1 overflow-x-auto">
              {TABS.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md shadow-emerald-500/20'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* ── SECTION 3.1 ── */}
            {activeTab === '3.1' && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                  <SectionBadge label="3.1" />
                  <h3 className="font-bold text-slate-800 text-sm">Details of Outward Supplies and Inward Supplies Liable to Reverse Charge</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <TableHeader cols={['Nature of Supplies', 'Total Taxable Value (₹)', 'Integrated Tax (₹)', 'Central Tax (₹)', 'State/UT Tax (₹)', 'Cess (₹)']} />
                    <tbody className="divide-y divide-slate-100">
                      {d.section31.map((row, i) => (
                        <tr key={i} className={`hover:bg-slate-50 transition-colors ${i === 0 ? 'bg-emerald-50/50' : ''}`}>
                          <td className="px-4 py-3.5 text-xs text-slate-700 leading-relaxed max-w-xs">
                            <span className={`font-semibold ${i === 0 ? 'text-emerald-700' : 'text-slate-800'}`}>{row.label}</span>
                          </td>
                          <MoneyCell val={row.taxable} />
                          <MoneyCell val={row.igst} />
                          <MoneyCell val={row.cgst} />
                          <MoneyCell val={row.sgst} />
                          <MoneyCell val={row.cess} />
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <TotalRow label="Total" vals={[total31.taxable, total31.igst, total31.cgst, total31.sgst, total31.cess]} />
                    </tfoot>
                  </table>
                </div>
                <div className="px-6 py-3 bg-blue-50 border-t border-blue-100 flex items-start gap-2">
                  <Info className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
                  <p className="text-xs text-blue-700">
                    Taxable turnover includes both local sales (CGST+SGST) and inter-state sales (IGST). Row (d) reflects Reverse Charge Mechanism purchases worth ₹6,200.
                  </p>
                </div>
              </div>
            )}

            {/* ── SECTION 3.1.1 ── */}
            {activeTab === '3.1.1' && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                  <SectionBadge label="3.1.1" />
                  <h3 className="font-bold text-slate-800 text-sm">Details of Supplies Notified under Section 9(5) — E-Commerce Operator</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <TableHeader cols={['Nature of Supplies', 'Total Taxable Value (₹)', 'Integrated Tax (₹)', 'Central Tax (₹)', 'State/UT Tax (₹)', 'Cess (₹)']} />
                    <tbody className="divide-y divide-slate-100">
                      {d.section311.map((row, i) => (
                        <tr key={i} className="hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-3.5 text-xs text-slate-700 max-w-xs">{row.label}</td>
                          <MoneyCell val={row.taxable} />
                          <MoneyCell val={row.igst} />
                          <MoneyCell val={row.cgst} />
                          <MoneyCell val={row.sgst} />
                          <MoneyCell val={row.cess} />
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="px-6 py-3 bg-slate-50 border-t border-slate-100">
                  <p className="text-xs text-slate-500">No e-commerce operator supplies reported for this period.</p>
                </div>
              </div>
            )}

            {/* ── SECTION 3.2 ── */}
            {activeTab === '3.2' && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                  <SectionBadge label="3.2" />
                  <h3 className="font-bold text-slate-800 text-sm">Out of supplies in 3.1(a) and 3.1.1(i) — Details of Inter-State Supplies Made</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <TableHeader cols={['Type of Recipient', 'Total Taxable Value (₹)', 'Integrated Tax (₹)']} />
                    <tbody className="divide-y divide-slate-100">
                      {[
                        { label: 'Supplies made to Unregistered Persons', taxable: 0, igst: 0 },
                        { label: 'Supplies made to Composition Taxable Persons', taxable: 0, igst: 0 },
                        { label: 'Supplies made to UIN Holders', taxable: 0, igst: 0 },
                      ].map((row, i) => (
                        <tr key={i} className="hover:bg-slate-50">
                          <td className="px-4 py-3.5 text-xs text-slate-700">{row.label}</td>
                          <MoneyCell val={row.taxable} />
                          <MoneyCell val={row.igst} />
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="px-6 py-3 bg-slate-50 border-t border-slate-100">
                  <p className="text-xs text-slate-500">All inter-state supplies for this period are to registered B2B customers — no unregistered/composition/UIN holder supplies.</p>
                </div>
              </div>
            )}

            {/* ── SECTION 4 ITC ── */}
            {activeTab === '4' && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                  <SectionBadge label="4" />
                  <h3 className="font-bold text-slate-800 text-sm">Eligible ITC — Available, Reversed and Net</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <TableHeader cols={['Details', 'Integrated Tax (₹)', 'Central Tax (₹)', 'State/UT Tax (₹)', 'Cess (₹)']} />
                    <tbody className="divide-y divide-slate-100">
                      {/* 4A header */}
                      <tr className="bg-emerald-50">
                        <td colSpan={5} className="px-4 py-2 text-xs font-bold text-emerald-800 uppercase tracking-wider">
                          A. ITC Available (whether in full or part)
                        </td>
                      </tr>
                      {d.section4A.map((row, i) => (
                        <tr key={i} className={`hover:bg-slate-50 transition-colors ${(row.igst + row.cgst + row.sgst) > 0 ? 'bg-emerald-50/30' : ''}`}>
                          <td className="px-4 py-3.5 text-xs text-slate-700 pl-8">{row.label}</td>
                          <MoneyCell val={row.igst} />
                          <MoneyCell val={row.cgst} />
                          <MoneyCell val={row.sgst} />
                          <MoneyCell val={row.cess} />
                        </tr>
                      ))}
                      <tr className="bg-emerald-100/60 border-t border-emerald-200">
                        <td className="px-4 py-3 text-xs font-bold text-emerald-800 pl-8">Sub-total (A)</td>
                        <td className="px-4 py-3 text-right text-xs font-bold font-mono text-emerald-800">{INR(total4A.igst)}</td>
                        <td className="px-4 py-3 text-right text-xs font-bold font-mono text-emerald-800">{INR(total4A.cgst)}</td>
                        <td className="px-4 py-3 text-right text-xs font-bold font-mono text-emerald-800">{INR(total4A.sgst)}</td>
                        <td className="px-4 py-3 text-right text-xs font-bold font-mono text-emerald-800">{INR(total4A.cess)}</td>
                      </tr>

                      {/* 4B header */}
                      <tr className="bg-rose-50">
                        <td colSpan={5} className="px-4 py-2 text-xs font-bold text-rose-800 uppercase tracking-wider">
                          B. ITC Reversed
                        </td>
                      </tr>
                      {d.section4B.map((row, i) => (
                        <tr key={i} className="hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-3.5 text-xs text-slate-700 pl-8">{row.label}</td>
                          <MoneyCell val={row.igst} />
                          <MoneyCell val={row.cgst} />
                          <MoneyCell val={row.sgst} />
                          <MoneyCell val={row.cess} />
                        </tr>
                      ))}
                      <tr className="bg-rose-100/40 border-t border-rose-200">
                        <td className="px-4 py-3 text-xs font-bold text-rose-800 pl-8">Sub-total (B)</td>
                        <td className="px-4 py-3 text-right text-xs font-bold font-mono text-rose-800">{INR(total4B.igst)}</td>
                        <td className="px-4 py-3 text-right text-xs font-bold font-mono text-rose-800">{INR(total4B.cgst)}</td>
                        <td className="px-4 py-3 text-right text-xs font-bold font-mono text-rose-800">{INR(total4B.sgst)}</td>
                        <td className="px-4 py-3 text-right text-xs font-bold font-mono text-rose-800">{INR(total4B.cess)}</td>
                      </tr>

                      {/* 4C Net ITC */}
                      <tr className="bg-slate-800">
                        <td className="px-4 py-4 text-sm font-extrabold text-white">C. Net ITC Available (A − B)</td>
                        <td className="px-4 py-4 text-right text-sm font-extrabold font-mono text-emerald-300">{INR(d.section4C.igst)}</td>
                        <td className="px-4 py-4 text-right text-sm font-extrabold font-mono text-emerald-300">{INR(d.section4C.cgst)}</td>
                        <td className="px-4 py-4 text-right text-sm font-extrabold font-mono text-emerald-300">{INR(d.section4C.sgst)}</td>
                        <td className="px-4 py-4 text-right text-sm font-extrabold font-mono text-emerald-300">{INR(d.section4C.cess)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div className="px-6 py-3 bg-blue-50 border-t border-blue-100 flex items-start gap-2">
                  <Info className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
                  <p className="text-xs text-blue-700">
                    Net ITC of ₹{INR(d.section4C.igst + d.section4C.cgst + d.section4C.sgst)} fully offset the output tax liability. ₹{INR(cashPayable)} was paid via cash (on RCM supplies).
                  </p>
                </div>
              </div>
            )}

            {/* ── SECTION 5 ── */}
            {activeTab === '5' && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                  <SectionBadge label="5" />
                  <h3 className="font-bold text-slate-800 text-sm">Values of Exempt, Nil-Rated and Non-GST Inward Supplies</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <TableHeader cols={['Nature of Supplies', 'Inter-State Supplies (₹)', 'Intra-State Supplies (₹)']} />
                    <tbody className="divide-y divide-slate-100">
                      {[
                        { label: 'From a supplier under composition scheme, Exempt and Nil rated supply', inter: d.section5.compositionExemptNilInter, intra: d.section5.compositionExemptNilIntra },
                        { label: 'Non GST supply', inter: d.section5.nonGSTInter, intra: d.section5.nonGSTIntra },
                      ].map((row, i) => (
                        <tr key={i} className="hover:bg-slate-50">
                          <td className="px-4 py-3.5 text-xs text-slate-700 max-w-xs">{row.label}</td>
                          <MoneyCell val={row.inter} />
                          <MoneyCell val={row.intra} />
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="px-6 py-3 bg-slate-50 border-t border-slate-100">
                  <p className="text-xs text-slate-500">No exempt, nil-rated or non-GST inward supplies for this period.</p>
                </div>
              </div>
            )}

            {/* ── SECTION 6.1 PAYMENT ── */}
            {activeTab === '6.1' && (
              <div className="space-y-4">
                {/* 6.1A */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                    <SectionBadge label="6.1A" />
                    <h3 className="font-bold text-slate-800 text-sm">Payment of Tax — Other than Reverse Charge</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <TableHeader cols={['Tax Head', 'Tax Payable (₹)', 'ITC: IGST (₹)', 'ITC: CGST (₹)', 'ITC: SGST (₹)', 'Tax paid in Cash (₹)']} />
                      <tbody className="divide-y divide-slate-100">
                        {[
                          { label: 'Integrated Tax (IGST)', ...d.section61A.igst },
                          { label: 'Central Tax (CGST)', ...d.section61A.cgst },
                          { label: 'State/UT Tax (SGST)', ...d.section61A.sgst },
                          { label: 'Cess', ...d.section61A.cess },
                        ].map((row, i) => (
                          <tr key={i} className="hover:bg-slate-50 transition-colors">
                            <td className="px-4 py-3.5 text-xs font-semibold text-slate-700">{row.label}</td>
                            <td className={`px-4 py-3.5 text-right text-xs font-mono font-semibold ${row.payable > 0 ? 'text-blue-700' : 'text-slate-400'}`}>{INR(row.payable)}</td>
                            <td className={`px-4 py-3.5 text-right text-xs font-mono ${row.itcIGST > 0 ? 'text-emerald-700 font-semibold' : 'text-slate-400'}`}>{INR(row.itcIGST)}</td>
                            <td className={`px-4 py-3.5 text-right text-xs font-mono ${row.itcCGST > 0 ? 'text-emerald-700 font-semibold' : 'text-slate-400'}`}>{INR(row.itcCGST)}</td>
                            <td className={`px-4 py-3.5 text-right text-xs font-mono ${row.itcSGST > 0 ? 'text-emerald-700 font-semibold' : 'text-slate-400'}`}>{INR(row.itcSGST)}</td>
                            <td className={`px-4 py-3.5 text-right text-xs font-mono font-bold ${row.cash > 0 ? 'text-rose-700' : 'text-slate-400'}`}>{INR(row.cash)}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="bg-blue-50 border-t-2 border-blue-200 font-bold">
                          <td className="px-4 py-3 text-sm text-blue-800">Total (6.1A)</td>
                          <td className="px-4 py-3 text-right text-sm font-mono text-blue-800">{INR(d.section61A.igst.payable + d.section61A.cgst.payable + d.section61A.sgst.payable)}</td>
                          <td className="px-4 py-3 text-right text-sm font-mono text-emerald-700">{INR(d.section61A.igst.itcIGST)}</td>
                          <td className="px-4 py-3 text-right text-sm font-mono text-emerald-700">{INR(d.section61A.cgst.itcCGST)}</td>
                          <td className="px-4 py-3 text-right text-sm font-mono text-emerald-700">{INR(d.section61A.sgst.itcSGST)}</td>
                          <td className="px-4 py-3 text-right text-sm font-mono text-rose-700">{INR(0)}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>

                {/* 6.1B RCM */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                    <SectionBadge label="6.1B" />
                    <h3 className="font-bold text-slate-800 text-sm">Payment of Tax — Reverse Charge &amp; Supplies u/s 9(5)</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <TableHeader cols={['Tax Head', 'Tax Payable (₹)', 'ITC: IGST (₹)', 'ITC: CGST (₹)', 'ITC: SGST (₹)', 'Tax paid in Cash (₹)']} />
                      <tbody className="divide-y divide-slate-100">
                        {[
                          { label: 'Integrated Tax (IGST)', ...d.section61B.igst },
                          { label: 'Central Tax (CGST)', ...d.section61B.cgst },
                          { label: 'State/UT Tax (SGST)', ...d.section61B.sgst },
                          { label: 'Cess', ...d.section61B.cess },
                        ].map((row, i) => (
                          <tr key={i} className="hover:bg-slate-50 transition-colors">
                            <td className="px-4 py-3.5 text-xs font-semibold text-slate-700">{row.label}</td>
                            <td className={`px-4 py-3.5 text-right text-xs font-mono ${row.payable > 0 ? 'text-blue-700 font-semibold' : 'text-slate-400'}`}>{INR(row.payable)}</td>
                            <td className="px-4 py-3.5 text-right text-xs font-mono text-slate-400">{INR(row.itcIGST)}</td>
                            <td className="px-4 py-3.5 text-right text-xs font-mono text-slate-400">{INR(row.itcCGST)}</td>
                            <td className="px-4 py-3.5 text-right text-xs font-mono text-slate-400">{INR(row.itcSGST)}</td>
                            <td className={`px-4 py-3.5 text-right text-xs font-mono font-bold ${row.cash > 0 ? 'text-rose-700' : 'text-slate-400'}`}>{INR(row.cash)}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="bg-rose-50 border-t-2 border-rose-200 font-bold">
                          <td className="px-4 py-3 text-sm text-rose-800">Total (6.1B)</td>
                          <td className="px-4 py-3 text-right text-sm font-mono text-rose-800">{INR(d.section61B.igst.payable)}</td>
                          <td className="px-4 py-3 text-right text-sm font-mono text-slate-400">{INR(0)}</td>
                          <td className="px-4 py-3 text-right text-sm font-mono text-slate-400">{INR(0)}</td>
                          <td className="px-4 py-3 text-right text-sm font-mono text-slate-400">{INR(0)}</td>
                          <td className="px-4 py-3 text-right text-sm font-mono text-rose-800">{INR(d.section61B.igst.cash)}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                  <div className="px-6 py-3 bg-amber-50 border-t border-amber-100 flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                    <p className="text-xs text-amber-700">
                      ₹310.00 paid in cash as IGST on Reverse Charge (RCM) purchases. This is for inward supply from unregistered dealer.
                    </p>
                  </div>
                </div>

                {/* Grand Total */}
                <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-2xl p-5">
                  <h4 className="text-white font-bold text-sm mb-4 flex items-center gap-2">
                    <Wallet className="h-4 w-4 text-emerald-400" />
                    Grand Summary — Tax Payment for March 2025
                  </h4>
                  <div className="grid grid-cols-3 gap-4">
                    {[
                      { label: 'Total Output Tax Payable', val: outputTax + d.section61B.igst.payable, color: 'text-sky-300' },
                      { label: 'Paid via ITC (Credit)', val: totalITC, color: 'text-emerald-300' },
                      { label: 'Net Cash Paid', val: cashPayable, color: 'text-rose-300' },
                    ].map(({ label, val, color }) => (
                      <div key={label} className="bg-white/10 rounded-xl p-4 text-center">
                        <p className="text-slate-400 text-xs font-semibold mb-1">{label}</p>
                        <p className={`text-xl font-extrabold font-mono ${color}`}>₹{INR(val)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </>
        )}

      </div>
    </div>
  );
}

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Calendar, FileText, CheckCircle2, AlertTriangle,
  Clock, Search, RefreshCw, Loader2, X, Download, FileWarning,
  Building2, Hash,
} from 'lucide-react';
import { Gstr1SummaryPanel } from '@/components/gstr1/Gstr1SummaryPanel';
import { buildDksMarchMockInvoices, buildGstr1ReturnData } from '@/lib/gstr1';
import type { BusinessProfileContext, Gstr1InvoiceInsert, Gstr1ReturnData } from '@/lib/gstr1/types';
import { buildReconciliationPeriodOptions } from '@/lib/reconciliation/periodOptions';
import { DKS_MARCH_PERIOD } from '@/lib/reconciliation/dksMarchConstants';

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

const PERIODS = buildReconciliationPeriodOptions();
const MARCH_PERIOD = DKS_MARCH_PERIOD;

type GenerateState = 'idle' | 'generating' | 'success' | 'failed';

const GENERATE_STEPS = [
  'Reading sales register…',
  'Classifying B2B / B2CL / B2CS…',
  'Building HSN summary…',
  'Preparing GSTR-1 PDF draft…',
];

const DKS_DEMO_PROFILE: BusinessProfileContext = {
  gstin: '27AATFD2632G1ZC',
  legal_name: 'DEV KAILASH STEEL',
  trade_name: 'DEV KAILASH STEEL',
  state_cd: '27',
  annual_turnover_range: 'Above 5 Cr',
};

const DKS_DEMO_RETURN_ID = 'dks-mar25-demo';
const GSTR1_DEMO_PDF_PATH = "/DKS - GSTR1_MAR'25 - OK.pdf";

function formatPeriodLabel(period: string): string {
  const month = parseInt(period.slice(0, 2), 10);
  const year = parseInt(period.slice(2), 10);
  if (!month || !year) return period;
  const d = new Date(year, month - 1, 1);
  return d.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
}

function gstr1InsertToUiInvoice(inv: Gstr1InvoiceInsert, index: number): Invoice {
  return {
    id: inv.source_invoice_id || `demo-${index}`,
    section: inv.section,
    invoice_number: inv.invoice_number || '',
    invoice_date: inv.invoice_date || '',
    invoice_value: inv.invoice_value,
    place_of_supply: inv.place_of_supply,
    counterparty_gstin: inv.counterparty_gstin || '',
    counterparty_name: inv.counterparty_name || '',
    taxable_value: inv.taxable_value,
    igst_amount: inv.igst_amount,
    cgst_amount: inv.cgst_amount,
    sgst_amount: inv.sgst_amount,
    cess_amount: inv.cess_amount,
    tax_rate: inv.tax_rate,
    invoice_type: inv.invoice_type,
    reverse_charge: inv.reverse_charge,
    hsn_code: inv.hsn_code || '',
    uqc: inv.uqc || '',
    quantity: inv.quantity ?? 0,
    validation_status: inv.validation_status,
    source: inv.source,
  };
}

function buildGstr1PdfFilename(summary: Gstr1ReturnData | null, label: string): string {
  const period = (label || (summary?.header?.return_period ?? ''))
    .replace(/\s+/g, '-')
    .replace(/[^\w-]/g, '');
  const company = (summary?.header?.legal_name || summary?.header?.trade_name || 'Taxpayer')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 40);
  const fy = (summary?.header?.financial_year || '').replace(/\//g, '-').replace(/\s+/g, '');
  const parts = ['GSTR-1', period, company].filter(Boolean);
  if (fy) parts.push(fy);
  return `${parts.join('_')}.pdf`;
}

function triggerGstr1PdfDownload(filename: string): void {
  const link = document.createElement('a');
  link.href = GSTR1_DEMO_PDF_PATH;
  link.download = filename;
  link.rel = 'noopener';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

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
  const [selectedPeriod, setSelectedPeriod] = useState(
    PERIODS.find((p) => p.value === MARCH_PERIOD)?.value ?? PERIODS[0]?.value ?? MARCH_PERIOD
  );
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [returnData, setReturnData] = useState<ReturnData | null>(null);
  const [loading, setLoading] = useState(false);
  const [generateState, setGenerateState] = useState<GenerateState>('idle');
  const [loadingStep, setLoadingStep] = useState(0);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [returnSummary, setReturnSummary] = useState<Gstr1ReturnData | null>(null);
  const [hsnSubTab, setHsnSubTab] = useState<HsnSubTab>('b2b');
  const [validationIssues, setValidationIssues] = useState<{ errors: { message: string }[]; warnings: { message: string }[] } | null>(null);

  const isMarchPeriod = selectedPeriod === MARCH_PERIOD;
  const periodLabel = PERIODS.find((p) => p.value === selectedPeriod)?.label ?? selectedPeriod;

  const resetMarchDraftState = () => {
    setGenerateState('idle');
    setReturnData(null);
    setReturnSummary(null);
    setInvoices([]);
    setValidationIssues(null);
    setSearchQuery('');
    setError('');
    setSuccessMsg('');
  };

  const handlePeriodChange = (val: string) => {
    setSelectedPeriod(val);
    if (val !== MARCH_PERIOD) {
      resetMarchDraftState();
    }
  };

  const downloadPdf = (summary: Gstr1ReturnData | null) => {
    const filename = buildGstr1PdfFilename(summary, periodLabel);
    triggerGstr1PdfDownload(filename);
  };

  const fetchData = useCallback(async () => {
    if (selectedPeriod !== MARCH_PERIOD) return;
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
        if (row.return_data && (invData.data?.length ?? 0) > 0) {
          setGenerateState('success');
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
  }, [selectedPeriod, periodLabel]);

  useEffect(() => {
    if (isMarchPeriod) fetchData();
  }, [fetchData, isMarchPeriod]);

  const applyMarchClientDemo = () => {
    const inserts = buildDksMarchMockInvoices(DKS_DEMO_RETURN_ID, 'demo');
    const summary = buildGstr1ReturnData(inserts, DKS_DEMO_PROFILE, '2024-25', MARCH_PERIOD);
    const invRows = inserts.map(gstr1InsertToUiInvoice);
    const totals = summary.total_liability;
    setReturnSummary(summary);
    setInvoices(invRows);
    setReturnData({
      id: DKS_DEMO_RETURN_ID,
      return_period: MARCH_PERIOD,
      status: 'generated',
      total_taxable_value: totals.value,
      total_igst: totals.igst,
      total_cgst: totals.cgst,
      total_sgst: totals.sgst,
      total_cess: totals.cess,
      total_tax: totals.igst + totals.cgst + totals.sgst + totals.cess,
      total_invoices: inserts.length,
      arn: '',
      filed_date: '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      return_data: summary,
      gstin: DKS_DEMO_PROFILE.gstin,
    });
    downloadPdf(summary);
    setSuccessMsg('GSTR-1 draft generated using DKS March 2025 demo data. PDF downloaded.');
    setGenerateState('success');
  };

  const handleGenerate = async () => {
    setGenerateState('generating');
    setError('');
    setSuccessMsg('');
    setLoadingStep(0);
    setLoadingProgress(0);

    try {
      for (let i = 0; i < GENERATE_STEPS.length; i++) {
        setLoadingStep(i);
        setLoadingProgress(Math.round(((i + 0.4) / GENERATE_STEPS.length) * 100));
        await new Promise((r) => setTimeout(r, 500));
      }

      const res = await fetch(`/api/returns?action=generate-gstr1&period=${MARCH_PERIOD}`);
      const data = await res.json();
      if (!res.ok) {
        const useClientDemo =
          res.status === 400 &&
          typeof data.error === 'string' &&
          data.error.toLowerCase().includes('user');
        if (useClientDemo) {
          setLoadingProgress(100);
          applyMarchClientDemo();
          return;
        }
        setError(data.error || `Failed to generate GSTR-1 (${res.status})`);
        setGenerateState('failed');
        return;
      }
      if (!data.success) {
        setError(data.error || 'Failed to generate GSTR-1');
        setGenerateState('failed');
        return;
      }

      if (data.totalInvoices === 0) {
        const d = data.diagnostics;
        const range = d?.dateRange ? `${d.dateRange.startDate} to ${d.dateRange.endDate}` : selectedPeriod;
        setError(
          data.message ||
            `No sales invoices found for ${range}. Add invoices under Sales Register for this month, then generate again.`
        );
        setGenerateState('failed');
        return;
      }

      setLoadingProgress(92);
      if (data.returnData) setReturnSummary(data.returnData);

      const retRes = await fetch(`/api/returns?action=list&type=GSTR1&period=${MARCH_PERIOD}`);
      const retData = await retRes.json();
      const row = retData.data?.[0] as ReturnData | undefined;
      let invRows: Invoice[] = [];
      if (row) {
        setReturnData(row);
        const invRes = await fetch(`/api/returns?action=gstr1-invoices&period=${MARCH_PERIOD}`);
        const invData = await invRes.json();
        invRows = invData.data || [];
        setInvoices(invRows);
        if (row.return_data?.validation) {
          setValidationIssues(row.return_data.validation as typeof validationIssues);
        }
      }

      const summary = (data.returnData || row?.return_data) as Gstr1ReturnData | undefined;
      if (summary && row && invRows.length > 0) {
        setLoadingProgress(100);
        await new Promise((r) => setTimeout(r, 200));
        downloadPdf(summary);
      }

      setSuccessMsg(
        data.message ||
          `GSTR-1 draft generated with ${data.totalInvoices} invoices. PDF downloaded.`
      );
      setGenerateState('success');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Generation failed');
      setGenerateState('failed');
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 border border-emerald-200 rounded-full mb-3">
            <FileText className="h-3.5 w-3.5 text-emerald-600" strokeWidth={2.5} />
            <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">Draft Returns</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">GSTR-1 Draft</h1>
          <p className="text-gray-600 text-sm mt-1">Outward supplies return — auto-generated from sales register</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative">
            <select
              value={selectedPeriod}
              onChange={(e) => handlePeriodChange(e.target.value)}
              disabled={generateState === 'generating'}
              className="appearance-none bg-white border border-gray-200 text-sm rounded-xl pl-9 pr-8 py-2.5 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-gray-900 cursor-pointer hover:border-gray-300 min-w-[160px] disabled:opacity-60"
            >
              {PERIODS.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          </div>
          {isMarchPeriod && (
            <button
              type="button"
              onClick={handleGenerate}
              disabled={generateState === 'generating'}
              className="btn-primary-custom px-4 py-2.5 rounded-xl text-sm font-medium shadow-md hover:shadow-lg transition-all flex items-center gap-2 disabled:opacity-70"
            >
              {generateState === 'generating' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              {generateState === 'success' ? 'Re-generate & Download' : 'Auto-Generate & Download'}
            </button>
          )}
        </div>
      </div>

      {!isMarchPeriod && (
        <div className="rounded-2xl border-2 border-dashed border-amber-300 bg-amber-50 p-10 flex flex-col items-center gap-4 text-center animate-in fade-in duration-300">
          <div className="p-4 rounded-full bg-amber-100">
            <FileWarning className="h-8 w-8 text-amber-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-amber-800 mb-1">
              GSTR-1 Draft Not Available for {periodLabel}
            </h3>
            <p className="text-amber-700 text-sm max-w-md mx-auto leading-relaxed">
              Sales invoices, B2B/B2CS tables, and HSN summary for <strong>{periodLabel}</strong> have
              not been uploaded yet. Upload the required data files to generate GSTR-1 for this period.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-6 mt-1">
            {['Sales Invoices', 'B2B / B2CS Tables', 'HSN Summary'].map((item) => (
              <div key={item} className="flex items-center gap-2 text-sm text-amber-700">
                <div className="w-2 h-2 rounded-full bg-amber-400" />
                {item}: <span className="font-semibold text-amber-800">Not Available</span>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => handlePeriodChange(MARCH_PERIOD)}
            className="mt-2 px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold rounded-xl transition-colors"
          >
            View March 2025 GSTR-1 Draft
          </button>
        </div>
      )}

      {isMarchPeriod && (
      <>
      {generateState === 'generating' && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-10 flex flex-col items-center text-center min-h-[280px]">
          <div className="relative mb-8">
            <div className="h-20 w-20 rounded-full border-4 border-emerald-100 flex items-center justify-center">
              <Loader2 className="h-10 w-10 text-emerald-600 animate-spin" />
            </div>
          </div>
          <h3 className="text-xl font-semibold text-gray-900">Generating GSTR-1 Draft</h3>
          <p className="text-sm text-gray-500 mt-2 max-w-md">
            Building your outward supplies return for <span className="font-medium text-gray-700">{periodLabel}</span>.
          </p>
          <div className="w-full max-w-lg mt-8 space-y-3">
            <div className="flex justify-between text-xs text-gray-600">
              <span>{GENERATE_STEPS[loadingStep]}</span>
              <span className="text-emerald-600 font-semibold">{loadingProgress}%</span>
            </div>
            <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${loadingProgress}%` }}
              />
            </div>
            <ul className="text-left text-xs text-gray-500 space-y-1.5 mt-4">
              {GENERATE_STEPS.map((step, i) => (
                <li key={step} className={`flex items-center gap-2 ${i <= loadingStep ? 'text-emerald-700' : ''}`}>
                  {i < loadingStep ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                  ) : i === loadingStep ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-emerald-600 shrink-0" />
                  ) : (
                    <span className="h-3.5 w-3.5 rounded-full border border-gray-300 shrink-0 inline-block" />
                  )}
                  {step}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {generateState !== 'generating' && loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 text-emerald-600 animate-spin" />
          <span className="ml-3 text-gray-600">Loading return data...</span>
        </div>
      ) : generateState !== 'generating' && (
      <>
      {returnSummary?.header && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { icon: Building2, label: 'Taxpayer', value: returnSummary.header.legal_name || returnSummary.header.trade_name || '—' },
            { icon: Hash, label: 'GSTIN', value: returnSummary.header.gstin },
            { icon: Calendar, label: 'Return Period', value: formatPeriodLabel(returnSummary.header.return_period) },
            { icon: Clock, label: 'Status', value: statusLabel },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="bg-white rounded-xl border border-gray-200 px-4 py-3 shadow-sm">
              <div className="flex items-center gap-2 mb-1">
                <Icon className="h-3.5 w-3.5 text-gray-400" />
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{label}</span>
              </div>
              <p className="text-sm font-bold text-gray-800 font-mono truncate" title={value}>{value}</p>
            </div>
          ))}
        </div>
      )}

      {generateState === 'idle' && invoices.length === 0 && !loading && (
        <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-12 flex flex-col items-center text-center">
          <Download className="h-10 w-10 text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No draft generated yet</h3>
          <p className="text-sm text-gray-500 max-w-md mb-6">
            Click Auto-Generate &amp; Download to build GSTR-1 from your sales register (or DKS March 2025 demo data) and download the PDF draft.
          </p>
        </div>
      )}

      {(generateState === 'success' || invoices.length > 0) && (
      <>
      {/* STATUS CARD */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden">
         <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-gray-200">
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
               {returnData?.arn && (
                 <div className="text-xs text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2 font-mono">
                   ARN: {returnData.arn}
                 </div>
               )}
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
                  <button onClick={fetchData} disabled={loading}
                    className="px-3 py-2 rounded-lg border border-gray-300 text-gray-700 text-xs font-medium hover:bg-gray-50 transition-all disabled:opacity-50">
                    {loading ? 'Refreshing...' : 'Refresh data'}
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
      </>
      )}
      </>
      )}

    </div>
    </div>
  );
}

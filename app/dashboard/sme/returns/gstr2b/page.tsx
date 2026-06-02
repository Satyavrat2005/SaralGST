'use client';

import React, { useMemo, useState } from 'react';
import {
  Calendar,
  Download,
  RefreshCw,
  CheckCircle2,
  Loader2,
  FileText,
  Search,
  Building2,
  X,
} from 'lucide-react';
import {
  GSTR2B_EXCEL_ASSET_PATH,
  buildGstr2bDownloadFilename,
  parseGstr2bWorkbook,
  sumItcAvailable,
  type Gstr2bB2bInvoiceRow,
  type Gstr2bExcelViewModel,
} from '@/lib/gstr2b/parseGstr2bExcel';

type FetchState = 'not_fetched' | 'fetching' | 'success' | 'failed';
type ViewTab = 'b2b' | 'b2ba' | 'summary';

const LOADING_STEPS = [
  'Connecting to GST portal…',
  'Authenticating taxpayer session…',
  'Retrieving GSTR-2B statement…',
  'Parsing invoice & ITC tables…',
  'Preparing download…',
];

const PERIODS = (() => {
  const periods: { label: string; value: string }[] = [];
  const now = new Date();
  for (let i = 0; i < 24; i++) {
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

function formatCurrency(val: number) {
  return `₹${val.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
}

function formatLakhs(val: number) {
  const total = val;
  if (total >= 100000) return `₹${(total / 100000).toFixed(2)} L`;
  return formatCurrency(total);
}

async function loadGstr2bWorkbook() {
  const res = await fetch(GSTR2B_EXCEL_ASSET_PATH);
  if (!res.ok) throw new Error('Could not load GSTR-2B file');
  const buffer = await res.arrayBuffer();
  const XLSX = await import('xlsx');
  return XLSX.read(buffer, { type: 'array' });
}

function triggerExcelDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.rel = 'noopener';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export default function GSTR2BFetchPage() {
  const [fetchState, setFetchState] = useState<FetchState>('not_fetched');
  const [loadingStep, setLoadingStep] = useState(0);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [selectedPeriod, setSelectedPeriod] = useState(
    PERIODS.find((p) => p.value === '032025')?.value ?? PERIODS[0]?.value ?? '032025'
  );
  const [excelData, setExcelData] = useState<Gstr2bExcelViewModel | null>(null);
  const [excelBlob, setExcelBlob] = useState<Blob | null>(null);
  const [activeTab, setActiveTab] = useState<ViewTab>('b2b');
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState('');

  const periodLabel = PERIODS.find((p) => p.value === selectedPeriod)?.label ?? selectedPeriod;

  const itcTotals = useMemo(() => {
    if (!excelData) return { igst: 0, cgst: 0, sgst: 0, cess: 0, total: 0 };
    const s = sumItcAvailable(excelData.itcAvailable);
    return { ...s, total: s.igst + s.cgst + s.sgst + s.cess };
  }, [excelData]);

  const itcNotAvailableTotals = useMemo(() => {
    if (!excelData) return { total: 0 };
    const s = sumItcAvailable(excelData.itcNotAvailable);
    return { total: s.igst + s.cgst + s.sgst + s.cess };
  }, [excelData]);

  const tableRows: Gstr2bB2bInvoiceRow[] = useMemo(() => {
    if (!excelData) return [];
    return activeTab === 'b2ba' ? excelData.b2ba : excelData.b2b;
  }, [excelData, activeTab]);

  const filteredRows = useMemo(() => {
    if (!searchQuery.trim()) return tableRows;
    const q = searchQuery.toLowerCase();
    return tableRows.filter(
      (r) =>
        r.supplierName.toLowerCase().includes(q) ||
        r.supplierGstin.toLowerCase().includes(q) ||
        r.invoiceNumber.toLowerCase().includes(q)
    );
  }, [tableRows, searchQuery]);

  const downloadWithName = () => {
    if (!excelBlob || !excelData) return;
    const name = buildGstr2bDownloadFilename(periodLabel, excelData.meta);
    triggerExcelDownload(excelBlob, name);
  };

  const handleFetchFromPortal = async () => {
    setFetchState('fetching');
    setError('');
    setLoadingStep(0);
    setLoadingProgress(0);

    try {
      for (let i = 0; i < LOADING_STEPS.length; i++) {
        setLoadingStep(i);
        setLoadingProgress(Math.round(((i + 0.4) / LOADING_STEPS.length) * 100));
        await new Promise((r) => setTimeout(r, 550));
      }

      const [res, XLSX] = await Promise.all([
        fetch(GSTR2B_EXCEL_ASSET_PATH),
        import('xlsx'),
      ]);

      if (!res.ok) throw new Error('Could not retrieve GSTR-2B from portal');

      const buffer = await res.arrayBuffer();
      setLoadingProgress(92);
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const wb = XLSX.read(buffer, { type: 'array' });
      const parsed = parseGstr2bWorkbook(wb);

      setLoadingProgress(100);
      await new Promise((r) => setTimeout(r, 300));

      setExcelBlob(blob);
      setExcelData(parsed);
      setFetchState('success');
      setActiveTab('b2b');

      triggerExcelDownload(blob, buildGstr2bDownloadFilename(periodLabel, parsed.meta));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Fetch failed');
      setFetchState('failed');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-emerald-50 to-teal-50">
      <div className="max-w-[1400px] mx-auto px-8 py-6 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 border border-emerald-200 rounded-full mb-3">
              <Download className="h-3.5 w-3.5 text-emerald-600" strokeWidth={2.5} />
              <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">
                Fetch Returns
              </span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">GSTR-2B Fetch</h1>
            <p className="text-gray-600 text-sm mt-1">
              Auto-generated ITC statement — fetch from GST portal
            </p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative">
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                disabled={fetchState === 'fetching'}
                className="appearance-none bg-white border border-gray-200 text-sm rounded-xl pl-9 pr-8 py-2.5 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-gray-900 cursor-pointer hover:border-gray-300 min-w-[160px] disabled:opacity-60"
              >
                {PERIODS.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            </div>
            {fetchState === 'success' && excelBlob && (
              <button
                type="button"
                onClick={downloadWithName}
                className="px-4 py-2.5 rounded-xl text-sm font-medium border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Download Excel
              </button>
            )}
            <button
              type="button"
              onClick={handleFetchFromPortal}
              disabled={fetchState === 'fetching'}
              className="btn-primary-custom px-4 py-2.5 rounded-xl text-sm font-medium shadow-md hover:shadow-lg transition-all flex items-center gap-2 disabled:opacity-70"
            >
              {fetchState === 'fetching' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              {fetchState === 'success' ? 'Re-fetch' : 'Fetch from Portal'}
            </button>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
            <span className="flex-1">{error}</span>
            <button type="button" onClick={() => setError('')}>
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {fetchState === 'fetching' && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-10 flex flex-col items-center text-center min-h-[340px]">
            <div className="relative mb-8">
              <div className="h-20 w-20 rounded-full border-4 border-emerald-100 flex items-center justify-center">
                <Loader2 className="h-10 w-10 text-emerald-600 animate-spin" />
              </div>
            </div>
            <h3 className="text-xl font-semibold text-gray-900">Fetching GSTR-2B from GST Portal</h3>
            <p className="text-sm text-gray-500 mt-2 max-w-md">
              Please wait while we retrieve your auto-drafted ITC statement for{' '}
              <span className="font-medium text-gray-700">{periodLabel}</span>.
            </p>
            <div className="w-full max-w-lg mt-8 space-y-3">
              <div className="flex justify-between text-xs text-gray-600">
                <span>{LOADING_STEPS[loadingStep]}</span>
                <span className="text-emerald-600 font-semibold">{loadingProgress}%</span>
              </div>
              <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${loadingProgress}%` }}
                />
              </div>
              <ul className="text-left text-xs text-gray-500 space-y-1.5 mt-4">
                {LOADING_STEPS.map((step, i) => (
                  <li
                    key={step}
                    className={`flex items-center gap-2 ${i <= loadingStep ? 'text-emerald-700' : ''}`}
                  >
                    {i < loadingStep ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                    ) : i === loadingStep ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-emerald-600 shrink-0" />
                    ) : (
                      <span className="h-3.5 w-3.5 rounded-full border border-gray-300 shrink-0" />
                    )}
                    {step}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {fetchState === 'failed' && (
          <div className="bg-white rounded-2xl border border-red-200 shadow-lg p-8 flex flex-col items-center text-center min-h-[280px]">
            <h3 className="text-lg font-semibold text-gray-900">Fetch Failed</h3>
            <p className="text-gray-600 mt-2 max-w-md">{error || 'Could not fetch GSTR-2B. Please try again.'}</p>
            <button
              type="button"
              onClick={handleFetchFromPortal}
              className="mt-6 px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700"
            >
              Retry Fetch
            </button>
          </div>
        )}

        {fetchState === 'not_fetched' && (
          <div className="bg-white rounded-2xl border-2 border-dashed border-gray-300 shadow-lg p-8 flex flex-col items-center justify-center text-center min-h-[300px]">
            <div className="h-16 w-16 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center mb-4 shadow-sm">
              <Download className="h-8 w-8 text-gray-500" strokeWidth={2} />
            </div>
            <h3 className="text-xl font-semibold text-gray-900">GSTR-2B Not Fetched</h3>
            <p className="text-gray-600 max-w-md mt-2">
              Select a return period and fetch your auto-drafted ITC statement from the GST portal.
            </p>
          </div>
        )}

        {fetchState === 'success' && excelData && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="bg-white rounded-2xl border border-emerald-200 shadow-sm p-5">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200">
                    <Building2 className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{excelData.meta.legalName}</h3>
                    <p className="text-sm text-gray-600 mt-0.5">
                      GSTIN: <span className="font-mono text-gray-800">{excelData.meta.gstin}</span>
                      {' · '}
                      Period: {excelData.meta.taxPeriod} ({excelData.meta.financialYear})
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Generated on {excelData.meta.generatedOn}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-800">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  GSTR-2B fetched successfully
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-2xl border border-emerald-200 p-5 shadow-sm">
                <p className="text-xs font-semibold text-emerald-700 uppercase">Table 3 — ITC Available</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{formatLakhs(itcTotals.total)}</p>
                <p className="text-xs text-gray-500 mt-1">
                  IGST {formatCurrency(itcTotals.igst)} · CGST {formatCurrency(itcTotals.cgst)} · SGST{' '}
                  {formatCurrency(itcTotals.sgst)}
                </p>
              </div>
              <div className="bg-white rounded-2xl border border-red-200 p-5 shadow-sm">
                <p className="text-xs font-semibold text-red-700 uppercase">Table 4 — ITC Not Available</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {formatLakhs(itcNotAvailableTotals.total)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {excelData.itcNotAvailable.length} summary line(s)
                </p>
              </div>
              <div className="bg-white rounded-2xl border border-blue-200 p-5 shadow-sm">
                <p className="text-xs font-semibold text-blue-700 uppercase">Documents</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{excelData.b2b.length}</p>
                <p className="text-xs text-gray-500 mt-1">
                  B2B invoices · {excelData.b2ba.length} amendment(s)
                </p>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-2 inline-flex gap-1 overflow-x-auto">
              {(
                [
                  { id: 'b2b' as ViewTab, label: `B2B (${excelData.b2b.length})` },
                  { id: 'b2ba' as ViewTab, label: `B2BA (${excelData.b2ba.length})` },
                  { id: 'summary' as ViewTab, label: 'ITC Summary' },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2.5 text-sm font-medium rounded-xl whitespace-nowrap transition-all ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-700 border border-emerald-200 shadow-sm'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {activeTab === 'summary' ? (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
                  <h4 className="font-semibold text-gray-900">ITC Available — Form Summary</h4>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-3 text-xs font-semibold text-gray-700">Heading</th>
                        <th className="px-4 py-3 text-xs font-semibold text-gray-700">GSTR-3B</th>
                        <th className="px-4 py-3 text-xs font-semibold text-gray-700 text-right">IGST</th>
                        <th className="px-4 py-3 text-xs font-semibold text-gray-700 text-right">CGST</th>
                        <th className="px-4 py-3 text-xs font-semibold text-gray-700 text-right">SGST</th>
                        <th className="px-4 py-3 text-xs font-semibold text-gray-700 text-right">Cess</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {excelData.itcAvailable.map((row) => (
                        <tr key={row.heading} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-gray-900 font-medium max-w-xs">{row.heading}</td>
                          <td className="px-4 py-3 text-gray-600">{row.gstr3bTable}</td>
                          <td className="px-4 py-3 text-right">{formatCurrency(row.igst)}</td>
                          <td className="px-4 py-3 text-right">{formatCurrency(row.cgst)}</td>
                          <td className="px-4 py-3 text-right">{formatCurrency(row.sgst)}</td>
                          <td className="px-4 py-3 text-right">{formatCurrency(row.cess)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center px-4 py-3 bg-white border border-gray-200 rounded-xl shadow-sm">
                  <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search invoice, supplier, GSTIN…"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 pr-4 py-2 w-full bg-white border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                {filteredRows.length === 0 ? (
                  <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center text-gray-500 text-sm">
                    <FileText className="h-10 w-10 mx-auto mb-3 opacity-20" />
                    No records in this section.
                  </div>
                ) : (
                  <div className="bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-200">
                          <tr>
                            <th className="px-4 py-3 text-xs font-semibold text-gray-700 whitespace-nowrap">
                              Invoice
                            </th>
                            <th className="px-4 py-3 text-xs font-semibold text-gray-700 whitespace-nowrap">
                              Date
                            </th>
                            <th className="px-4 py-3 text-xs font-semibold text-gray-700 min-w-[180px]">
                              Supplier
                            </th>
                            <th className="px-4 py-3 text-xs font-semibold text-gray-700 text-right">
                              Taxable
                            </th>
                            <th className="px-4 py-3 text-xs font-semibold text-gray-700 text-right">
                              Tax
                            </th>
                            <th className="px-4 py-3 text-xs font-semibold text-gray-700 text-center">
                              RCM
                            </th>
                            <th className="px-4 py-3 text-xs font-semibold text-gray-700 text-center">
                              ITC
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {filteredRows.map((r) => {
                            const tax = r.igst + r.cgst + r.sgst + r.cess;
                            return (
                              <tr key={`${r.supplierGstin}-${r.invoiceNumber}`} className="hover:bg-gray-50">
                                <td className="px-4 py-3 font-semibold text-gray-900 whitespace-nowrap">
                                  {r.invoiceNumber}
                                </td>
                                <td className="px-4 py-3 text-gray-600 text-xs whitespace-nowrap">
                                  {r.invoiceDate}
                                </td>
                                <td className="px-4 py-3">
                                  <div className="font-medium text-xs text-gray-900">{r.supplierName}</div>
                                  <div className="text-[10px] font-mono text-gray-500">{r.supplierGstin}</div>
                                </td>
                                <td className="px-4 py-3 text-right font-medium whitespace-nowrap">
                                  {formatCurrency(r.taxableValue)}
                                </td>
                                <td className="px-4 py-3 text-right text-gray-700 whitespace-nowrap">
                                  {formatCurrency(tax)}
                                </td>
                                <td className="px-4 py-3 text-center text-xs">{r.reverseCharge}</td>
                                <td className="px-4 py-3 text-center">
                                  <span
                                    className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                                      r.itcAvailable === 'Yes'
                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                        : 'bg-red-50 text-red-700 border-red-200'
                                    }`}
                                  >
                                    {r.itcAvailable === 'Yes' ? 'Yes' : 'No'}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                    <div className="px-6 py-3 border-t border-gray-100 bg-gray-50 text-sm text-gray-600 flex justify-between">
                      <span>{filteredRows.length} record(s)</span>
                      <span>
                        Taxable:{' '}
                        <strong className="text-gray-900">
                          {formatCurrency(filteredRows.reduce((s, r) => s + r.taxableValue, 0))}
                        </strong>
                      </span>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

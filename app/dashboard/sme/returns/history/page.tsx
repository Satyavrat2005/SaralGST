'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Search, 
  Download, 
  FileText, 
  CheckCircle2, 
  Clock,
  Loader2,
  AlertTriangle,
  X,
  RefreshCw,
  Calendar
} from 'lucide-react';

interface FilingRecord {
  id: string;
  return_type: string;
  return_period: string;
  status: string;
  arn: string;
  total_taxable_value: number;
  total_igst: number;
  total_cgst: number;
  total_sgst: number;
  total_cess: number;
  filed_date: string;
  created_at: string;
  updated_at: string;
}

const FY_OPTIONS = (() => {
  const now = new Date();
  const currentFY = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
  return Array.from({ length: 3 }, (_, i) => {
    const start = currentFY - i;
    return { label: `FY ${start}-${(start + 1).toString().slice(2)}`, value: `${start}` };
  });
})();

function getPeriodLabel(period: string): string {
  if (!period || period.length < 6) return period;
  const m = parseInt(period.substring(0, 2));
  const y = parseInt(period.substring(2));
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[m - 1]} ${y}`;
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function FilingHistoryPage() {
  const [records, setRecords] = useState<FilingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedFY, setSelectedFY] = useState(FY_OPTIONS[0].value);
  const [selectedType, setSelectedType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/returns?action=history`);
      const data = await res.json();
      if (data.data) setRecords(data.data);
      else setRecords([]);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to fetch history');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  const filtered = records.filter(r => {
    // FY filter
    const m = parseInt(r.return_period.substring(0, 2));
    const y = parseInt(r.return_period.substring(2));
    const fyStart = m >= 4 ? y : y - 1;
    if (fyStart.toString() !== selectedFY) return false;
    // Type filter
    if (selectedType !== 'all' && r.return_type !== selectedType) return false;
    // Search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!r.arn?.toLowerCase().includes(q) && !r.return_type.toLowerCase().includes(q) && !getPeriodLabel(r.return_period).toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const totalLiability = filtered.reduce((s, r) => s + (r.total_igst || 0) + (r.total_cgst || 0) + (r.total_sgst || 0), 0);
  const filedCount = filtered.filter(r => r.status === 'filed').length;

  const statusBadge = (status: string) => {
    switch (status) {
      case 'filed': return { bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: <CheckCircle2 className="h-3 w-3" />, label: 'Filed' };
      case 'submitted': return { bg: 'bg-blue-50 text-blue-700 border-blue-200', icon: <Clock className="h-3 w-3" />, label: 'Submitted' };
      case 'generated': return { bg: 'bg-amber-50 text-amber-700 border-amber-200', icon: <Clock className="h-3 w-3" />, label: 'Draft' };
      default: return { bg: 'bg-gray-50 text-gray-600 border-gray-200', icon: <Clock className="h-3 w-3" />, label: status };
    }
  };

  const typeBadge = (type: string) => {
    switch (type) {
      case 'GSTR1': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'GSTR2B': return 'bg-teal-50 text-teal-700 border-teal-200';
      case 'GSTR3B': return 'bg-purple-50 text-purple-700 border-purple-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

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

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 border border-emerald-200 rounded-full mb-3">
            <FileText className="h-3.5 w-3.5 text-emerald-600" strokeWidth={2.5} />
            <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">Archive</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Filing History</h1>
          <p className="text-gray-600 text-sm mt-1">Archive of all submitted GST returns</p>
        </div>
        <div className="flex items-center gap-3">
           <button onClick={fetchHistory} disabled={loading}
             className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 hover:bg-gray-50 hover:border-gray-300 hover:shadow-sm transition-all flex items-center gap-2 font-medium disabled:opacity-50">
             <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
           </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
          <p className="text-xs text-gray-600 font-semibold uppercase mb-1">Total Returns</p>
          <p className="text-2xl font-bold text-gray-900">{filtered.length}</p>
          <p className="text-xs text-gray-500 mt-1">{filedCount} filed successfully</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
          <p className="text-xs text-gray-600 font-semibold uppercase mb-1">Total Tax Paid</p>
          <p className="text-2xl font-bold text-emerald-600">₹{totalLiability.toLocaleString('en-IN')}</p>
          <p className="text-xs text-gray-500 mt-1">IGST + CGST + SGST</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
          <p className="text-xs text-gray-600 font-semibold uppercase mb-1">Compliance Rate</p>
          <p className="text-2xl font-bold text-blue-600">{filtered.length > 0 ? Math.round((filedCount / filtered.length) * 100) : 0}%</p>
          <p className="text-xs text-gray-500 mt-1">Returns filed on time</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-4 flex flex-wrap items-center gap-3">
         <select value={selectedFY} onChange={(e) => setSelectedFY(e.target.value)}
           className="bg-white border border-gray-200 text-gray-900 text-sm rounded-xl p-2.5 cursor-pointer hover:border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all">
            {FY_OPTIONS.map(fy => <option key={fy.value} value={fy.value}>{fy.label}</option>)}
         </select>
         <select value={selectedType} onChange={(e) => setSelectedType(e.target.value)}
           className="bg-white border border-gray-200 text-gray-900 text-sm rounded-xl p-2.5 cursor-pointer hover:border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all">
            <option value="all">All Return Types</option>
            <option value="GSTR1">GSTR-1</option>
            <option value="GSTR2B">GSTR-2B</option>
            <option value="GSTR3B">GSTR-3B</option>
         </select>
         <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
            <input type="text" placeholder="Search by ARN or period..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none w-full transition-all" />
         </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 text-emerald-600 animate-spin" />
          <span className="ml-3 text-gray-600">Loading history...</span>
        </div>
      ) : (
      <div className="bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden">
         <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
               <thead className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-200">
                  <tr>
                     <th className="px-4 py-3 text-xs font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap">Period</th>
                     <th className="px-4 py-3 text-xs font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap">Return Type</th>
                     <th className="px-4 py-3 text-xs font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap">Filed Date</th>
                     <th className="px-4 py-3 text-xs font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap">ARN</th>
                     <th className="px-4 py-3 text-xs font-semibold text-gray-700 uppercase tracking-wider text-right whitespace-nowrap">Total Tax</th>
                     <th className="px-4 py-3 text-xs font-semibold text-gray-700 uppercase tracking-wider text-center whitespace-nowrap">Status</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-gray-100">
                  {filtered.length === 0 ? (
                    <tr><td colSpan={6} className="px-4 py-12 text-center text-gray-500">
                      <Calendar className="h-10 w-10 mx-auto mb-3 text-gray-300" />
                      <p className="font-medium">No returns found</p>
                      <p className="text-xs mt-1">No filing records match the selected filters</p>
                    </td></tr>
                  ) : (
                    filtered.map((row) => {
                      const badge = statusBadge(row.status);
                      const tax = (row.total_igst || 0) + (row.total_cgst || 0) + (row.total_sgst || 0) + (row.total_cess || 0);
                      return (
                        <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                           <td className="px-4 py-3 text-gray-900 font-semibold whitespace-nowrap">{getPeriodLabel(row.return_period)}</td>
                           <td className="px-4 py-3">
                              <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border whitespace-nowrap ${typeBadge(row.return_type)}`}>
                                 {row.return_type.replace('GSTR', 'GSTR-')}
                              </span>
                           </td>
                           <td className="px-4 py-3 text-gray-600 whitespace-nowrap text-xs">{formatDate(row.filed_date || row.updated_at)}</td>
                           <td className="px-4 py-3 font-mono text-gray-700 text-xs whitespace-nowrap">{row.arn || '-'}</td>
                           <td className="px-4 py-3 text-right text-gray-900 font-semibold whitespace-nowrap text-xs">₹{tax.toLocaleString('en-IN')}</td>
                           <td className="px-4 py-3 text-center">
                              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border whitespace-nowrap ${badge.bg}`}>
                                 {badge.icon}
                                 {badge.label}
                              </span>
                           </td>
                        </tr>
                      );
                    })
                  )}
               </tbody>
            </table>
         </div>
      </div>
      )}
    </div>
    </div>
  );
}

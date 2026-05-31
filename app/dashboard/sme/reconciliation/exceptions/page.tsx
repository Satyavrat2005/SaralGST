'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  AlertOctagon,
  Download,
  RefreshCw,
  Loader2,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const PERIODS = (() => {
  const periods: { label: string; value: string }[] = [];
  const now = new Date();
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    periods.push({
      label: `${d.toLocaleDateString('en-US', { month: 'long' })} ${d.getFullYear()}`,
      value: `${(d.getMonth() + 1).toString().padStart(2, '0')}${d.getFullYear()}`,
    });
  }
  return periods;
})();

export default function ExceptionDashboardPage() {
  const [selectedPeriod, setSelectedPeriod] = useState(PERIODS[0].value);
  const [loading, setLoading] = useState(true);
  const [vendorExceptionData, setVendorExceptionData] = useState<Array<{ name: string; gstr2b: number; books: number; value: number; total: number }>>([]);
  const [categoryData, setCategoryData] = useState<Array<{ name: string; value: number; color: string }>>([]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const listRes = await fetch(`/api/returns?action=list&type=GSTR2B&period=${selectedPeriod}`);
      const listData = await listRes.json();
      const ret = listData.data?.[0];
      if (!ret?.id) {
        setVendorExceptionData([]);
        setCategoryData([]);
        return;
      }
      const res = await fetch(`/api/returns?action=reconciliation-results&returnId=${ret.id}&view=vendor-summary`);
      const data = await res.json();
      setVendorExceptionData(data.data || []);
      const stats = data.stats;
      if (stats) {
        setCategoryData([
          { name: 'Missing in Books', value: stats.unmatched_gstr2b || 0, color: '#F97316' },
          { name: 'Missing in GSTR-2B', value: stats.missing_in_gstr2b || 0, color: '#EF4444' },
          { name: 'Partial Match', value: stats.partial || 0, color: '#EAB308' },
        ].filter((c) => c.value > 0));
      }
    } finally {
      setLoading(false);
    }
  }, [selectedPeriod]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-emerald-50 to-teal-50">
      <div className="max-w-[1400px] mx-auto px-8 py-6 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 bg-red-50 border border-red-200 rounded-full px-3 py-1 mb-2">
              <AlertOctagon className="h-4 w-4 text-red-600" />
              <span className="text-red-700 text-xs font-semibold">EXCEPTION DASHBOARD</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Reconciliation Exceptions</h1>
            <p className="text-gray-600 text-sm mt-1">Vendor-wise breakdown of unmatched invoices</p>
          </div>
          <div className="flex items-center gap-3">
            <select value={selectedPeriod} onChange={(e) => setSelectedPeriod(e.target.value)}
              className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm">
              {PERIODS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
            <button onClick={loadData} className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm flex items-center gap-2">
              <RefreshCw className="h-4 w-4" /> Refresh
            </button>
          </div>
        </div>

        {vendorExceptionData.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center text-gray-500">
            No exceptions — run reconciliation on GSTR-2B for this period first.
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl border border-gray-200 p-6 h-80">
                <h3 className="font-bold text-gray-900 mb-4">Exceptions by Vendor</h3>
                <ResponsiveContainer width="100%" height="85%">
                  <BarChart data={vendorExceptionData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="gstr2b" name="Missing GSTR-2B" stackId="a" fill="#EF4444" />
                    <Bar dataKey="books" name="Missing Books" stackId="a" fill="#F97316" />
                    <Bar dataKey="value" name="Value Mismatch" stackId="a" fill="#EAB308" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              {categoryData.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-200 p-6 h-80">
                  <h3 className="font-bold text-gray-900 mb-4">By Category</h3>
                  <ResponsiveContainer width="100%" height="85%">
                    <PieChart>
                      <Pie data={categoryData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                        {categoryData.map((entry) => (
                          <Cell key={entry.name} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left">Vendor</th>
                    <th className="px-4 py-3 text-right">In 2B only</th>
                    <th className="px-4 py-3 text-right">In books only</th>
                    <th className="px-4 py-3 text-right">Value diff</th>
                    <th className="px-4 py-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {vendorExceptionData.map((v) => (
                    <tr key={v.name} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium">{v.name}</td>
                      <td className="px-4 py-3 text-right">{v.gstr2b}</td>
                      <td className="px-4 py-3 text-right">{v.books}</td>
                      <td className="px-4 py-3 text-right">{v.value}</td>
                      <td className="px-4 py-3 text-right font-bold">{v.total}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

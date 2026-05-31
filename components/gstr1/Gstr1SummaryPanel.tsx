'use client';

import React from 'react';
import type { Gstr1ReturnData } from '@/lib/gstr1/types';
import { AlertTriangle } from 'lucide-react';

interface Props {
  returnData: Gstr1ReturnData | null;
  formatCurrency: (n: number) => string;
}

const SECTION_ROWS: { key: keyof Gstr1ReturnData['sections']; label: string }[] = [
  { key: '4A', label: '4A — B2B Regular' },
  { key: '4B', label: '4B — B2B Reverse Charge' },
  { key: '5', label: '5 — B2C Large (B2CL)' },
  { key: '6A', label: '6A — Exports' },
  { key: '7', label: '7 — B2C Others' },
  { key: '8', label: '8 — Nil / Exempt / Non-GST' },
];

export function Gstr1SummaryPanel({ returnData, formatCurrency }: Props) {
  if (!returnData?.sections) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 text-center text-gray-500 text-sm">
        Generate a draft to see the return summary (portal-style tables).
      </div>
    );
  }

  const { header, sections, total_liability, validation_warnings } = returnData;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
        <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Return Summary</h2>
        <p className="text-xs text-gray-600 mt-1">
          {header.legal_name || header.trade_name || '—'} · GSTIN {header.gstin} · FY {header.financial_year} · Period {header.return_period}
        </p>
      </div>

      {validation_warnings.length > 0 && (
        <div className="px-6 py-3 bg-amber-50 border-b border-amber-100 space-y-1">
          {validation_warnings.map((w, i) => (
            <p key={i} className="text-xs text-amber-800 flex items-start gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
              {w}
            </p>
          ))}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-xs font-semibold text-gray-700 uppercase">Section</th>
              <th className="px-4 py-3 text-xs font-semibold text-gray-700 uppercase text-center">Records</th>
              <th className="px-4 py-3 text-xs font-semibold text-gray-700 uppercase text-right">Value (₹)</th>
              <th className="px-4 py-3 text-xs font-semibold text-gray-700 uppercase text-right">IGST</th>
              <th className="px-4 py-3 text-xs font-semibold text-gray-700 uppercase text-right">CGST</th>
              <th className="px-4 py-3 text-xs font-semibold text-gray-700 uppercase text-right">SGST</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {SECTION_ROWS.map(({ key, label }) => {
              const s = sections[key];
              if (!s || !('count' in s)) return null;
              return (
                <tr key={key} className={s.count > 0 ? 'bg-emerald-50/30' : ''}>
                  <td className="px-4 py-2.5 text-gray-900 font-medium text-xs">{label}</td>
                  <td className="px-4 py-2.5 text-center text-gray-700">{s.count}</td>
                  <td className="px-4 py-2.5 text-right font-semibold text-gray-900 text-xs">{formatCurrency(s.value)}</td>
                  <td className="px-4 py-2.5 text-right text-gray-600 text-xs">{formatCurrency(s.igst)}</td>
                  <td className="px-4 py-2.5 text-right text-gray-600 text-xs">{formatCurrency(s.cgst)}</td>
                  <td className="px-4 py-2.5 text-right text-gray-600 text-xs">{formatCurrency(s.sgst)}</td>
                </tr>
              );
            })}
            <tr className="bg-blue-50/40">
              <td className="px-4 py-2.5 text-gray-900 font-medium text-xs">12 — HSN (B2B)</td>
              <td className="px-4 py-2.5 text-center text-gray-700">{sections['12_b2b'].hsn_rows}</td>
              <td className="px-4 py-2.5 text-right font-semibold text-xs">{formatCurrency(sections['12_b2b'].value)}</td>
              <td className="px-4 py-2.5 text-right text-xs">{formatCurrency(sections['12_b2b'].igst)}</td>
              <td className="px-4 py-2.5 text-right text-xs">{formatCurrency(sections['12_b2b'].cgst)}</td>
              <td className="px-4 py-2.5 text-right text-xs">{formatCurrency(sections['12_b2b'].sgst)}</td>
            </tr>
            <tr>
              <td className="px-4 py-2.5 text-gray-900 font-medium text-xs">12 — HSN (B2C)</td>
              <td className="px-4 py-2.5 text-center text-gray-700">{sections['12_b2c'].hsn_rows}</td>
              <td className="px-4 py-2.5 text-right font-semibold text-xs">{formatCurrency(sections['12_b2c'].value)}</td>
              <td className="px-4 py-2.5 text-right text-xs">{formatCurrency(sections['12_b2c'].igst)}</td>
              <td className="px-4 py-2.5 text-right text-xs">{formatCurrency(sections['12_b2c'].cgst)}</td>
              <td className="px-4 py-2.5 text-right text-xs">{formatCurrency(sections['12_b2c'].sgst)}</td>
            </tr>
            <tr>
              <td className="px-4 py-2.5 text-gray-900 font-medium text-xs">13 — Documents Issued</td>
              <td className="px-4 py-2.5 text-center text-gray-700">{sections['13'].net_issued}</td>
              <td colSpan={4} className="px-4 py-2.5 text-xs text-gray-500">
                {sections['13'].series.length > 0
                  ? sections['13'].series.map((d) => `${d.from}–${d.to} (${d.net_issue} net)`).join(', ')
                  : '—'}
              </td>
            </tr>
          </tbody>
          <tfoot className="bg-gradient-to-r from-emerald-50 to-teal-50 border-t-2 border-emerald-200">
            <tr>
              <td className="px-4 py-3 font-bold text-gray-900 text-xs">Total Liability</td>
              <td className="px-4 py-3 text-center font-bold text-gray-900">{total_liability.count}</td>
              <td className="px-4 py-3 text-right font-bold text-gray-900">{formatCurrency(total_liability.value)}</td>
              <td className="px-4 py-3 text-right font-bold text-gray-900">{formatCurrency(total_liability.igst)}</td>
              <td className="px-4 py-3 text-right font-bold text-gray-900">{formatCurrency(total_liability.cgst)}</td>
              <td className="px-4 py-3 text-right font-bold text-gray-900">{formatCurrency(total_liability.sgst)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

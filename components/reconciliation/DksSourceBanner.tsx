import React from 'react';
import { FileSpreadsheet, FileText } from 'lucide-react';

interface DksSourceBannerProps {
  sources?: { gstr2bFile: string; gstr1File: string };
  gstr1Meta?: {
    legalName?: string;
    gstin?: string;
    arn?: string;
    b2bInvoiceCount?: number;
  } | null;
}

export function DksSourceBanner({ sources, gstr1Meta }: DksSourceBannerProps) {
  if (!sources) return null;

  return (
    <div className="rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-50/80 via-white to-teal-50/60 p-4 shadow-sm">
      <p className="text-xs font-semibold text-emerald-800 uppercase tracking-wide mb-3">
        March 2025 — DKS file reconciliation
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
        <div className="flex items-start gap-2 rounded-xl bg-white border border-gray-200 p-3">
          <FileText className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-gray-900">GSTR-1 filing summary</p>
            <p className="text-xs text-gray-600 mt-0.5">{sources.gstr1File}</p>
            {gstr1Meta?.legalName && (
              <p className="text-[10px] text-gray-500 mt-1">
                {gstr1Meta.legalName} · {gstr1Meta.gstin} · ARN {gstr1Meta.arn}
                {gstr1Meta.b2bInvoiceCount != null
                  ? ` · ${gstr1Meta.b2bInvoiceCount} B2B invoices`
                  : ''}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-start gap-2 rounded-xl bg-white border border-gray-200 p-3">
          <FileSpreadsheet className="h-4 w-4 text-orange-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-gray-900">GSTR-2B (portal ITC)</p>
            <p className="text-xs text-gray-600 mt-0.5">{sources.gstr2bFile}</p>
            <p className="text-[10px] text-gray-500 mt-1">
              Purchase register is matched line-by-line against these inward supplies
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

import { isDksMarchPeriod, DKS_RECON_RETURN_ID } from './dksMarchConstants';

export interface ReconciliationApiPayload {
  stats?: {
    match_pct: number;
    matched: number;
    partial: number;
    missing_in_gstr2b: number;
    total_gstr2b?: number;
    total_purchase?: number;
    ran_at?: string;
  };
  matched?: unknown[];
  partial?: unknown[];
  missing_in_gstr2b?: unknown[];
  missing_in_books?: unknown[];
  data?: unknown[];
  sources?: { gstr2bFile: string; gstr1File: string };
  gstr1Meta?: Record<string, unknown> | null;
  error?: string;
}

export async function fetchReconciliationPayload(
  period: string,
  options?: { view?: string; returnId?: string | null }
): Promise<{
  payload: ReconciliationApiPayload | null;
  returnId: string | null;
  isDks: boolean;
}> {
  if (isDksMarchPeriod(period)) {
    const view = options?.view;
    const q = view ? `?view=${view}` : '';
    const res = await fetch(`/api/reconciliation/dks-march${q}`);
    const payload = (await res.json()) as ReconciliationApiPayload;
    if (!res.ok) {
      return { payload: null, returnId: null, isDks: true };
    }
    return { payload, returnId: DKS_RECON_RETURN_ID, isDks: true };
  }

  const listRes = await fetch(`/api/returns?action=list&type=GSTR2B&period=${period}`);
  const listData = await listRes.json();
  const ret = listData.data?.[0];
  if (!ret?.id) {
    return { payload: null, returnId: null, isDks: false };
  }

  const view = options?.view || 'all';
  const viewParam = view === 'all' ? '' : `&view=${view}`;
  const res = await fetch(
    `/api/returns?action=reconciliation-results&returnId=${ret.id}${viewParam}`
  );
  const payload = (await res.json()) as ReconciliationApiPayload;
  return { payload, returnId: ret.id as string, isDks: false };
}

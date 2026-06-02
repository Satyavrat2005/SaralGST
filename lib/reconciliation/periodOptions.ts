/** Earliest return period selectable in reconciliation flows (MMYYYY). */
export const RECONCILIATION_PERIOD_START = { month: 1, year: 2025 } as const;

export interface ReturnPeriodOption {
  label: string;
  value: string;
}

/** GST return periods from the current month back through January 2025. */
export function buildReconciliationPeriodOptions(
  now: Date = new Date()
): ReturnPeriodOption[] {
  const periods: ReturnPeriodOption[] = [];
  const start = new Date(
    RECONCILIATION_PERIOD_START.year,
    RECONCILIATION_PERIOD_START.month - 1,
    1
  );
  let cursor = new Date(now.getFullYear(), now.getMonth(), 1);

  while (cursor >= start) {
    const month = cursor.getMonth() + 1;
    const year = cursor.getFullYear();
    periods.push({
      label: `${cursor.toLocaleDateString('en-US', { month: 'long' })} ${year}`,
      value: `${month.toString().padStart(2, '0')}${year}`,
    });
    cursor = new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1);
  }

  return periods;
}

/** GSTR-2B auto-draft is published on the 14th of the month after the return period. */
export function gstr2bAvailableFromDate(period: string): Date | null {
  const parsed = parseMmYyyy(period);
  if (!parsed) return null;
  const { month, year } = parsed;
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;
  return new Date(nextYear, nextMonth - 1, 14);
}

export function parseMmYyyy(period: string): { month: number; year: number } | null {
  if (!/^\d{6}$/.test(period)) return null;
  const month = parseInt(period.slice(0, 2), 10);
  const year = parseInt(period.slice(2), 10);
  if (month < 1 || month > 12) return null;
  return { month, year };
}

export function formatPeriodLabel(period: string): string {
  const parsed = parseMmYyyy(period);
  if (!parsed) return period;
  const d = new Date(parsed.year, parsed.month - 1, 1);
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

/** Best sandbox period — matches test fixture and DKS GSTR-1 sample. */
export const SANDBOX_GSTR2B_PERIOD = '032025';

export interface Gstr2bPeriodCheck {
  blocked: boolean;
  code?: 'IMS2B009' | 'PERIOD_FUTURE';
  message?: string;
  availableFrom?: string;
  suggestedPeriod?: string;
}

export function checkGstr2bPeriodFetchable(period: string, now = new Date()): Gstr2bPeriodCheck {
  const parsed = parseMmYyyy(period);
  if (!parsed) {
    return { blocked: true, message: 'Invalid period format. Use MMYYYY.' };
  }

  const availableFrom = gstr2bAvailableFromDate(period);
  if (!availableFrom) {
    return { blocked: true, message: 'Invalid period.' };
  }

  if (now < availableFrom) {
    return {
      blocked: true,
      code: 'IMS2B009',
      message: `GSTR-2B for ${formatPeriodLabel(period)} is not released yet. Portal allows fetch after ${availableFrom.toLocaleDateString('en-IN')}.`,
      availableFrom: availableFrom.toISOString(),
      suggestedPeriod: SANDBOX_GSTR2B_PERIOD,
    };
  }

  return { blocked: false, suggestedPeriod: SANDBOX_GSTR2B_PERIOD };
}

export const PORTAL_UNAVAILABLE_CODES = new Set([
  'GTR2B-002',
  'IMS2B009',
  'IMS2B007',
  'GSTR2B_GENERATING',
]);

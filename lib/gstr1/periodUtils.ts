import { parseReturnPeriod } from '@/lib/services/masterGSTService';

/** Inclusive YYYY-MM-DD range for a GSTR return period (MMYYYY), local calendar dates. */
export function getReturnPeriodDateRange(period: string): {
  startDate: string;
  endDate: string;
  month: number;
  year: number;
} {
  const { month, year } = parseReturnPeriod(period);
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
  return { startDate, endDate, month, year };
}

export function invoiceDateInPeriod(
  invoiceDate: string | null | undefined,
  startDate: string,
  endDate: string
): boolean {
  if (!invoiceDate) return false;
  const d = invoiceDate.length >= 10 ? invoiceDate.slice(0, 10) : invoiceDate;
  return d >= startDate && d <= endDate;
}

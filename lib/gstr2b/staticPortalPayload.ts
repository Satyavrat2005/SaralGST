import basePayload from './data/gstr2b-portal-payload.json';
import { SANDBOX_GSTR2B_PERIOD } from './periodValidation';

export { SANDBOX_GSTR2B_PERIOD };

const DATE_FIELDS = ['idt', 'nt_dt', 'docdt', 'boedt'] as const;

function parsePeriod(period: string): { month: number; year: number } | null {
  const m = period.match(/^(\d{2})(\d{4})$/);
  if (!m) return null;
  return { month: parseInt(m[1], 10), year: parseInt(m[2], 10) };
}

function formatGstnDate(day: number, month: number, year: number): string {
  const dd = String(day).padStart(2, '0');
  const mm = String(month).padStart(2, '0');
  return `${dd}-${mm}-${year}`;
}

function parseGstnDateStr(value: string): { day: number; month: number; year: number } | null {
  const m = value.match(/^(\d{2})-(\d{2})-(\d{4})$/);
  if (!m) return null;
  return { day: parseInt(m[1], 10), month: parseInt(m[2], 10), year: parseInt(m[3], 10) };
}

function shiftDateInPeriod(
  value: string,
  sourcePeriod: string,
  targetPeriod: string
): string {
  if (sourcePeriod === targetPeriod) return value;
  const src = parsePeriod(sourcePeriod);
  const tgt = parsePeriod(targetPeriod);
  const parsed = parseGstnDateStr(value);
  if (!src || !tgt || !parsed) return value;

  const lastDay = new Date(tgt.year, tgt.month, 0).getDate();
  const day = Math.min(parsed.day, lastDay);
  return formatGstnDate(day, tgt.month, tgt.year);
}

function shiftDatesInObject(
  obj: unknown,
  sourcePeriod: string,
  targetPeriod: string
): unknown {
  if (obj == null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) {
    return obj.map((item) => shiftDatesInObject(item, sourcePeriod, targetPeriod));
  }

  const record = obj as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(record)) {
    if (DATE_FIELDS.includes(key as (typeof DATE_FIELDS)[number]) && typeof val === 'string') {
      out[key] = shiftDateInPeriod(val, sourcePeriod, targetPeriod);
    } else if (val && typeof val === 'object') {
      out[key] = shiftDatesInObject(val, sourcePeriod, targetPeriod);
    } else {
      out[key] = val;
    }
  }
  return out;
}

export function getStaticGstr2bPortalResponse(period = SANDBOX_GSTR2B_PERIOD): Record<string, unknown> {
  const payload = JSON.parse(JSON.stringify(basePayload)) as Record<string, unknown>;
  if (period !== SANDBOX_GSTR2B_PERIOD) {
    return shiftDatesInObject(payload, SANDBOX_GSTR2B_PERIOD, period) as Record<string, unknown>;
  }
  return payload;
}

export function isMasterGstSandboxEnv(): boolean {
  if (process.env.MASTERGST_SANDBOX === 'false') return false;
  return true;
}

/** @deprecated Use getStaticGstr2bPortalResponse */
export function getSandboxGstr2bPortalResponse(): Record<string, unknown> {
  return getStaticGstr2bPortalResponse();
}

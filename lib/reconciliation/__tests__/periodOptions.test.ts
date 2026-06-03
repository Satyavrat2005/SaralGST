import { describe, it, expect } from 'vitest';
import { buildReconciliationPeriodOptions } from '../periodOptions';

describe('buildReconciliationPeriodOptions', () => {
  it('includes January 2025 through the reference month', () => {
    const periods = buildReconciliationPeriodOptions(new Date(2026, 5, 15)); // June 2026
    const values = periods.map((p) => p.value);
    expect(values).toContain('012025');
    expect(values[0]).toBe('062026');
    expect(values[values.length - 1]).toBe('012025');
    expect(periods.length).toBe(18);
  });

  it('does not include months before January 2025', () => {
    const periods = buildReconciliationPeriodOptions(new Date(2026, 5, 1));
    expect(periods.some((p) => p.value === '122024')).toBe(false);
  });
});

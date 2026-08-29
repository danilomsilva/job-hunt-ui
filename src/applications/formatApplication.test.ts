import { describe, expect, it } from 'vitest';
import { formatSalary } from './formatApplication';

describe('formatSalary', () => {
  it('formats a full range, with and without a currency', () => {
    expect(formatSalary(90000, 120000, 'EUR')).toBe('90,000–120,000 EUR');
    expect(formatSalary(90000, 120000, null)).toBe('90,000–120,000');
  });

  it('formats a single bound', () => {
    expect(formatSalary(90000, null, 'EUR')).toBe('From 90,000 EUR');
    expect(formatSalary(null, 120000, 'EUR')).toBe('Up to 120,000 EUR');
  });

  it('is an em dash when both bounds are missing', () => {
    expect(formatSalary(null, null, 'EUR')).toBe('—');
    expect(formatSalary(null, null, null)).toBe('—');
  });
});

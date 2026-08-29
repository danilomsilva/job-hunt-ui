import { describe, expect, it } from 'vitest';
import type { ApplicationStatus } from '../lib/types';
import { formatAppliedAt, STATUS_LABELS } from './formatStatus';

const ALL_STATUSES: ApplicationStatus[] = [
  'wishlist',
  'applied',
  'phone_screen',
  'interview',
  'offer',
  'rejected',
  'accepted',
];

describe('STATUS_LABELS', () => {
  it('has a non-empty label for every status', () => {
    for (const status of ALL_STATUSES) {
      expect(STATUS_LABELS[status]).toBeTruthy();
    }
    expect(STATUS_LABELS.phone_screen).toBe('Phone screen');
  });
});

describe('formatAppliedAt', () => {
  it('renders a date for a valid ISO string', () => {
    expect(formatAppliedAt('2026-08-01T00:00:00.000Z')).toMatch(/2026/);
  });

  it('is an em dash for null or an unparseable value', () => {
    expect(formatAppliedAt(null)).toBe('—');
    expect(formatAppliedAt('not-a-date')).toBe('—');
  });
});

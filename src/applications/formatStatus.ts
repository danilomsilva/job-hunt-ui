import type { ApplicationStatus } from '../lib/types';

export const STATUS_LABELS: Record<ApplicationStatus, string> = {
  wishlist: 'Wishlist',
  applied: 'Applied',
  phone_screen: 'Phone screen',
  interview: 'Interview',
  offer: 'Offer',
  rejected: 'Rejected',
  accepted: 'Accepted',
};

/** An application's applied date as a short local date, or an em dash if unset. */
export function formatAppliedAt(iso: string | null): string {
  if (iso === null) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-IE', { year: 'numeric', month: 'short', day: 'numeric' });
}

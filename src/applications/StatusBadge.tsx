import type { ApplicationStatus } from '../lib/types';
import { STATUS_LABELS } from './formatStatus';

const STATUS_STYLES: Record<ApplicationStatus, string> = {
  wishlist: 'bg-slate-100 text-slate-700',
  applied: 'bg-blue-100 text-blue-700',
  phone_screen: 'bg-indigo-100 text-indigo-700',
  interview: 'bg-amber-100 text-amber-800',
  offer: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  accepted: 'bg-emerald-100 text-emerald-800',
};

export function StatusBadge({ status }: { status: ApplicationStatus }) {
  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[status]}`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}

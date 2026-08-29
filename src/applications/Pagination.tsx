import type { Pagination as PaginationInfo } from '../lib/types';

interface PaginationProps {
  pagination: PaginationInfo | null;
  onPageChange: (page: number) => void;
}

const button = 'rounded border border-slate-300 px-2 py-1 disabled:opacity-40';

export function Pagination({ pagination, onPageChange }: PaginationProps) {
  if (pagination === null || pagination.totalPages <= 1) return null;

  const { page, totalPages } = pagination;

  return (
    <nav aria-label="Pagination" className="mt-4 flex items-center gap-3 text-sm">
      <button
        type="button"
        className={button}
        disabled={page <= 1}
        onClick={() => {
          onPageChange(page - 1);
        }}
      >
        Previous
      </button>
      <span className="text-slate-600">
        Page {page} of {totalPages}
      </span>
      <button
        type="button"
        className={button}
        disabled={page >= totalPages}
        onClick={() => {
          onPageChange(page + 1);
        }}
      >
        Next
      </button>
    </nav>
  );
}

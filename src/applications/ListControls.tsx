import { useEffect, useState } from 'react';
import type { ApplicationSort, ApplicationStatus } from '../lib/types';
import type { ListApplicationsParams } from './applicationsApi';
import { STATUS_LABELS } from './formatStatus';
import { useDebouncedValue } from './useDebouncedValue';

const SORT_LABELS: Record<ApplicationSort, string> = {
  createdAt: 'Created date',
  updatedAt: 'Updated date',
  appliedAt: 'Applied date',
  company: 'Company',
};

const STATUS_OPTIONS = Object.keys(STATUS_LABELS) as (keyof typeof STATUS_LABELS)[];
const SORT_OPTIONS = Object.keys(SORT_LABELS) as ApplicationSort[];

interface ListControlsProps {
  params: ListApplicationsParams;
  onFilter: (patch: Partial<ListApplicationsParams>) => void;
}

const field = 'rounded border border-slate-300 px-2 py-1 text-sm';

export function ListControls({ params, onFilter }: ListControlsProps) {
  const [company, setCompany] = useState(params.company ?? '');
  const debouncedCompany = useDebouncedValue(company, 300);

  useEffect(() => {
    if (debouncedCompany !== (params.company ?? '')) {
      onFilter({ company: debouncedCompany });
    }
  }, [debouncedCompany, params.company, onFilter]);

  const sortOrder = params.sortOrder ?? 'desc';

  return (
    <div className="mt-4 flex flex-wrap items-end gap-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="filter-status" className="text-xs font-medium text-slate-600">
          Status
        </label>
        <select
          id="filter-status"
          className={field}
          value={params.status ?? ''}
          onChange={(event) => {
            const value = event.target.value;
            onFilter({ status: value === '' ? undefined : (value as ApplicationStatus) });
          }}
        >
          <option value="">All statuses</option>
          {STATUS_OPTIONS.map((status) => (
            <option key={status} value={status}>
              {STATUS_LABELS[status]}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="filter-company" className="text-xs font-medium text-slate-600">
          Company
        </label>
        <input
          id="filter-company"
          className={field}
          value={company}
          placeholder="Any company"
          onChange={(event) => {
            setCompany(event.target.value);
          }}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="sort-by" className="text-xs font-medium text-slate-600">
          Sort by
        </label>
        <select
          id="sort-by"
          className={field}
          value={params.sortBy ?? 'createdAt'}
          onChange={(event) => {
            onFilter({ sortBy: event.target.value as ApplicationSort });
          }}
        >
          {SORT_OPTIONS.map((sort) => (
            <option key={sort} value={sort}>
              {SORT_LABELS[sort]}
            </option>
          ))}
        </select>
      </div>

      <button
        type="button"
        className={`${field} font-medium text-slate-700`}
        onClick={() => {
          onFilter({ sortOrder: sortOrder === 'asc' ? 'desc' : 'asc' });
        }}
      >
        {sortOrder === 'asc' ? 'Ascending ↑' : 'Descending ↓'}
      </button>
    </div>
  );
}

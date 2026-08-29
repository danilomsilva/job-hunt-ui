import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { ApplicationSort, ApplicationStatus } from '../lib/types';
import type { ListApplicationsParams } from './applicationsApi';

function isStatus(value: string | null): value is ApplicationStatus {
  return (
    value === 'wishlist' ||
    value === 'applied' ||
    value === 'phone_screen' ||
    value === 'interview' ||
    value === 'offer' ||
    value === 'rejected' ||
    value === 'accepted'
  );
}

function isSort(value: string | null): value is ApplicationSort {
  return (
    value === 'createdAt' || value === 'updatedAt' || value === 'appliedAt' || value === 'company'
  );
}

export interface ListParamsApi {
  params: ListApplicationsParams;
  /** Merge a filter/sort change; always resets back to page 1. */
  setFilter: (patch: Partial<ListApplicationsParams>) => void;
  setPage: (page: number) => void;
}

/**
 * The list's filter/sort/page state, read from and written to the URL query
 * string so refresh, back/forward, and link-sharing all preserve the view.
 * Unknown or malformed params are ignored (they fall back to the API defaults).
 */
export function useListParams(): ListParamsApi {
  const [searchParams, setSearchParams] = useSearchParams();

  const params = useMemo<ListApplicationsParams>(() => {
    const statusRaw = searchParams.get('status');
    const sortByRaw = searchParams.get('sortBy');
    const company = searchParams.get('company') ?? '';
    const pageRaw = Number(searchParams.get('page'));
    const pageSizeRaw = Number(searchParams.get('pageSize'));

    return {
      status: isStatus(statusRaw) ? statusRaw : undefined,
      company: company.length > 0 ? company : undefined,
      sortBy: isSort(sortByRaw) ? sortByRaw : undefined,
      sortOrder: searchParams.get('sortOrder') === 'asc' ? 'asc' : undefined,
      page: Number.isInteger(pageRaw) && pageRaw > 1 ? pageRaw : undefined,
      // No UI control for pageSize (fixed at the API default), but an explicit
      // ?pageSize=… in the URL is still honoured.
      pageSize: Number.isInteger(pageSizeRaw) && pageSizeRaw > 0 ? pageSizeRaw : undefined,
    };
  }, [searchParams]);

  const setFilter = useCallback(
    (patch: Partial<ListApplicationsParams>) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          for (const [key, value] of Object.entries(patch)) {
            if (value === undefined || value === '') {
              next.delete(key);
            } else {
              next.set(key, String(value));
            }
          }
          next.delete('page');
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  const setPage = useCallback(
    (page: number) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (page <= 1) next.delete('page');
          else next.set('page', String(page));
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  return { params, setFilter, setPage };
}

import { useCallback, useEffect, useState } from 'react';
import { ApiError } from '../lib/api';
import type { Application, Pagination } from '../lib/types';
import { listApplications, type ListApplicationsParams } from './applicationsApi';

type Status = 'loading' | 'error' | 'success';

interface UseApplications {
  applications: Application[];
  pagination: Pagination | null;
  status: Status;
  error: string | null;
  reload: () => void;
}

/**
 * Hand-rolled fetch of `GET /applications` (no TanStack Query — see
 * docs/ROADMAP.md). The effect re-runs whenever a param changes or `reload()`
 * bumps the nonce; params are destructured to primitives so the dependency
 * array is stable across parent re-renders. Setting state in `reload` (an event
 * callback) rather than the effect body keeps clear of `set-state-in-effect`.
 */
export function useApplications(params: ListApplicationsParams = {}): UseApplications {
  const { status: statusFilter, company, sortBy, sortOrder, page, pageSize } = params;

  const [applications, setApplications] = useState<Application[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [status, setStatus] = useState<Status>('loading');
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);

  const reload = useCallback(() => {
    setStatus('loading');
    setError(null);
    setNonce((n) => n + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const query: ListApplicationsParams = {
      status: statusFilter,
      company,
      sortBy,
      sortOrder,
      page,
      pageSize,
    };

    listApplications(query)
      .then((list) => {
        if (cancelled) return;
        setApplications(list.data);
        setPagination(list.pagination);
        setStatus('success');
      })
      .catch((cause: unknown) => {
        if (cancelled) return;
        setError(cause instanceof ApiError ? cause.message : 'Could not load applications.');
        setStatus('error');
      });

    return () => {
      cancelled = true;
    };
  }, [statusFilter, company, sortBy, sortOrder, page, pageSize, nonce]);

  return { applications, pagination, status, error, reload };
}

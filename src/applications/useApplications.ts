import { useCallback, useEffect, useState } from 'react';
import { ApiError } from '../lib/api';
import type { Application } from '../lib/types';
import { listApplications } from './applicationsApi';

type Status = 'loading' | 'error' | 'success';

interface UseApplications {
  applications: Application[];
  status: Status;
  error: string | null;
  reload: () => void;
}

/**
 * Hand-rolled fetch of `GET /applications` (no TanStack Query — see
 * docs/ROADMAP.md). One `useEffect` does the request; `reload()` flips back to
 * `loading` and bumps a nonce to re-run it. Setting state in `reload` (an event
 * callback) rather than the effect body keeps clear of `set-state-in-effect`.
 */
export function useApplications(): UseApplications {
  const [applications, setApplications] = useState<Application[]>([]);
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

    listApplications()
      .then((list) => {
        if (cancelled) return;
        setApplications(list.data);
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
  }, [nonce]);

  return { applications, status, error, reload };
}

import { useCallback, useEffect, useState } from 'react';
import { ApiError } from '../lib/api';
import type { Application } from '../lib/types';
import { getApplication } from './applicationsApi';

type Status = 'loading' | 'error' | 'notFound' | 'success';

interface UseApplication {
  application: Application | null;
  status: Status;
  error: string | null;
  reload: () => void;
}

/**
 * Hand-rolled fetch of `GET /applications/:id`. Same idiom as `useApplications`;
 * a `404` (missing, not-owned, or malformed id — the API doesn't distinguish)
 * gets its own `notFound` status so the page can show a dedicated message.
 */
export function useApplication(id: string): UseApplication {
  const [application, setApplication] = useState<Application | null>(null);
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

    getApplication(id)
      .then((data) => {
        if (cancelled) return;
        setApplication(data);
        setStatus('success');
      })
      .catch((cause: unknown) => {
        if (cancelled) return;
        if (cause instanceof ApiError && cause.status === 404) {
          setStatus('notFound');
          return;
        }
        setError(cause instanceof ApiError ? cause.message : 'Could not load this application.');
        setStatus('error');
      });

    return () => {
      cancelled = true;
    };
  }, [id, nonce]);

  return { application, status, error, reload };
}

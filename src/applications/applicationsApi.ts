import { apiFetch } from '../lib/api';
import type { ApplicationList } from '../lib/types';

/**
 * `GET /applications` — the authenticated user's applications. Filtering,
 * sorting, and pagination params land in Stage 4.
 */
export function listApplications(): Promise<ApplicationList> {
  return apiFetch<ApplicationList>('/applications');
}

import { apiFetch } from '../lib/api';
import type { ApplicationList, ApplicationSort, ApplicationStatus, SortOrder } from '../lib/types';

/**
 * Query params for `GET /applications` — all optional, see job-hunt-api's
 * `listQuerySchema`. Fields are `| undefined` (not just `?`) so callers can pass
 * a fully-shaped object with unset values, under `exactOptionalPropertyTypes`.
 */
export interface ListApplicationsParams {
  status?: ApplicationStatus | undefined;
  company?: string | undefined;
  sortBy?: ApplicationSort | undefined;
  sortOrder?: SortOrder | undefined;
  page?: number | undefined;
  pageSize?: number | undefined;
}

function toQueryString(params: ListApplicationsParams): string {
  const search = new URLSearchParams();
  if (params.status) search.set('status', params.status);
  if (params.company) search.set('company', params.company);
  if (params.sortBy) search.set('sortBy', params.sortBy);
  if (params.sortOrder) search.set('sortOrder', params.sortOrder);
  if (params.page !== undefined) search.set('page', String(params.page));
  if (params.pageSize !== undefined) search.set('pageSize', String(params.pageSize));
  return search.toString();
}

/**
 * `GET /applications` — the authenticated user's applications, filtered, sorted,
 * and paginated per `params`. Unset params fall back to the API's defaults
 * (`sortBy=createdAt`, `sortOrder=desc`, `page=1`, `pageSize=20`).
 */
export function listApplications(params: ListApplicationsParams = {}): Promise<ApplicationList> {
  const query = toQueryString(params);
  return apiFetch<ApplicationList>(`/applications${query ? `?${query}` : ''}`);
}

import { apiFetch } from '../lib/api';
import type {
  Application,
  ApplicationList,
  ApplicationSort,
  ApplicationStatus,
  SortOrder,
} from '../lib/types';

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

/**
 * The write shape for `POST` / `PATCH /applications` — what the form produces
 * once validated. Every field is sent on both create and update (a full payload
 * each time, no dirty-diffing); an empty optional field goes as `null`.
 */
export interface ApplicationPayload {
  company: string;
  role: string;
  status: ApplicationStatus;
  location: string | null;
  jobUrl: string | null;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryCurrency: string | null;
  notes: string | null;
  appliedAt: string | null;
}

export function getApplication(id: string): Promise<Application> {
  return apiFetch<Application>(`/applications/${id}`);
}

export function createApplication(payload: ApplicationPayload): Promise<Application> {
  return apiFetch<Application>('/applications', { method: 'POST', body: payload });
}

export function updateApplication(id: string, payload: ApplicationPayload): Promise<Application> {
  return apiFetch<Application>(`/applications/${id}`, { method: 'PATCH', body: payload });
}

export async function deleteApplication(id: string): Promise<void> {
  await apiFetch<undefined>(`/applications/${id}`, { method: 'DELETE' });
}

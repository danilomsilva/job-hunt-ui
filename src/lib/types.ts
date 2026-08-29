/**
 * Response shapes from job-hunt-api. The API contract itself is not duplicated
 * here — see job-hunt-api's `docs/API.md` and `/ui`. These are only the pieces
 * the frontend currently touches.
 */

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface UserResponse {
  id: string;
  email: string;
  createdAt: string;
}

/** Every error the API returns has this shape (see its `error-handler.ts`). */
export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
  requestId: string;
}

/** The hiring-pipeline stages, in order (job-hunt-api's `application_status` enum). */
export type ApplicationStatus =
  'wishlist' | 'applied' | 'phone_screen' | 'interview' | 'offer' | 'rejected' | 'accepted';

export interface Application {
  id: string;
  userId: string;
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
  createdAt: string;
  updatedAt: string;
}

export interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface ApplicationList {
  data: Application[];
  pagination: Pagination;
}

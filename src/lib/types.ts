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

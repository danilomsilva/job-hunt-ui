# Roadmap

## Who is building this

Danilo M. Silva — Phase 2 of the same roadmap as
[`job-hunt-api`](https://github.com/danilomsilva/job-hunt-api): a React +
TypeScript client consuming that backend. The priority is the same as
Phase 1's — learn the fundamentals properly, not ship fast with shortcuts.

## Tech stack decisions

- **Build tool:** Vite — fast dev server, native TypeScript, no bundler config
- **Framework:** React 18, TypeScript (strict mode)
- **Routing:** React Router — the standard client-side router for a React SPA
- **Server state:** TanStack Query — caching, refetching, loading/error states
  for data from `job-hunt-api`, instead of hand-rolled `useEffect` fetching
- **Forms & validation:** React Hook Form + Zod (`@hookform/resolvers`) — same
  validation library the backend already uses
- **Styling:** Tailwind CSS
- **Testing:** Vitest + React Testing Library
- **Linting:** ESLint + Prettier

One decision deliberately deferred to the Auth stage, not made upfront: where
access/refresh tokens are stored client-side (`localStorage` vs. in-memory
only). The backend returns both in the JSON response body today, not
`httpOnly` cookies, so the real trade-off (XSS exposure vs. losing the
session on every page refresh) is worth deciding once the auth flow is
actually being built, not guessed at now.

---

## Phase 2 — Frontend

Build a React + TypeScript client for `job-hunt-api`: auth flow with token
refresh, the applications list with filtering/sorting/pagination wired to the
API, and create/edit/detail views for an application.

**The API contract is not duplicated here.** `job-hunt-api`'s
[`docs/API.md`](https://github.com/danilomsilva/job-hunt-api/blob/main/docs/API.md)
and its live Swagger UI (`/ui` on the running backend) are the source of
truth for every endpoint, request/response shape, and status code — this
roadmap only covers what the _frontend_ does with them.

| Stage                 | Outcome                                                                          |
| --------------------- | -------------------------------------------------------------------------------- |
| 1. Scaffold           | Vite + React + TS strict, ESLint + Prettier, Tailwind, connects to `/health`     |
| 2. Auth flow          | Login/register pages, token storage, automatic refresh, protected routes, logout |
| 3. Applications list  | Fetch and render via TanStack Query, loading/error states                        |
| 4. List refinements   | Filtering, sorting, pagination UI wired to `GET /applications`'s query params    |
| 5. Create/edit/detail | Forms (React Hook Form + Zod) for create/update, a detail view, delete           |
| 6. Polish             | Empty states, accessibility pass, component + integration tests                  |

### Pages & flow

```
(unauthenticated) ── /login ──┐
                    /register ─┴──▶ /applications (list)
                                        │
                                        ├──▶ /applications/new      (create)
                                        └──▶ /applications/:id      (detail → edit / delete)
```

- **`/login`, `/register`** — the only routes reachable without a valid access
  token; a successful login/register redirects to `/applications`
- **`/applications`** — the list view: filters (status, company), sorting,
  pagination controls, a link into each row's detail view
- **`/applications/new`** — a create form; on success, redirects to the new
  application's detail view
- **`/applications/:id`** — view one application, edit its fields inline or
  via the same form component as create, delete with confirmation
- Any route other than `/login`/`/register` redirects to `/login` if there's
  no valid (or refreshable) access token

### Checklist

- [ ] Repo created
- [ ] Project scaffolded (Vite, TypeScript, ESLint, Prettier, Tailwind)
- [ ] Routing set up, connects to `job-hunt-api`'s `/health`
- [ ] Auth flow (login, register, token storage, automatic refresh, logout)
- [ ] Applications list (fetch, loading/error states)
- [ ] Filtering, sorting, pagination wired to the list
- [ ] Create / edit / detail views
- [ ] Component and integration tests

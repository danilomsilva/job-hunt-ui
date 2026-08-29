# Roadmap

## Who is building this

Danilo M. Silva — Phase 2 of the same roadmap as
[`job-hunt-api`](https://github.com/danilomsilva/job-hunt-api): a React +
TypeScript client consuming that backend. The priority is the same as
Phase 1's — learn the fundamentals properly, not ship fast with shortcuts.

## Tech stack decisions

- **Build tool:** Vite — fast dev server, native TypeScript, no bundler config
- **Framework:** React 19, TypeScript (strict mode)
- **Routing:** React Router — the standard client-side router for a React SPA
- **Server state:** hand-rolled — `useState` + `useEffect` + `fetch`, loading and
  error state handled explicitly per call. No TanStack Query: the fetching,
  caching, and refetch mechanics are part of what this project exists to learn.
- **Forms:** controlled components with React state — no React Hook Form.
- **Validation:** Zod, called directly (`schema.safeParse`) — the same library the
  backend uses. The one form/data framework deliberately kept.
- **Styling:** Tailwind CSS
- **Testing:** Vitest + React Testing Library
- **Linting:** ESLint + Prettier

One decision was deliberately deferred to the Auth stage, not made upfront:
where access/refresh tokens are stored client-side. The backend returns both
in the JSON response body, not `httpOnly` cookies, so the trade-off is real —
XSS exposure vs. losing the session on every page refresh.

**Decided (Stage 2): a hybrid store.** The access token lives in memory only
(a module variable / context, never persisted), so an injected script can't
read it back from storage and it dies with the tab. The refresh token goes in
`localStorage`, so the session survives a reload: on app mount the client
calls `POST /auth/refresh` with it to mint a fresh access token. Refresh
tokens rotate on every use, so a stale copy in `localStorage` is single-use
and self-limiting if it leaks. Full in-memory-only was rejected — logging out
on every reload is the wrong feel for a tracker left open in a tab.

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
| 3. Applications list  | Fetch and render (hand-rolled `useEffect`), loading/error/empty states           |
| 4. List refinements   | Filtering, sorting, pagination UI wired to `GET /applications`'s query params    |
| 5. Create/edit/detail | Forms (controlled + Zod) for create/update, a detail view, delete                |
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

- [x] Repo created
- [x] Project scaffolded (Vite, TypeScript, ESLint, Prettier, Tailwind)
- [x] Connected to `job-hunt-api`'s `/health` (Stage 1 check; the auth flow now exercises the API for real)
- [x] Auth flow (login, register, token storage, automatic refresh, logout)
- [x] Applications list (fetch, loading/error/empty states)
- [x] Filtering, sorting, pagination wired to the list (URL query string as the source of truth)
- [ ] Create / edit / detail views
- [ ] Component and integration tests

### Future / optional — not scheduled into a stage yet

- **Containerize the frontend**, as a learning exercise (`job-hunt-api` did
  this for the backend). Different shape than the backend's: a frontend
  build produces static files (`dist/`), so this means bundling a small web
  server (e.g. nginx) to serve them, not "run a persistent Node process" —
  a genuinely different exercise, not a repeat of the backend's Dockerfile.
  Also less commonly done in the real world than the backend case — static
  frontends usually deploy straight to something like Vercel/Netlify rather
  than a container. Circle back to this deliberately later, not folded into
  Stage 1.

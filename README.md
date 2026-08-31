# job-hunt-ui

[![CI](https://github.com/danilomsilva/job-hunt-ui/actions/workflows/ci.yml/badge.svg)](https://github.com/danilomsilva/job-hunt-ui/actions/workflows/ci.yml)
![TypeScript strict](https://img.shields.io/badge/TypeScript-strict-3178c6?logo=typescript&logoColor=white)
![Tests](https://img.shields.io/badge/tests-102%20passing-brightgreen)

A React + TypeScript client for [`job-hunt-api`](https://github.com/danilomsilva/job-hunt-api) —
Phase 2 of the same learning roadmap. Auth with automatic token refresh, an
applications list wired to filtering / sorting / pagination, and create / edit /
detail / delete views for a job application.

Built as a from-scratch frontend exercise: no data-fetching library, no form
library — `useState` + `useEffect` + `fetch` and controlled inputs, held to the
same standards (typed, tested, documented, every loading/error state handled) as
the backend it talks to.

> Planning and rationale live in [`docs/ROADMAP.md`](docs/ROADMAP.md): the tech
> stack decisions, the phased plan, and the page/flow breakdown.

## Tech stack

| Layer         | Choice                                                   | Why                                                                                                       |
| ------------- | -------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| Build tool    | Vite 8                                                   | Fast dev server, native TypeScript, no bundler config                                                     |
| Framework     | React 19, TypeScript strict                              | `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, no `any` — matches the backend                  |
| Routing       | React Router 7                                           | The standard client-side router for a React SPA                                                           |
| Server state  | Hand-rolled `useState` / `useEffect` / `fetch`           | No TanStack Query — the fetching, refetch, and 401→refresh mechanics are the exercise                     |
| Forms         | Controlled components                                    | No React Hook Form                                                                                        |
| Validation    | [Zod](https://zod.dev) 4                                 | Same library the backend validates with; `schema.safeParse` on submit — the one form/data dependency kept |
| Styling       | Tailwind CSS 4                                           | Utility-first, no separate stylesheet                                                                     |
| Testing       | Vitest + React Testing Library + [MSW](https://mswjs.io) | Component and integration tests against a mock of `job-hunt-api`, not a live backend                      |
| Accessibility | `axe-core`                                               | Automated per-page a11y assertions in the test suite                                                      |
| Linting       | ESLint (type-aware, strict) + Prettier                   | Same ruleset shape as `job-hunt-api`                                                                      |

## Features

- **Auth** — login, register, logout. The access token is a short-lived JWT kept
  **in memory only**; the refresh token lives in `localStorage`, so the session
  survives a reload (the app trades it for a fresh access token on startup). Any
  `401` transparently triggers a single `/auth/refresh` and retries the request;
  a failed refresh ends the session and bounces to `/login`.
- **Applications list** — fetched with explicit loading / error / empty states.
  A first-run empty state links straight to the create form.
- **Filter, sort, paginate** — by status and company, four sortable columns in
  either direction, page navigation. All of it lives in the **URL query string**
  (`?status=interview&sortBy=company&page=2`), so refresh, back/forward, and
  link-sharing all preserve the view.
- **Create / edit / detail / delete** — one shared form component (controlled +
  Zod, mirroring the backend's `createApplicationSchema` including the
  `salaryMin ≤ salaryMax` rule). Delete uses an inline confirm, not a browser
  dialog.
- **Accessibility** — a skip link, focus moves to `<main>` on every route
  change, per-page `<title>`, form errors wired to their inputs via
  `aria-describedby`, `lang="en-IE"`.
- **102 tests** (Vitest + RTL + MSW), including an end-to-end flow test
  (log in → create → edit → delete through the real `<App>`) and `axe` checks on
  every page. **No backend or Docker needed to run them.**

## Architecture decisions

Judgment calls, with the full reasoning in [`docs/ROADMAP.md`](docs/ROADMAP.md):

- **No data-fetching / form library** — server state is hand-rolled hooks, forms
  are controlled components. Zod is the only form/data dependency. The point was
  to learn the mechanics, not an abstraction over them.
- **Hybrid token storage** — access token in memory (an injected script can't
  read it back out of storage, and it dies with the tab); refresh token in
  `localStorage` and rotated on every use, so a stale copy is single-use if it
  leaks. Full in-memory-only was rejected — logging out on every reload is the
  wrong feel for a tracker left open in a tab.
- **MSW mock of `job-hunt-api` for tests** — deterministic, needs no Postgres or
  Docker in CI. The mock and the app share one Zod credentials schema so they
  can't drift. Dev talks to the real backend.
- **Ireland / EUR defaults** — currency, salary and date formatting default to
  `en-IE` / Euro.

## Getting started

**Prerequisites:** Node.js 24+ (`.nvmrc` pins it), npm 10+, and a running
[`job-hunt-api`](https://github.com/danilomsilva/job-hunt-api).

```bash
npm install
cp .env.example .env      # set VITE_API_URL — see below
npm run dev               # http://localhost:5173
```

`VITE_API_URL` points at wherever `job-hunt-api` is listening:

| Backend running as         | `VITE_API_URL`          |
| -------------------------- | ----------------------- |
| `npm run dev` (hot reload) | `http://localhost:3000` |
| its Docker `app` service   | `http://localhost:3001` |

The backend's CORS is configured to allow `http://localhost:5173` specifically,
so the Vite dev server works against it out of the box.

### Seeding demo data

To exercise filtering / sorting / pagination against the real backend:

```bash
npm run seed      # creates demo@example.com / demopassword with 30 applications
```

Re-running clears and reseeds. Override with `SEED_EMAIL`, `SEED_PASSWORD`,
`SEED_COUNT`, or `SEED_API_URL`.

## Testing

```bash
npm test          # run once
npm run test:watch
```

Every test runs against the MSW handlers in [`src/mocks/`](src/mocks), which
mirror `job-hunt-api`'s `/auth` and `/applications` routes — the same error
shape, refresh-token rotation, the ownership `404`, the salary refinement. There
is no live backend or database involved.

## Project structure

```
src/
├── main.tsx, App.tsx              Providers, <Routes>, route-change focus
├── lib/
│   ├── api.ts                     fetch wrapper: bearer token, typed errors, 401→refresh→retry
│   ├── tokens.ts                  in-memory access token + localStorage refresh token
│   ├── types.ts                   response shapes from job-hunt-api
│   └── useDocumentTitle.ts
├── auth/
│   ├── AuthProvider.tsx, useAuth.ts, authApi.ts
│   ├── CredentialsForm.tsx        shared login/register form
│   └── schemas.ts                 Zod credentials schema (shared with the mock)
├── applications/
│   ├── applicationsApi.ts         list / get / create / update / delete
│   ├── useApplications.ts, useApplication.ts
│   ├── useListParams.ts           filter/sort/page state ⇄ URL query string
│   ├── ApplicationForm.tsx, schemas.ts
│   ├── ListControls.tsx, Pagination.tsx, StatusBadge.tsx
│   └── formatStatus.ts, formatApplication.ts
├── pages/                         Login, Register, Applications, ApplicationForm, ApplicationDetail
├── components/                    Header, PageLayout
├── routes/                        ProtectedRoute, useRouteFocus
└── mocks/                         MSW handlers + in-memory db (tests only)
```

## Scripts

| Script                 | What it does                                 |
| ---------------------- | -------------------------------------------- |
| `npm run dev`          | Vite dev server with HMR                     |
| `npm run build`        | Type-check, then production build to `dist/` |
| `npm run preview`      | Serve the production build locally           |
| `npm run typecheck`    | `tsc -b`, no emit                            |
| `npm test`             | Run the test suite once (Vitest)             |
| `npm run test:watch`   | Vitest in watch mode                         |
| `npm run lint`         | ESLint (type-aware, strict)                  |
| `npm run lint:fix`     | ESLint with autofix                          |
| `npm run format`       | Format with Prettier                         |
| `npm run format:check` | Verify formatting                            |

## Conventions

- **TypeScript strict**, plus `noUncheckedIndexedAccess` and
  `exactOptionalPropertyTypes`. No `any`.
- Loading and error states are handled explicitly for every request — no silent
  failures.
- Component / integration tests are written alongside each feature.
- **Conventional Commits** (`feat:`, `fix:`, `docs:`, `refactor:`, `chore:`,
  `test:`), same convention as `job-hunt-api`.

---

The API contract is not duplicated here — `job-hunt-api`'s
[`docs/API.md`](https://github.com/danilomsilva/job-hunt-api/blob/main/docs/API.md)
and its live `/ui` (Swagger) are the source of truth. Learning-project
background and the phased plan: [`docs/ROADMAP.md`](docs/ROADMAP.md).

# job-hunt-ui

A React + TypeScript client for [`job-hunt-api`](https://github.com/danilomsilva/job-hunt-api) —
Phase 2 of the same learning roadmap. Auth flow, an applications list wired to
filtering/sorting/pagination, and create/edit/detail views for a job application.

> Planning lives in [`docs/ROADMAP.md`](docs/ROADMAP.md): tech stack decisions, the
> phased plan, and the page/flow breakdown.

## Tech stack

- **Build tool:** Vite — fast dev server, native TypeScript, no bundler config needed
- **Framework:** React 19, TypeScript (strict mode)
- **Routing:** React Router — the standard client-side router for a React SPA
- **Server state:** hand-rolled — `useState` + `useEffect` + `fetch`, with loading and
  error state handled explicitly per call. No TanStack Query; fetching mechanics are
  part of what this project is for.
- **Forms:** controlled components with React's own state — no React Hook Form.
- **Validation:** Zod — the same validation library the backend uses, called directly
  (`schema.safeParse`) on submit. This is the one framework kept for forms/data.
- **Styling:** Tailwind CSS
- **Testing:** Vitest + React Testing Library
- **Linting:** ESLint + Prettier

## Code standards

- TypeScript strict mode — no `any`, no shortcuts
- No prop drilling past 2 levels — lift to context or a custom hook instead
- Every form validates with the same Zod schema shape the backend expects
- Loading and error states are handled explicitly for every request — no silent failures
- Write component/integration tests alongside each feature, not after
- Commit often with clear, descriptive commit messages — Conventional Commits
  (`feat:`, `fix:`, `docs:`, `refactor:`, `chore:`, `test:`), same convention as
  `job-hunt-api`

## What to avoid

- Don't use `any` in TypeScript — ever
- Don't duplicate the API contract here — `job-hunt-api`'s `docs/API.md` and its live
  `/ui` (Swagger) are the source of truth; link to them, don't re-describe them
- Don't skip tests — write them alongside each feature
- Don't over-engineer — keep it simple and correct, not clever
- Don't add a data-fetching or form library — server state is hand-rolled
  `useEffect`/`fetch`, forms are controlled components. Zod is the only
  validation dependency.

## Current status

- [x] Repo created
- [x] Project scaffolded (Vite, TypeScript, ESLint, Prettier, Tailwind)
- [x] Connects to `job-hunt-api`'s `/health` (routing itself arrives with the Auth flow)
- [ ] Auth flow (login, register, token storage, automatic refresh, logout)
- [ ] Applications list (fetch, loading/error states)
- [ ] Filtering, sorting, pagination wired to the list
- [ ] Create / edit / detail views
- [ ] Component and integration tests

# Implementation Plan

Working rules: one focused branch per part, merge to `main` with `--no-ff`, update `REVIEW.md` resolution log on every merge, push branch + `main` to GitHub after each merge.

## Branch status

- [x] **Branch 1 — `docs/code-review`**: `REVIEW.md` with priority findings table. Merged as `5e6c3bd`.
- [x] **Branch 2 — `refactor/naming-conventions`**: rename misleading identifiers, delete dead `taskValidator.js`. Merged as `925e77d`.
- [ ] **Branch 3 — `refactor/activity-feed`** (in progress): fix `frontend/app/activity/page.tsx` — remove `tick`/`setInterval`/`forcedList` re-render loop (1.1), collapse triple state to `loading`/`error` + backend fetch (1.2), dedupe `formatTimeA/B` and `applyFilterA/B`, single timestamp per item (7), add loading/error/empty states (8). Code written; needs verification, REVIEW.md entry, commit, merge, push.
- [ ] **Branch 4 — `fix/tasks-error-handling`**: `TaskDashboard.tsx` retry + no unmount fetch (:47), `useTasks.ts` stale-response race (:75), proxy routes pass through backend status instead of flattening to 500.
- [ ] **Branch 5 — `feat/validation`**: Zod schemas backend + frontend (e.g. `src/middleware/validate.js`), replace inline checks, remove dead validator usage; mirror client-side validation.
- [ ] **Branch 6 — `feat/cache-middleware`**: separate in-memory cache middleware, no TTL, `clear()` only on POST/PATCH/DELETE; wire into tasks/activity routes.
- [ ] **Branch 7 — `feat/query-params`**: backend `GET /tasks?search=&status=&sort=&order=&page=&limit=` and `GET /activity?search=&sort=&order=&page=&limit=` with `meta: {page,limit,total,totalPages}`; frontend UI controls; document contract change in `frontend/docs/backend-endpoints.md`.
- [ ] **Branch 8 — `feat/reports-page`**: `frontend/app/reports/page.tsx` consuming `GET /reports/tasks-summary` (raw `{total, byStatus:{todo,"in-progress",done}, recentActivityCount}`), loading/error/empty states, counts + status breakdown.
- [ ] **Branch 9 — `ui/polish`**: design-token pass in `globals.css`, consistent spacing/typography/empty states across tasks, activity, reports pages.

## Verification per branch
- grep/glob for leftover old identifiers or dead references
- `cd frontend && npx tsc --noEmit` (if deps installed), `npm run build` when feasible
- update `REVIEW.md` resolution log, commit, merge `--no-ff`, push

## Done summary
- Branch 1 ✅ merged + pushed (`41528f0` → `5e6c3bd`)
- Branch 2 ✅ merged + pushed (`7d42eca` → `925e77d`)
- Branch 3 🔄 rewritten, uncommitted
- Branches 4–9 ⬜ not started

## Final hardening review

The original branch plan is historical and predates the current merged feature
set. Final review work is being completed on `fix/final-review-hardening` from
the repository's current `main` base while preserving the uncommitted task
activity logging changes. The branch adds persistence, cache, CORS, retry, and
documentation hardening; verification and merge status will be recorded only
after they actually occur.

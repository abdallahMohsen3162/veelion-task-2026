# Code Review — VeeLion Task Management System

Review of the original codebase prior to refactoring. Findings are grouped by
category; each item states **what is wrong**, **why it matters**, and a
**suggested improvement**. Line references point at the starting state of the
repository (commit `f99d24f`).

---

## 1. Performance

### 1.1 Permanent re-render loop on the Activity page
- **What:** `frontend/app/activity/page.tsx:63-69` starts a `setInterval(…, 1400)`
  that increments a `tick` counter forever while the page is open. The counter
  feeds effects at lines 71-83 that rebuild and re-clone the entire list on
  every tick.
- **Why it matters:** The whole page re-renders every 1.4 seconds for no
  user-visible reason — pure CPU and battery drain, and it defeats any future
  memoization because every list item gets a new object identity each cycle.
- **Improvement:** Delete the interval and the `tick` state entirely. Data is
  fetched once on mount; there is no live stream to poll for.

### 1.2 Derived state copied across three state slices
- **What:** `activity/page.tsx:8-12` keeps `allActivity`, `shownActivity`, and
  `forcedList`. Effects at lines 71-83 recompute the filtered list and then
  copy it again (`[...shownActivity]` or `.map(item => ({...item}))`).
- **Why it matters:** Filtering is derived data, not state. Storing it causes
  extra render passes per keystroke (set A → effect → set B → render) and the
  cloning allocates new arrays/objects every tick.
- **Improvement:** Keep a single source of truth (`activityLogs`) and compute
  the visible list with `useMemo` at render time.

### 1.3 Every request re-reads JSON files from disk
- **What:** `backend/src/modules/tasks/services/tasks.service.js:22,26,49,67,88`
  and `backend/src/modules/activity/services/activity.service.js:11,24` call
  `fs.readFileSync` on each request. There is no response cache or
  memoization; `reports.service.js:8-11` re-reads both files for every summary
  call.
- **Why it matters:** Disk I/O on the hot path does not scale and is
  unnecessary for a dataset that only changes when the API itself writes.
- **Improvement:** Add a small in-memory cache middleware for GET responses
  and invalidate it on POST/PATCH/DELETE.

### 1.4 Inline style objects recreated on every render
- **What:** Components pass fresh `style={{…}}` literals on each render —
  `TaskDashboard.tsx:26,33,39`, `TaskItem.tsx:13-24`, `TaskList.tsx:13,21`,
  `activity/page.tsx:101-126`, `app/page.tsx:13-19`.
- **Why it matters:** New object identities each render prevent cheap
  reconciliation and scatter magic values (`#e3b4c0`, `#fff8fa`) that bypass
  the CSS custom properties defined in `globals.css`.
- **Improvement:** Move styling into classes/tokens in `globals.css`.

---

## 2. Maintainability

### 2.1 Byte-identical duplicated functions
- **What:** `backend/src/modules/activity/services/activity.service.js:6-30`
  defines `loadDataA` and `loadDataB` with identical bodies; both are called
  (lines 33, 38). On the frontend, `formatTimeA`/`formatTimeB`
  (`activity/page.tsx:14-20`) and `applyFilterA`/`applyFilterB`
  (`activity/page.tsx:22-46`) are likewise duplicates — and *both* filters run
  chained at lines 72-73 for the same query.
- **Why it matters:** Double the code to maintain; the next edit to one copy
  silently diverges from the other. The duplication is already user-visible:
  lines 124-126 render the same timestamp twice per row.
- **Improvement:** Keep one `readActivityStore()`, one `formatTimestamp()`,
  one `filterActivityLogs()`.

### 2.2 Validation implemented three times with conflicting rules
- **What:** `backend/src/modules/tasks/utils/taskValidator.js` exports
  `validateCreateTask`/`validateUpdateTask` but is **dead code** — nothing
  imports it. Live validation is duplicated inline in
  `tasks.controller.js:14-68` *and* `tasks.service.js:37-65`, and the two
  disagree (the service rejects `title.length < 2` on PATCH; the controller
  does not; trimming happens in the controller but not the service on update).
- **Why it matters:** Callers cannot predict which rule wins; fixing a bug in
  one layer leaves the other wrong; dead files mislead readers about where
  truth lives.
- **Improvement:** Single source of truth — Zod schemas consumed by a
  `validate` middleware on the routes; delete the dead validator and the
  duplicated service checks.

### 2.3 Three inconsistent data-fetching styles in one small app
- **What:** (1) `hooks/useTasks.ts` + `requestJson`; (2) server wrapper
  `lib/backendApi.ts`; (3) raw inline `fetch().then()` in
  `activity/page.tsx:48-61`. Error-body parsing is re-implemented in at least
  five places (`useTasks.ts:6-12,27-29`, `backendApi.ts:8-17`,
  `app/api/tasks/route.ts:10`, `app/api/tasks/[id]/route.ts:25`,
  `app/api/activity/route.ts:10`).
- **Why it matters:** Bugs fixed in one path remain in the others (the Activity
  page's missing `ok` check is exactly this); onboarding cost doubles.
- **Improvement:** One shared client fetch helper + one hook pattern
  (`useTasks` / `useActivity`), one server fetch helper.

### 2.4 API proxy routes destroy upstream status codes
- **What:** `frontend/app/api/tasks/route.ts:8-12`,
  `app/api/tasks/[id]/route.ts:23-27`, and `app/api/activity/route.ts:7-12`
  catch every error and answer `500`, even when the body was invalid JSON
  (should be 400 — lines 14-19 of the `[id]` route already intend a 400) or
  when the backend returned 404/400. Raw `error.message` is forwarded to the
  client.
- **Why it matters:** Clients cannot distinguish "task not found" from
  "server broke"; the deliberate 400 validation is unreachable for malformed
  JSON; internal messages can leak.
- **Improvement:** Propagate upstream status codes (typed `BackendError`),
  return 400 for parse failures, sanitize messages.

### 2.5 Back-navigation markup copy-pasted across pages
- **What:** The same `<nav><Link href="/">Back</Link></nav>` block appears in
  `app/tasks/page.tsx:7-11` and `app/activity/page.tsx:95-99`.
- **Why it matters:** UI drifts between pages; `layout.tsx` is the natural
  place for shared chrome.
- **Improvement:** Shared layout header or a `BackNav` component.

### 2.6 No lint or test tooling
- **What:** `frontend/package.json:5-9` exposes only `dev`/`build`/`start`.
  There is no ESLint config, so `react-hooks/exhaustive-deps` violations (e.g.
  `activity/page.tsx:75` includes a bogus `tick` and omits filter functions)
  go uncaught.
- **Why it matters:** The class of bugs in this review is exactly what
  `eslint-plugin-react-hooks` flags automatically.
- **Improvement:** Add `next lint` with the React hooks rules; fix findings.

### 2.7 Unsafe `as` casts instead of validation
- **What:** `lib/backendApi.ts:12,29,51,68`, `hooks/useTasks.ts:25,32`, and
  `app/api/tasks/[id]/route.ts:12` assert response/request shapes with `as`.
- **Why it matters:** A contract change on the backend becomes a runtime crash
  far from the request (the Activity page's `.filter is not a function` crash
  is the realized version of this risk).
- **Improvement:** Parse with Zod (`safeParse`) at the boundary; derive
  TypeScript types from the schemas.

---

## 3. UX Issues

### 3.1 One failed update unmounts the entire task list
- **What:** `TaskDashboard.tsx:47` renders `<TaskList>` only when
  `!loading && !error`. Any PATCH failure sets `error`
  (`useTasks.ts:72-73`), so the list disappears even though the data is fine.
- **Why it matters:** Users lose all context on a transient failure; the error
  is about one mutation, not the collection.
- **Improvement:** Show errors as a banner/toast *alongside* the list; reserve
  full-page error state for failed initial loads only.

### 3.2 Activity page has no loading, error, or empty states
- **What:** `activity/page.tsx:48-61` fetches with `.catch(() => …)` that
  silently empties the list. There is no spinner, no error message, no retry,
  and no "no results" state (blank card when the array is empty).
- **Why it matters:** "Failed", "still loading", and "actually empty" look
  identical — users cannot tell whether the system is broken.
- **Improvement:** Explicit loading skeleton, error card with Retry, and a
  distinct empty/search-empty state (the Tasks module already models this).

### 3.3 Activity search crashes on API errors
- **What:** The fetch at `activity/page.tsx:49-55` never checks
  `response.ok`. On a 500 the body is `{ error: { message } }`, which is
  truthy, so `setAllActivity` stores an object; the filter effect then calls
  `items.filter(...)` → `TypeError` → uncaught crash.
- **Why it matters:** Any backend hiccup takes the page down instead of
  showing an error.
- **Improvement:** Check `response.ok`, keep data in typed state, guard with
  loading/error UI (covered by the shared fetch helper in §2.3).

### 3.4 Timestamps displayed twice per activity row
- **What:** `activity/page.tsx:124-126` renders `formatTimeA(item.when)` and
  `formatTimeB(item.when)` with a `<br />` — the same value printed twice.
- **Why it matters:** Obvious visual bug that reads as unfinished work.
- **Improvement:** One formatter, one timestamp (§2.1).

### 3.5 Missing disabled and focus affordances
- **What:** `globals.css` defines no `.button:disabled` rule even though
  `TaskItem.tsx:33` sets `disabled={busy}`; there are no `:focus-visible`
  styles anywhere, and `.card` / home-page links have no hover state
  (`app/page.tsx:14-22`).
- **Why it matters:** Keyboard users get no visible focus ring (an a11y
  failure); "Saving…" is the only signal that a button is disabled.
- **Improvement:** Add `:focus-visible`, `:disabled`, `:hover`, `:active`
  states to the global stylesheet.

### 3.6 Empty-state copy is wrong when the user has zero tasks
- **What:** `TaskList.tsx:11-16` always says "No tasks match this filter."
- **Why it matters:** A brand-new user with no tasks at all is told their
  *filter* is the problem.
- **Improvement:** Distinguish "no tasks yet" from "no matches".

### 3.7 Search input has no accessible label
- **What:** `activity/page.tsx:104-109` — placeholder-only input, no
  `<label>`/`aria-label`, not `type="search"`.
- **Why it matters:** Screen readers announce an unnamed textbox.
- **Improvement:** Add a label or `aria-label`; use `type="search"`.

---

## 4. Code Quality

### 4.1 Single-letter and misleading identifiers (backend)
- **What:** `activity.controller.js:1,3,4,10` uses `aSvc`, `get_activity`
  (snake_case in a camelCase codebase), `const x`, `made`;
  `activity.routes.js:3` uses `const c`;
  `activity.service.js:4,33,37,39` uses `fp`, `arr`, `b`, `one`;
  `reports.routes.js:2` exports `router` while siblings use `tasksRouter` /
  `activityRouter`; `tasks.controller.js:75` names the DELETE handler
  `removeTask` while the service calls it `deleteTask`.
- **Why it matters:** Readers must open the definition to learn what `x` or
  `made` is; verb mismatches across layers (`add` vs `create`,
  `remove` vs `delete`) suggest APIs that do not exist.
- **Improvement:** Rename to intent-revealing names and align verbs across
  routes → controller → service (`getActivity`, `activityService`,
  `deleteTask`, `reportsRouter`, …).

### 4.2 Misleading state names (frontend)
- **What:** `activity/page.tsx:11-12` — `tick` (a forced re-render counter,
  not a timer callback) and `forcedList` (a cloned copy with no special
  semantics); `stats.everySecondTick` (line 89) is never rendered; in
  `useTasks.ts:47,64` the variable named `body` holds a parsed *response*.
- **Why it matters:** Names that lie slow down every future reader and hide
  that `forcedList` exists only to paper over the render loop (§1.1).
- **Improvement:** Remove the dead states; rename `body` → `response`.

### 4.3 Missing `encodeURIComponent` on dynamic path segments
- **What:** `backendApi.ts:38` builds `/tasks/${taskId}` and
  `useTasks.ts:64` builds `/api/tasks/${taskId}` without encoding; the Next
  proxy also forwards `params.id` raw.
- **Why it matters:** An id containing `/` or `..` alters the outbound path
  (path injection against the backend).
- **Improvement:** `encodeURIComponent(taskId)` at every interpolation.

### 4.4 Response envelope inconsistency leaks across layers
- **What:** Tasks endpoints wrap as `{ data: … }`; activity and reports
  return bare arrays/objects (`docs/backend-endpoints.md:131,154`). The
  frontend proxies mirror the inconsistency (`app/api/tasks/route.ts:7` vs
  `app/api/activity/route.ts:7`), so every consumer must know which shape it
  is calling.
- **Why it matters:** Easy to write `res.json()` expecting the wrong shape;
  the Activity crash in §3.3 is downstream of this fragility.
- **Improvement:** Normalize at the proxy layer (or document and enforce one
  contract), and type both shapes explicitly.

### 4.5 `NEXT_PUBLIC_BACKEND_API_URL` used only server-side
- **What:** `lib/constants.ts:1-2` reads `NEXT_PUBLIC_BACKEND_API_URL`, but
  the only consumer is `lib/backendApi.ts`, imported solely from route handlers.
- **Why it matters:** The `NEXT_PUBLIC_` prefix opts the value into the client
  bundle if anything client-side ever imports `constants.ts` — server config
  should not be public by default.
- **Improvement:** Rename to `BACKEND_API_URL` (no prefix) in `.env.example`.

### 4.6 Frontend and backend each re-document the API contract by hand
- **What:** `types/api.ts` duplicates `docs/backend-endpoints.md`; neither is
  generated from the backend. The docs already describe `POST/DELETE /tasks`
  and `/reports/*` with no corresponding client types.
- **Why it matters:** Two hand-maintained copies drift; Zod schemas (planned)
  should be the single source, with types inferred.
- **Improvement:** Infer TS types from shared schemas; keep docs as prose.

---

## 5. React Best Practices

### 5.1 Race conditions: no cancellation and a broken busy-flag
- **What:** `useTasks.ts:42-77` has no `AbortController` and no unmount
  cleanup (`useEffect` at 79-81). Worse, `updatingTaskId` holds a single id
  and `finally { setUpdatingTaskId("") }` (line 75) clears it
  unconditionally: toggle A → toggle B (id overwritten) → A's response arrives
  → B is re-enabled while its PATCH is still in flight → double-submit.
- **Why it matters:** Overlapping requests can show stale UI; users can fire
  the same mutation twice; Retry spam can let an older fetch overwrite newer
  state.
- **Improvement:** Track in-flight ids as a `Set` (or clear conditionally:
  `cur === id ? "" : cur`); abort superseded fetches; clean up on unmount.

### 5.2 Derived data computed in `useEffect` instead of `useMemo`
- **What:** `activity/page.tsx:71-75` filters inside an effect and writes the
  result to state; deps include the bogus `tick` and omit `applyFilterA/B`
  (would fail `exhaustive-deps`). Conversely, lines 85-91 wrap a trivial
  object literal in `useMemo` while the real hot path (the list) is
  re-cloned every tick.
- **Why it matters:** Extra render passes per keystroke; the effect pattern is
  the canonical React anti-pattern for derived state.
- **Improvement:** `const visibleLogs = useMemo(() => filter(…), [logs, query])`.

### 5.3 Inline handlers block memoization
- **What:** `TaskItem.tsx:32` `onClick={() => onToggle(task)}`;
  `StatusFilter.tsx:26` `onClick={() => onChange(filter.value)}`;
  `TaskDashboard.tsx:20-22` recreates `handleToggle` each render (unlike
  `fetchTasks`, which is correctly `useCallback`-wrapped in the hook).
- **Why it matters:** Any future `React.memo(TaskItem)` is defeated by the
  new function identity every render.
- **Improvement:** Pass primitive props (`taskId`) with a stable
  `useCallback` handler at the parent.

### 5.4 Loading state hides existing data on refetch
- **What:** Retry calls `fetchTasks` which sets `loading = true`
  (`useTasks.ts:44`); `TaskDashboard.tsx:47` then unmounts the list until the
  request finishes.
- **Why it matters:** Refreshing should not blank the UI — flashes of empty
  content feel broken.
- **Improvement:** Distinguish initial load from background refetch (keep
  previous data, show a subtle busy indicator).

### 5.5 Missing `role`/`aria-live` on status regions
- **What:** Loading text (`TaskDashboard.tsx:34`) and error text (line 40)
  are plain elements with no `role="status"` / `aria-live`.
- **Why it matters:** Screen-reader users are not told when data finishes
  loading or fails.
- **Improvement:** Wrap status messages in `role="status"` (polite) or
  `role="alert"` for errors.

### 5.6 Good practices observed (keep these)
- `key={task.id}` / `key={item.id}` on lists (`TaskList.tsx:23`,
  `activity/page.tsx:121`).
- `useCallback`/`useMemo` discipline inside `useTasks` (lines 42, 59, 83-93).
- `aria-pressed` on filter buttons and meaningful `aria-label` on the toggle
  (`TaskItem.tsx:34`), `type="button"` everywhere.
- `strict: true` TypeScript across the frontend; consistent `@/*` path alias.
- Module-per-feature layout on the backend (routes → controller → service)
  with `asyncHandler` and a central `errorHandler`.

---

## 6. Summary — priority order for fixes

| # | Issue | Category | Severity |
|---|---|---|---|
| 1 | Activity page crashes on API error (no `ok` check) | UX / React | Critical |
| 2 | 1.4s render loop + triple state copy | Performance | High |
| 3 | Update error unmounts entire task list | UX | High |
| 4 | `updatingTaskId` race → double submit | React | High |
| 5 | Proxy routes map all failures to 500 | Code quality | High |
| 6 | Validation triplicated with conflicting rules (+ dead `taskValidator.js`) | Maintainability | High |
| 7 | Duplicated A/B functions; timestamp shown twice | Maintainability / UX | Medium |
| 8 | No loading/error/empty states on Activity | UX | Medium |
| 9 | Derived state in effects; bad hook deps | React | Medium |
| 10 | Misleading names (`get_activity`, `aSvc`, `x`, `forcedList`, `tick`) | Code quality | Medium |
| 11 | No response caching; disk read per request | Performance | Medium |
| 12 | Inline styles fighting design tokens; no focus/disabled styles | UX | Medium |
| 13 | Error parsing duplicated ×5; three fetch styles | Maintainability | Medium |
| 14 | Missing `encodeURIComponent` | Code quality | Medium |
| 15 | `NEXT_PUBLIC_` on server-only config | Code quality | Low |
| 16 | No ESLint/tests | Maintainability | Low |

Findings addressed during the refactor are marked in the "Resolution log"
appended at the end of this file as branches merge to `main`.

---

## Resolution log

Entries are appended here as fix branches merge into `main`.

### Branch: refactor/naming-conventions

| # | Finding | Resolution |
|---|---|---|
| 10 | Misleading names (`get_activity`, `aSvc`, `loadDataA/B`, `removeTask`, `router`, `t`, `body`, dead `taskValidator.js`) | Renamed activity service API to `readActivityStore`/`listActivityLogs`/`createActivity`; controller exports `getActivity`/`createActivity`; `removeTask` ? `deleteTask`; reports `router` ? `reportsRouter`, `t` ? `task`; frontend `body` ? `response` in `useTasks.ts`; deleted dead `backend/src/modules/tasks/utils/taskValidator.js`. Remaining activity-page names (`tick`, `forcedList`, `formatTimeA/B`, `applyFilterA/B`) deferred to the activity-feed branch. |

### Branch: refactor/activity-feed

| # | Finding | Resolution |
|---|---|---|
| 1 | Activity page crashes on API error (no `ok` check); re-render loop (`tick`/`setInterval`/`forcedList`); triple overlapping states (all/filtered/forced) | Rewrote `frontend/app/activity/page.tsx`: fetch once from `/api/activity` with `response.ok` check and `AbortController` cleanup; single `loading`/`error`/`allActivity` source of truth derived via `useMemo`; removed `tick`, `setInterval`, and `forcedList`. |
| 7 | Duplicated `formatTimeA/B` + `applyFilterA/B`; timestamp shown twice per item | Deduplicated to single `formatTimestamp` and `filterActivityLogs` (memoized via `useMemo`); one timestamp rendered per item. |
| 8 | No loading/error/empty states on Activity | Added loading (`role="status"`), error (`role="alert"` + Retry), and search-aware empty states. |
| 3.7 / 5.5 | Search input had no accessible label; status regions had no live roles | Added `<label for="activity-search">` + `type="search"` + `aria-label` path; loading uses `role="status"`, errors use `role="alert"`. |
| 10 | Remaining activity-page names (`tick`, `forcedList`, `formatTimeA/B`, `applyFilterA/B`) | Removed/renamed as part of the rewrite (`filterActivityLogs`, `formatTimestamp`, `shownActivity`). |

### Branch: fix/tasks-error-handling

| # | Finding | Resolution |
|---|---|---|
| 3 | Update error unmounts entire task list (`TaskDashboard.tsx:47`) | Dashboard keeps the list mounted when tasks exist; error renders as a banner alongside the list with Retry. Full-page error is reserved for initial-load failure (`tasks.length === 0`). Added `refreshing` indicator for background refetches. |
| 5.1 | `updatingTaskId` single-id race + no cancellation (`useTasks.ts`) | Replaced string flag with `updatingTaskIds: Set<string>` (per-id add/delete, `memo` `TaskItem`); added `AbortController` + sequence guard + mounted guard to ignore stale/superseded fetches and unmount updates. |
| 5.4 | Retry blanks the UI (`loading` hides data) | Split `loading` (initial) from `refreshing` (background); list stays visible on retry when data exists. |
| 5 | Proxy routes flatten all failures to 500 | `lib/backendApi.ts` now throws typed `BackendError(status)` preserving upstream codes (502 for network); `app/api/tasks`, `app/api/tasks/[id]`, `app/api/activity` forward `error.status`, return 400 for malformed JSON, and only use generic 500 for unknown failures. |
| 14 | Missing `encodeURIComponent` on dynamic segments | Added in `updateTaskInBackend()` and `useTasks.updateTaskStatus()` (`/api/tasks/${encodeURIComponent(taskId)}`). |
| 5.3 | Inline handlers defeat memoization | `TaskDashboard.handleToggle` is `useCallback` on `(taskId, nextCompleted)` primitives; `TaskItem` is `memo` with internal `useCallback` click; `StatusFilter` uses memoized `FilterButton` children. |
| 3.6 / 5.5 | Wrong empty copy; missing live roles on tasks | `TaskList` distinguishes "No tasks yet…" vs "No tasks match this filter."; loading uses `role="status"`, errors use `role="alert"`. |

### Branch: feat/validation

| # | Finding | Resolution |
|---|---|---|
| 6 | Validation triplicated with conflicting rules (+ dead `taskValidator.js`) | Single source via Zod: `backend/src/middleware/validate.js` + `tasks.validation.js` (`createTaskBodySchema`/`updateTaskBodySchema` with `.trim()`, `.strict()`, `refine` for empty patch) + `activity.validation.js`; controllers are thin (`req.body` is already parsed/trimmed), service-layer duplicate checks removed. Unknown keys now 400 via `.strict()` instead of hand-rolled `ensureNoUnknownFields`; trimming via Zod instead of `normalizeTitleIfPresent`. |
| 2.7 | Unsafe `as` casts instead of validation | Frontend `lib/schemas.ts` (Zod) validates at boundaries: `backendApi.ts` uses `safeParse` for tasks/activity responses (throws `BackendError(502)` on shape drift); proxy routes validate upstream payloads and client `PATCH` bodies (`updateTaskPayloadSchema`); `useTasks` validates outgoing updates and incoming lists before setting state. |

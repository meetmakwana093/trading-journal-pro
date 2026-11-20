# ✅ Task Tracker

> **Project:** Trading Journal Pro · **Last updated:** 2026-11-20 · **Status:** 🟢 Stable

---

## Progress Summary

| Phase | Done | Total | Progress |
| --- | --- | --- | --- |
| Phase 1 — Core Auth & Trades | 8 | 8 | ████████████████████ 100% |
| Phase 2 — Analytics & Review | 7 | 7 | ████████████████████ 100% |
| Phase 3 — Advanced Features | 8 | 8 | ████████████████████ 100% |
| Phase 4 — Polish & Ops | 4 | 6 | ██████████████░░░░ 67% |

---

## Phase 1 — Core Auth & Trades (Completed)

- [x] User registration & login (JWT + bcrypt)
- [x] Protected routes via `verifyToken` middleware
- [x] Trades table with 20+ columns (`user_id` isolation)
- [x] CRUD: add, edit, delete, bulk import
- [x] Trade mapping: snake_case DB → camelCase React
- [x] CSV parser (Groww/Zerodha auto-detect)
- [x] Pre-market prep table with upsert
- [x] User settings table with defaults

---

## Phase 2 — Analytics & Review (Completed)

- [x] Dashboard: metrics, equity curve, calendar heatmap, radar, psychology bleed
- [x] Analytics: performance, risk, daily, weekly tabs
- [x] Journal Review: daily + monthly with best/worst callouts
- [x] Playbook manager: models with rules, per-model stats, trade drill-down
- [x] Chart Gallery: image upload, masonry, lightbox, mistakes/lessons
- [x] Missed Trades: vault with reason breakdown, cumulative cost, pie chart
- [x] Day-of-week P&L bar charts

---

## Phase 3 — Advanced Features (Completed)

- [x] Milestones: 25 badges with timeline & detail modal
- [x] AI Coach: edge, psychology, risk audit prompts
- [x] Economic Calendar: TradingView embed + custom notes
- [x] Data Import: CSV staging table → bulk commit
- [x] Quick-Add FAB on dashboard
- [x] Sidebar navigation with live streak widget
- [x] Interactive calendar day drill-down modal
- [x] Account/currency/session/risk settings UI

---

## Phase 4 — Polish & Ops (In Progress)

| Task | Owner | Status | Notes |
| --- | --- | --- | --- |
| Add unit/integration tests | — | 📅 Planned | No test framework configured |
| CI pipeline (GitHub Actions) | — | 📅 Planned | Lint + build + test |
| Production build verification | — | 🚧 In progress | Run `npm run build` |
| Environment variable docs | — | ✅ Done | `.env.example` to be created |
| Error boundary / Sentry | — | 📅 Planned | No error tracking yet |
| Accessibility audit | — | 📅 Planned | WCAG 2.1 AA target |

---

## Phase 5 — Future Enhancements (Planned)

- [ ] Broker API sync (Zerodha Kite Connect, etc.)
- [ ] Multi-user workspaces / shared journals
- [ ] Trade tagging taxonomy management UI
- [ ] PDF/Excel export of trade history
- [ ] Dark/light theme toggle
- [ ] PWA manifest + service worker

---

## Open Bugs and TODO/FIXME Items Found in Code

| # | File | Line | Issue | Severity |
| --- | --- | --- | --- | --- |
| 1 | `server.js` | 114-118 | Hard-coded DB credentials in source | High |
| 2 | `server.js` | 299 | SQL error exposed to client in bulk import | Medium |
| 3 | `src/pages/TradeDB.jsx` | 152 | Inline styles object (`styles`) re-created each render | Low |
| 4 | `src/pages/Analytics.jsx` | 141 | `COLORS` object re-created each render | Low |
| 5 | `src/App.jsx` | 23 | `VITE_API_URL` fallback hard-coded to localhost | Low |
| 6 | `server.js` | 115 | No connection retry/backoff on startup failure | Medium |
| 7 | `src/App.jsx` | 115 | `useEffect` fetches all tables sequentially (could parallelize) | Low |
| 8 | `src/pages/ReviewPage.jsx` | 235 | `localStorage` key uses selectedMonth (no user namespace) | Medium |
| 9 | `src/pages/EconomicCalendar.jsx` | 12 | Direct DOM manipulation via `containerRef.current.innerHTML` | Low |
| 10 | `src/auth/authService.js` | 18 | `localStorage` keys lack prefix (`tj_token`, `tj_user`) | Low |
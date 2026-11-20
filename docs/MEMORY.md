# 🧠 Project Memory

> **Project:** Trading Journal Pro · **Last updated:** 2026-11-20 · **Status:** 🟢 Stable

---

## Snapshot Date
2026-11-20

---

## Key Decisions Log

| Date | Decision | Why |
| --- | --- | --- |
| unknown | MySQL over PostgreSQL/SQLite | Team familiarity; hosted MySQL available |
| unknown | JWT (30d) in localStorage | Stateless auth; avoids server session store |
| 2026-08-15 | Added `chart_gallery` table | Visual journal with screenshots per trade |
| 2026-08-16 | Added `missed_trades` table | Capture FOMO/hesitation opportunities |
| 2026-08-18 | Replaced milestone logic with 25 badges | Gamified progression; detailed unlock dates |
| 2026-08-23 | Added `premarket_prep` + `user_settings` | Pre-market routine + risk guardrails |
| 2026-11-18 | Quick-Add FAB on dashboard | Reduce friction for manual trade entry |

---

## Current State

- Frontend: React 18 + Vite, single-page app with 12 feature pages
- Backend: Express 5 + MySQL 8, REST API under `/api/*`
- Auth: JWT (30-day) stored in `localStorage` (`tj_token`, `tj_user`)
- Styling: Custom CSS variables + inline style objects (no Tailwind build step)
- Charts: Recharts (Area, Bar, Pie, Radar) + Framer Motion transitions
- Deployment: Not yet configured (dev only on `localhost:5173` + `localhost:5000`)

---

## Open Questions

| # | Question | Owner | Status |
| --- | --- | --- | --- |
| 1 | Production DB host/credentials strategy? | — | > ⚠️ TODO: confirm |
| 2 | CI/CD pipeline (GitHub Actions / Docker)? | — | > ⚠️ TODO: confirm |
| 3 | Error tracking (Sentry / LogRocket)? | — | > ⚠️ TODO: confirm |
| 4 | Unit test framework (Vitest / Jest)? | — | > ⚠️ TODO: confirm |
| 5 | Need `.env.example` for onboarding? | — | > ⚠️ TODO: confirm |
| 6 | Accessibility audit scope? | — | > ⚠️ TODO: confirm |

---

## Changelog

| Date | Change |
| --- | --- |
| 2026-11-18 | Add Quick-Start button on dashboard; TradesDB auto-open form |
| 2026-08-23 | Missed Trades: reason taxonomy, cumulative cost chart, pie breakdown |
| 2026-08-18 | Milestones v2: 25 badges, timeline, detail modal, monthly goal tracker |
| 2026-08-16 | Dashboard: equity curve, calendar heatmap, radar, psychology bleed |
| 2026-08-15 | Chart Gallery: image upload, masonry, lightbox, setup filtering |
| 2026-08-14 | Playbook models + per-model trade history |
| 2026-08-14 | Analytics: performance, risk, daily, weekly tabs |
| 2026-08-13 | Review Page: daily + monthly with editable notes |
| 2026-08-13 | Pre-market Prep: bias, readiness, checklist, if-then rules |
| 2026-08-13 | CSV Import: auto-detect broker headers, staging preview |
| 2026-08-12 | Auth: register/login, JWT middleware, protected routes |
| 2026-08-11 | Core Trades DB: 20-column schema, CRUD, R-multiple calc |
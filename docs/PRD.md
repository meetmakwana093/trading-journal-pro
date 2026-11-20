# 📋 Product Requirements Document

> **Project:** Trading Journal Pro · **Last updated:** 2026-11-20 · **Status:** 🟢 Stable

---

## Overview

Trading Journal Pro is a personal trading command center: a dark-themed web application that helps individual traders log executions, measure their edge, and eliminate behavioral leaks. It pairs a React SPA frontend (Vite + Recharts + Framer Motion) with a Node.js/Express backend that persists data in MySQL. Every trade is captured with entry/exit price, stop loss, risk/reward, session, direction, and tags, then surfaced as analytics, a calendar heatmap, a milestone vault, and an AI-style coaching report.

## Target Users

| User | Need | How the product helps |
| --- | --- | --- |
| Active day/swing trader | A fast way to log trades without leaving the chart | Quick-Add floating button, bulk CSV import from broker exports, auto R-multiple calculation |
| Disciplined trader | Enforce rules and measure adherence | Pre-market checklist, followed-plan tracking, "Cost of Broken Rules" metric on the dashboard |
| Student of trading | Understand what is actually making or losing money | Playbook edge matrix, symbol performance, day-of-week analysis, win rate and profit factor |
| Emotion-driven trader | Find and remove FOMO and hesitation | Missed Trades vault with root-cause breakdown and cumulative opportunity-cost chart |
| Goal-oriented trader | Track progress over months and years | 25 achievement badges, milestone equity curve, monthly goal tracker |

## Feature Matrix

| Feature | Status | Notes |
| --- | --- | --- |
| User authentication (register/login) | ✅ Done | JWT (30-day expiry), bcrypt password hashing, token stored in `localStorage` |
| Trades database (CRUD) | ✅ Done | Manual add, edit, delete; 20-column table mapped to React shape |
| Broker CSV import | ✅ Done | Auto-detects headers from Groww/Zerodha-style exports, bulk insert |
| Playbook models | ✅ Done | Named strategies with timeframe, rules, per-model stats |
| Chart gallery | ✅ Done | Image upload, masonry grid, lightbox with mistakes/lessons |
| Missed trades vault | ✅ Done | Opportunity-cost logging with reason taxonomy |
| Dashboard | ✅ Done | Metric cards, equity curve, calendar heatmap, radar profile, psychology bleed |
| Analytics | ✅ Done | Four tabs: performance, risk, daily, weekly insights |
| Journal review | ✅ Done | Daily and monthly review with best/worst trade callouts |
| Milestones / badges | ✅ Done | 25 badges with interactive detail modal |
| Pre-market prep | ✅ Done | Bias, readiness slider, checklist, key levels, if-then rules |
| Economic calendar | ✅ Done | TradingView events embed + custom notes |
| AI trading coach | ✅ Done | Rule-based audit across edge, psychology, and risk prompts |
| Risk & account settings | ✅ Done | Starting balance, max daily loss, risk per trade, defaults |
| Multi-account support | ✅ Done | `account` field per trade; pill-styled per-account colors |

## Out of Scope

- Broker API connectivity / live trade syncing (CSV import only)
- Real-time market data feeds (Economic Calendar uses a third-party embed)
- Multi-user collaboration or shared journals
- Paper trading / order execution
- Backtesting engine
- Mobile native applications (responsive web only)
- User-level data export or account deletion tooling

## Success Criteria

| Metric | Target | Current |
| --- | --- | --- |
| Core flows render without error | 100% of logged-in routes | All 12 pages render; verified via manual run |
| Auth round-trip | Register → login → fetch protected data | Working against MySQL via `/api/*` |
| Trade persistence | Every created trade survives a page reload | Confirmed via `server.log` DB connection |
| Build succeeds | `npm run build` exits 0 | Not yet run in this snapshot |
| Data isolation | User A cannot read User B's trades | Enforced by `WHERE user_id = ?` on every query |
| No secrets committed | `.env` is git-ignored | `.gitignore` covers `.env`; repo contains no keys |
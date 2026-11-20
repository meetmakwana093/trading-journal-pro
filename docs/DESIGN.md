# 🎨 Design System

> **Project:** Trading Journal Pro · **Last updated:** 2026-11-20 · **Status:** 🟢 Stable

---

## Color Palette

Token names and hex values pulled directly from `src/App.css` CSS variables.

| Token / Class | Hex | Usage |
| --- | --- | --- |
| `--bg-base` | `#080B14` | Page background |
| `--bg-card` | `rgba(13,17,28,0.95)` | Card/panel background |
| `--bg-card-hover` | `rgba(16,21,35,0.98)` | Card hover state |
| `--accent-green` | `#00FF88` | Primary action, profit, success |
| `--accent-red` | `#FF3333` | Loss, danger, error |
| `--accent-blue` | `#3b82f6` | Informational, secondary action |
| `--accent-purple` | `#8b5cf6` | Tertiary accent |
| `--text-primary` | `#ffffff` | Primary text |
| `--text-secondary` | `rgba(255,255,255,0.55)` | Muted text |
| `--text-muted` | `rgba(255,255,255,0.25)` | Disabled/placeholder text |
| `--border-subtle` | `rgba(255,255,255,0.06)` | Default borders |
| `--border-green` | `rgba(0,255,136,0.2)` | Active/focus borders |
| `--shadow-card` | `0 4px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.04)` | Card elevation |

## Typography

| Role | Font | Size | Weight |
| --- | --- | --- | --- |
| Headings (h1) | Inter | 2.2rem | 800 |
| Section titles | Inter | 0.7rem | 600 (uppercase, letter-spacing 0.1em) |
| Body copy | Inter | 0.85–1rem | 400–500 |
| Numbers / P&L | JetBrains Mono | 0.6–3rem | 700–800 |
| Buttons / Tabs | Inter | 0.82–0.9rem | 600–700 |

## Spacing and Radius Scale

| Token | Value | Used for |
| --- | --- | --- |
| Card border radius | 16px | `.tab-content`, `.info-card`, `.chart-container` |
| Button border radius | 8–12px | Sub-tab buttons, FAB, form buttons |
| Small radius | 4–6px | Checkboxes, pills, table cells |
| Gap | 12–24px | Grid/flex gaps |
| Padding (card) | 16–24px | Card interiors |
| Max content width | 1200px | Page container |

## Core Components

| Component | File path | Variants / Props |
| --- | --- | --- |
| `MagneticCard` | `src/App.jsx:53` | Hover tilt animation, children |
| `AnimatedNumber` | `src/App.jsx:25` | `value`, `prefix`, `suffix`, `decimals` |
| `CustomTooltip` | `src/App.jsx:87` | Recharts tooltip with dynamic color |
| Sidebar / Sub-tabs | `src/App.jsx:140` | Active state, icon + label |
| Calendar | `src/App.jsx:80` | Positive/negative/neutral/weekend day states |
| Info Card | `src/App.css:65` | Title + value (positive/negative) |
| Modal / Lightbox | `src/pages/ChartGallery.jsx`, `MissedTradeDB.jsx` | AnimatePresence, backdrop blur |
| Table | `src/pages/TradeDB.jsx`, `ReviewPage.jsx` | Sticky header, pill badges, checkboxes |

## Breakpoints

| Name | Min width | Behavior |
| --- | --- | --- |
| Desktop | >1200px | 3-column layout (left 22%, center 56%, right 20%) |
| Tablet | 1024–1200px | Left 26%, right 22% |
| Mobile | ≤1024px | Single-column stack; sidebar becomes slide-over drawer |

## Interaction States

| State | Pattern |
| --- | --- |
| Default | `background: rgba(38,38,38,0.5)` + subtle border |
| Hover | `transform: translateY(-2px)` + elevated shadow; buttons brighten |
| Focus | `box-shadow: 0 0 0 3px rgba(0,255,136,0.08)` + green border |
| Disabled | `opacity: 0.5`, `cursor: not-allowed` |
| Loading | Spinner overlay on submit buttons (`LoginPage`, `DataImport`) |
| Error | Red border + error toast/message below field |
| Empty | Centered illustration + descriptive text + primary CTA |
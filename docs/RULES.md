# 📐 Coding Rules

> **Project:** Trading Journal Pro · **Last updated:** 2026-11-20 · **Status:** 🟢 Stable

---

## Naming Conventions

| Item | Convention | Example |
| --- | --- | --- |
| React components | PascalCase | `TradeDB.jsx`, `AICoach.jsx` |
| Hooks / utilities | camelCase, prefix `use` / `get` | `useState`, `getToken`, `formatCurrency` |
| API routes | kebab-case, `/api/<resource>` | `/api/trades`, `/api/playbooks` |
| DB tables / columns | snake_case | `trades`, `user_id`, `entry_price` |
| CSS custom properties | kebab-case, `--prefix` | `--bg-base`, `--accent-green` |
| Environment variables | UPPER_SNAKE_CASE | `VITE_API_URL`, `JWT_SECRET` |

## Folder Placement

| Type | Location |
| --- | --- |
| Page-level components | `src/pages/` |
| Shared UI primitives | `src/components/` (not yet used; currently inline) |
| Auth helpers | `src/auth/` |
| Styles | `src/App.css` (global) + inline `styles` objects per page |
| Server code | `server.js` (root) |
| DB migrations | `create_*_table.sql` (root) |
| Documentation | `docs/` |

## Error Handling and Logging Pattern

From `server.js:130-139` and `src/auth/authService.js`:

```js
// Server: verifyToken middleware
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// Every route handler wraps DB calls in try/catch
app.post('/api/trades', verifyToken, async (req, res) => {
  try {
    const [result] = await pool.query(sql, params);
    res.json(mapDBToReact(rows[0]));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
```

```js
// Client: fetch with error fallback
fetch(`${API}/trades`, { headers: { Authorization: `Bearer ${getToken()}` } })
  .then(res => res.json())
  .then(data => { if (Array.isArray(data)) setTrades(data.map(formatTradeData)); })
  .catch(err => console.error('Failed to fetch trades:', err));
```

## Comment Style

Brief inline comments for non-obvious logic; section headers in `server.js`:

```js
// 🟢 FIXED: This will instantly expand your column limits to prevent crashes!
async function updateTradesTable() { … }
```

## Dependency Policy

- Ask before adding any new npm package
- Prefer existing dependencies: `framer-motion` for animation, `recharts` for charts, `clsx` for classnames
- Pin exact versions in `package.json` (no `^` or `~` for production deps)

## Change Policy

- Minimal, targeted edits
- Do not alter existing logic, formatting, or styling unless explicitly asked
- Preserve inline styles and `className` conventions
- No refactoring for style alone

## Verification Commands

```bash
# Lint (no dedicated lint script; uses Vite + React Fast Refresh)
npm run build   # Type-check + production build
npm run dev     # Start dev server (frontend + backend in parallel via scripts)
node server.js  # Start backend only
```
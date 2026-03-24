# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start dev server (Vite, localhost:5173)
npm run build     # Production build → dist/
npm run preview   # Preview production build

node scripts/scrape-felioom.mjs           # Scrape Felioom client data
node scripts/scrape-felioom-appointments.mjs  # Scrape appointments
node scripts/import-felioom.mjs           # Import scraped data into Supabase
```

## Architecture

**Boku.AI** is a pet grooming business management SPA (React 19 + Vite + Supabase). The app is Italian-localized.

### Stack
- **Frontend:** React 19, no TypeScript, CSS-in-JS (styles embedded in App.jsx)
- **Backend:** Supabase (PostgreSQL) via `src/supabaseClient.js`
- **Scraping:** Playwright scripts in `scripts/` that pull data from the Felioom platform

### Key files
- `src/App.jsx` — monolithic ~2300-line component containing all views, state, styles, and business logic
- `src/supabaseClient.js` — initializes Supabase from `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` env vars
- `.env` — contains Supabase credentials and Felioom login (not committed to public repos)

### App.jsx structure (by comment section)
1. **DATA GENERATION** — `SERVICES` array, `PET_DATA`, `generateData()` for seeded demo data, `dbToClient()`/`dbToBooking()` mappers
2. **ICONS** — single `Icon` component with 18 inline SVGs
3. **ANIMAL COLORS** — color/emoji map per animal type
4. **STYLES** — all CSS as a template literal injected via `<style>`; dark theme, accent `#6EE7B7`
5. **MAIN APP COMPONENT** — everything else: 20+ `useState` hooks, memoized selectors, CRUD handlers, and all view renders

### Views (controlled by `view` state)
- `dashboard` — stats, charts, AI insights, today's bookings
- `clients` — client list with search, multi-select, bulk delete
- `bookings` — booking list with status filter and bulk ops
- `analytics` — revenue/profit trends, per-client forecast
- `calendar` — month / week / list views; week view supports drag-and-drop slot assignment

### Data flow
State lives in React (`clients`, `bookings`, `services`). On mount, data is fetched from Supabase. All mutations call Supabase first, then update local state on success.

### Supabase tables
`clients`, `bookings`, `services` — schema inferred from `dbToClient()` / `dbToBooking()` mappers in App.jsx.

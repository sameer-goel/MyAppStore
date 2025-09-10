# Project Guide — AI Solutions Library

This guide documents the project structure, features, navigation, environments, and how to run and manage the app safely.

## Structure
- `interactive-portfolio/` — React + Vite frontend (Tailwind v4 via `@tailwindcss/vite`).
  - `src/Me.jsx` — Main “Portfolio” viewer (categories → subcategories → apps).
  - `src/AdminPage.jsx` — Single‑page admin (CRUD for categories, subcategories, apps).
  - `src/features/store/AppStoreView.jsx` — App Store view (/store) with rails: Recently Added, Coming Soon.
  - `src/features/icons-lab/IconsLab.jsx` — Icons Lab (/icons) for testing Iconify icons (e.g., Token Branded).
  - `src/AppEditorModal.jsx` — App create/edit modal (name, desc, details, preview, links, icons).
  - `src/data/api.js` — Frontend API client for backend routes.
  - `src/icons.js` — Curated lucide icons shared across app/editor.
  - `vite.config.js` — Dev proxy `/api` → `http://localhost:4000`.
- `server/` — Express API backend.
  - `index.js` — Routes: list + CRUD for categories/subcategories/apps; upload presign endpoint.
  - `repo.js` — DynamoDB repository (single‑table, GSI1 on `entityType`).
  - `package.json` — API dependencies (AWS SDK v3, express, cors).
- `db_tests/` — DynamoDB scripts (Python + Node snippets in DBAdmin.md).
  - `python_crud_test.py` — End‑to‑end CRUD test (ensure table → CRUD → verify → cleanup app).
  - `seed_mock_data.py` — Idempotent seeding for categories/subs/apps.
- `DBAdmin.md` — DynamoDB table design, CRUD code, CLI, Python harness.
- `backups/` — Timestamped tar.gz and folder copies + `backups/README.md` (restore notes).

## Key Features
- Portfolio viewer (Me page)
  - Progressive drilldown: categories → subcategories → app cards
  - Preview modal per app: attach GIF/MP4/Image via URL, change icon, quick close (ESC)
  - Layout switcher: Classic vs iOS card layout
  - “Open” button: launches `publicUrl` in a new tab (if present)
- Admin mode (inline) and Admin page (/admin)
  - Add/Edit/Delete apps (App Editor modal)
  - Category/Subcategory CRUD (prompts in v1; modals can be added)
- App Store view (/store)
  - Rails: Recently Added (apps with `publicUrl`, sorted by updated/created), Coming Soon (no `publicUrl`)
  - Filters and search across categories/subcategories
- Icons Lab (/icons)
  - Preview curated lucide icons and Iconify sets (Tabler, Fluent Emoji, Material Symbols, Token Branded)
  - Click to copy icon IDs for use in the editor
- Icon system (flexible)
  - `iconUploadUrl` (custom uploaded image via S3 presign)
  - `iconId` (Iconify id, e.g., `token-branded:eth`)
  - `thumbUrl` (square artwork)
  - `iconIndex` (lucide fallback)
  - Rendering precedence: `iconUploadUrl` → `iconId` → `thumbUrl` → `iconIndex`

## Navigation
- Main: `/` (Me page)
  - Header: Back, Reset, Sound, Admin Mode toggle, Layout switcher
  - Breadcrumbs: Portfolio → Category → Subcategory
  - Cards: Click Category to expand; click Subcategory to see apps
- Admin page: `/admin` (or `#/admin`, `?admin=1`)
  - Left: Categories; Middle: Subcategories; Right: Apps
  - + Add in each panel; Edit/Delete; App Editor modal for apps
- App Store: `/store` (or `#/store`, `?store=1`)
  - Two rails: Recently Added, Coming Soon; horizontal scroll with filters
- Icons Lab: `/icons` (or `#/icons`, `?icons=1`)
  - Preview + copy Iconify IDs, including Token Branded set

## Backend API (Express)
- Health: `GET /api/health`
- Categories:
  - `GET /api/categories`
  - `POST /api/categories` (upsert)
  - `PUT /api/categories/:catKey` (upsert)
  - `DELETE /api/categories/:catKey` (blocked if children unless `?force=1`)
- Subcategories:
  - `GET /api/categories/:catKey/subcategories`
  - `POST /api/subcategories` (upsert)
  - `PUT /api/subcategories/:catKey/:subKey` (upsert)
  - `DELETE /api/subcategories/:catKey/:subKey` (blocked if children unless `?force=1`)
- Apps:
  - `GET /api/categories/:catKey/subcategories/:subKey/apps`
  - `POST /api/apps`
  - `PUT /api/apps/:catKey/:subKey/:slug`
  - `DELETE /api/apps/:catKey/:subKey/:slug`
- Uploads (optional):
  - `POST /api/uploads/icon` → returns `{ uploadUrl, publicUrl, key }` (requires `S3_BUCKET`)

## Data Model (DynamoDB)
- Single table: `Portfolio` (PK, SK); GSI1 on (`entityType`, SK)
- Category: `PK=CAT#{catKey}`, `SK=META`; attrs: `name`, `tagline`, `gradient`, `iconKey`, `order`, `status`, timestamps
- Subcategory: `PK=CAT#{catKey}`, `SK=SUB#{subKey}`; attrs: `name`, `blurb`, `iconKey`, `order`, `status`, timestamps
- App: `PK=CAT#{catKey}#SUB#{subKey}`, `SK=APP#{slug}`; attrs:
  - Required: `name`, `slug`, `catKey`, `subKey`, `entityType='App'`
  - Optional: `desc`, `details`, `publicUrl`, `mediaUrl`, `thumbUrl`,
    `iconId` (Iconify), `iconUploadUrl` (uploaded), `iconSource`, `iconIndex`, `order`, `status`, timestamps
- See `DBAdmin.md` for full schema, CRUD snippets, and test harness

## Run Locally
- API
  - `cd server && npm install && npm start`
  - Optional uploads: export `S3_BUCKET=your-bucket`; optional `S3_PUBLIC_BASE=https://cdn.example.com`
- Frontend
  - `cd interactive-portfolio && npm install && npm run dev`
  - Dev Proxy: frontend calls `/api/*` (Vite proxies to port 4000)

## Backups
- We keep timestamped app backups under `backups/` and folder copies `interactive-portfolio_backup_<timestamp>`.
- See `backups/README.md` for a list of archives and restore steps.

## Safety & Notes
- Backups exist prior to DB integration; rollback is quick.
- UI updates are non‑breaking; legacy apps still render via lucide `iconIndex`.
- Error handling: if a component fails, the rest of the app continues; consider adding an error boundary for extra resilience.

If you want this consolidated into the main README, say the word and I’ll merge it there and add links in the UI footer.

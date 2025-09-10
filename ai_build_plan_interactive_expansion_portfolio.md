# AI Build Plan — Interactive Expansion Portfolio

Goal: Recreate the interactive portfolio exactly as delivered (two categories → three subcategories → apps), with smooth layered expansions, preview modals (GIF/MP4/Image), on‑the‑fly icon swap, and optional sound micro‑feedback. Keep UX responsive and keyboard‑friendly.

> **Mode:** /ai — direct instructions. The AI has access to the current code and the Handover Guide.

---

## 0) Scope & Acceptance
**Replicate as‑is:**
- Category → Subcategory → Apps with Framer Motion layout morphs.
- App cards with detail toggle.
- **Preview Modal** per app (paste media URL; supports GIF/MP4/WebM/PNG/JPG; ESC/backdrop close).
- **Icon Swap** in modal (cycles curated lucide icons; reflected on app card).
- **Sound Micro‑feedback** (expand/collapse/click) with header toggle.
- Breadcrumbs + Back + Reset + keyboard (ESC collapses; Backspace/← goes up a level; ESC also closes modal).
- Responsive design; decorative background; basic accessibility roles.

**Definition of Done:** All above behaviors pass the QA checks in section 6 on desktop and mobile viewports.

---

## 1) Prerequisites
- Node 18+
- Package manager (npm or pnpm)
- Modern browser (for WebAudio + CSS)

---

## 2) Environment Setup (Vite)
1. Scaffold:
   ```bash
   npm create vite@latest interactive-portfolio -- --template react
   cd interactive-portfolio
   ```
2. Install deps:
   ```bash
   npm i framer-motion lucide-react
   npm i -D tailwindcss postcss autoprefixer
   npx tailwindcss init -p
   ```
3. Tailwind config:
   - `tailwind.config.js`
     ```js
     export default {
       content: ['./index.html','./src/**/*.{js,jsx,ts,tsx}'],
       theme: { extend: {} },
       plugins: [],
     };
     ```
   - `src/index.css`
     ```css
     @tailwind base;
     @tailwind components;
     @tailwind utilities;
     ```
4. App mount:
   - `src/App.jsx` imports the component created in step 4 and renders it.

**Commit:** `chore: scaffold Vite + Tailwind + deps`

---

## 3) Project Structure
```
src/
  InteractiveExpansionPortfolio.jsx   # main component (from canvas)
  App.jsx                             # renders the component
  index.css
  main.jsx (Vite bootstrap)
```
**Commit:** `chore: add base file layout`

---

## 4) Implement Core Component (Layered Expansion)
1. Create `src/InteractiveExpansionPortfolio.jsx`.
2. Add: DATA model (two categories; three subcategories each; three apps each).
3. Add UI primitives: `Pill`, `Breadcrumb`, `CloseButton`.
4. Add cards: `CategoryCard`, `SubcategoryCard`, `AppCard` (detail toggle only for now).
5. Add views: `CategoryExpandView`, `SubcategoryExpandView`.
6. Add motion:
   - `layoutId` on category and subcategory containers.
   - shared `spring` config `{ type: 'spring', stiffness: 260, damping: 28, mass: 0.8 }`.
7. Add root component with state: `selectedCategory`, `selectedSub`; handlers for select, back, collapse.
8. Add `DecorativeBackground`.

**Commit:** `feat: layered expansion UI with framer-motion`

---

## 5) Navigation & Keyboard
1. Add header: Back + Reset + keyboard hint.
2. Add `useKeyboardNav` hook: ESC→collapse; Backspace/ArrowLeft→back up one level.
3. Wire breadcrumb clicks to collapse or step back.

**Commit:** `feat: breadcrumbs, back/reset controls, keyboard nav`

---

## 6) App Details + Preview Modal
1. Enhance `AppCard`:
   - Local `open` state for description toggle.
   - Add **Preview** button that opens a modal.
2. Add `PreviewModal`:
   - Props: `{ open, onClose, app, mediaUrl, setMediaUrl, iconIndex, setIconIndex }`.
   - Layout: media panel (aspect‑video) + details panel.
   - Media rendering:
     - If URL ends with `.mp4`/`.webm` → `<video controls autoPlay muted loop>`.
     - Else → `<img>`.
   - Input field to paste/clear media URL.
   - ESC to close; backdrop click closes.
3. Root state:
   - `modalOpen`, `modalApp`, `modalAppId`.
   - `mediaMap` object keyed by `appId(catKey, subKey, appName)`.
   - Helpers: `slugify`, `appId`.

**Commit:** `feat: per-app preview modal with media URL input`

---

## 7) Icon Swap (Curated Set)
1. Define `altIconChoices` array (Rocket, Zap, Shapes, Layers, Wand2, Sparkles, Play).
2. Add `iconIdxMap` at root `{ [appId]: number }`.
3. In `PreviewModal`, add **Change icon** button → cycles index.
4. In `SubcategoryExpandView`, resolve icon per app using `iconIdxMap[appId]` with fallback to default.
5. In `AppCard`, render `resolvedIcon`.

**Commit:** `feat: per-app icon swap reflected on grid`

---

## 8) Sound Micro‑feedback
1. Create `useChimes(soundsOn)` hook using WebAudio API:
   - `chimeExpand()`, `chimeCollapse()`, `chimeClick()`.
2. Header toggle component `Toggle` (Sound/Muted).
3. Call chimes on category/sub select, on back/collapse, and on open preview.

**Commit:** `feat: sound micro-feedback + header toggle`

---

## 9) Polish & Responsiveness
1. Verify spacing, rounded corners, shadow levels.
2. Ensure grids adapt (`sm:grid-cols-2`, `md:grid-cols-3`).
3. Check focus states on buttons (`focus-visible:`).
4. Ensure modal scales well at `sm`, `md`, `lg`.

**Commit:** `style: responsive polish and focus states`

---

## 10) QA — Manual Test Script
Run `npm run dev`, then verify in order:

**A. Expansion Flow**
- Initial view shows **2 categories** only.
- Click a category → smooth morph to a header panel + **3 subcategories**.
- Click a subcategory → morph into **apps grid**.
- Click `Back` or press `Backspace/←` → return to subcategories.
- Press `ESC` → collapses all to initial 2 categories.

**B. App Cards**
- Click **Show details** → description expands; click again collapses.
- Click **Preview** → modal opens.

**C. Preview Modal**
- Paste a valid **GIF/MP4/WebM/Image URL** → shows live media.
- **Clear** resets URL to empty state.
- Press **ESC** or click backdrop or ✕ → modal closes.

**D. Icon Swap**
- In modal, click **Change icon** → cycles icons.
- Close modal → see **new icon** on the app card.

**E. Sound Toggle**
- Ensure chimes on expand/collapse/click.
- Toggle header to **Muted** → no sounds.

**F. Keyboard**
- TAB navigation lands on interactive elements in logical order.
- `Backspace/←` steps up one level; `ESC` collapses or closes modal.

**G. Responsive**
- At ~375px width → single column; modal fills viewport.
- At `sm`/`md` → multi‑column grids; background still performant.

---

## 11) Optional Enhancements (deferred)
- **Persistence:** Save `mediaMap` & `iconIdxMap` to `localStorage` (load on mount; save on change).
- **Deep linking:** Hash URLs like `#/ai/education/ai-tutor` (parse on load; update on navigation).
- **A11y:** Focus trap for modal; `aria-labelledby`/`aria-describedby`.
- **Reduced Motion:** Detect `prefers-reduced-motion` and simplify animations.
- **Storybook:** Stories for cards and modal.

**Commit (when done):** `feat: localStorage persistence`, `feat: hash deep-linking`, `feat: modal focus trap`, etc.

---

## 12) Git Workflow
- Branch per step (e.g., `feat/layered-expansion`, `feat/preview-modal`).
- Small, descriptive commits matching step titles.
- PR with checklist from sections 4–10; link to QA results.

---

## 13) Risk & Mitigation
- **Autoplay video blocked:** We set `muted` & `autoPlay` to comply with autoplay policies.
- **WebAudio init:** Sounds only after some user interaction (click); provide visible toggle.
- **Invalid media URL:** Show empty state; (optional) add basic URL validation.

---

## 14) Handoff Notes
- The canonical implementation is in `InteractiveExpansionPortfolio.jsx` (see canvas). Reuse data and helper functions to avoid drift.
- Keep acceptance aligned with section 0 and QA in section 10.

**Build plan complete.** Execute steps 2 → 10 in order; each step should compile and pass its local QA before moving on.
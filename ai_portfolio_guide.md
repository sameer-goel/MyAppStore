# Interactive Expansion Portfolio — Handover Guide

**Project focus:** A silky, layered expansion experience (Category → Subcategory → Apps) with preview modals, optional sound micro‑feedback, and on‑the‑fly icon swaps.

---

## 1) Quick Overview
- **Main component:** `InteractiveExpansionPortfolio` (already built in canvas code)
- **UI flow:**
  - Initial: two hero categories
  - 1st click: expands to subcategories
  - 2nd click: expands to app grid with detail cards
  - Per‑app: preview modal with GIF/MP4/Image URL slot + icon swap
- **Navigation:** Breadcrumbs, Back, Reset, ESC. Keyboard left/backspace for “back”.
- **Extras:** WebAudio chimes (toggle in header), responsive Tailwind design, Framer Motion layout morphs.

---

## 2) Tech Stack
- **React 18+** (Vite or Next.js)
- **Framer Motion** (layout & presence animations)
- **Tailwind CSS** (utility styling)
- **lucide-react** (icons)
- **Optional:** TypeScript, Storybook, Playwright, React Testing Library, shadcn/ui (not required).

---

## 3) Install & Run

### Option A — Vite (Recommended for quick dev)
```bash
# Create project
npm create vite@latest interactive-portfolio -- --template react
cd interactive-portfolio

# Install deps
npm i framer-motion lucide-react
npm i -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```
**tailwind.config.js**
```js
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: { extend: {} },
  plugins: [],
};
```
**src/index.css**
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```
**src/App.jsx** (mount the component)
```jsx
import React from 'react';
import InteractiveExpansionPortfolio from './InteractiveExpansionPortfolio.jsx';
import './index.css';

export default function App(){
  return <InteractiveExpansionPortfolio/>;
}
```
Run:
```bash
npm run dev
```

### Option B — Next.js (app router)
```bash
npx create-next-app@latest interactive-portfolio
cd interactive-portfolio
npm i framer-motion lucide-react
npm i -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```
Add Tailwind per Next.js docs (include `app/**/*.{js,jsx,ts,tsx}` in `content`). Place the component in `app/components/InteractiveExpansionPortfolio.jsx` and import into `app/page.jsx`.

---

## 4) File Layout (suggested)
```
src/
  InteractiveExpansionPortfolio.jsx   # Provided in canvas
  index.css
  App.jsx
  main.jsx (Vite bootstrap)
```

---

## 5) Core Concepts & Data Model

**DATA structure** (already in component):
```js
const DATA = {
  'ARTIFICIAL INTELLIGENCE': {
    key: 'ai', gradient: 'from-cyan-500 to-blue-600', icon: Brain,
    subcategories: [{ name: 'Education', key: 'education', apps: [...] }, ...]
  },
  'INNER INTELLIGENCE': {
    key: 'inner', gradient: 'from-fuchsia-500 to-rose-600', icon: Sparkles,
    subcategories: [{ name: 'Mind', key: 'mind', apps: [...] }, ...]
  }
};
```
- **Categories** → `key`, `tagline`, `gradient`, `icon`, `subcategories[]`
- **Subcategories** → `name`, `key`, `icon`, `blurb`, `apps[]`
- **Apps** → `name`, `icon`, `desc`, `details`

**IDs:** `appId(catKey, subKey, appName)` → used to persist modal state (preview URLs, icon choice).

**Animation:**
- Shared layout morphs via `layoutId` on category & subcategory cards.
- Spring: `{ type: 'spring', stiffness: 260, damping: 28, mass: 0.8 }`.

**Sound:**
- WebAudio chimes via `useChimes(soundsOn)` (expand, collapse, click). Header toggle enables/disables.

---

## 6) Extending the Experience

### A. Add or Modify Content
1. **Add a new category:** append to `DATA` with unique `key`, gradient, and icon.
2. **Add subcategories/apps:** extend `subcategories` array; each sub has 3 apps by default but supports any count.
3. **Icons:** apps use lucide icons. In preview modal, you can **cycle alternative icons** (Rocket, Zap, Shapes, Layers, Wand, Sparkles, Play). Extend `altIconChoices` to add more.

### B. Per‑App Preview Media
- Open an app card → **Preview** → paste a GIF/MP4/WebM/PNG/JPG URL.
- State map `mediaMap[appId]` stores the URL (in‑memory). See TODO for persistence.

### C. Persistence (Next Step)
Implement localStorage so previews and icon picks survive refresh:
```js
useEffect(() => {
  const m = localStorage.getItem('mediaMap');
  const i = localStorage.getItem('iconIdxMap');
  if (m) setMediaMap(JSON.parse(m));
  if (i) setIconIdxMap(JSON.parse(i));
}, []);
useEffect(() => localStorage.setItem('mediaMap', JSON.stringify(mediaMap)), [mediaMap]);
useEffect(() => localStorage.setItem('iconIdxMap', JSON.stringify(iconIdxMap)), [iconIdxMap]);
```

### D. Deep Linking (Next Step)
- Encode path in URL (e.g., `#/ai/education/ai-tutor`) on selection.
- On mount, parse hash and pre‑open the corresponding category/sub/app.

### E. Accessibility
- Modal: add focus trap and aria labels (`role="dialog"`, `aria-labelledby`, `aria-describedby`).
- Respect `prefers-reduced-motion`: reduce spring stiffness or switch to fades.
- Keyboard: ensure tab order on buttons; add visible focus rings (Tailwind `focus-visible:` already used in places).

### F. Performance
- Framer Motion is performant by default; avoid heavy shadows on mobile.
- Consider `React.memo` on `AppCard` list if data grows.

---

## 7) Handover Tasks by AI Session

### AI Session A — Logic & Persistence
- [ ] Implement localStorage persistence for `mediaMap` and `iconIdxMap` (see snippet above).
- [ ] Add URL hash routing for deep links (open on load, update on navigate).
- [ ] Add `prefers-reduced-motion` support (read via `window.matchMedia`).
- [ ] TypeScript conversion with prop types and `DATA` typing.
- [ ] Unit tests for helpers: `slugify`, `appId`, deep‑link parser.

**Definition of Done (A):**
- Refresh preserves preview URLs & icon choices.
- Visiting `#/ai/education/ai-tutor` opens the exact state.
- Reduced motion honored; tests pass.

### AI Session B — UI & Interaction
- [ ] Add focus trap to modal (e.g., using `focus-trap` or simple custom trap).
- [ ] Optional: fullscreen preview gallery with left/right navigation.
- [ ] Microcopy polish on buttons; add subtle hover/tap affordances.
- [ ] Add tiny confetti pulse on category open (reduced-motion aware).
- [ ] Storybook stories for CategoryCard, SubcategoryCard, AppCard, PreviewModal.

**Definition of Done (B):**
- Modal fully keyboard accessible and screen‑reader friendly.
- Storybook covers states (default, hover, open modal, error URL).
- Visual QA at `sm`, `md`, `lg` breakpoints.

---

## 8) Integration Points & Public API
- **Mounting:** `<InteractiveExpansionPortfolio />`
- **Configuration:**
  - Default sound: set initial `soundsOn` state.
  - Theme accents: swap gradients per category in `DATA`.
- **Helper APIs:**
  - `appId(catKey, subKey, appName)`
  - `slugify(str)`
  - `openPreview(catKey, subKey, app)` (internal; can be lifted if needed)

---

## 9) Testing Checklist
- **Desktop:** Chrome, Firefox, Safari
- **Mobile:** iOS Safari, Android Chrome
- **Keyboard‑only:** TAB/Shift+TAB focus order, ESC collapse/modal, Backspace/← back
- **Reduced motion:** animations simplified
- **Media:** GIF/MP4/WebM/Image render correctly, invalid URLs handled gracefully

---

## 10) Known Limitations
- No persistence across reloads (pending Task A)
- No focus trap in modal yet (pending Task B)
- No SSR deep linking (hash‑based routing suggested; Next.js `useSearchParams` alternative possible)

---

## 11) Style Guide
- **Tone:** Calm, modern, minimal
- **Spacing:** Generous padding, rounded corners (2xl), soft shadows
- **Motion:** Purposeful; avoid over‑stimulation (respect reduced motion)
- **Hierarchy:** Big category → mid subcategory → compact apps

---

## 12) Future Ideas
- Drag‑to‑reorder apps within a subcategory
- Per‑app theme accent + dynamic background bloom
- Import/export `DATA` as JSON to make it CMS‑like
- Analytics: capture open/close events for UX insights (privacy‑first)

---

## 13) Contact & Ownership
- Component currently owned by **InteractiveExpansionPortfolio.jsx** (see canvas). All changes should stay backward‑compatible with the current props and structure.

**Handover complete.** Proceed with Sessions A/B tasks and keep PRs atomic with clear acceptance criteria above.


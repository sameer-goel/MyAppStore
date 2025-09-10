import React, { useMemo, useState, useEffect, useCallback, useRef } from "react";
import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import {
  Brain,
  Bot,
  Sparkles,
  GraduationCap,
  Stethoscope,
  HeartPulse,
  Image as ImageIcon,
  Battery,
  Leaf,
  Sun,
  Target,
  Timer,
  NotebookPen,
  Dumbbell,
  Compass,
  Infinity,
  ChevronLeft,
  X,
  ImagePlus,
  Video,
  Volume2,
  VolumeX,
  Shuffle,
  Play,
} from "lucide-react";

import { listCategories as apiListCategories, listSubcategories as apiListSubcategories, listApps as apiListApps, createApp as apiCreateApp, updateApp as apiUpdateApp, deleteApp as apiDeleteApp } from './data/api.js';
import { altIconChoices } from './icons.js';
import { Icon as IconifyIcon } from '@iconify/react';
import AppEditorModal from './AppEditorModal.jsx';

/**
 * Interactive Expansion Portfolio — Enhanced (/ai mode) with DB integration
 */

// ---------- DB-backed Data Model ----------
// dynamic categories/subcategories/apps from API

// ---------- Helpers ----------
const spring = { type: "spring", stiffness: 260, damping: 28, mass: 0.8 };

// icon choices moved to ./icons.js and shared with editor

function slugify(s) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function appId(catKey, subKey, appName) {
  return `${catKey}__${subKey}__${slugify(appName)}`;
}

// ---------- Sound Micro‑feedback (WebAudio) ----------
function useChimes(enabled) {
  const ctxRef = useRef(null);
  const ensureCtx = () => {
    if (!enabled) return null;
    if (typeof window === "undefined") return null;
    if (!ctxRef.current) ctxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    return ctxRef.current;
  };

  const playTone = useCallback((freq = 440, duration = 0.08, type = "sine", gain = 0.06) => {
    const ctx = ensureCtx();
    if (!ctx) return;
    const t0 = ctx.currentTime;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(gain, t0 + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
    osc.connect(g).connect(ctx.destination);
    osc.start(t0);
    osc.stop(t0 + duration + 0.02);
  }, [enabled]);

  const chimeExpand = useCallback(() => playTone(520, 0.10, "sine", 0.07), [playTone]);
  const chimeCollapse = useCallback(() => playTone(330, 0.10, "sine", 0.07), [playTone]);
  const chimeClick = useCallback(() => playTone(680, 0.06, "triangle", 0.05), [playTone]);

  return { chimeExpand, chimeCollapse, chimeClick };
}

function useKeyboardNav({ onBack, collapseAll }) {
  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape") collapseAll?.();
      if (e.key === "Backspace" || e.key === "ArrowLeft") onBack?.();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onBack, collapseAll]);
}

// ---------- UI Primitives ----------
function Pill({ children }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-xs text-white/80 backdrop-blur">
      {children}
    </span>
  );
}

function Toggle({ on, onClick, labelOn = "On", labelOff = "Off" }) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1 rounded-full border border-white/10 px-2 py-1 text-xs backdrop-blur ${
        on ? "bg-white/20" : "bg-white/10"
      }`}
    >
      {on ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
      {on ? labelOn : labelOff}
    </button>
  );
}

function Breadcrumb({ path, onCrumb }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-4">
      <ol className="flex flex-wrap items-center gap-2 text-sm text-white/80">
        {path.map((p, i) => (
          <li key={p.key} className="flex items-center gap-2">
            <button
              onClick={() => onCrumb(i)}
              className={`transition hover:text-white ${i === path.length - 1 ? "text-white" : ""}`}
            >
              {p.label}
            </button>
            {i < path.length - 1 && <span className="opacity-60">/</span>}
          </li>
        ))}
      </ol>
    </nav>
  );
}

function CloseButton({ onClick, label = "Close" }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className="absolute right-4 top-4 rounded-full border border-white/10 bg-white/10 p-2 text-white/90 backdrop-blur transition hover:bg-white/20"
    >
      <X className="h-4 w-4" />
    </button>
  );
}

// ---------- Cards ----------
function CategoryCard({ name, data, selected, onSelect }) {
  const Icon = data.icon;
  return (
    <motion.button
      layoutId={`cat-${data.key}`}
      onClick={onSelect}
      className={`group relative w-full overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br ${
        data.gradient
      } p-6 text-left shadow-2xl outline-none transition focus-visible:ring-2 focus-visible:ring-white/40 ${
        selected ? "ring-2 ring-white/40" : "hover:scale-[1.01]"
      }`}
      transition={spring}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(255,255,255,0.15),transparent_40%),radial-gradient(circle_at_80%_0%,rgba(255,255,255,0.12),transparent_35%)]" />
      <div className="relative flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight drop-shadow-sm md:text-3xl">{name}</h2>
          <p className="mt-1 max-w-md text-sm/5 opacity-90">{data.tagline}</p>
          <div className="mt-4 flex flex-wrap gap-2 opacity-90">
            <Pill>Click to explore</Pill>
            <Pill>3 subcategories</Pill>
          </div>
        </div>
        <div className="-mr-1 -mt-1 shrink-0 rounded-2xl bg-white/10 p-3 backdrop-blur">
          <Icon className="h-8 w-8" />
        </div>
      </div>
    </motion.button>
  );
}

function SubcategoryCard({ catKey, sub, selected, onSelect }) {
  const Icon = iconFromKey(sub.iconKey);
  return (
    <motion.button
      layoutId={`sub-${catKey}-${sub.key}`}
      onClick={onSelect}
      className={`group relative w-full overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-5 text-left outline-none transition focus-visible:ring-2 focus-visible:ring-white/40 ${
        selected ? "ring-2 ring-white/40" : "hover:bg-white/10"
      }`}
      transition={spring}
    >
      <div className="relative flex items-start gap-4">
        <div className="rounded-xl bg-white/10 p-2 backdrop-blur">
          {Icon ? <Icon className="h-6 w-6" /> : <Sparkles className="h-6 w-6" />}
        </div>
        <div>
          <h3 className="text-lg font-semibold tracking-tight">{sub.name}</h3>
          <p className="mt-1 text-sm text-white/80">{sub.blurb || ''}</p>
        </div>
      </div>
      {/* No sub.apps in DB listing; pills removed to avoid runtime errors */}
    </motion.button>
  );
}

function AppCard({ app, resolvedIcon: ResolvedIcon, onOpenPreview, storeStyle = false }) {
  const [open, setOpen] = useState(false);
  if (storeStyle) {
    const isRich = !!app.iconId;
    return (
      <motion.div layout transition={spring} className="group relative w-full overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-4">
        <div className="flex items-center gap-3">
          <div className={`h-16 w-16 ${isRich ? 'grid place-items-center' : 'overflow-hidden'} rounded-2xl ${isRich ? '' : 'border border-white/10'} ${isRich ? '' : 'bg-white/10'}`}>
            {app.iconId ? (
              <IconifyIcon icon={app.iconId} width={36} height={36} />
            ) : (
              <div className="grid h-full w-full place-items-center">
                <ResolvedIcon className="h-6 w-6 opacity-80" />
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="truncate text-sm font-medium">{app.name}</div>
                <div className="truncate text-xs text-white/70">{app.desc || 'App'}</div>
              </div>
              <div className="shrink-0 flex items-center gap-2">
                <a
                  href={app.publicUrl || '#'}
                  target={app.publicUrl ? "_blank" : undefined}
                  rel={app.publicUrl ? "noreferrer" : undefined}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium ${app.publicUrl ? 'bg-white text-slate-900' : 'bg-white/10 text-white/60 border border-white/10 cursor-not-allowed'}`}
                  onClick={(e)=>{ if(!app.publicUrl) e.preventDefault(); }}
                >Open</a>
                <button
                  onClick={onOpenPreview}
                  className="rounded-full border border-white/10 bg-white/10 px-2 py-1 text-xs hover:bg-white/20"
                >Preview</button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }
  return (
    <motion.div
      layout
      className="group relative w-full overflow-hidden rounded-xl border border-white/10 bg-white/5 p-4 text-left outline-none transition hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-white/40"
      transition={spring}
    >
      <div className="flex items-start gap-3">
        <div className={`rounded-lg p-2 ${app.iconId ? '' : 'bg-white/10 backdrop-blur'}`}>
          {app.iconId ? (
            <IconifyIcon icon={app.iconId} width={18} height={18} />
          ) : (
            <ResolvedIcon className="h-5 w-5" />
          )}
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between gap-4">
            <h4 className="font-medium tracking-tight">{app.name}</h4>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setOpen((v) => !v)}
                className="rounded-full border border-white/10 bg-white/10 px-2 py-1 text-xs hover:bg-white/20"
                aria-expanded={open}
              >
                {open ? "Hide details" : "Show details"}
              </button>
              <button
                onClick={onOpenPreview}
                className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/10 px-2 py-1 text-xs hover:bg-white/20"
              >
                <ImagePlus className="h-3.5 w-3.5" /> Preview
              </button>
              {app.publicUrl && (
                <a
                  href={app.publicUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/10 px-2 py-1 text-xs hover:bg-white/20"
                >
                  Open
                </a>
              )}
            </div>
          </div>
          <p className="mt-1 text-sm text-white/80">{app.desc}</p>
          <AnimatePresence initial={false}>
            {open && (
              <motion.p
                key="details"
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.16 }}
                className="mt-3 rounded-md border border-white/10 bg-white/5 p-3 text-sm text-white/85"
              >
                {app.details}
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

// ---------- Preview Modal ----------
function PreviewModal({ open, onClose, app, mediaUrl, setMediaUrl, iconIndex, setIconIndex }) {
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={spring}
            className="relative z-10 w-full max-w-3xl overflow-hidden rounded-2xl border border-white/15 bg-slate-900 p-0 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-3">
              <div className="flex items-center gap-2 text-sm text-white/80">
                <Wand2 className="h-4 w-4" />
                <span>Preview & Customize</span>
              </div>
              <button
                onClick={onClose}
                className="rounded-full border border-white/10 bg-white/10 p-1.5 text-white/90 hover:bg-white/20"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid gap-0 p-5 md:grid-cols-2 md:gap-5">
              {/* Media Panel */}
              <div className="order-2 md:order-1">
                <div className="aspect-video w-full overflow-hidden rounded-xl border border-white/10 bg-white/5">
                  {mediaUrl ? (
                    mediaUrl.match(/\.(mp4|webm)$/i) ? (
                      <video src={mediaUrl} className="h-full w-full object-cover" controls autoPlay muted loop />
                    ) : (
                      <img src={mediaUrl} alt="App preview" className="h-full w-full object-cover" />
                    )
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-white/60">
                      <div className="text-center">
                        <ImagePlus className="mx-auto mb-2 h-6 w-6" />
                        <p className="text-sm">No preview yet</p>
                        <p className="text-xs">Paste a GIF/MP4/Image URL below</p>
                      </div>
                    </div>
                  )}
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <input
                    type="url"
                    placeholder="https://… (gif, mp4, webm, png, jpg)"
                    value={mediaUrl ?? ""}
                    onChange={(e) => setMediaUrl(e.target.value)}
                    className="min-w-0 flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none placeholder:text-white/40 focus:border-white/20"
                  />
                  <button
                    onClick={() => setMediaUrl("")}
                    className="rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-sm hover:bg-white/20"
                  >
                    Clear
                  </button>
                </div>
              </div>

              {/* Details & Icon panel */}
              <div className="order-1 md:order-2">
                <div className="flex items-center gap-3">
                  {React.createElement(altIconChoices[iconIndex % altIconChoices.length].Cmp, { className: "h-6 w-6" })}
                  <h3 className="text-lg font-semibold tracking-tight">{app?.name}</h3>
                </div>
                <p className="mt-2 text-sm text-white/80">{app?.desc}</p>
                <p className="mt-2 rounded-lg border border-white/10 bg-white/5 p-3 text-sm text-white/85">{app?.details}</p>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => setIconIndex((i) => (i + 1) % altIconChoices.length)}
                    className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-sm hover:bg-white/20"
                  >
                    <Shuffle className="h-4 w-4" /> Change icon
                  </button>
                  <Pill>ESC to close</Pill>
                  <Pill>GIF/MP4/Image supported</Pill>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ---------- Main Component ----------
export default function InteractiveExpansionPortfolio() {
  const [selectedCategory, setSelectedCategory] = useState(null); // { key, label }
  const [selectedSub, setSelectedSub] = useState(null); // { key, label }
  const [soundsOn, setSoundsOn] = useState(true);
  const { chimeExpand, chimeCollapse, chimeClick } = useChimes(soundsOn);

  // Preview modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalApp, setModalApp] = useState(null); // full app object
  const [modalAppId, setModalAppId] = useState(null);
  // Admin mode
  const [adminMode, setAdminMode] = useState(false);

  // DB data
  const [categories, setCategories] = useState([]); // [{catKey,name,tagline,gradient,iconKey,...}]
  const [subcategories, setSubcategories] = useState([]); // for selectedCategory
  const [apps, setApps] = useState([]); // for selectedSub
  const [layoutStyle, setLayoutStyle] = useState('classic'); // 'classic' | 'ios'
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorMode, setEditorMode] = useState('add');
  const [editorInitial, setEditorInitial] = useState(null);

  // Load categories on mount
  useEffect(() => {
    (async () => {
      try { const data = await apiListCategories(); setCategories(data); } catch (e) { console.error('listCategories failed', e); }
    })();
  }, []);

  // Deep link support: /library?cat=ai&sub=education
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search || '')
      const c = params.get('cat'); const s = params.get('sub')
      if (c) {
        handleSelectCategory(c, c.toUpperCase())
        if (s) {
          // slight delay to ensure subcategories loaded
          setTimeout(() => handleSelectSub(s, s.charAt(0).toUpperCase() + s.slice(1)), 60)
        }
      }
    } catch(_) {}
  }, [])

  const collapseAll = useCallback(() => {
    if (selectedSub || selectedCategory) chimeCollapse();
    setSelectedSub(null);
    setSelectedCategory(null);
    setSubcategories([]);
    setApps([]);
  }, [selectedSub, selectedCategory, chimeCollapse]);

  const onBack = useCallback(() => {
    if (selectedSub) {
      chimeCollapse();
      return setSelectedSub(null);
    }
    if (selectedCategory) {
      chimeCollapse();
      return setSelectedCategory(null);
    }
  }, [selectedCategory, selectedSub, chimeCollapse]);

  useKeyboardNav({ onBack, collapseAll });

  const path = [
    { key: "root", label: "Portfolio", level: 0 },
    ...(selectedCategory ? [{ key: selectedCategory.key, label: selectedCategory.label, level: 1 }] : []),
    ...(selectedSub ? [{ key: selectedSub.key, label: selectedSub.label, level: 2 }] : []),
  ];

  const handleSelectCategory = (dataKey, label) => {
    chimeExpand();
    setSelectedCategory({ key: dataKey, label });
    // fetch subcategories for this category
    (async () => {
      try { const data = await apiListSubcategories(dataKey); setSubcategories(data); } catch (e) { console.error('listSubcategories failed', e); }
    })();
  };
  const handleSelectSub = (subKey, label) => {
    chimeExpand();
    setSelectedSub({ key: subKey, label });
    // fetch apps for this sub
    (async () => {
      try { const data = await apiListApps(selectedCategory.key, subKey); setApps(data); } catch (e) { console.error('listApps failed', e); }
    })();
  };

  const openPreview = (catKey, subKey, app) => {
    chimeClick();
    const id = appId(catKey, subKey, app.name || app.slug);
    setModalApp(app);
    setModalAppId(id);
    setModalOpen(true);
  };

  return (
    <LayoutGroup>
      <div className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-100">
        {/* Ambient background */}
        <DecorativeBackground />

        <main className="relative mx-auto max-w-6xl px-4 pb-24 pt-10 md:px-6 md:pt-16">
          <HeaderControls
            onBack={onBack}
            collapseAll={collapseAll}
            hasBack={!!(selectedCategory || selectedSub)}
            soundsOn={soundsOn}
            setSoundsOn={setSoundsOn}
          />

          {/* Admin toggle */}
          <div className="mb-4 flex items-center gap-3 text-sm">
            <label className="inline-flex items-center gap-2 opacity-80">
              <input type="checkbox" checked={adminMode} onChange={(e) => setAdminMode(e.target.checked)} />
              <span>Admin mode</span>
            </label>
            <div className="ml-auto flex items-center gap-2 opacity-90">
              <span className="text-xs">Layout</span>
              <div className="inline-flex rounded-full border border-white/10 bg-white/10 p-0.5">
                <button
                  onClick={() => setLayoutStyle('classic')}
                  className={`rounded-full px-2 py-1 text-xs ${layoutStyle==='classic'?'bg-white/20':''}`}
                >Classic</button>
                <button
                  onClick={() => setLayoutStyle('ios')}
                  className={`rounded-full px-2 py-1 text-xs ${layoutStyle==='ios'?'bg-white/20':''}`}
                >iOS</button>
              </div>
            </div>
          </div>

          <Breadcrumb
            path={path}
            onCrumb={(i) => {
              if (i === 0) collapseAll();
              if (i === 1 && selectedSub) setSelectedSub(null);
            }}
          />

          {/* Layer 0: Categories */}
          {!selectedCategory && (
            <motion.section
              key="cats"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className="grid grid-cols-1 gap-5 sm:grid-cols-2"
            >
              {categories.map((c) => (
                <CategoryCard
                  key={c.catKey}
                  name={c.name}
                  data={{ key: c.catKey, gradient: c.gradient, tagline: c.tagline, icon: iconFromKey(c.iconKey) }}
                  selected={false}
                  onSelect={() => handleSelectCategory(c.catKey, c.name)}
                />
              ))}
            </motion.section>
          )}

          {/* Layer 1: Subcategories */}
          {selectedCategory && !selectedSub && (
            <CategoryExpandView
              selectedCategory={selectedCategory}
              setSelectedCategory={setSelectedCategory}
              setSelectedSub={(obj) => handleSelectSub(obj.key, obj.label)}
              subcategories={subcategories}
              adminMode={adminMode}
            />
          )}

          {/* Layer 2: Apps */}
          {selectedCategory && selectedSub && (
            <SubcategoryExpandView
              selectedCategory={selectedCategory}
              selectedSub={selectedSub}
              setSelectedSub={setSelectedSub}
              openPreview={(app) => openPreview(selectedCategory.key, selectedSub.key, app)}
              apps={apps}
              adminMode={adminMode}
              layoutStyle={layoutStyle}
              onOpenAdd={() => { setEditorMode('add'); setEditorInitial({}); setEditorOpen(true); }}
              onOpenEdit={(app) => { setEditorMode('edit'); setEditorInitial(app); setEditorOpen(true); }}
              onDeleteApp={async (slug) => {
                await apiDeleteApp(selectedCategory.key, selectedSub.key, slug);
                const data = await apiListApps(selectedCategory.key, selectedSub.key); setApps(data);
              }}
            />
          )}
        </main>

        {/* Preview Modal */}
        <PreviewModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          app={modalApp}
          mediaUrl={modalApp?.mediaUrl}
          setMediaUrl={async (url) => {
            if (!modalApp) return;
            const slug = modalApp.slug || slugify(modalApp.name);
            await apiUpdateApp(selectedCategory.key, selectedSub.key, slug, { mediaUrl: url });
            const data = await apiListApps(selectedCategory.key, selectedSub.key); setApps(data);
            setModalApp((a) => a ? { ...a, mediaUrl: url } : a);
          }}
          iconIndex={modalApp?.iconIndex ?? 0}
          setIconIndex={async (fnOrVal) => {
            if (!modalApp) return;
            const slug = modalApp.slug || slugify(modalApp.name);
            const next = typeof fnOrVal === 'function' ? fnOrVal(modalApp?.iconIndex ?? 0) : fnOrVal;
            await apiUpdateApp(selectedCategory.key, selectedSub.key, slug, { iconIndex: next });
            const data = await apiListApps(selectedCategory.key, selectedSub.key); setApps(data);
            setModalApp((a) => a ? { ...a, iconIndex: next } : a);
          }}
        />
      </div>
      {/* App Editor Modal */}
      <AppEditorModal
        open={editorOpen}
        mode={editorMode}
        initial={editorInitial}
        onClose={() => setEditorOpen(false)}
        onSave={async (vals) => {
          if (editorMode === 'add') {
            await apiCreateApp({
              catKey: selectedCategory.key,
              subKey: selectedSub.key,
              name: vals.name,
              desc: vals.desc,
              details: vals.details,
              mediaUrl: vals.mediaUrl,
              thumbUrl: vals.thumbUrl,
              publicUrl: vals.publicUrl,
              iconIndex: vals.iconIndex,
              iconId: vals.iconId,
              iconSource: vals.iconSource,
              iconUploadUrl: vals.iconUploadUrl,
            })
          } else if (editorMode === 'edit' && editorInitial) {
            const slug = editorInitial.slug || slugify(editorInitial.name)
            await apiUpdateApp(selectedCategory.key, selectedSub.key, slug, {
              name: vals.name,
              desc: vals.desc,
              details: vals.details,
              mediaUrl: vals.mediaUrl,
              thumbUrl: vals.thumbUrl,
              publicUrl: vals.publicUrl,
              iconIndex: vals.iconIndex,
              iconId: vals.iconId,
              iconSource: vals.iconSource,
              iconUploadUrl: vals.iconUploadUrl,
            })
          }
          const data = await apiListApps(selectedCategory.key, selectedSub.key)
          setApps(data)
        }}
      />
    </LayoutGroup>
  );
}

function HeaderControls({ onBack, collapseAll, hasBack, soundsOn, setSoundsOn }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        {hasBack && (
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-sm backdrop-blur transition hover:bg-white/20"
          >
            <ChevronLeft className="h-4 w-4" /> Back
          </button>
        )}
        <Toggle on={soundsOn} onClick={() => setSoundsOn((v) => !v)} labelOn="Sound" labelOff="Muted" />
      </div>
      <div className="flex items-center gap-2 text-xs text-white/70">
        <span className="hidden sm:inline">Keyboard: ESC = collapse/modal, Backspace/← = back</span>
      </div>
      <div className="w-full sm:w-[88px] sm:text-right">
        <button
          onClick={collapseAll}
          className="w-full inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-sm backdrop-blur transition hover:bg-white/20"
        >
          Reset
        </button>
      </div>
    </div>
  );
}

function CategoryExpandView({ selectedCategory, setSelectedCategory, setSelectedSub, subcategories, adminMode }) {
  const catMeta = useMemo(() => {
    return { name: selectedCategory.label, key: selectedCategory.key };
  }, [selectedCategory]);

  // For banner, we need gradient/icon; fetch from current categories list if we had it; fallback visuals.
  const Icon = Brain;
  const gradient = 'from-slate-700 to-slate-900';

  return (
    <section className="relative">
      <motion.div
        layoutId={`cat-${selectedCategory.key}`}
        transition={spring}
        className={`relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br ${gradient} p-6 shadow-2xl`}
      >
        <CloseButton onClick={() => setSelectedCategory(null)} />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_-10%,rgba(255,255,255,0.15),transparent_35%),radial-gradient(circle_at_80%_-20%,rgba(255,255,255,0.12),transparent_35%)]" />
        <div className="relative flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">{catMeta.name}</h2>
            <p className="mt-2 max-w-2xl text-sm/6 opacity-90">Select a subcategory to view apps.</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Pill>Choose a subcategory</Pill>
              <Pill>Click again to view apps</Pill>
            </div>
          </div>
          <div className="-mr-1 -mt-1 shrink-0 rounded-2xl bg-white/10 p-3 backdrop-blur">
            <Icon className="h-8 w-8" />
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, delay: 0.02 }}
        className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3"
      >
        {subcategories.map((sub) => (
          <SubcategoryCard
            key={sub.subKey}
            catKey={selectedCategory.key}
            sub={sub}
            onSelect={() => setSelectedSub({ key: sub.subKey || sub.key, label: sub.name })}
          />
        ))}
      </motion.div>
    </section>
  );
}

function SubcategoryExpandView({ selectedCategory, selectedSub, setSelectedSub, openPreview, apps, adminMode, layoutStyle, onOpenAdd, onOpenEdit, onDeleteApp }) {
  const catName = selectedCategory.label;
  const sub = { key: selectedSub.key, name: selectedSub.label, blurb: '' };
  const CatIcon = Brain;
  const SubIcon = Sparkles;

  return (
    <section className="relative">
      <motion.div
        layoutId={`sub-${selectedCategory.key}-${selectedSub.key}`}
        transition={spring}
        className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl"
      >
        <CloseButton onClick={() => setSelectedSub(null)} label="Collapse subcategory" />
        <div className="relative flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-3">
              <span className={`inline-flex items-center gap-2 rounded-xl border border-white/10 bg-gradient-to-br from-slate-700 to-slate-900 px-3 py-1.5 text-sm font-medium shadow-lg`}> 
                <CatIcon className="h-4 w-4" /> {catName}
              </span>
              <span className="text-white/50">→</span>
              <span className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/10 px-3 py-1.5 text-sm">
                <SubIcon className="h-4 w-4" /> {sub.name}
              </span>
            </div>
            <h3 className="text-xl font-semibold tracking-tight md:text-2xl">{sub.name} Apps</h3>
            <p className="mt-2 max-w-2xl text-sm/6 text-white/85">{sub.blurb || 'Manage and preview apps in this subcategory.'}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Pill>Open Preview to attach GIF</Pill>
              <Pill>Tap cards for details</Pill>
              {adminMode && <Pill>Admin: add/edit/delete apps</Pill>}
            </div>
          </div>
        </div>
      </motion.div>

      {adminMode && (
        <div className="mt-4 flex items-center justify-end">
          <button
            onClick={onOpenAdd}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-sm hover:bg-white/20"
          >
            + Add App
          </button>
        </div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28 }}
        className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3"
      >
        {apps.map((app) => {
          const slug = app.slug || slugify(app.name);
          const altIdx = app.iconIndex ?? 0;
          const ResolvedIcon = altIconChoices[altIdx % altIconChoices.length].Cmp || Sparkles;
          return (
            <div key={slug} className="relative">
              <AppCard
                app={app}
                resolvedIcon={ResolvedIcon}
                onOpenPreview={() => openPreview(app)}
                storeStyle={layoutStyle === 'ios'}
              />
              {adminMode && (
                <div className="absolute right-3 top-3 flex gap-2">
                  <button
                    onClick={() => onOpenEdit(app)}
                    className="rounded-full border border-white/10 bg-white/10 px-2 py-1 text-xs hover:bg-white/20"
                  >
                    Edit
                  </button>
                  <button
                    onClick={async () => {
                      if (!confirm(`Delete app "${app.name}"?`)) return;
                      await onDeleteApp(slug);
                    }}
                    className="rounded-full border border-rose-300/30 bg-rose-500/10 px-2 py-1 text-xs text-rose-200 hover:bg-rose-500/20"
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </motion.div>
    </section>
  );
}

// ---------- Background ----------
function DecorativeBackground() {
  return (
    <>
      {/* Soft vignette */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(1200px_600px_at_50%_0%,rgba(56,189,248,0.08),transparent),radial-gradient(800px_400px_at_10%_40%,rgba(244,114,182,0.08),transparent),radial-gradient(900px_600px_at_90%_20%,rgba(59,130,246,0.08),transparent)]" />
      {/* Grid overlay */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:40px_40px] opacity-20" />
    </>
  );
}

// Icon mapping helper
const ICON_MAP = { Brain, Sparkles, GraduationCap, Stethoscope, HeartPulse, ImageIcon, Battery, Leaf, Sun, Target, Timer, NotebookPen, Dumbbell, Compass, Infinity };
function iconFromKey(key) {
  return ICON_MAP[key] || Brain;
}

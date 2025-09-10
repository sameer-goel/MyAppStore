import React, { useMemo, useState } from 'react'
import VariantA from './VariantA.jsx'
import VariantB from './VariantB.jsx'
import VariantC from './VariantC.jsx'
import VariantD from './VariantD.jsx'
import VariantE from './VariantE.jsx'

function initialVariant() {
  if (typeof window === 'undefined') return 'e'
  const p = window.location.pathname
  const h = window.location.hash
  const q = new URLSearchParams(window.location.search)
  const qp = (q.get('variant') || '').toLowerCase()
  if (/\/landing\/a$/.test(p) || h.includes('#/landing/a') || qp === 'a') return 'a'
  if (/\/landing\/b$/.test(p) || h.includes('#/landing/b') || qp === 'b') return 'b'
  if (/\/landing\/c$/.test(p) || h.includes('#/landing/c') || qp === 'c') return 'c'
  if (/\/landing\/d$/.test(p) || h.includes('#/landing/d') || qp === 'd') return 'd'
  if (/\/landing\/e$/.test(p) || h.includes('#/landing/e') || qp === 'e') return 'e'
  // default to E (Sci‑Fi Glass)
  return 'e'
}

export default function Landing() {
  const [variant, setVariant] = useState(initialVariant())

  const Switcher = useMemo(() => (
    <div className="fixed right-4 top-4 z-50">
      <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 p-0.5 text-sm backdrop-blur">
        <span className="hidden md:inline text-white/70 pl-2">Layout</span>
        <div className="inline-flex rounded-full">
          <button
            onClick={() => setVariant('d')}
            className={`rounded-full px-3 py-1 ${variant==='d'?'bg-white text-slate-900':'text-white/80'}`}
            title="Category rails"
          >Rails</button>
          <button
            onClick={() => setVariant('b')}
            className={`rounded-full px-3 py-1 ${variant==='b'?'bg-white text-slate-900':'text-white/80'}`}
            title="Recent apps grid"
          >Recent</button>
        </div>
      </div>
    </div>
  ), [variant])

  // Only show switcher for B/D; E is standalone preview
  if (variant === 'e') return <VariantE />
  return (<>
    {Switcher}
    {variant === 'b' ? <VariantB /> : <VariantD />}
  </>)
}

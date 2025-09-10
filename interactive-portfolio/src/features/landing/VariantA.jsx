import React from 'react'
import { motion } from 'framer-motion'

const spring = { type: 'spring', stiffness: 260, damping: 28, mass: 0.8 }

export default function VariantA() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-100">
      <DecorativeBackground />
      <header className="mx-auto max-w-6xl px-4 pt-14 md:px-6 md:pt-20">
        <motion.h1 layout transition={spring} className="text-3xl font-semibold tracking-tight md:text-5xl">
          AI Solutions Library
        </motion.h1>
        <motion.p layout transition={spring} className="mt-3 max-w-2xl text-white/80">
          Curated apps and interactive experiences. Explore recently added apps, browse categories, and jump straight into live demos.
        </motion.p>
        <div className="mt-6 flex flex-wrap gap-3">
          <a href="/store" className="rounded-full bg-white px-4 py-2 text-sm font-medium text-slate-900">Open App Store</a>
          <a href="/" className="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm hover:bg-white/20">Explore Portfolio</a>
          <a href="/icons" className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm hover:bg-white/10">Icons Lab</a>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-10 md:px-6">
        <section className="mt-6">
          <h2 className="mb-3 text-lg font-medium">Highlights</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {[
              {
                title: 'Interactive Portfolio',
                desc: 'A layered view from categories to apps with smooth motion and previews.',
                href: '/',
              },
              {
                title: 'Recently Added',
                desc: 'Browse new and active apps with direct links.',
                href: '/store',
              },
              {
                title: 'Token‑Branded Icons',
                desc: 'Rich icons integrated across the experience.',
                href: '/icons',
              },
            ].map((c) => (
              <a key={c.title} href={c.href} className="rounded-2xl border border-white/10 bg-white/5 p-5 transition hover:bg-white/10">
                <div className="text-base font-semibold">{c.title}</div>
                <div className="mt-2 text-sm text-white/80">{c.desc}</div>
              </a>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}

function DecorativeBackground() {
  return (
    <>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(1200px_600px_at_50%_0%,rgba(56,189,248,0.08),transparent),radial-gradient(800px_400px_at_10%_40%,rgba(244,114,182,0.08),transparent),radial-gradient(900px_600px_at_90%_20%,rgba(59,130,246,0.08),transparent)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:40px_40px] opacity-20" />
    </>
  )
}


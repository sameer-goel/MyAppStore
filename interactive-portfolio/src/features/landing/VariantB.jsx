import React, { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Icon as IconifyIcon } from '@iconify/react'
import { listCategories, listSubcategories, listApps } from '../../data/api.js'

const spring = { type: 'spring', stiffness: 260, damping: 28, mass: 0.8 }

export default function VariantB() {
  const [apps, setApps] = useState([])
  useEffect(() => { (async () => {
    const cats = await listCategories()
    const results = []
    await Promise.all(cats.map(async (c) => {
      const subs = await listSubcategories(c.catKey)
      await Promise.all(subs.map(async (s) => {
        const a = await listApps(c.catKey, s.subKey)
        a.forEach(x => results.push({ ...x, cName: c.name, sName: s.name }))
      }))
    }))
    const byDate = (x) => Date.parse(x.updatedAt || x.createdAt || 0) || 0
    setApps(results.sort((a,b)=> byDate(b) - byDate(a)).slice(0,9))
  })().catch(console.error) }, [])

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-100">
      <header className="mx-auto max-w-6xl px-4 pt-14 md:px-6 md:pt-20">
        <div className="flex items-start gap-4 md:gap-5">
          <div className="grid h-14 w-14 place-items-center rounded-2xl border border-white/10 bg-white/5 md:h-16 md:w-16">
            {/* Logo icon; change token if you prefer */}
            <IconifyIcon icon="token-branded:eth" width={28} height={28} />
          </div>
          <div>
            <h1 className="text-3xl font-semibold tracking-tight md:text-5xl">Discover. Build. Launch.</h1>
            <p className="mt-2 max-w-2xl text-white/80">A fast entry to what’s new. Open live apps or dive into the full library.</p>
            <div className="mt-4 flex flex-wrap gap-3">
              <a href="/store" className="rounded-full bg-white px-4 py-2 text-sm font-medium text-slate-900">Recently Added</a>
              <a href="/" className="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm hover:bg-white/20">Explore Library</a>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-10 md:px-6">
        <motion.section layout transition={spring}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
            {apps.map(app => (
              <a
                key={`${app.catKey}/${app.subKey}/${app.slug || app.name}`}
                href={app.publicUrl || '/store'}
                target={app.publicUrl ? '_blank' : undefined}
                rel={app.publicUrl ? 'noreferrer' : undefined}
                className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-4 transition hover:bg-white/10"
              >
                <div className="flex items-start gap-4">
                  <div className="grid h-16 w-16 place-items-center rounded-2xl">
                    {app.iconId ? (
                      <IconifyIcon icon={app.iconId} width={36} height={36} />
                    ) : (
                      <div className="h-6 w-6 rounded bg-white/10" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate font-medium">{app.name}</div>
                        <div className="mt-1 text-sm text-white/70">{app.desc || 'App'}</div>
                      </div>
                      <span
                        className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${app.publicUrl ? 'bg-emerald-400 text-emerald-950' : 'border border-white/10 bg-white/5 text-white/60'}`}
                      >
                        {app.publicUrl ? 'Open' : 'Coming soon'}
                      </span>
                    </div>
                    <div className="mt-2 text-[10px] text-white/50">{app.cName} • {app.sName}</div>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </motion.section>
      </main>
    </div>
  )
}

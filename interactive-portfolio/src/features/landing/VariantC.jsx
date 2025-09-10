import React, { useEffect, useState } from 'react'
import { Icon as IconifyIcon } from '@iconify/react'
import { listCategories, listSubcategories, listApps } from '../../data/api.js'

export default function VariantC() {
  const [icons, setIcons] = useState([])
  useEffect(() => { (async () => {
    const cats = await listCategories()
    const picks = []
    for (const c of cats) {
      const subs = await listSubcategories(c.catKey)
      for (const s of subs) {
        const a = await listApps(c.catKey, s.subKey)
        a.slice(0, 2).forEach(x => picks.push(x))
      }
    }
    setIcons(picks.slice(0, 18))
  })().catch(console.error) }, [])

  return (
    <div className="relative min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 px-4 py-14 md:grid-cols-2 md:px-6 md:py-20">
        <div>
          <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">Ship delightful AI apps.</h1>
          <p className="mt-4 max-w-prose text-white/80">A living catalog of small, useful AI tools. Browse the library, open live apps, or explore what’s coming next.</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a href="/store" className="rounded-full bg-white px-4 py-2 text-sm font-medium text-slate-900">Open Store</a>
            <a href="/" className="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm hover:bg-white/20">Explore Library</a>
          </div>
        </div>
        <div className="grid grid-cols-6 gap-3 self-start rounded-3xl border border-white/10 bg-white/5 p-6 md:grid-cols-6">
          {icons.map((a, i) => (
            <div key={i} className="grid h-14 w-14 place-items-center rounded-2xl">
              {a.iconId ? <IconifyIcon icon={a.iconId} width={28} height={28} /> : <div className="h-6 w-6 rounded bg-white/10" />}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}


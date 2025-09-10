import React, { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Icon as IconifyIcon } from '@iconify/react'
import { listCategories, listSubcategories, listApps } from '../../data/api.js'
import { altIconChoices } from '../../icons.js'

const spring = { type: 'spring', stiffness: 260, damping: 28, mass: 0.8 }

function slugify(s){ return (s||'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'') }

function AppStoreCard({ app }) {
  const hasThumb = !!app.thumbUrl
  const ResolvedIcon = altIconChoices[(app.iconIndex ?? 0) % altIconChoices.length]?.Cmp
  return (
    <motion.div layout transition={spring} className="group relative w-full overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="flex items-center gap-3">
        {(() => {
          const isRich = !!app.iconId;
          return (
            <div className={`h-16 w-16 ${isRich ? 'grid place-items-center' : 'overflow-hidden'} rounded-2xl ${isRich ? '' : 'border border-white/10'} ${isRich ? '' : 'bg-white/10'}`}>
              {app.iconId ? (
                <IconifyIcon icon={app.iconId} width={36} height={36} />
              ) : (
                <div className="grid h-full w-full place-items-center">
                  {ResolvedIcon ? <ResolvedIcon className="h-6 w-6 opacity-80" /> : null}
                </div>
              )}
            </div>
          );
        })()}
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="truncate text-sm font-medium">{app.name}</div>
              <div className="truncate text-xs text-white/70">{app.desc || 'App'}</div>
              <div className="mt-1 text-[10px] text-white/50">{app.categoryName} • {app.subcategoryName}</div>
            </div>
            <div className="shrink-0">
              <a
                href={app.publicUrl || '#'}
                target={app.publicUrl ? "_blank" : undefined}
                rel={app.publicUrl ? "noreferrer" : undefined}
                className={`rounded-full px-3 py-1.5 text-xs font-medium ${app.publicUrl ? 'bg-white text-slate-900' : 'bg-white/10 text-white/60 border border-white/10 cursor-not-allowed'}`}
                onClick={(e)=>{ if(!app.publicUrl) e.preventDefault(); }}
              >Open</a>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )}

export default function AppStoreView(){
  const [allApps, setAllApps] = useState([])
  const [cats, setCats] = useState([])
  const [selectedCat, setSelectedCat] = useState('all')
  const [selectedSub, setSelectedSub] = useState('all')
  const [subsForCat, setSubsForCat] = useState([])
  const [query, setQuery] = useState('')

  useEffect(() => { (async () => {
    // Load categories, then subs and apps in parallel
    const catList = await listCategories()
    setCats(catList)
    const subsByCat = await Promise.all(catList.map(c => listSubcategories(c.catKey).then(s => ({ cat: c, subs: s }))))
    const apps = []
    await Promise.all(subsByCat.map(async ({ cat, subs }) => {
      await Promise.all(subs.map(async s => {
        const a = await listApps(cat.catKey, s.subKey)
        a.forEach(x => apps.push({
          ...x,
          categoryKey: cat.catKey,
          categoryName: cat.name,
          subcategoryKey: s.subKey,
          subcategoryName: s.name,
          key: `${cat.catKey}/${s.subKey}/${x.slug || slugify(x.name)}`
        }))
      }))
    }))
    setAllApps(apps)
  })().catch(console.error) }, [])

  useEffect(() => {
    if (selectedCat === 'all') { setSubsForCat([]); setSelectedSub('all'); return }
    const cat = cats.find(c => c.catKey === selectedCat)
    if (!cat) { setSubsForCat([]); setSelectedSub('all'); return }
    ;(async () => { const s = await listSubcategories(selectedCat); setSubsForCat(s) })().catch(console.error)
  }, [selectedCat, cats])

  const filtered = useMemo(() => {
    return allApps.filter(a => {
      if (selectedCat !== 'all' && a.categoryKey !== selectedCat) return false
      if (selectedSub !== 'all' && a.subcategoryKey !== selectedSub) return false
      if (query.trim()) {
        const q = query.trim().toLowerCase()
        const blob = `${a.name} ${a.desc||''} ${a.details||''}`.toLowerCase()
        if (!blob.includes(q)) return false
      }
      return true
    })
  }, [allApps, selectedCat, selectedSub, query])

  const recentlyAdded = useMemo(() => {
    const withUrl = filtered.filter(a => !!a.publicUrl)
    const byDate = (x) => Date.parse(x.updatedAt || x.createdAt || 0) || 0
    return withUrl.sort((a,b) => byDate(b) - byDate(a))
  }, [filtered])

  const comingSoon = useMemo(() => filtered.filter(a => !a.publicUrl), [filtered])

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="mx-auto max-w-6xl px-4 py-6 md:px-6">
        <h1 className="text-2xl font-semibold">App Store</h1>
        <p className="text-sm text-white/70">All apps across categories, in an iOS-style grid.</p>
        <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
          <select value={selectedCat} onChange={(e)=>{ setSelectedCat(e.target.value); setSelectedSub('all') }} className="rounded-md border border-white/10 bg-white/10 px-2 py-1">
            <option value="all">All Categories</option>
            {cats.map(c => <option key={c.catKey} value={c.catKey}>{c.name}</option>)}
          </select>
          <select value={selectedSub} onChange={(e)=> setSelectedSub(e.target.value)} disabled={selectedCat==='all'} className="rounded-md border border-white/10 bg-white/10 px-2 py-1 disabled:opacity-40">
            <option value="all">All Subcategories</option>
            {subsForCat.map(s => <option key={s.subKey} value={s.subKey}>{s.name}</option>)}
          </select>
          <input value={query} onChange={(e)=> setQuery(e.target.value)} placeholder="Search apps" className="min-w-[220px] flex-1 rounded-md border border-white/10 bg-white/10 px-3 py-1.5 text-sm outline-none placeholder:text-white/40 focus:border-white/20" />
          <a className="ml-auto text-xs underline opacity-80 hover:opacity-100" href="#" onClick={(e)=>{e.preventDefault(); window.history.back()}}>Back</a>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-8 px-4 pb-16 md:px-6">
        <section>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-lg font-medium">Recently Added</h2>
            <div className="text-xs text-white/60">Active apps with public links</div>
          </div>
          <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2">
            {recentlyAdded.map(app => (
              <div key={app.key} className="w-[320px] shrink-0 snap-start">
                <AppStoreCard app={app} />
              </div>
            ))}
            {!recentlyAdded.length && (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center text-sm text-white/70">No active apps yet.</div>
            )}
          </div>
        </section>

        <section>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-lg font-medium">Coming Soon</h2>
            <div className="text-xs text-white/60">Apps without public link</div>
          </div>
          <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2">
            {comingSoon.map(app => (
              <div key={app.key} className="w-[320px] shrink-0 snap-start">
                <AppStoreCard app={app} />
              </div>
            ))}
            {!comingSoon.length && (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center text-sm text-white/70">All apps are active.</div>
            )}
          </div>
        </section>
      </main>
    </div>
  )
}

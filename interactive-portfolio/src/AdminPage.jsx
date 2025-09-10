import React, { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { listCategories, listSubcategories, listApps, createCategory, updateCategory, deleteCategory, createSubcategory, updateSubcategory, deleteSubcategory } from './data/api.js'
import AppEditorModal from './AppEditorModal.jsx'
import { createApp as apiCreateApp, updateApp as apiUpdateApp, deleteApp as apiDeleteApp } from './data/api.js'
import { Icon as IconifyIcon } from '@iconify/react'

const spring = { type: 'spring', stiffness: 260, damping: 28, mass: 0.8 }

export default function AdminPage() {
  const [cats, setCats] = useState([])
  const [subs, setSubs] = useState([])
  const [apps, setApps] = useState([])
  const [selCat, setSelCat] = useState(null) // {catKey,name}
  const [selSub, setSelSub] = useState(null) // {subKey,name}

  const [appEditorOpen, setAppEditorOpen] = useState(false)
  const [appEditorMode, setAppEditorMode] = useState('add')
  const [appEditorInitial, setAppEditorInitial] = useState(null)

  useEffect(() => { (async () => { setCats(await listCategories()) })().catch(console.error) }, [])

  useEffect(() => { (async () => {
    if (!selCat) { setSubs([]); return }
    setSubs(await listSubcategories(selCat.catKey))
  })().catch(console.error) }, [selCat])

  useEffect(() => { (async () => {
    if (!selCat || !selSub) { setApps([]); return }
    setApps(await listApps(selCat.catKey, selSub.subKey))
  })().catch(console.error) }, [selCat, selSub])

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="mx-auto max-w-6xl px-4 py-6 md:px-6">
        <h1 className="text-2xl font-semibold">Admin — Portfolio</h1>
        <p className="text-sm text-white/70">Manage categories, subcategories, and apps</p>
      </header>
      <main className="mx-auto grid max-w-6xl grid-cols-1 gap-4 px-4 pb-10 md:grid-cols-3 md:px-6">
        {/* Categories */}
        <motion.section layout transition={spring} className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-medium">Categories</h2>
            <button className="rounded-md border border-white/10 bg-white/10 px-2 py-1 text-sm hover:bg-white/20"
              onClick={async () => {
                const catKey = prompt('New category key (slug)')?.trim()
                const name = catKey ? prompt('Category name')?.trim() : null
                if (!catKey || !name) return
                await createCategory({ catKey, name, tagline: '', gradient: 'from-slate-700 to-slate-900', iconKey: 'Brain', order: 0 })
                setCats(await listCategories())
              }}>+ Add</button>
          </div>
          <ul className="space-y-1">
            {cats.map(c => (
              <li key={c.catKey} className={`flex items-center justify-between rounded-md px-2 py-1 ${selCat?.catKey===c.catKey?'bg-white/10':''}`}>
                <button onClick={() => { setSelCat({ catKey: c.catKey, name: c.name }); setSelSub(null) }} className="truncate text-left">{c.name}</button>
                <div className="shrink-0 space-x-2">
                  <button className="rounded border border-white/10 px-2 py-0.5 text-xs hover:bg-white/10" onClick={async ()=>{
                    const name = prompt('Edit name', c.name) ?? c.name
                    const tagline = prompt('Edit tagline', c.tagline||'') ?? (c.tagline||'')
                    await updateCategory(c.catKey, { name, tagline })
                    setCats(await listCategories())
                  }}>Edit</button>
                  <button className="rounded border border-rose-300/30 bg-rose-500/10 px-2 py-0.5 text-xs text-rose-200 hover:bg-rose-500/20" onClick={async ()=>{
                    if (!confirm('Delete category? This will fail if it has subcategories.')) return
                    try { await deleteCategory(c.catKey) } catch (e) { alert(e?.message||'Delete failed'); return }
                    if (selCat?.catKey===c.catKey) { setSelCat(null); setSubs([]); setApps([]) }
                    setCats(await listCategories())
                  }}>Del</button>
                </div>
              </li>
            ))}
          </ul>
        </motion.section>

        {/* Subcategories */}
        <motion.section layout transition={spring} className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-medium">Subcategories</h2>
            <button disabled={!selCat} className="rounded-md border border-white/10 bg-white/10 px-2 py-1 text-sm disabled:opacity-40 hover:bg-white/20"
              onClick={async () => {
                if (!selCat) return
                const subKey = prompt('New subcategory key (slug)')?.trim()
                const name = subKey ? prompt('Subcategory name')?.trim() : null
                if (!subKey || !name) return
                await createSubcategory({ catKey: selCat.catKey, subKey, name, blurb: '', iconKey: 'Sparkles', order: 0 })
                setSubs(await listSubcategories(selCat.catKey))
              }}>+ Add</button>
          </div>
          {!selCat && <p className="text-sm text-white/60">Select a category</p>}
          <ul className="space-y-1">
            {subs.map(s => (
              <li key={s.subKey} className={`flex items-center justify-between rounded-md px-2 py-1 ${selSub?.subKey===s.subKey?'bg-white/10':''}`}>
                <button onClick={() => setSelSub({ subKey: s.subKey, name: s.name })} className="truncate text-left">{s.name}</button>
                <div className="shrink-0 space-x-2">
                  <button className="rounded border border-white/10 px-2 py-0.5 text-xs hover:bg-white/10" onClick={async ()=>{
                    const name = prompt('Edit name', s.name) ?? s.name
                    const blurb = prompt('Edit blurb', s.blurb||'') ?? (s.blurb||'')
                    await updateSubcategory(selCat.catKey, s.subKey, { name, blurb })
                    setSubs(await listSubcategories(selCat.catKey))
                  }}>Edit</button>
                  <button className="rounded border border-rose-300/30 bg-rose-500/10 px-2 py-0.5 text-xs text-rose-200 hover:bg-rose-500/20" onClick={async ()=>{
                    if (!confirm('Delete subcategory? This will fail if it has apps.')) return
                    try { await deleteSubcategory(selCat.catKey, s.subKey) } catch (e) { alert(e?.message||'Delete failed'); return }
                    if (selSub?.subKey===s.subKey) { setSelSub(null); setApps([]) }
                    setSubs(await listSubcategories(selCat.catKey))
                  }}>Del</button>
                </div>
              </li>
            ))}
          </ul>
        </motion.section>

        {/* Apps */}
        <motion.section layout transition={spring} className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-medium">Apps</h2>
            <button disabled={!selSub} className="rounded-md border border-white/10 bg-white/10 px-2 py-1 text-sm disabled:opacity-40 hover:bg-white/20"
              onClick={() => { setAppEditorMode('add'); setAppEditorInitial({}); setAppEditorOpen(true) }}>+ Add</button>
          </div>
          {!selSub && <p className="text-sm text-white/60">Select a subcategory</p>}
          <ul className="space-y-2">
            {apps.map(a => (
              <li key={a.slug || a.name} className="flex items-start justify-between rounded-md border border-white/10 bg-white/5 p-2">
                <div className="flex items-start gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-md border border-white/10 bg-white/5">
                    {a.iconId ? (
                      <IconifyIcon icon={a.iconId} width={18} height={18} />
                    ) : (
                      <div className="h-3 w-3 rounded bg-white/10" />
                    )}
                  </div>
                  <div>
                    <div className="font-medium">{a.name}</div>
                    <div className="text-xs text-white/70">{a.desc}</div>
                  </div>
                </div>
                <div className="shrink-0 space-x-2">
                  <button className="rounded border border-white/10 px-2 py-0.5 text-xs hover:bg-white/10" onClick={()=>{ setAppEditorMode('edit'); setAppEditorInitial(a); setAppEditorOpen(true) }}>Edit</button>
                  <button className="rounded border border-rose-300/30 bg-rose-500/10 px-2 py-0.5 text-xs text-rose-200 hover:bg-rose-500/20" onClick={async ()=>{
                    if (!confirm('Delete app?')) return
                    const slug = a.slug || (a.name||'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'')
                    await apiDeleteApp(selCat.catKey, selSub.subKey, slug)
                    setApps(await listApps(selCat.catKey, selSub.subKey))
                  }}>Del</button>
                </div>
              </li>
            ))}
          </ul>
        </motion.section>
      </main>

      <AppEditorModal
        open={appEditorOpen}
        mode={appEditorMode}
        initial={appEditorInitial}
        onClose={() => setAppEditorOpen(false)}
        onSave={async (vals) => {
          if (!selCat || !selSub) return
          if (appEditorMode === 'add') {
            await apiCreateApp({ catKey: selCat.catKey, subKey: selSub.subKey, ...vals })
          } else {
            const slug = appEditorInitial?.slug || (appEditorInitial?.name||'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'')
            await apiUpdateApp(selCat.catKey, selSub.subKey, slug, vals)
          }
          setApps(await listApps(selCat.catKey, selSub.subKey))
        }}
      />
    </div>
  )
}

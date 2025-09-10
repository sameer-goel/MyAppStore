import React, { useEffect, useMemo, useState, useRef } from 'react'
import { Icon as IconifyIcon } from '@iconify/react'
import { listCategories, listSubcategories, listApps } from '../../data/api.js'

function useRecentApps(limit = 9) {
  const [apps, setApps] = useState([])
  useEffect(() => {
    (async () => {
      const cats = (await listCategories()).slice().sort((a,b)=>{
        const ao = typeof a.order === 'number' ? a.order : 999
        const bo = typeof b.order === 'number' ? b.order : 999
        if (ao !== bo) return ao - bo
        return String(a.name||'').localeCompare(String(b.name||''))
      })
      const agg = []
      for (const c of cats) {
        const subs = (await listSubcategories(c.catKey)).slice().sort((a,b)=>{
          const ao = typeof a.order === 'number' ? a.order : 999
          const bo = typeof b.order === 'number' ? b.order : 999
          if (ao !== bo) return ao - bo
          return String(a.name||'').localeCompare(String(b.name||''))
        })
        for (const s of subs) {
          const a = await listApps(c.catKey, s.subKey)
          a.forEach(x => agg.push({ ...x, cName: c.name, sName: s.name }))
        }
      }
      const t = (x) => Date.parse(x.updatedAt || x.createdAt || 0) || 0
      setApps(agg.sort((a,b) => t(b) - t(a)).slice(0, limit))
    })().catch(console.error)
  }, [limit])
  return apps
}

function TiltCard({ children }) {
  const ref = useRef(null)
  const handle = (e) => {
    const el = ref.current; if (!el) return
    const r = el.getBoundingClientRect()
    const x = (e.clientX - r.left) / r.width
    const y = (e.clientY - r.top) / r.height
    const rx = (0.5 - y) * 8
    const ry = (x - 0.5) * 12
    el.style.transform = `perspective(1000px) rotateX(${rx}deg) rotateY(${ry}deg)`
  }
  const reset = () => { if (ref.current) ref.current.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg)' }
  return (
    <div
      ref={ref}
      onMouseMove={handle}
      onMouseLeave={reset}
      className="will-change-transform transition-transform"
      style={{ transform: 'perspective(1000px) rotateX(0deg) rotateY(0deg)' }}
    >{children}</div>
  )
}

function GlassCard({ app }) {
  const open = !!app.publicUrl
  return (
    <TiltCard>
      <a
        href={open ? app.publicUrl : '/store'}
        target={open ? '_blank' : undefined}
        rel={open ? 'noreferrer' : undefined}
        className="group relative block rounded-3xl border border-white/10 bg-white/5/70 p-4 backdrop-blur-md transition hover:border-white/20"
      >
        {/* Neon edge */}
        <div className="pointer-events-none absolute inset-0 rounded-3xl bg-gradient-to-br from-fuchsia-500/10 via-cyan-400/10 to-emerald-400/10 opacity-0 blur-lg transition-opacity group-hover:opacity-100" />
        {/* Shine sweep */}
        <div className="pointer-events-none absolute -inset-1 rounded-3xl opacity-0 [background:linear-gradient(120deg,transparent,rgba(255,255,255,0.18),transparent)] [mask:linear-gradient(#000,transparent)] transition-opacity group-hover:opacity-100" />

        <div className="relative z-10 flex items-center gap-4">
          <div className="grid h-16 w-16 place-items-center rounded-2xl bg-white/5 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08),0_8px_30px_rgba(0,0,0,0.4)]">
            {app.iconId ? (
              <IconifyIcon icon={app.iconId} width={32} height={32} />
            ) : (
              <div className="h-6 w-6 rounded bg-white/10" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold md:text-base">{app.name}</div>
            <div className="mt-1 text-xs text-white/60">{app.desc || `${app.cName} • ${app.sName}`}</div>
            <div className="mt-2">
              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium ${open ? 'bg-emerald-400 text-emerald-950' : 'border border-white/10 bg-white/5 text-white/60'}`}>{open ? 'Open' : 'Coming soon'}</span>
            </div>
          </div>
        </div>
      </a>
    </TiltCard>
  )
}

export default function VariantE() {
  const apps = useRecentApps(12)
  const [rails, setRails] = useState([]) // [{ title, groups: [{subTitle, items}] }]
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    (async () => {
      setLoading(true)
      const cats = await listCategories()
      const out = []
      for (const c of cats) {
        const subs = await listSubcategories(c.catKey)
        const groups = []
        for (const s of subs) {
          const a = await listApps(c.catKey, s.subKey)
          const items = a.map(x => ({
            ...x,
            cName: c.name,
            sName: s.name,
            key: `${c.catKey}/${s.subKey}/${x.slug || x.name}`,
          }))
          if (items.length) groups.push({ subTitle: s.name, items })
        }
        out.push({ title: c.name, groups })
      }
      setRails(out)
      setLoading(false)
    })().catch((e)=>{ console.error(e); setLoading(false) })
  }, [])
  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-100">
      <NeonBackdrop />
      <header className="relative z-10 mx-auto max-w-6xl px-4 pt-14 text-center md:px-6 md:pt-20">
        <h1 className="text-3xl font-semibold tracking-tight md:text-5xl">AI Apps Portfolio</h1>
        <p className="mx-auto mt-3 max-w-2xl text-white/80">Niche Apps that truly transformes</p>
        {/* CTAs removed per request. Admin panel is available on the side. */}
      </header>

      <main className="relative z-10 mx-auto max-w-6xl px-4 py-10 md:px-6">
        {loading && (
          <div className="space-y-8">
            {[...Array(2)].map((_,i)=> (
              <div key={i}>
                <div className="mb-3 h-6 w-40 rounded bg-white/10" />
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3">
                  {[...Array(3)].map((_,j)=>(
                    <div key={j} className="h-[120px] rounded-3xl border border-white/10 bg-white/5" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && rails.map(cat => (
          <section key={cat.title} className="mb-10">
            {cat.groups.map(group => (
              <div key={group.subTitle} className="mb-6">
                <div className="mb-2 text-sm font-semibold text-white/90 md:text-base">{group.subTitle}</div>
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3">
                  {group.items.slice(0,3).map(a => (
                    <GlassCard key={a.key} app={a} />
                  ))}
                </div>
              </div>
            ))}
          </section>
        ))}
      </main>
    </div>
  )
}

function NeonBackdrop() {
  return (
    <div className="pointer-events-none absolute inset-0">
      <style>{`
        @keyframes sweep { 0%{ transform: translateX(-50%) } 100%{ transform: translateX(150%) } }
      `}</style>
      {/* soft radial glows */}
      <div className="absolute -top-1/3 left-0 h-[120vh] w-[70vw] rounded-full bg-fuchsia-500/10 blur-3xl" />
      <div className="absolute bottom-0 right-0 h-[100vh] w-[70vw] rounded-full bg-cyan-400/10 blur-3xl" />
      {/* faint grid */}
      <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'linear-gradient(to right, rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.05) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
      {/* sweep line removed per request */}
    </div>
  )
}

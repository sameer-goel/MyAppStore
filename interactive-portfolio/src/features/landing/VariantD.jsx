import React, { useEffect, useMemo, useState } from 'react'
import { Icon as IconifyIcon } from '@iconify/react'
import { listCategories, listSubcategories, listApps } from '../../data/api.js'
import AuroraBackground from './backgrounds/Aurora.jsx'
import GridGlowBackground from './backgrounds/GridGlow.jsx'
import ParticlesBackground from './backgrounds/Particles.jsx'
import GradientBackground from './backgrounds/Gradient.jsx'

function byRecent(a, b) {
  const t = (x) => Date.parse(x.updatedAt || x.createdAt || 0) || 0
  return t(b) - t(a)
}

export default function VariantD() {
  const [rails, setRails] = useState([]) // [{ title, groups: [{subTitle, items}] }]
  const [loading, setLoading] = useState(true)
  const [bg, setBg] = useState('aurora') // 'aurora' | 'grid' | 'particles' | 'gradient' | 'none'

  useEffect(() => {
    (async () => {
      setLoading(true)
      const cats = (await listCategories()).slice().sort((a,b)=>{
        const ao = typeof a.order === 'number' ? a.order : 999
        const bo = typeof b.order === 'number' ? b.order : 999
        if (ao !== bo) return ao - bo
        return String(a.name||'').localeCompare(String(b.name||''))
      })
      const out = []
      for (const c of cats) {
        const subs = (await listSubcategories(c.catKey)).slice().sort((a,b)=>{
          const ao = typeof a.order === 'number' ? a.order : 999
          const bo = typeof b.order === 'number' ? b.order : 999
          if (ao !== bo) return ao - bo
          return String(a.name||'').localeCompare(String(b.name||''))
        })
        const groups = []
        for (const s of subs) {
          const a = await listApps(c.catKey, s.subKey)
          const items = a
            .map(x => ({
              ...x,
              catKey: c.catKey,
              subKey: s.subKey,
              cName: c.name,
              sName: s.name,
              key: `${c.catKey}/${s.subKey}/${x.slug || x.name}`,
            }))
            .sort(byRecent)
          if (items.length) groups.push({ subTitle: s.name, items })
        }
        out.push({ title: c.name, groups })
      }
      setRails(out)
      setLoading(false)
    })().catch((e) => { console.error(e); setLoading(false) })
  }, [])

  const Background = useMemo(() => {
    if (bg === 'grid') return <GridGlowBackground />
    if (bg === 'particles') return <ParticlesBackground density={60} />
    if (bg === 'gradient') return <GradientBackground />
    if (bg === 'aurora') return <AuroraBackground />
    return null
  }, [bg])

  return (
    <div className="relative min-h-screen bg-slate-950 text-slate-100">
      {Background}
      <div className="fixed left-4 top-4 z-50">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 p-0.5 text-sm backdrop-blur">
          <span className="hidden md:inline text-white/70 pl-2">Background</span>
          <button onClick={()=>setBg('aurora')} className={`rounded-full px-3 py-1 ${bg==='aurora'?'bg-white text-slate-900':'text-white/80'}`}>Aurora</button>
          <button onClick={()=>setBg('grid')} className={`rounded-full px-3 py-1 ${bg==='grid'?'bg-white text-slate-900':'text-white/80'}`}>Grid</button>
          <button onClick={()=>setBg('particles')} className={`rounded-full px-3 py-1 ${bg==='particles'?'bg-white text-slate-900':'text-white/80'}`}>Particles</button>
          <button onClick={()=>setBg('gradient')} className={`rounded-full px-3 py-1 ${bg==='gradient'?'bg-white text-slate-900':'text-white/80'}`}>Gradient</button>
          <button onClick={()=>setBg('none')} className={`rounded-full px-3 py-1 ${bg==='none'?'bg-white text-slate-900':'text-white/80'}`}>None</button>
        </div>
      </div>

      <div className="relative mx-auto max-w-6xl px-4 py-10 md:px-6 md:py-14">
        {loading && (
          <div className="space-y-8">
            {[...Array(2)].map((_,i)=> (
              <div key={i}>
                <div className="mb-3 h-6 w-40 rounded bg-white/10" />
                <div className="flex gap-4 overflow-hidden">
                  {[...Array(8)].map((_,j)=>(
                    <div key={j} className="w-[180px] shrink-0">
                      <div className="h-[96px] w-[96px] rounded-3xl bg-white/10" />
                      <div className="mt-3 h-4 w-3/4 rounded bg-white/10" />
                      <div className="mt-2 h-3 w-1/2 rounded bg-white/10" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && rails.map(rail => (
          <section key={rail.title} className="mb-12">
            <h2 className="mb-4 text-xl font-semibold tracking-tight">{rail.title}</h2>
            {rail.groups.map(group => (
              <div key={group.subTitle} className="mb-8">
                <div className="mb-2 text-sm font-semibold text-white/90 md:text-base">
                  {group.subTitle}
                </div>
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3">
                  {group.items.slice(0,3).map(app => (
                    <a
                      key={app.key}
                      href={app.publicUrl || '/store'}
                      target={app.publicUrl ? '_blank' : undefined}
                      rel={app.publicUrl ? 'noreferrer' : undefined}
                      className="group flex min-h-[104px] items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 transition hover:bg-white/10"
                      title={app.name}
                    >
                      <div className="grid h-16 w-16 place-items-center rounded-2xl bg-white/5">
                        {app.iconId ? (
                          <IconifyIcon icon={app.iconId} width={34} height={34} />
                        ) : (
                          <div className="h-6 w-6 rounded bg-white/10" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium md:text-base">{app.name}</div>
                        <div className="mt-1">
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium ${app.publicUrl ? 'bg-emerald-400 text-emerald-950' : 'border border-white/10 bg-white/5 text-white/60'}`}
                          >
                            {app.publicUrl ? 'Open' : 'Coming soon'}
                          </span>
                        </div>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </section>
        ))}
      </div>
    </div>
  )
}

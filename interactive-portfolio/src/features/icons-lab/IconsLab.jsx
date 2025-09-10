import React, { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Icon as IconifyIcon } from '@iconify/react'
import tokenSet from '@iconify-json/token-branded/icons.json'

const spring = { type: 'spring', stiffness: 260, damping: 28, mass: 0.8 }

export default function IconsLab() {
  const [copied, setCopied] = useState('')
  const [query, setQuery] = useState('')
  const [limit, setLimit] = useState(200)

  const allNames = useMemo(() => {
    const names = new Set(Object.keys(tokenSet.icons || {}))
    // include aliases as well
    Object.keys(tokenSet.aliases || {}).forEach((k) => names.add(k))
    return Array.from(names).sort()
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return allNames
    return allNames.filter((n) => n.includes(q))
  }, [allNames, query])

  const shown = filtered.slice(0, limit)

  const copy = async (text) => {
    try { await navigator.clipboard.writeText(text); setCopied(text); setTimeout(()=>setCopied(''), 1200) } catch {}
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="mx-auto max-w-6xl px-4 py-6 md:px-6">
        <h1 className="text-2xl font-semibold">Token Branded Icons</h1>
        <p className="text-sm text-white/70">All icons from token-branded. Click to copy the Iconify ID.</p>
        <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
          <input value={query} onChange={(e)=>{ setQuery(e.target.value); setLimit(200) }} placeholder="Search (e.g., btc, eth)" className="min-w-[220px] rounded-md border border-white/10 bg-white/10 px-3 py-1.5 text-sm outline-none placeholder:text-white/40 focus:border-white/20" />
          <span className="text-white/60">{filtered.length} icons</span>
          <a className="ml-auto text-xs underline opacity-80 hover:opacity-100" href="https://icon-sets.iconify.design/token-branded/" target="_blank" rel="noreferrer">View on Iconify</a>
          <a className="text-xs underline opacity-80 hover:opacity-100" href="#" onClick={(e)=>{e.preventDefault(); window.history.back()}}>Back</a>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-6 px-4 pb-16 md:px-6">
        <motion.section layout transition={spring} className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="grid grid-cols-6 gap-2 md:grid-cols-10">
            {shown.map((name) => {
              const id = `token-branded:${name}`
              return (
                <button key={id} onClick={() => copy(id)}
                  title={id}
                  className="flex aspect-square items-center justify-center rounded-md border border-white/10 bg-white/5 p-2 hover:bg-white/10">
                  <IconifyIcon icon={id} width={24} height={24} />
                </button>
              )
            })}
          </div>
          {shown.length < filtered.length && (
            <div className="mt-4 text-center">
              <button onClick={()=> setLimit((n)=> n + 200)} className="rounded-md border border-white/10 bg-white/10 px-3 py-1.5 text-sm hover:bg-white/20">Load more</button>
            </div>
          )}
        </motion.section>

        {copied && (
          <div className="fixed bottom-4 left-1/2 -translate-x-1/2 rounded-full border border-white/10 bg-white/90 px-3 py-1 text-sm text-slate-900 shadow-lg">Copied: {copied}</div>
        )}
      </main>
    </div>
  )
}

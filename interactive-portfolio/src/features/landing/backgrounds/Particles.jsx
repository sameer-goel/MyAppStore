import React, { useEffect, useRef } from 'react'

// Lightweight particle field (dots drifting slowly)
export default function ParticlesBackground({ density = 60 }) {
  const ref = useRef(null)
  const animRef = useRef(0)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d', { alpha: true })
    let w = (canvas.width = canvas.offsetWidth)
    let h = (canvas.height = canvas.offsetHeight)
    const dpr = window.devicePixelRatio || 1
    canvas.width = w * dpr
    canvas.height = h * dpr
    ctx.scale(dpr, dpr)

    function resize() {
      w = canvas.offsetWidth; h = canvas.offsetHeight
      canvas.width = w * dpr; canvas.height = h * dpr; ctx.scale(dpr, dpr)
    }
    const onResize = () => { resize() }
    window.addEventListener('resize', onResize)

    // init particles
    const count = Math.max(10, Math.floor((w * h) / (12000)) * (density / 60))
    const parts = Array.from({ length: count }).map(() => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.15,
      vy: (Math.random() - 0.5) * 0.15,
      r: 1 + Math.random() * 1.5,
      a: 0.25 + Math.random() * 0.25,
    }))

    function step() {
      ctx.clearRect(0, 0, w, h)
      ctx.fillStyle = '#ffffff'
      for (const p of parts) {
        p.x += p.vx; p.y += p.vy
        if (p.x < -10) p.x = w + 10; else if (p.x > w + 10) p.x = -10
        if (p.y < -10) p.y = h + 10; else if (p.y > h + 10) p.y = -10
        ctx.globalAlpha = p.a
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill()
      }
      animRef.current = requestAnimationFrame(step)
    }
    animRef.current = requestAnimationFrame(step)

    return () => {
      cancelAnimationFrame(animRef.current)
      window.removeEventListener('resize', onResize)
    }
  }, [density])

  return <canvas ref={ref} className="pointer-events-none absolute inset-0" />
}


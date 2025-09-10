import React from 'react'

// Animated grid with gentle glow and slow drift
export default function GridGlowBackground() {
  return (
    <div className="pointer-events-none absolute inset-0">
      <style>{`
        @keyframes gridDrift { 0%{background-position: 0 0, 0 0;} 100%{background-position: 40px 0, 0 40px;} }
      `}</style>
      <div
        aria-hidden
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            'linear-gradient(to right, rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.06) 1px, transparent 1px)',
          backgroundSize: '40px 40px, 40px 40px',
          animation: 'gridDrift 30s linear infinite',
        }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(600px_200px_at_50%_0%,rgba(59,130,246,0.10),transparent)]" />
    </div>
  )
}


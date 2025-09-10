import React from 'react'

// Animated multi-stop gradient that slowly shifts
export default function GradientBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <style>{`
        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>
      <div
        aria-hidden
        className="absolute inset-0 opacity-40"
        style={{
          background:
            'linear-gradient(120deg, rgba(59,130,246,0.28), rgba(244,114,182,0.26), rgba(16,185,129,0.22), rgba(147,197,253,0.24))',
          backgroundSize: '300% 300%',
          animation: 'gradientShift 18s ease-in-out infinite',
        }}
      />
      {/* Soft vignette to keep content readable */}
      <div className="absolute inset-0 bg-[radial-gradient(900px_500px_at_50%_0%,rgba(0,0,0,0.35),transparent_60%)]" />
    </div>
  )
}


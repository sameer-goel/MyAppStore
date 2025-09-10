import React from 'react'

// Subtle animated aurora gradients using CSS keyframes
export default function AuroraBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <style>{`
        @keyframes auroraShift { 0%{transform:translate3d(-10%, -10%, 0) rotate(0deg)} 50%{transform:translate3d(10%, 5%, 0) rotate(15deg)} 100%{transform:translate3d(-10%, -10%, 0) rotate(0deg)} }
        @keyframes auroraDrift { 0%{transform:translate3d(10%, -20%, 0) rotate(0deg)} 50%{transform:translate3d(-10%, 10%, 0) rotate(-12deg)} 100%{transform:translate3d(10%, -20%, 0) rotate(0deg)} }
      `}</style>
      <div
        aria-hidden
        className="absolute -top-1/3 -left-1/3 h-[120vh] w-[120vw] rounded-full blur-3xl opacity-30"
        style={{
          background:
            'radial-gradient(40% 40% at 30% 30%, rgba(56,189,248,0.25), transparent 60%), radial-gradient(35% 35% at 70% 20%, rgba(244,114,182,0.18), transparent 60%), radial-gradient(45% 45% at 50% 70%, rgba(59,130,246,0.22), transparent 60%)',
          animation: 'auroraShift 18s ease-in-out infinite',
        }}
      />
      <div
        aria-hidden
        className="absolute -bottom-1/3 -right-1/3 h-[120vh] w-[120vw] rounded-full blur-3xl opacity-25"
        style={{
          background:
            'radial-gradient(40% 40% at 70% 70%, rgba(16,185,129,0.20), transparent 60%), radial-gradient(35% 35% at 30% 80%, rgba(147,197,253,0.18), transparent 60%)',
          animation: 'auroraDrift 22s ease-in-out infinite',
        }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(800px_400px_at_50%_0%,rgba(255,255,255,0.06),transparent)]" />
    </div>
  )
}


import AdminPage from './AdminPage.jsx'
import IconsLab from './features/icons-lab/IconsLab.jsx'
import AppStoreView from './features/store/AppStoreView.jsx'
import Landing from './features/landing/Landing.jsx'
import Me from './Me.jsx'

function isAdminRoute() {
  if (typeof window === 'undefined') return false
  const p = window.location.pathname
  const h = window.location.hash
  const q = new URLSearchParams(window.location.search)
  return p === '/admin' || h.includes('#/admin') || q.get('admin') === '1'
}

function isIconsRoute() {
  if (typeof window === 'undefined') return false
  const p = window.location.pathname
  const h = window.location.hash
  const q = new URLSearchParams(window.location.search)
  return p === '/icons' || h.includes('#/icons') || q.get('icons') === '1'
}

function isStoreRoute() {
  if (typeof window === 'undefined') return false
  const p = window.location.pathname
  const h = window.location.hash
  const q = new URLSearchParams(window.location.search)
  return p === '/store' || h.includes('#/store') || q.get('store') === '1'
}

function isLibraryRoute() {
  if (typeof window === 'undefined') return false
  const p = window.location.pathname
  const h = window.location.hash
  const q = new URLSearchParams(window.location.search)
  return p === '/library' || h.includes('#/library') || q.get('view') === 'library'
}

function isLandingRoute() {
  if (typeof window === 'undefined') return false
  const p = window.location.pathname
  const h = window.location.hash
  const q = new URLSearchParams(window.location.search)
  return p.startsWith('/landing') || h.includes('#/landing') || q.get('landing') === '1'
}

export default function App() {
  if (isAdminRoute()) {
    if (typeof window !== 'undefined') {
      try {
        const mm = String(new Date().getMinutes())
        const ok = window.sessionStorage.getItem('admin_ok_minute') === mm
        if (!ok) {
          const input = prompt('Enter password:')
          if (!input) return null
          if (input.trim() === mm || input.trim() === mm.padStart(2, '0')) {
            window.sessionStorage.setItem('admin_ok_minute', mm)
          } else {
            alert('Incorrect password')
            return null
          }
        }
      } catch (_) { /* ignore */ }
    }
    return <AdminPage />
  }
  if (isIconsRoute()) return <IconsLab />
  if (isStoreRoute()) return <AppStoreView />
  if (isLibraryRoute()) return <Me />
  // Treat root or /landing as the landing page; default variant handled inside
  if (isLandingRoute() || true) return <Landing />
  // fallback (unreached because of `|| true` above)
  // return <Me />
}

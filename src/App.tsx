import { Link, Routes, Route } from 'react-router-dom'
import { Topbar } from './components/Topbar'
import { MobileNav } from './components/MobileNav'
import { ToastProvider } from './components/Toast'
import { ScrollToTop } from './components/ScrollToTop'
import { ErrorBoundary } from './components/ErrorBoundary'
import { OfflineBanner } from './components/OfflineBanner'
import { AutoSignBanner } from './components/AutoSignBanner'
import { AutoSignWorker } from './components/AutoSignWorker'
import { SkipLink } from './components/SkipLink'
import { Home } from './pages/Home'
import { Dashboard } from './pages/Dashboard'
import { Leaderboard } from './pages/Leaderboard'
import { CopySetup } from './pages/CopySetup'
import { ActiveCopies } from './pages/ActiveCopies'
import { Activity } from './pages/Activity'
import { Settings } from './pages/Settings'
import { Tools } from './pages/Tools'
import { Help } from './pages/Help'
import { NotFound } from './pages/NotFound'

export default function App() {
  return (
    <ToastProvider>
      <SkipLink />
      <ScrollToTop />
      <AutoSignWorker />
      <div className="app">
        <OfflineBanner />
        <AutoSignBanner />
        <Topbar />
        <main id="main-content" className="main" tabIndex={-1}>
          <ErrorBoundary>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/leaderboard" element={<Leaderboard />} />
              <Route path="/tools" element={<Tools />} />
              <Route path="/copies" element={<ActiveCopies />} />
              <Route path="/activity" element={<Activity />} />
              <Route path="/copy/:address" element={<CopySetup />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/help" element={<Help />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </ErrorBoundary>
        </main>
        <MobileNav />
        <footer className="footer">
          <p>
            Non-custodial. Your keys, your funds. · <Link to="/settings">Settings</Link> ·{' '}
            <Link to="/help">Help</Link>
          </p>
          <p className="disclaimer">
            Copy trading can lose money. Manual mode: you approve every trade. Experimental auto-sign
            can place trades you did not individually review. Not financial advice.
          </p>
        </footer>
      </div>
    </ToastProvider>
  )
}

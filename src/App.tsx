import { Routes, Route } from 'react-router-dom'
import { Topbar } from './components/Topbar'
import { MobileNav } from './components/MobileNav'
import { ToastProvider } from './components/Toast'
import { Home } from './pages/Home'
import { Dashboard } from './pages/Dashboard'
import { Leaderboard } from './pages/Leaderboard'
import { CopySetup } from './pages/CopySetup'
import { ActiveCopies } from './pages/ActiveCopies'
import { Activity } from './pages/Activity'
import { Settings } from './pages/Settings'
import { Tools } from './pages/Tools'
import { Help } from './pages/Help'

export default function App() {
  return (
    <ToastProvider>
      <div className="app">
        <Topbar />
        <main className="main">
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
          </Routes>
        </main>
        <MobileNav />
        <footer className="footer">
          <p>Non-custodial. Your keys, your funds.</p>
          <p className="disclaimer">
            Copy trading can lose money. You approve every trade. This is not financial advice.
          </p>
        </footer>
      </div>
    </ToastProvider>
  )
}
import { Routes, Route } from 'react-router-dom'
import { Topbar } from './components/Topbar'
import { Home } from './pages/Home'
import { Leaderboard } from './pages/Leaderboard'
import { CopySetup } from './pages/CopySetup'
import { ActiveCopies } from './pages/ActiveCopies'

export default function App() {
  return (
    <div className="app">
      <Topbar />
      <main className="main">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/copies" element={<ActiveCopies />} />
          <Route path="/copy/:address" element={<CopySetup />} />
        </Routes>
      </main>
      <footer className="footer">
        <p>Non-custodial by design. Your keys, your funds.</p>
        <p className="disclaimer">
          Copy trading involves significant risk of loss. Past performance of any wallet is not
          indicative of future results. You always sign every trade.
        </p>
      </footer>
    </div>
  )
}
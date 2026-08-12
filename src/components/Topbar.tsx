import { Link, NavLink } from 'react-router-dom'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { listSignals } from '../lib/monitor'
import { useAppTick } from '../hooks/useAppTick'

export function Topbar() {
  useAppTick()
  const pending = listSignals().filter((s) => s.status === 'pending').length

  return (
    <header className="topbar">
      <div className="topbar-inner">
        <Link to="/" className="logo" aria-label="LottaCash home">
          Lotta<span>Cash</span>
        </Link>

        <nav className="nav desktop-nav" aria-label="Main">
          <NavLink to="/dashboard">Dashboard</NavLink>
          <NavLink to="/leaderboard">Leaderboard</NavLink>
          <NavLink to="/tools">Tools</NavLink>
          <NavLink to="/copies">Copies</NavLink>
          <NavLink to="/activity" className="nav-with-badge">
            Activity
            {pending > 0 && <span className="nav-badge">{pending > 9 ? '9+' : pending}</span>}
          </NavLink>
          <NavLink to="/help">Help</NavLink>
        </nav>

        <div className="wallet-btn">
          <WalletMultiButton />
        </div>
      </div>
    </header>
  )
}
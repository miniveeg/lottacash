import { Link, NavLink } from 'react-router-dom'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'

export function Topbar() {
  return (
    <header className="topbar">
      <div className="topbar-inner">
        <Link to="/" className="logo">
          Lotta<span>Cash</span>
        </Link>

        <nav className="nav desktop-nav">
          <NavLink to="/dashboard">Dashboard</NavLink>
          <NavLink to="/leaderboard">Leaderboard</NavLink>
          <NavLink to="/tools">Tools</NavLink>
          <NavLink to="/copies">Copies</NavLink>
          <NavLink to="/activity">Activity</NavLink>
          <NavLink to="/settings">Settings</NavLink>
        </nav>

        <div className="wallet-btn">
          <WalletMultiButton />
        </div>
      </div>
    </header>
  )
}
import { NavLink } from 'react-router-dom'
import { listSignals } from '../lib/monitor'

export function MobileNav() {
  const pending = listSignals().filter((s) => s.status === 'pending').length

  return (
    <nav className="mobile-nav" aria-label="Mobile">
      <NavLink to="/dashboard">Home</NavLink>
      <NavLink to="/leaderboard">Board</NavLink>
      <NavLink to="/activity" className="nav-with-badge">
        Activity
        {pending > 0 && <span className="nav-badge">{pending > 9 ? '9+' : pending}</span>}
      </NavLink>
      <NavLink to="/copies">Copies</NavLink>
      <NavLink to="/tools">Tools</NavLink>
    </nav>
  )
}
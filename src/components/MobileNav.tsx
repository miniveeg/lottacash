import { NavLink } from 'react-router-dom'

export function MobileNav() {
  return (
    <nav className="mobile-nav">
      <NavLink to="/" end>
        Home
      </NavLink>
      <NavLink to="/leaderboard">Board</NavLink>
      <NavLink to="/copies">Copies</NavLink>
      <NavLink to="/activity">Activity</NavLink>
      <NavLink to="/settings">Settings</NavLink>
    </nav>
  )
}
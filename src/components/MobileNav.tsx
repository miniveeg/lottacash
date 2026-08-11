import { NavLink } from 'react-router-dom'

export function MobileNav() {
  return (
    <nav className="mobile-nav">
      <NavLink to="/dashboard">Home</NavLink>
      <NavLink to="/leaderboard">Board</NavLink>
      <NavLink to="/activity">Activity</NavLink>
      <NavLink to="/tools">Tools</NavLink>
      <NavLink to="/help">Help</NavLink>
    </nav>
  )
}
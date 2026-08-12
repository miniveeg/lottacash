import { Link } from 'react-router-dom'

export function NotFound() {
  return (
    <div className="page">
      <div className="empty">
        <p style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text)' }}>Page not found</p>
        <p className="hint">That link doesn’t exist in LottaCash.</p>
        <div className="dash-actions" style={{ justifyContent: 'center' }}>
          <Link to="/dashboard" className="btn primary">
            Dashboard
          </Link>
          <Link to="/leaderboard" className="btn ghost">
            Leaderboard
          </Link>
          <Link to="/help" className="btn ghost">
            Help
          </Link>
        </div>
      </div>
    </div>
  )
}
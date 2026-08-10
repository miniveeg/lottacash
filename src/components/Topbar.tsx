import { Link } from 'react-router-dom'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'

export function Topbar() {
  return (
    <header className="topbar">
      <div className="topbar-inner">
        <Link to="/" className="logo">
          Lotta<span>Cash</span>
        </Link>

        <nav className="nav">
          <Link to="/">Home</Link>
          <Link to="/leaderboard">Leaderboard</Link>
        </nav>

        <div className="wallet-btn">
          <WalletMultiButton />
        </div>
      </div>
    </header>
  )
}
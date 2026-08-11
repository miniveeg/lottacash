import { Link } from 'react-router-dom'

export function Home() {
  return (
    <div className="page home">
      <section className="hero">
        <div className="hero-badge">Non-custodial · Solana</div>
        <h1>Copy the best Solana wallets</h1>
        <p className="lead">
          Connect your wallet, pick top performers, set your size, and mirror trades — you always
          sign. No platform keys. No deposits into a black box.
        </p>
        <div className="hero-actions">
          <Link to="/dashboard" className="btn primary">
            Dashboard
          </Link>
          <Link to="/leaderboard" className="btn ghost">
            Leaderboard
          </Link>
          <Link to="/tools" className="btn ghost">
            Tools
          </Link>
        </div>
      </section>

      <section className="features">
        <div className="feature">
          <div className="feature-icon">🔑</div>
          <h3>Your keys stay with you</h3>
          <p>Connect Phantom or Solflare. We never generate or store private keys.</p>
        </div>
        <div className="feature">
          <div className="feature-icon">📐</div>
          <h3>Flexible sizing</h3>
          <p>Fixed SOL per trade or proportional 1:1 with a hard max safety cap.</p>
        </div>
        <div className="feature">
          <div className="feature-icon">✍️</div>
          <h3>You approve every trade</h3>
          <p>Jupiter routes are prepared for you. Nothing broadcasts without your signature.</p>
        </div>
        <div className="feature">
          <div className="feature-icon">🛠️</div>
          <h3>Built-in tools</h3>
          <p>Wallet lookup, size calculator, balance checks, and explorer shortcuts.</p>
        </div>
      </section>
    </div>
  )
}
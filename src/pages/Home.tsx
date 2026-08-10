import { Link } from 'react-router-dom'

export function Home() {
  return (
    <div className="page home">
      <section className="hero">
        <h1>Copy the best Solana wallets</h1>
        <p className="lead">
          Non-custodial copy trading. Connect your wallet, pick top performers,
          set your size, and mirror their trades — you always sign.
        </p>
        <div className="hero-actions">
          <Link to="/leaderboard" className="btn primary">
            View Leaderboard
          </Link>
        </div>
      </section>

      <section className="features">
        <div className="feature">
          <h3>Your keys stay with you</h3>
          <p>We never generate or store private keys. You connect your existing wallet.</p>
        </div>
        <div className="feature">
          <h3>Flexible sizing</h3>
          <p>Fixed SOL amount per trade or proportional 1:1 copy with optional max.</p>
        </div>
        <div className="feature">
          <h3>You approve every trade</h3>
          <p>We prepare the Jupiter swap. You sign it. Full control at all times.</p>
        </div>
      </section>
    </div>
  )
}
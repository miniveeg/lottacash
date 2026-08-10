import { Link } from 'react-router-dom'

export function Home() {
  return (
    <div className="page home">
      <section className="hero">
        <h1>Copy the best Solana wallets</h1>
        <p className="lead">
          Non-custodial copy trading. Connect your wallet, pick top performers, set your size, and
          mirror their trades — you always sign.
        </p>
        <div className="hero-actions">
          <Link to="/leaderboard" className="btn primary">
            View Leaderboard
          </Link>
          <Link to="/copies" className="btn ghost">
            My Copies
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
          <p>Fixed SOL per trade or proportional 1:1 copy with an optional max cap.</p>
        </div>
        <div className="feature">
          <h3>You approve every trade</h3>
          <p>We prepare the Jupiter swap. You sign it. Full control at all times.</p>
        </div>
      </section>

      <section className="how">
        <h2>How it works</h2>
        <ol>
          <li>Connect Phantom, Solflare, or another Solana wallet.</li>
          <li>Pick wallets from the leaderboard (daily / weekly / all-time).</li>
          <li>Set fixed size or proportional copy + max safety limit.</li>
          <li>When they trade, we build a Jupiter swap and ask you to sign.</li>
        </ol>
      </section>
    </div>
  )
}
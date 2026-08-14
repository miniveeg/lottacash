import { Link } from 'react-router-dom'
import { Steps } from '../components/Steps'
import { feesEnabled, formatFeePercent } from '../lib/fees'

export function Home() {
  return (
    <div className="page home">
      <section className="hero">
        <div className="hero-badge">Your wallet · Your keys · Your trades</div>
        <h1>Copy Solana traders — without giving up control</h1>
        <p className="lead">
          Pick wallets that are winning, choose how much SOL to risk per trade, and approve each swap
          yourself. LottaCash never holds your funds.
        </p>
        <div className="hero-actions">
          <Link to="/leaderboard" className="btn primary">
            Find wallets to copy
          </Link>
          <Link to="/dashboard" className="btn ghost">
            Go to dashboard
          </Link>
        </div>
        {feesEnabled() && (
          <p className="hero-fee">
            Platform fee: <strong>{formatFeePercent()}</strong> on each copy swap you sign — built into
            the Jupiter trade, not a separate withdrawal.
          </p>
        )}
      </section>

      <section className="panel guide-panel">
        <h2>How it works (simple)</h2>
        <Steps
          items={[
            'Connect Phantom or Solflare (top right).',
            'Open the Leaderboard and tap Copy on a wallet you like.',
            'Choose a fixed SOL amount per trade (or match their size) and a max safety cap.',
            'When they buy or sell, a signal shows up under Activity — you sign the swap in your wallet.',
          ]}
        />
        <p className="guide-note">
          If something is confusing, open <Link to="/help">Help</Link> anytime.
        </p>
      </section>

      <section className="features">
        <div className="feature">
          <div className="feature-icon">1</div>
          <h3>Non-custodial</h3>
          <p>
            You connect the wallet you already own. We never create a “trading wallet” for you or ask
            for your seed phrase.
          </p>
        </div>
        <div className="feature">
          <div className="feature-icon">2</div>
          <h3>You pick the size</h3>
          <p>
            Example: they buy with 10 SOL — you can copy with 0.2 SOL, or try to match them, with a
            hard max so one trade cannot wipe you out.
          </p>
        </div>
        <div className="feature">
          <div className="feature-icon">3</div>
          <h3>You approve every trade</h3>
          <p>
            We prepare a Jupiter swap. Your wallet pops up. Nothing sends until you confirm. You can
            always reject.
          </p>
        </div>
        <div className="feature">
          <div className="feature-icon">!</div>
          <h3>Risk is real</h3>
          <p>
            Copy trading can lose money fast. Tokens rug, fills lag the leader, and past profit does
            not mean future profit. Only use money you can lose.
          </p>
        </div>
      </section>

      <section className="panel cta-panel">
        <div>
          <h2>Ready to try?</h2>
          <p>Start with the leaderboard, or paste any wallet address in Tools.</p>
        </div>
        <div className="cta-actions">
          <Link to="/leaderboard" className="btn primary">
            Leaderboard
          </Link>
          <Link to="/tools" className="btn ghost">
            Tools
          </Link>
          <Link to="/help" className="btn ghost">
            Help
          </Link>
        </div>
      </section>
    </div>
  )
}

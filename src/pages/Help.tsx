import { Link } from 'react-router-dom'
import { Steps } from '../components/Steps'
import { FeeNotice } from '../components/FeeNotice'
import { formatFeePercent, feesEnabled } from '../lib/fees'

export function Help() {
  return (
    <div className="page help">
      <div className="page-header">
        <h1>Help</h1>
        <p>Plain-language answers. No fluff.</p>
      </div>

      <section className="panel help-block">
        <h2>What is LottaCash?</h2>
        <p>
          A website that helps you <strong>mirror trades</strong> made by other Solana wallets. You
          stay in control: your wallet, your SOL, your signatures.
        </p>
      </section>

      <section className="panel help-block">
        <h2>Does LottaCash hold my money?</h2>
        <p>
          <strong>No.</strong> We do not take deposits into a company wallet and we do not generate
          a private key for you. You connect Phantom/Solflare and sign transactions yourself.
        </p>
      </section>

      <section className="panel help-block">
        <h2>How does LottaCash make money?</h2>
        <FeeNotice />
        <p>
          {feesEnabled() ? (
            <>
              A <strong>{formatFeePercent()}</strong> platform fee is included in each Jupiter swap
              you sign when copying a trade (buy or sell). It is taken on-chain as part of that
              transaction — not by moving funds to a custodial account.
            </>
          ) : (
            <>
              When enabled by the operator, a small percentage (default 0.5%) is taken on each copy
              swap via Jupiter’s platform fee feature.
            </>
          )}
        </p>
      </section>

      <section className="panel help-block">
        <h2>First-time setup</h2>
        <Steps
          items={[
            'Connect Phantom or Solflare.',
            'Go to Leaderboard → pick someone → Copy.',
            'Set a small fixed SOL size + max cap, then save.',
            'Open Activity when you want to test a demo signal.',
          ]}
        />
      </section>

      <section className="panel help-block">
        <h2>Fixed vs proportional size</h2>
        <ul className="plain-list">
          <li>
            <strong>Fixed</strong> — same SOL every time (easiest).
          </li>
          <li>
            <strong>Match size</strong> — try to mirror the leader (still capped by your max).
          </li>
        </ul>
      </section>

      <section className="panel help-block">
        <h2>What is a signal?</h2>
        <p>
          A notice that a wallet you follow traded. On Activity you can <strong>Sign swap</strong> or
          dismiss. Signing opens your wallet to approve the Jupiter exchange.
        </p>
      </section>

      <section className="panel help-block">
        <h2>Where do I click?</h2>
        <ul className="plain-list">
          <li>
            <Link to="/dashboard">Dashboard</Link> — overview
          </li>
          <li>
            <Link to="/leaderboard">Leaderboard</Link> — wallets to copy
          </li>
          <li>
            <Link to="/tools">Tools</Link> — lookup any address
          </li>
          <li>
            <Link to="/copies">Copies</Link> — manage follows
          </li>
          <li>
            <Link to="/activity">Activity</Link> — pending trades
          </li>
        </ul>
      </section>

      <section className="panel help-block danger-soft">
        <h2>Safety rules of thumb</h2>
        <ul className="plain-list">
          <li>Start tiny until you trust the flow.</li>
          <li>Always set a max cap.</li>
          <li>Never share your seed phrase.</li>
          <li>Assume any memecoin can go to zero.</li>
        </ul>
      </section>
    </div>
  )
}
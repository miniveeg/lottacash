import { Link } from 'react-router-dom'
import { Steps } from '../components/Steps'

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
        <h2>First-time setup</h2>
        <Steps
          items={[
            'Click Connect in the top right and approve in your wallet app.',
            'Go to Leaderboard → pick someone → Copy.',
            'Set "SOL per trade" to a small number (like 0.1) while learning.',
            'Set a Max SOL cap (safety limit for one trade).',
            'Save. Open Activity when you want to test a demo signal.',
          ]}
        />
      </section>

      <section className="panel help-block">
        <h2>Fixed vs proportional size</h2>
        <ul className="plain-list">
          <li>
            <strong>Fixed</strong> — every copy uses the same SOL amount (e.g. always 0.25 SOL).
            Easiest for beginners.
          </li>
          <li>
            <strong>Proportional / 1:1</strong> — try to match the leader’s size (capped by your max).
            More advanced; can get large quickly.
          </li>
        </ul>
      </section>

      <section className="panel help-block">
        <h2>What is a "signal"?</h2>
        <p>
          A notice that a wallet you follow just traded. You review it on the Activity page and
          choose <strong>Sign swap</strong> or dismiss. Signing opens your wallet to approve the
          Jupiter exchange.
        </p>
      </section>

      <section className="panel help-block">
        <h2>Why might I get a worse price than them?</h2>
        <p>
          Speed. By the time you see the signal and sign, the market may have moved. That is normal
          for copy trading. Smaller size and higher-quality wallets help, but nothing removes this
          risk.
        </p>
      </section>

      <section className="panel help-block">
        <h2>Where do I click?</h2>
        <ul className="plain-list">
          <li>
            <Link to="/dashboard">Dashboard</Link> — overview of balance and active copies
          </li>
          <li>
            <Link to="/leaderboard">Leaderboard</Link> — ranked wallets to copy
          </li>
          <li>
            <Link to="/tools">Tools</Link> — look up any address, size calculator
          </li>
          <li>
            <Link to="/copies">Copies</Link> — turn follows on/off
          </li>
          <li>
            <Link to="/activity">Activity</Link> — pending trades to sign
          </li>
        </ul>
      </section>

      <section className="panel help-block danger-soft">
        <h2>Safety rules of thumb</h2>
        <ul className="plain-list">
          <li>Start tiny (0.05–0.2 SOL) until you trust the flow.</li>
          <li>Always set a max cap.</li>
          <li>Never share your seed phrase or private key with any site.</li>
          <li>Assume any memecoin can go to zero.</li>
        </ul>
      </section>
    </div>
  )
}
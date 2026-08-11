import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useWallet } from '@solana/wallet-adapter-react'
import { listCopyConfigs } from '../lib/copyStore'
import { listSignals } from '../lib/monitor'
import { getSolBalance } from '../lib/solanaTools'
import { apiHealth } from '../lib/api'
import { StatCard } from '../components/StatCard'
import { shortAddress } from '../lib/format'
import { Steps } from '../components/Steps'

export function Dashboard() {
  const { publicKey, connected } = useWallet()
  const [bal, setBal] = useState<number | null>(null)
  const [apiOk, setApiOk] = useState(false)
  const configs = listCopyConfigs()
  const enabled = configs.filter((c) => c.enabled).length
  const pending = listSignals().filter((s) => s.status === 'pending').length

  useEffect(() => {
    apiHealth().then(setApiOk)
    if (!publicKey) {
      setBal(null)
      return
    }
    getSolBalance(publicKey.toBase58())
      .then(setBal)
      .catch(() => setBal(null))
  }, [publicKey])

  return (
    <div className="page dashboard">
      <div className="page-header">
        <h1>Dashboard</h1>
        <p>
          {connected && publicKey
            ? `Connected as ${shortAddress(publicKey.toBase58(), 4)}`
            : 'Connect a wallet (top right) to see your balance and manage copies.'}
        </p>
      </div>

      {!connected && (
        <div className="banner-info">
          New here? Connect your wallet, then open the{' '}
          <Link to="/leaderboard">Leaderboard</Link> and tap <strong>Copy</strong> on a wallet.
          Full walkthrough in <Link to="/help">Help</Link>.
        </div>
      )}

      <div className="stat-grid">
        <StatCard
          label="Your SOL"
          value={bal === null ? '—' : bal.toFixed(3)}
          sub={connected ? 'Wallet balance' : 'Connect to load'}
        />
        <StatCard
          label="Copying"
          value={String(enabled)}
          sub={enabled === 1 ? '1 wallet on' : `${configs.length} saved total`}
        />
        <StatCard
          label="Waiting on you"
          value={String(pending)}
          sub="Signals to sign or skip"
        />
        <StatCard label="Server" value={apiOk ? 'Online' : 'Offline'} sub="Backend API" />
      </div>

      <div className="dash-actions">
        <Link to="/leaderboard" className="btn primary">
          Find wallets
        </Link>
        <Link to="/activity" className="btn ghost">
          Activity {pending > 0 ? `(${pending})` : ''}
        </Link>
        <Link to="/tools" className="btn ghost">
          Tools
        </Link>
        <Link to="/help" className="btn ghost">
          Help
        </Link>
      </div>

      {enabled > 0 ? (
        <section className="dash-section">
          <h2>You’re copying</h2>
          <div className="chip-row">
            {configs
              .filter((c) => c.enabled)
              .map((c) => (
                <Link key={c.targetAddress} to={`/copy/${c.targetAddress}`} className="chip">
                  {shortAddress(c.targetAddress, 4)}
                  <span className="chip-meta">
                    {c.sizeMode === 'fixed' ? `${c.fixedSol} SOL` : 'match size'}
                  </span>
                </Link>
              ))}
          </div>
        </section>
      ) : (
        <section className="panel guide-panel">
          <h2>Get set up in 4 steps</h2>
          <Steps
            items={[
              'Connect Phantom or Solflare.',
              'Open Leaderboard and choose a wallet.',
              'Set a small fixed SOL size + max cap, then save.',
              'Check Activity for signals (or generate a demo).',
            ]}
          />
        </section>
      )}
    </div>
  )
}
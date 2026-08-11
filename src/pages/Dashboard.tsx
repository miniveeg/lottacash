import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useWallet } from '@solana/wallet-adapter-react'
import { listCopyConfigs } from '../lib/copyStore'
import { listSignals } from '../lib/monitor'
import { getSolBalance } from '../lib/solanaTools'
import { apiHealth } from '../lib/api'
import { StatCard } from '../components/StatCard'
import { shortAddress } from '../lib/format'

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
            ? `Signed in as ${shortAddress(publicKey.toBase58(), 4)}`
            : 'Connect a wallet to see live balances and copy status.'}
        </p>
      </div>

      <div className="stat-grid">
        <StatCard
          label="Wallet SOL"
          value={bal === null ? '—' : bal.toFixed(3)}
          sub={connected ? 'On-chain balance' : 'Connect wallet'}
        />
        <StatCard label="Active copies" value={String(enabled)} sub={`${configs.length} total saved`} />
        <StatCard label="Pending signals" value={String(pending)} sub="Need your signature" />
        <StatCard label="API" value={apiOk ? 'Online' : 'Offline'} sub="Backend status" />
      </div>

      <div className="dash-actions">
        <Link to="/leaderboard" className="btn primary">
          Browse leaderboard
        </Link>
        <Link to="/tools" className="btn ghost">
          Open tools
        </Link>
        <Link to="/activity" className="btn ghost">
          Activity
        </Link>
        <Link to="/copies" className="btn ghost">
          My copies
        </Link>
      </div>

      {enabled > 0 && (
        <section className="dash-section">
          <h2>Enabled targets</h2>
          <div className="chip-row">
            {configs
              .filter((c) => c.enabled)
              .map((c) => (
                <Link key={c.targetAddress} to={`/copy/${c.targetAddress}`} className="chip">
                  {shortAddress(c.targetAddress, 4)}
                  <span className="chip-meta">
                    {c.sizeMode === 'fixed' ? `${c.fixedSol} SOL` : '1:1'}
                  </span>
                </Link>
              ))}
          </div>
        </section>
      )}

      <section className="dash-section how-compact">
        <h2>Flow</h2>
        <ol>
          <li>Pick wallets on the leaderboard or paste an address in Tools.</li>
          <li>Set fixed or proportional size + max cap.</li>
          <li>When they trade, a signal appears in Activity.</li>
          <li>You sign the Jupiter swap — funds never leave your control without approval.</li>
        </ol>
      </section>
    </div>
  )
}
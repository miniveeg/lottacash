import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useWallet } from '@solana/wallet-adapter-react'
import { listCopyConfigs } from '../lib/copyStore'
import { listSignals } from '../lib/monitor'
import { getSolBalance } from '../lib/solanaTools'
import { apiHealth } from '../lib/api'
import { StatCard } from '../components/StatCard'
import { StatusDot } from '../components/StatusDot'
import { shortAddress } from '../lib/format'
import { Steps } from '../components/Steps'
import type { CopyConfig } from '../lib/types'
import { useAppTick } from '../hooks/useAppTick'

export function Dashboard() {
  const { publicKey, connected } = useWallet()
  const tick = useAppTick()
  const [bal, setBal] = useState<number | null>(null)
  const [balLoading, setBalLoading] = useState(false)
  const [apiOk, setApiOk] = useState<boolean | null>(null)
  const [configs, setConfigs] = useState<CopyConfig[]>([])
  const [pending, setPending] = useState(0)

  const refreshLocal = useCallback(() => {
    setConfigs(listCopyConfigs())
    setPending(listSignals().filter((s) => s.status === 'pending').length)
  }, [])

  useEffect(() => {
    refreshLocal()
  }, [refreshLocal, tick])

  useEffect(() => {
    apiHealth().then(setApiOk)

    const onFocus = () => {
      refreshLocal()
      apiHealth().then(setApiOk)
    }
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [refreshLocal])

  useEffect(() => {
    if (!publicKey) {
      setBal(null)
      return
    }
    let cancelled = false
    setBalLoading(true)
    getSolBalance(publicKey.toBase58())
      .then((v) => {
        if (!cancelled) setBal(v)
      })
      .catch(() => {
        if (!cancelled) setBal(null)
      })
      .finally(() => {
        if (!cancelled) setBalLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [publicKey])

  const enabled = configs.filter((c) => c.enabled)

  return (
    <div className="page dashboard">
      <div className="page-header row-header">
        <div>
          <h1>Dashboard</h1>
          <p>
            {connected && publicKey
              ? `Connected as ${shortAddress(publicKey.toBase58(), 4)}`
              : 'Connect a wallet (top right) to see your balance and manage copies.'}
          </p>
        </div>
        <StatusDot ok={apiOk} labelOn="API online" labelOff="API offline" />
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
          value={balLoading ? '…' : bal === null ? '—' : bal.toFixed(3)}
          sub={connected ? 'On-chain balance' : 'Connect to load'}
        />
        <StatCard
          label="Copying"
          value={String(enabled.length)}
          sub={`${configs.length} saved total`}
        />
        <StatCard
          label="Waiting on you"
          value={String(pending)}
          sub="Signals to sign or skip"
        />
        <StatCard
          label="Server"
          value={apiOk === null ? '…' : apiOk ? 'Online' : 'Offline'}
          sub="Backend API"
        />
      </div>

      <div className="dash-actions">
        <Link to="/leaderboard" className="btn primary">
          Find wallets
        </Link>
        <Link to="/activity" className="btn ghost">
          Activity{pending > 0 ? ` (${pending})` : ''}
        </Link>
        <Link to="/copies" className="btn ghost">
          My copies
        </Link>
        <Link to="/tools" className="btn ghost">
          Tools
        </Link>
      </div>

      {enabled.length > 0 ? (
        <section className="dash-section">
          <h2>You’re copying</h2>
          <div className="chip-row">
            {enabled.map((c) => (
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

      {pending > 0 && (
        <div className="banner-warn">
          You have <strong>{pending}</strong> pending signal{pending === 1 ? '' : 's'}.{' '}
          <Link to="/activity">Review in Activity</Link>
        </div>
      )}
    </div>
  )
}

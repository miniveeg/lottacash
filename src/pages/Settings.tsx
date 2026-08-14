import { useEffect, useState } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { shortAddress } from '../lib/format'
import { SOLANA_NETWORK, getRpcEndpoint } from '../lib/connection'
import { fetchHealth, runMonitorOnce, fetchFeeStats, type HealthInfo } from '../lib/api'
import { StatusDot } from '../components/StatusDot'
import { CopyButton } from '../components/CopyButton'
import { FeeNotice } from '../components/FeeNotice'
import { useToast } from '../components/Toast'
import { clearCopyConfigs } from '../lib/copyStore'
import { clearSignals } from '../lib/monitor'
import {
  feesEnabled,
  formatFeePercent,
  getFeeWallet,
  getPlatformFeeBps,
} from '../lib/fees'

export function Settings() {
  const { publicKey, connected } = useWallet()
  const [health, setHealth] = useState<HealthInfo | null>(null)
  const [checking, setChecking] = useState(false)
  const [runningMon, setRunningMon] = useState(false)
  const [feeStats, setFeeStats] = useState<{
    totalEvents: number
    totalTradeSol: number
    totalFeeSolEstimate: number
  } | null>(null)
  const { push } = useToast()

  async function recheck() {
    setChecking(true)
    const h = await fetchHealth()
    setHealth(h)
    try {
      const s = await fetchFeeStats()
      setFeeStats(s)
    } catch {
      setFeeStats(null)
    }
    setChecking(false)
    push(h?.ok ? 'API is online' : 'API is offline', h?.ok ? 'success' : 'error')
  }

  async function forceMonitor() {
    setRunningMon(true)
    try {
      await runMonitorOnce()
      const h = await fetchHealth()
      setHealth(h)
      push('Monitor cycle finished', 'success')
    } catch (e) {
      push(e instanceof Error ? e.message : 'Monitor run failed', 'error')
    } finally {
      setRunningMon(false)
    }
  }

  useEffect(() => {
    fetchHealth().then(setHealth)
    fetchFeeStats()
      .then(setFeeStats)
      .catch(() => setFeeStats(null))
  }, [])

  function clearLocalData() {
    const ok = window.confirm(
      'Clear copy settings and signals saved in this browser? This cannot be undone.'
    )
    if (!ok) return
    clearCopyConfigs()
    clearSignals()
    push('Local data cleared', 'success')
  }

  const apiOk = health === null ? null : !!health.ok
  const mon = health?.monitor
  const feeWallet = getFeeWallet()

  return (
    <div className="page settings">
      <div className="page-header row-header">
        <div>
          <h1>Settings</h1>
          <p>Connection, fees, monitor, and safety.</p>
        </div>
        <StatusDot ok={apiOk} />
      </div>

      <div className="settings-card">
        <h3>Wallet</h3>
        {connected && publicKey ? (
          <div className="settings-row">
            <p className="mono">{shortAddress(publicKey.toBase58(), 6)}</p>
            <CopyButton text={publicKey.toBase58()} label="Copy full address" />
          </div>
        ) : (
          <p>Not connected — use the button in the top right.</p>
        )}
      </div>

      <div className="settings-card">
        <h3>Platform fee (your revenue)</h3>
        <FeeNotice />
        <div className="hint" style={{ lineHeight: 1.6, marginTop: '0.5rem' }}>
          <div>Configured rate: {getPlatformFeeBps()} bps ({formatFeePercent()})</div>
          <div>
            Fee wallet:{' '}
            {feeWallet ? (
              <span className="mono">{shortAddress(feeWallet, 4)}</span>
            ) : (
              <span>not set — add VITE_FEE_WALLET to .env</span>
            )}
          </div>
          <div>Active: {feesEnabled() ? 'yes' : 'no'}</div>
          {feeStats && (
            <div style={{ marginTop: '0.35rem' }}>
              Tracked swaps: {feeStats.totalEvents} · est. fees:{' '}
              {feeStats.totalFeeSolEstimate.toFixed(4)} SOL · volume:{' '}
              {feeStats.totalTradeSol.toFixed(3)} SOL
            </div>
          )}
        </div>
        <p className="hint" style={{ marginTop: '0.65rem' }}>
          Example: user copies with $5 → you earn about $0.025 at 0.5%. Same math in SOL: 1 SOL trade
          → 0.005 SOL fee.
        </p>
      </div>

      <div className="settings-card">
        <h3>Network</h3>
        <p className="mono">{SOLANA_NETWORK}</p>
        <p className="hint mono" style={{ wordBreak: 'break-all' }}>
          RPC: {getRpcEndpoint()}
        </p>
      </div>

      <div className="settings-card">
        <h3>Backend API</h3>
        <p>
          {health === null && 'Checking…'}
          {health?.ok && (
            <>
              Online · v{health.version || '?'} · Helius{' '}
              {health.helius ? 'configured' : 'not set (public RPC)'}
            </>
          )}
          {health === null ? null : !health.ok && 'Offline — run: cd server && npm run dev'}
        </p>
        <button className="btn small" style={{ marginTop: '0.75rem' }} onClick={recheck} disabled={checking}>
          {checking ? 'Checking…' : 'Recheck connection'}
        </button>
      </div>

      <div className="settings-card">
        <h3>Monitor worker</h3>
        {mon ? (
          <div className="hint" style={{ lineHeight: 1.6 }}>
            <div>Enabled: {mon.enabled ? 'yes' : 'no'}</div>
            <div>Watched wallets: {mon.watched}</div>
            <div>Cycles: {mon.cycles}</div>
            <div>Signals emitted: {mon.signalsEmitted}</div>
            <div>
              Last run:{' '}
              {mon.lastRunAt ? new Date(mon.lastRunAt).toLocaleString() : 'never'}
            </div>
            {mon.lastError && <div className="error-text">Last error: {mon.lastError}</div>}
          </div>
        ) : (
          <p>Start the API server to see monitor status.</p>
        )}
        <button
          className="btn small"
          style={{ marginTop: '0.75rem' }}
          onClick={forceMonitor}
          disabled={runningMon || !health?.ok}
        >
          {runningMon ? 'Running…' : 'Run monitor now'}
        </button>
      </div>

      <div className="settings-card">
        <h3>Local data</h3>
        <p>
          Copy configs and demo signals are stored in this browser when the API is offline. Clearing
          removes them from this device only.
        </p>
        <button className="btn small danger" style={{ marginTop: '0.75rem' }} onClick={clearLocalData}>
          Clear local copy data
        </button>
      </div>

      <div className="settings-card danger-zone">
        <h3>Risk reminder</h3>
        <p>
          Copy trading is high risk. Tokens can rug. Latency means worse fills than the wallet you
          copy. Never trade money you cannot afford to lose. This platform does not custody funds.
        </p>
      </div>
    </div>
  )
}

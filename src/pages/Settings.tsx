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
import {
  getAutoSignSettings,
  saveAutoSignSettings,
  disableAutoSign,
  clearAutoAttempted,
  type AutoSignSettings,
} from '../lib/autoSign'
import { useAppTick } from '../hooks/useAppTick'

export function Settings() {
  const { publicKey, connected } = useWallet()
  useAppTick()
  const [health, setHealth] = useState<HealthInfo | null>(null)
  const [checking, setChecking] = useState(false)
  const [runningMon, setRunningMon] = useState(false)
  const [feeStats, setFeeStats] = useState<{
    totalEvents: number
    totalTradeSol: number
    totalFeeSolEstimate: number
  } | null>(null)
  const [auto, setAuto] = useState<AutoSignSettings>(() => getAutoSignSettings())
  const [ack1, setAck1] = useState(false)
  const [ack2, setAck2] = useState(false)
  const [ack3, setAck3] = useState(false)
  const [ack4, setAck4] = useState(false)
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

  useEffect(() => {
    setAuto(getAutoSignSettings())
  })

  function clearLocalData() {
    const ok = window.confirm(
      'Clear copy settings and signals saved in this browser? This cannot be undone.'
    )
    if (!ok) return
    clearCopyConfigs()
    clearSignals()
    push('Local data cleared', 'success')
  }

  function tryEnableAutoSign() {
    if (!connected) {
      push('Connect your wallet first', 'error')
      return
    }
    if (!ack1 || !ack2 || !ack3 || !ack4) {
      push('Check all four risk acknowledgements first', 'error')
      return
    }
    const ok = window.confirm(
      'FINAL WARNING\n\n' +
        'Experimental auto-sign will try to place copy trades WITHOUT you reviewing each one.\n\n' +
        '• You may buy tokens you never wanted\n' +
        '• You may lose money quickly\n' +
        '• Bugs, lag, or bad signals can still fire trades\n' +
        '• Your wallet may still pop up unless you enabled auto-approve (even riskier)\n' +
        '• Only works while this browser tab stays open\n\n' +
        'Click OK only if you accept total responsibility for the outcomes.'
    )
    if (!ok) return

    clearAutoAttempted()
    const next = saveAutoSignSettings({
      enabled: true,
      acknowledged: true,
      maxSolPerTrade: auto.maxSolPerTrade,
      maxPerSession: auto.maxPerSession,
      pollSeconds: auto.pollSeconds,
      onlyWhenFocused: auto.onlyWhenFocused,
      sessionSigned: 0,
      sessionFailed: 0,
      lastError: undefined,
    })
    setAuto(next)
    push('Experimental auto-sign ENABLED', 'info')
  }

  function turnOffAutoSign() {
    const next = disableAutoSign('Turned off in Settings')
    setAuto(next)
    setAck1(false)
    setAck2(false)
    setAck3(false)
    setAck4(false)
    push('Auto-sign disabled', 'info')
  }

  const apiOk = health === null ? null : !!health.ok
  const mon = health?.monitor
  const feeWallet = getFeeWallet()

  return (
    <div className="page settings">
      <div className="page-header row-header">
        <div>
          <h1>Settings</h1>
          <p>Connection, fees, experimental auto-sign, monitor, and safety.</p>
        </div>
        <StatusDot ok={apiOk} />
      </div>

      <div className="settings-card danger-zone auto-sign-card">
        <div className="exp-badge">EXPERIMENTAL</div>
        <h3>Auto-sign mode</h3>
        <p className="auto-sign-warning">
          <strong>This is experimental and dangerous.</strong> When on, LottaCash will automatically
          attempt to sign pending copy-trade signals while this tab is open. You may execute trades
          you did not look at. Signals can be wrong, late, or based on wallets that rug. You can lose
          money — possibly all of the SOL you allow per trade. This is not financial advice. Use only
          with money you can afford to lose.
        </p>
        <ul className="auto-sign-list">
          <li>Does not run if you close the tab or put the device to sleep.</li>
          <li>
            Your wallet extension may still ask for approval on each trade unless you separately
            enabled auto-approve in the wallet (which increases risk further).
          </li>
          <li>Rejecting a wallet popup pauses auto-sign so it does not spam you.</li>
          <li>Hard caps below limit size and how many autos fire this session.</li>
        </ul>

        <div className="field">
          <label>Max SOL per auto trade</label>
          <input
            type="number"
            min={0.01}
            max={5}
            step={0.01}
            value={auto.maxSolPerTrade}
            disabled={auto.enabled}
            onChange={(e) =>
              setAuto(
                saveAutoSignSettings({
                  maxSolPerTrade: Number(e.target.value),
                })
              )
            }
          />
        </div>
        <div className="field">
          <label>Max auto trades this session</label>
          <input
            type="number"
            min={1}
            max={100}
            step={1}
            value={auto.maxPerSession}
            disabled={auto.enabled}
            onChange={(e) =>
              setAuto(
                saveAutoSignSettings({
                  maxPerSession: Number(e.target.value),
                })
              )
            }
          />
        </div>
        <div className="field">
          <label>Scan interval (seconds)</label>
          <input
            type="number"
            min={8}
            max={120}
            step={1}
            value={auto.pollSeconds}
            disabled={auto.enabled}
            onChange={(e) =>
              setAuto(
                saveAutoSignSettings({
                  pollSeconds: Number(e.target.value),
                })
              )
            }
          />
        </div>
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={auto.onlyWhenFocused}
            disabled={auto.enabled}
            onChange={(e) =>
              setAuto(saveAutoSignSettings({ onlyWhenFocused: e.target.checked }))
            }
          />
          Only auto-sign while this tab is focused (recommended)
        </label>

        {!auto.enabled && (
          <div className="ack-box">
            <p>
              <strong>You must check all boxes to enable:</strong>
            </p>
            <label className="checkbox-label">
              <input type="checkbox" checked={ack1} onChange={(e) => setAck1(e.target.checked)} />
              I understand auto-sign is experimental and may place trades I did not review.
            </label>
            <label className="checkbox-label">
              <input type="checkbox" checked={ack2} onChange={(e) => setAck2(e.target.checked)} />
              I understand I can lose money, including from bad signals, lag, bugs, or rugs.
            </label>
            <label className="checkbox-label">
              <input type="checkbox" checked={ack3} onChange={(e) => setAck3(e.target.checked)} />
              I understand this only works while the tab is open and is not a guaranteed bot.
            </label>
            <label className="checkbox-label">
              <input type="checkbox" checked={ack4} onChange={(e) => setAck4(e.target.checked)} />
              I accept full responsibility; LottaCash is not liable for my trading outcomes.
            </label>
          </div>
        )}

        <div className="form-actions" style={{ marginTop: '0.85rem' }}>
          {auto.enabled ? (
            <button className="btn danger" onClick={turnOffAutoSign}>
              Turn off auto-sign
            </button>
          ) : (
            <button
              className="btn danger"
              onClick={tryEnableAutoSign}
              disabled={!ack1 || !ack2 || !ack3 || !ack4 || !connected}
            >
              Enable experimental auto-sign
            </button>
          )}
        </div>

        <p className="hint" style={{ marginTop: '0.75rem' }}>
          Status: {auto.enabled ? 'ON' : 'off'} · session signed {auto.sessionSigned}/
          {auto.maxPerSession} · failed {auto.sessionFailed}
          {auto.lastError ? ` · last: ${auto.lastError}` : ''}
        </p>
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

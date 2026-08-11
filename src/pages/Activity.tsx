import { useCallback, useEffect, useState } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { listCopyConfigs } from '../lib/copyStore'
import {
  listSignals,
  createDemoSignal,
  updateSignalStatus,
  type TradeSignal,
} from '../lib/monitor'
import {
  apiHealth,
  createDemoSignalApi,
  fetchSignals,
  patchSignal,
} from '../lib/api'
import { executeDemoSwap } from '../lib/executeSwap'
import { shortAddress } from '../lib/format'

export function Activity() {
  const wallet = useWallet()
  const [signals, setSignals] = useState<TradeSignal[]>([])
  const [busyId, setBusyId] = useState<string | null>(null)
  const [msg, setMsg] = useState<string | null>(null)
  const [apiOnline, setApiOnline] = useState(false)

  const refresh = useCallback(async () => {
    const local = listSignals()
    setSignals(local)

    if (!wallet.publicKey) return
    try {
      const ok = await apiHealth()
      setApiOnline(ok)
      if (!ok) return
      const { signals: remote } = await fetchSignals(wallet.publicKey.toBase58())
      if (remote.length) {
        // Show remote signals (server is source of truth when online)
        setSignals(remote)
      }
    } catch {
      setApiOnline(false)
    }
  }, [wallet.publicKey])

  useEffect(() => {
    refresh()
    const t = setInterval(refresh, 8000)
    return () => clearInterval(t)
  }, [refresh])

  async function handleDemoSignal() {
    const configs = listCopyConfigs().filter((c) => c.enabled)
    if (configs.length === 0) {
      setMsg('Enable at least one copy configuration first (My Copies).')
      return
    }
    const cfg = configs[0]

    if (wallet.publicKey && (await apiHealth())) {
      try {
        await createDemoSignalApi(wallet.publicKey.toBase58(), cfg.targetAddress)
        setMsg('Demo signal created on server for ' + shortAddress(cfg.targetAddress))
        await refresh()
        return
      } catch (e) {
        setMsg(e instanceof Error ? e.message : 'Server demo failed; using local')
      }
    }

    createDemoSignal(cfg, 'buy')
    setMsg('Demo buy signal created locally for ' + shortAddress(cfg.targetAddress))
    refresh()
  }

  async function handleSign(signal: TradeSignal) {
    if (!wallet.connected || !wallet.publicKey) {
      setMsg('Connect your wallet first.')
      return
    }

    const cfg = listCopyConfigs().find((c) => c.targetAddress === signal.targetAddress)
    const slippageBps = cfg?.slippageBps ?? 200

    setBusyId(signal.id)
    setMsg(null)

    try {
      const USDC = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'
      const mint = signal.tokenMint || USDC
      const sig = await executeDemoSwap({
        wallet,
        side: signal.side,
        tokenMint: mint === 'So11111111111111111111111111111111111111112' ? USDC : mint,
        solAmount: Math.min(signal.suggestedSol, 0.05),
        slippageBps,
      })

      updateSignalStatus(signal.id, 'signed', { txSignature: sig })
      if (apiOnline) {
        try {
          await patchSignal(signal.id, { status: 'signed', txSignature: sig })
        } catch {
          /* ignore */
        }
      }
      setMsg(`Signed & sent: ${sig}`)
    } catch (e) {
      const err = e instanceof Error ? e.message : String(e)
      updateSignalStatus(signal.id, 'failed', { error: err })
      if (apiOnline) {
        try {
          await patchSignal(signal.id, { status: 'failed', error: err })
        } catch {
          /* ignore */
        }
      }
      setMsg(`Failed: ${err}`)
    } finally {
      setBusyId(null)
      refresh()
    }
  }

  async function dismiss(id: string) {
    updateSignalStatus(id, 'dismissed')
    if (apiOnline) {
      try {
        await patchSignal(id, { status: 'dismissed' })
      } catch {
        /* ignore */
      }
    }
    refresh()
  }

  return (
    <div className="page activity">
      <div className="page-header">
        <h1>Activity</h1>
        <p>
          Trade signals for your account.{' '}
          {apiOnline ? 'Connected to API (polls every 8s).' : 'API offline — local signals only.'}
        </p>
      </div>

      <div className="activity-toolbar">
        <button className="btn primary" onClick={handleDemoSignal}>
          Generate demo signal
        </button>
      </div>

      {msg && <div className="notice">{msg}</div>}

      {signals.length === 0 ? (
        <div className="empty">
          <p>No signals yet.</p>
          <p className="hint">Enable a copy, then generate a demo signal to test signing.</p>
        </div>
      ) : (
        <div className="signals-list">
          {signals.map((s) => (
            <div key={s.id} className={`signal-card status-${s.status}`}>
              <div className="signal-main">
                <div className="signal-title">
                  <span className={`side ${s.side}`}>{s.side.toUpperCase()}</span>
                  <span className="mono">{shortAddress(s.targetAddress, 4)}</span>
                  <span className="muted">{s.tokenSymbol || shortAddress(s.tokenMint, 4)}</span>
                </div>
                <div className="signal-meta">
                  ~{s.suggestedSol} SOL · {new Date(s.detectedAt).toLocaleString()} · {s.status}
                </div>
                {s.txSignature && (
                  <a
                    className="tx-link"
                    href={`https://solscan.io/tx/${s.txSignature}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    View on Solscan
                  </a>
                )}
                {s.error && <div className="error-text">{s.error}</div>}
              </div>
              <div className="signal-actions">
                {s.status === 'pending' && (
                  <>
                    <button
                      className="btn small primary"
                      disabled={busyId === s.id || !wallet.connected}
                      onClick={() => handleSign(s)}
                    >
                      {busyId === s.id ? 'Signing…' : 'Sign swap'}
                    </button>
                    <button className="btn small" onClick={() => dismiss(s.id)}>
                      Dismiss
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
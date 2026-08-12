import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
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
import { HelpTip } from '../components/HelpTip'
import { useAppTick } from '../hooks/useAppTick'
import { useToast } from '../components/Toast'

export function Activity() {
  const wallet = useWallet()
  useAppTick()
  const { push } = useToast()
  const [signals, setSignals] = useState<TradeSignal[]>([])
  const [busyId, setBusyId] = useState<string | null>(null)
  const [msg, setMsg] = useState<string | null>(null)
  const [apiOnline, setApiOnline] = useState(false)

  const refresh = useCallback(async () => {
    setSignals(listSignals())

    if (!wallet.publicKey) return
    try {
      const ok = await apiHealth()
      setApiOnline(ok)
      if (!ok) return
      const { signals: remote } = await fetchSignals(wallet.publicKey.toBase58())
      if (remote.length) {
        // Prefer remote when API has data; keep local-only demos merged by id
        const byId = new Map<string, TradeSignal>()
        for (const s of listSignals()) byId.set(s.id, s)
        for (const s of remote) byId.set(s.id, s)
        setSignals([...byId.values()].sort((a, b) => b.detectedAt - a.detectedAt))
      }
    } catch {
      setApiOnline(false)
    }
  }, [wallet.publicKey])

  useEffect(() => {
    refresh()
    const t = setInterval(refresh, 10000)
    return () => clearInterval(t)
  }, [refresh])

  async function handleDemoSignal() {
    const configs = listCopyConfigs().filter((c) => c.enabled)
    if (configs.length === 0) {
      setMsg('Turn on at least one copy first (Leaderboard → Copy → save with “on”).')
      push('Enable a copy first', 'error')
      return
    }
    const cfg = configs[0]

    if (wallet.publicKey && (await apiHealth())) {
      try {
        await createDemoSignalApi(wallet.publicKey.toBase58(), cfg.targetAddress)
        setMsg('Demo signal created. Scroll down and try Sign swap (tiny size).')
        push('Demo signal ready', 'success')
        await refresh()
        return
      } catch (e) {
        setMsg(e instanceof Error ? e.message : 'Server demo failed; trying local')
      }
    }

    createDemoSignal(cfg, 'buy')
    setMsg('Demo signal created on this device.')
    push('Demo signal ready', 'success')
    refresh()
  }

  async function handleSign(signal: TradeSignal) {
    if (!wallet.connected || !wallet.publicKey) {
      setMsg('Connect your wallet first (top right).')
      push('Connect wallet first', 'error')
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
        tokenMint: mint,
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
      setMsg(`Done. Transaction: ${sig.slice(0, 12)}…`)
      push('Swap submitted', 'success')
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
      setMsg(`Could not complete swap: ${err}`)
      push('Swap failed', 'error')
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

  const enabledCount = listCopyConfigs().filter((c) => c.enabled).length

  return (
    <div className="page activity">
      <div className="page-header">
        <h1>Activity</h1>
        <p>
          Trade alerts for wallets you follow. Review each one, then sign in your wallet or skip it.
        </p>
      </div>

      <HelpTip title="What should I do here?">
        <p>
          When a copied wallet trades, a card appears below. <strong>Sign swap</strong> opens your
          wallet to approve a Jupiter exchange sized by your rules. <strong>Dismiss</strong> ignores
          that alert.
        </p>
        <p>
          Live monitoring is still being connected. Use <strong>Generate demo signal</strong> to
          practice the sign flow safely with a very small size.
        </p>
      </HelpTip>

      {enabledCount === 0 && (
        <div className="banner-info">
          You’re not copying anyone yet.{' '}
          <Link to="/leaderboard">Pick a wallet on the leaderboard</Link> to get started.
        </div>
      )}

      <div className="activity-toolbar">
        <button className="btn primary" onClick={handleDemoSignal}>
          Generate demo signal
        </button>
        <span className="toolbar-hint">
          {apiOnline ? 'API connected' : 'API offline — local only'}
        </span>
      </div>

      {msg && <div className="notice">{msg}</div>}

      {signals.length === 0 ? (
        <div className="empty">
          <p>No signals yet.</p>
          <p className="hint">
            Enable a copy, then press <strong>Generate demo signal</strong> to test.
          </p>
          <Link to="/leaderboard" className="btn ghost">
            Browse leaderboard
          </Link>
        </div>
      ) : (
        <div className="signals-list">
          {signals.map((s) => (
            <div key={s.id} className={`signal-card status-${s.status}`}>
              <div className="signal-main">
                <div className="signal-title">
                  <span className={`side ${s.side}`}>{s.side.toUpperCase()}</span>
                  <span className="mono">{shortAddress(s.targetAddress, 4)}</span>
                  <span className="muted">{s.tokenSymbol || 'token'}</span>
                </div>
                <div className="signal-meta">
                  About {s.suggestedSol} SOL · {new Date(s.detectedAt).toLocaleString()} ·{' '}
                  {s.status}
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
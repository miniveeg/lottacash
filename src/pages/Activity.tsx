import { useEffect, useState } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { listCopyConfigs } from '../lib/copyStore'
import {
  listSignals,
  createDemoSignal,
  updateSignalStatus,
  type TradeSignal,
} from '../lib/monitor'
import { executeDemoSwap } from '../lib/executeSwap'
import { shortAddress } from '../lib/format'
import { SOL_MINT } from '../lib/jupiter'

export function Activity() {
  const wallet = useWallet()
  const [signals, setSignals] = useState<TradeSignal[]>([])
  const [busyId, setBusyId] = useState<string | null>(null)
  const [msg, setMsg] = useState<string | null>(null)

  function refresh() {
    setSignals(listSignals())
  }

  useEffect(() => {
    refresh()
  }, [])

  function handleDemoSignal() {
    const configs = listCopyConfigs().filter((c) => c.enabled)
    if (configs.length === 0) {
      setMsg('Enable at least one copy configuration first (My Copies).')
      return
    }
    const cfg = configs[0]
    createDemoSignal(cfg, 'buy')
    setMsg('Demo buy signal created for ' + shortAddress(cfg.targetAddress))
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
      // Demo uses a well-known liquid pair path. Real flow uses the exact mint from the target trade.
      // Using SOL mint on both sides is invalid — for a safe demo we only quote SOL -> USDC-like path
      // if available; otherwise we surface a clear message.
      //
      // Simplest safe demo: buy a tiny amount of a known mint is risky on mainnet.
      // So we demonstrate the signing path with a quote that may fail on purpose if mint is SOL.
      // Prefer: user tests on devnet, or we only build the quote and show the result.

      if (signal.tokenMint === SOL_MINT) {
        // Safer demo: only fetch a quote for SOL -> USDC (mainnet) so user sees real Jupiter response
        // without forcing a random memecoin buy.
        const USDC = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'
        const sig = await executeDemoSwap({
          wallet,
          side: 'buy',
          tokenMint: USDC,
          solAmount: Math.min(signal.suggestedSol, 0.05), // hard safety cap for demo
          slippageBps,
        })
        updateSignalStatus(signal.id, 'signed', { txSignature: sig })
        setMsg(`Signed & sent: ${sig}`)
      } else {
        const sig = await executeDemoSwap({
          wallet,
          side: signal.side,
          tokenMint: signal.tokenMint,
          solAmount: signal.suggestedSol,
          slippageBps,
        })
        updateSignalStatus(signal.id, 'signed', { txSignature: sig })
        setMsg(`Signed & sent: ${sig}`)
      }
    } catch (e) {
      const err = e instanceof Error ? e.message : String(e)
      updateSignalStatus(signal.id, 'failed', { error: err })
      setMsg(`Failed: ${err}`)
    } finally {
      setBusyId(null)
      refresh()
    }
  }

  function dismiss(id: string) {
    updateSignalStatus(id, 'dismissed')
    refresh()
  }

  return (
    <div className="page activity">
      <div className="page-header">
        <h1>Activity</h1>
        <p>
          Trade signals appear here when a copied wallet acts. For now you can generate a demo
          signal and test the full Jupiter quote → sign → send flow.
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

      <div className="notice small" style={{ marginTop: '2rem' }}>
        <strong>Production path:</strong> A backend watches enabled target wallets, detects real
        swaps, sizes according to each user config, builds a Jupiter transaction, and pushes a
        signal here. You only sign. The demo button proves the signing path works end-to-end.
      </div>
    </div>
  )
}
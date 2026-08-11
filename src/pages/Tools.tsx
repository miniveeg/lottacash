import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useWallet } from '@solana/wallet-adapter-react'
import {
  isValidSolanaAddress,
  getSolBalance,
  getRecentSignatures,
  explorerAddress,
  explorerTx,
  computeCopySize,
} from '../lib/solanaTools'
import { CopyButton } from '../components/CopyButton'
import { shortAddress } from '../lib/format'
import { useToast } from '../components/Toast'

export function Tools() {
  const { publicKey, connected } = useWallet()
  const navigate = useNavigate()
  const { push } = useToast()

  // Wallet lookup
  const [lookup, setLookup] = useState('')
  const [balance, setBalance] = useState<number | null>(null)
  const [sigs, setSigs] = useState<{ signature: string; err: unknown; blockTime: number | null }[]>([])
  const [lookupBusy, setLookupBusy] = useState(false)

  // Size calculator
  const [mode, setMode] = useState<'fixed' | 'proportional'>('fixed')
  const [fixedSol, setFixedSol] = useState('0.5')
  const [maxSol, setMaxSol] = useState('5')
  const [leaderSol, setLeaderSol] = useState('1.2')

  async function runLookup() {
    const addr = lookup.trim()
    if (!isValidSolanaAddress(addr)) {
      push('Invalid Solana address', 'error')
      return
    }
    setLookupBusy(true)
    setBalance(null)
    setSigs([])
    try {
      const [bal, recent] = await Promise.all([
        getSolBalance(addr),
        getRecentSignatures(addr, 10),
      ])
      setBalance(bal)
      setSigs(
        recent.map((r) => ({
          signature: r.signature,
          err: r.err,
          blockTime: r.blockTime ?? null,
        }))
      )
      push('Wallet loaded', 'success')
    } catch (e) {
      push(e instanceof Error ? e.message : 'Lookup failed', 'error')
    } finally {
      setLookupBusy(false)
    }
  }

  function startCopyFromLookup() {
    const addr = lookup.trim()
    if (!isValidSolanaAddress(addr)) {
      push('Enter a valid address first', 'error')
      return
    }
    navigate(`/copy/${addr}`)
  }

  async function loadMyBalance() {
    if (!publicKey) return
    setLookup(publicKey.toBase58())
    setLookupBusy(true)
    try {
      const bal = await getSolBalance(publicKey.toBase58())
      setBalance(bal)
      const recent = await getRecentSignatures(publicKey.toBase58(), 10)
      setSigs(
        recent.map((r) => ({
          signature: r.signature,
          err: r.err,
          blockTime: r.blockTime ?? null,
        }))
      )
    } catch (e) {
      push(e instanceof Error ? e.message : 'Failed', 'error')
    } finally {
      setLookupBusy(false)
    }
  }

  const suggested = computeCopySize({
    mode,
    fixedSol: Number(fixedSol) || 0,
    maxSol: Number(maxSol) || 0,
    leaderSol: Number(leaderSol) || 0,
  })

  return (
    <div className="page tools">
      <div className="page-header">
        <h1>Tools</h1>
        <p>Wallet lookup, size calculator, and quick actions for copy trading.</p>
      </div>

      <div className="tools-grid">
        {/* Wallet lookup */}
        <section className="tool-card">
          <h2>Wallet lookup</h2>
          <p className="tool-desc">Paste any Solana address to check SOL balance and recent txs.</p>
          <div className="tool-row">
            <input
              className="input grow"
              placeholder="Solana address"
              value={lookup}
              onChange={(e) => setLookup(e.target.value)}
            />
            <button className="btn primary" onClick={runLookup} disabled={lookupBusy}>
              {lookupBusy ? '…' : 'Lookup'}
            </button>
          </div>
          {connected && (
            <button className="btn small" style={{ marginTop: '0.75rem' }} onClick={loadMyBalance}>
              Use my wallet
            </button>
          )}

          {balance !== null && (
            <div className="tool-result">
              <div className="result-line">
                <strong>Balance:</strong> {balance.toFixed(4)} SOL
              </div>
              <div className="result-actions">
                <CopyButton text={lookup.trim()} />
                <a
                  className="btn small"
                  href={explorerAddress(lookup.trim())}
                  target="_blank"
                  rel="noreferrer"
                >
                  Solscan
                </a>
                <button className="btn small primary" onClick={startCopyFromLookup}>
                  Copy this wallet
                </button>
              </div>

              {sigs.length > 0 && (
                <div className="sig-list">
                  <div className="sig-title">Recent signatures</div>
                  {sigs.map((s) => (
                    <div key={s.signature} className="sig-row">
                      <a href={explorerTx(s.signature)} target="_blank" rel="noreferrer" className="mono">
                        {shortAddress(s.signature, 6)}
                      </a>
                      <span className={s.err ? 'negative' : 'positive'}>
                        {s.err ? 'err' : 'ok'}
                      </span>
                      <span className="muted">
                        {s.blockTime ? new Date(s.blockTime * 1000).toLocaleString() : '—'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </section>

        {/* Size calculator */}
        <section className="tool-card">
          <h2>Size calculator</h2>
          <p className="tool-desc">Preview how much SOL a copy trade would use under your rules.</p>

          <div className="field">
            <label>Mode</label>
            <div className="radio-group">
              <label>
                <input
                  type="radio"
                  checked={mode === 'fixed'}
                  onChange={() => setMode('fixed')}
                />
                Fixed
              </label>
              <label>
                <input
                  type="radio"
                  checked={mode === 'proportional'}
                  onChange={() => setMode('proportional')}
                />
                Proportional
              </label>
            </div>
          </div>

          {mode === 'fixed' && (
            <div className="field">
              <label>Fixed SOL</label>
              <input
                className="input"
                type="number"
                step="0.01"
                value={fixedSol}
                onChange={(e) => setFixedSol(e.target.value)}
              />
            </div>
          )}

          {mode === 'proportional' && (
            <div className="field">
              <label>Leader trade size (SOL)</label>
              <input
                className="input"
                type="number"
                step="0.01"
                value={leaderSol}
                onChange={(e) => setLeaderSol(e.target.value)}
              />
            </div>
          )}

          <div className="field">
            <label>Max SOL cap</label>
            <input
              className="input"
              type="number"
              step="0.1"
              value={maxSol}
              onChange={(e) => setMaxSol(e.target.value)}
            />
          </div>

          <div className="calc-result">
            Suggested size: <strong>{suggested.toFixed(4)} SOL</strong>
          </div>
        </section>

        {/* Quick links */}
        <section className="tool-card">
          <h2>Quick links</h2>
          <div className="quick-links">
            <Link to="/leaderboard" className="btn ghost">
              Leaderboard
            </Link>
            <Link to="/copies" className="btn ghost">
              My Copies
            </Link>
            <Link to="/activity" className="btn ghost">
              Activity / signals
            </Link>
            <a
              className="btn ghost"
              href="https://jup.ag"
              target="_blank"
              rel="noreferrer"
            >
              Jupiter
            </a>
            <a
              className="btn ghost"
              href="https://solscan.io"
              target="_blank"
              rel="noreferrer"
            >
              Solscan
            </a>
            <a
              className="btn ghost"
              href="https://birdeye.so"
              target="_blank"
              rel="noreferrer"
            >
              Birdeye
            </a>
          </div>
        </section>

        {/* Risk checklist */}
        <section className="tool-card">
          <h2>Before you copy</h2>
          <ul className="checklist">
            <li>Set a max SOL cap you can afford to lose</li>
            <li>Prefer wallets with consistent realized profits, not one lucky trade</li>
            <li>Expect worse entries than the leader (latency)</li>
            <li>Memecoins can go to zero — size small</li>
            <li>You sign every swap; never export your seed</li>
          </ul>
        </section>
      </div>
    </div>
  )
}
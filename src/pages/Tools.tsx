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
import { HelpTip } from '../components/HelpTip'

export function Tools() {
  const { publicKey, connected } = useWallet()
  const navigate = useNavigate()
  const { push } = useToast()

  const [lookup, setLookup] = useState('')
  const [balance, setBalance] = useState<number | null>(null)
  const [sigs, setSigs] = useState<{ signature: string; err: unknown; blockTime: number | null }[]>([])
  const [lookupBusy, setLookupBusy] = useState(false)

  const [mode, setMode] = useState<'fixed' | 'proportional'>('fixed')
  const [fixedSol, setFixedSol] = useState('0.2')
  const [maxSol, setMaxSol] = useState('1')
  const [leaderSol, setLeaderSol] = useState('1.2')

  async function runLookup() {
    const addr = lookup.trim()
    if (!isValidSolanaAddress(addr)) {
      push('That doesn’t look like a valid Solana address', 'error')
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
        <p>Look up any wallet, preview trade size, and jump to useful links.</p>
      </div>

      <HelpTip title="When do I use this?">
        <p>
          Use <strong>Wallet lookup</strong> if someone shared an address that isn’t on the
          leaderboard. Use the <strong>size calculator</strong> before you commit to copy settings.
        </p>
      </HelpTip>

      <div className="tools-grid">
        <section className="tool-card">
          <h2>Wallet lookup</h2>
          <p className="tool-desc">Paste an address to see SOL balance and recent transactions.</p>
          <div className="tool-row">
            <input
              className="input grow"
              placeholder="Paste Solana address"
              value={lookup}
              onChange={(e) => setLookup(e.target.value)}
            />
            <button className="btn primary" onClick={runLookup} disabled={lookupBusy}>
              {lookupBusy ? '…' : 'Look up'}
            </button>
          </div>
          {connected && (
            <button className="btn small" style={{ marginTop: '0.75rem' }} onClick={loadMyBalance}>
              Use my connected wallet
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
                  Open Solscan
                </a>
                <button className="btn small primary" onClick={startCopyFromLookup}>
                  Copy this wallet
                </button>
              </div>

              {sigs.length > 0 && (
                <div className="sig-list">
                  <div className="sig-title">Recent transactions</div>
                  {sigs.map((s) => (
                    <div key={s.signature} className="sig-row">
                      <a href={explorerTx(s.signature)} target="_blank" rel="noreferrer" className="mono">
                        {shortAddress(s.signature, 6)}
                      </a>
                      <span className={s.err ? 'negative' : 'positive'}>
                        {s.err ? 'failed' : 'ok'}
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

        <section className="tool-card">
          <h2>Size calculator</h2>
          <p className="tool-desc">See how much SOL a copy would use before you save settings.</p>

          <div className="field">
            <label>Mode</label>
            <div className="radio-group">
              <label>
                <input type="radio" checked={mode === 'fixed'} onChange={() => setMode('fixed')} />
                Fixed amount
              </label>
              <label>
                <input
                  type="radio"
                  checked={mode === 'proportional'}
                  onChange={() => setMode('proportional')}
                />
                Match their size
              </label>
            </div>
          </div>

          {mode === 'fixed' && (
            <div className="field">
              <label>Your fixed SOL</label>
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
              <label>Their trade size (SOL)</label>
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
            <label>Your max cap (SOL)</label>
            <input
              className="input"
              type="number"
              step="0.1"
              value={maxSol}
              onChange={(e) => setMaxSol(e.target.value)}
            />
          </div>

          <div className="calc-result">
            You would use about <strong>{suggested.toFixed(4)} SOL</strong>
          </div>
        </section>

        <section className="tool-card">
          <h2>Shortcuts</h2>
          <div className="quick-links">
            <Link to="/leaderboard" className="btn ghost">
              Leaderboard
            </Link>
            <Link to="/help" className="btn ghost">
              Help & FAQ
            </Link>
            <a className="btn ghost" href="https://jup.ag" target="_blank" rel="noreferrer">
              Jupiter (swaps)
            </a>
            <a className="btn ghost" href="https://solscan.io" target="_blank" rel="noreferrer">
              Solscan (explorer)
            </a>
          </div>
        </section>

        <section className="tool-card">
          <h2>Before you risk real SOL</h2>
          <ul className="checklist">
            <li>Practice with a tiny size first</li>
            <li>Always set a max cap</li>
            <li>Expect worse fills than the leader</li>
            <li>Never paste your seed phrase into any website</li>
          </ul>
        </section>
      </div>
    </div>
  )
}
import { useEffect, useMemo, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useWallet } from '@solana/wallet-adapter-react'
import { getWalletByAddress } from '../lib/mockData'
import { getCopyConfig, saveCopyConfig, removeCopyConfig } from '../lib/copyStore'
import { saveConfigApi, deleteConfigApi, apiHealth } from '../lib/api'
import type { SizeMode } from '../lib/types'
import { shortAddress } from '../lib/format'
import { HelpTip } from '../components/HelpTip'
import { FeeNotice } from '../components/FeeNotice'
import { useToast } from '../components/Toast'
import { isValidSolanaAddress, explorerAddress } from '../lib/solanaTools'
import { estimateFeeSol, feesEnabled, formatFeePercent } from '../lib/fees'

export function CopySetup() {
  const { address } = useParams<{ address: string }>()
  const navigate = useNavigate()
  const { publicKey, connected } = useWallet()
  const walletMeta = address ? getWalletByAddress(address) : undefined
  const { push } = useToast()

  const [sizeMode, setSizeMode] = useState<SizeMode>('fixed')
  const [fixedSol, setFixedSol] = useState('0.2')
  const [maxSol, setMaxSol] = useState('1')
  const [slippage, setSlippage] = useState('2')
  const [enabled, setEnabled] = useState(true)
  const [saved, setSaved] = useState(false)
  const [existing, setExisting] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const valid = !!address && isValidSolanaAddress(address)

  const previewSol = useMemo(() => {
    const n = Number(fixedSol)
    return Number.isFinite(n) && n > 0 ? n : 0
  }, [fixedSol])

  useEffect(() => {
    if (!address || !valid) return
    const cfg = getCopyConfig(address)
    if (cfg) {
      setExisting(true)
      setSizeMode(cfg.sizeMode)
      setFixedSol(String(cfg.fixedSol))
      setMaxSol(String(cfg.maxSol))
      setSlippage(String(cfg.slippageBps / 100))
      setEnabled(cfg.enabled)
    }
  }, [address, valid])

  async function handleSave() {
    if (!address || !publicKey || !valid) return
    const fixed = Number(fixedSol)
    const max = Number(maxSol)
    const slip = Number(slippage)
    if (!Number.isFinite(fixed) || fixed <= 0) {
      setError('Fixed SOL must be greater than 0')
      return
    }
    if (!Number.isFinite(max) || max < fixed) {
      setError('Max SOL must be at least your fixed amount')
      return
    }

    setBusy(true)
    setError(null)
    const payload = {
      targetAddress: address,
      sizeMode,
      fixedSol: fixed,
      maxSol: max,
      slippageBps: Math.round((Number.isFinite(slip) ? slip : 1) * 100),
      enabled,
    }

    saveCopyConfig(payload)

    try {
      if (await apiHealth()) {
        await saveConfigApi({
          ...payload,
          ownerWallet: publicKey.toBase58(),
        })
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Saved on this device only (API offline)')
    }

    setSaved(true)
    setExisting(true)
    setBusy(false)
    push(enabled ? 'Copying enabled' : 'Settings saved (currently off)', 'success')
    setTimeout(() => setSaved(false), 2000)
  }

  async function handleRemove() {
    if (!address) return
    const ok = window.confirm('Stop copying this wallet and remove your settings?')
    if (!ok) return
    removeCopyConfig(address)
    if (publicKey) {
      try {
        if (await apiHealth()) await deleteConfigApi(publicKey.toBase58(), address)
      } catch {
        /* local already removed */
      }
    }
    push('Stopped copying this wallet', 'info')
    navigate('/copies')
  }

  if (!address || !valid) {
    return (
      <div className="page">
        <div className="empty">
          <p>That doesn’t look like a valid Solana address.</p>
          <Link to="/tools" className="btn primary">
            Look up a wallet
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="page copy-setup">
      <div className="page-header">
        <Link to="/leaderboard" className="back">
          ← Back to leaderboard
        </Link>
        <h1>Set up copy</h1>
        <p className="mono">
          <a href={explorerAddress(address)} target="_blank" rel="noreferrer">
            {shortAddress(address, 6)}
          </a>
          {walletMeta?.label ? ` · ${walletMeta.label}` : ''}
        </p>
      </div>

      <HelpTip title="What happens after I save?">
        <p>
          We remember this wallet and your size rules. When they trade, a <strong>signal</strong>{' '}
          appears under Activity. You review it and sign in your own wallet — or ignore it.
        </p>
        <p>Start with a small fixed amount (0.1–0.3 SOL) and a max cap while you learn.</p>
      </HelpTip>

      <FeeNotice tradeSol={sizeMode === 'fixed' ? previewSol : undefined} />

      {!connected ? (
        <div className="banner-warn">
          <strong>Connect your wallet</strong> (button in the top right) to save these settings.
        </div>
      ) : (
        <div className="setup-form">
          <div className="field">
            <label>How much SOL per copy?</label>
            <div className="radio-group">
              <label>
                <input
                  type="radio"
                  checked={sizeMode === 'fixed'}
                  onChange={() => setSizeMode('fixed')}
                />
                <span>
                  <strong>Fixed amount</strong> — same SOL every time (recommended)
                </span>
              </label>
              <label>
                <input
                  type="radio"
                  checked={sizeMode === 'proportional'}
                  onChange={() => setSizeMode('proportional')}
                />
                <span>
                  <strong>Match their size</strong> — try 1:1, still limited by your max
                </span>
              </label>
            </div>
          </div>

          {sizeMode === 'fixed' && (
            <div className="field">
              <label>SOL each time they trade</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={fixedSol}
                onChange={(e) => setFixedSol(e.target.value)}
              />
              <p className="field-hint">
                Example: 0.2 means every copy uses about 0.2 SOL.
                {feesEnabled() && previewSol > 0 && (
                  <>
                    {' '}
                    At {formatFeePercent()}, fee ≈ {estimateFeeSol(previewSol).toFixed(4)} SOL per
                    trade.
                  </>
                )}
              </p>
              <div className="quick-sizes">
                {['0.05', '0.1', '0.25', '0.5', '1'].map((v) => (
                  <button key={v} type="button" className="btn small" onClick={() => setFixedSol(v)}>
                    {v} SOL
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="field">
            <label>Max SOL on a single trade (safety cap)</label>
            <input
              type="number"
              step="0.1"
              min="0.1"
              value={maxSol}
              onChange={(e) => setMaxSol(e.target.value)}
            />
            <p className="field-hint">Hard ceiling so one trade cannot use more than this.</p>
          </div>

          <div className="field">
            <label>Max slippage %</label>
            <input
              type="number"
              step="0.1"
              min="0.1"
              value={slippage}
              onChange={(e) => setSlippage(e.target.value)}
            />
            <p className="field-hint">
              How much worse a price you’ll accept vs quote. 1–3% is common for memecoins.
            </p>
          </div>

          <div className="field">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={enabled}
                onChange={(e) => setEnabled(e.target.checked)}
              />
              Turn copying on now
            </label>
          </div>

          {error && <div className="error-text">{error}</div>}

          <div className="form-actions">
            <button className="btn primary" onClick={handleSave} disabled={busy}>
              {busy ? 'Saving…' : saved ? 'Saved' : existing ? 'Save changes' : 'Start copying'}
            </button>
            {existing && (
              <button className="btn danger" onClick={handleRemove}>
                Stop copying
              </button>
            )}
          </div>

          <p className="connected-as">
            Saving for {publicKey ? shortAddress(publicKey.toBase58()) : '—'}
          </p>

          <div className="after-save">
            Next: open <Link to="/activity">Activity</Link> to see signals, or{' '}
            <Link to="/copies">My copies</Link> to manage follows.
          </div>
        </div>
      )}
    </div>
  )
}

import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useWallet } from '@solana/wallet-adapter-react'
import { getWalletByAddress } from '../lib/mockData'
import { getCopyConfig, saveCopyConfig, removeCopyConfig } from '../lib/copyStore'
import type { SizeMode } from '../lib/types'
import { shortAddress } from '../lib/format'

export function CopySetup() {
  const { address } = useParams<{ address: string }>()
  const navigate = useNavigate()
  const { publicKey, connected } = useWallet()
  const walletMeta = address ? getWalletByAddress(address) : undefined

  const [sizeMode, setSizeMode] = useState<SizeMode>('fixed')
  const [fixedSol, setFixedSol] = useState('0.5')
  const [maxSol, setMaxSol] = useState('5')
  const [slippage, setSlippage] = useState('2')
  const [enabled, setEnabled] = useState(true)
  const [saved, setSaved] = useState(false)
  const [existing, setExisting] = useState(false)

  useEffect(() => {
    if (!address) return
    const cfg = getCopyConfig(address)
    if (cfg) {
      setExisting(true)
      setSizeMode(cfg.sizeMode)
      setFixedSol(String(cfg.fixedSol))
      setMaxSol(String(cfg.maxSol))
      setSlippage(String(cfg.slippageBps / 100))
      setEnabled(cfg.enabled)
    }
  }, [address])

  function handleSave() {
    if (!address) return
    saveCopyConfig({
      targetAddress: address,
      sizeMode,
      fixedSol: Number(fixedSol) || 0.1,
      maxSol: Number(maxSol) || 1,
      slippageBps: Math.round((Number(slippage) || 1) * 100),
      enabled,
    })
    setSaved(true)
    setExisting(true)
    setTimeout(() => setSaved(false), 2000)
  }

  function handleRemove() {
    if (!address) return
    removeCopyConfig(address)
    navigate('/copies')
  }

  if (!address) {
    return <div className="page">Invalid wallet.</div>
  }

  return (
    <div className="page copy-setup">
      <div className="page-header">
        <Link to="/leaderboard" className="back">
          ← Back to leaderboard
        </Link>
        <h1>Copy Wallet</h1>
        <p className="mono">
          {shortAddress(address, 6)}
          {walletMeta?.label ? ` · ${walletMeta.label}` : ''}
        </p>
      </div>

      {!connected ? (
        <div className="notice">
          <p>Connect your wallet to configure and save copy settings.</p>
        </div>
      ) : (
        <div className="setup-form">
          <div className="field">
            <label>Size Mode</label>
            <div className="radio-group">
              <label>
                <input
                  type="radio"
                  checked={sizeMode === 'fixed'}
                  onChange={() => setSizeMode('fixed')}
                />
                Fixed SOL amount
              </label>
              <label>
                <input
                  type="radio"
                  checked={sizeMode === 'proportional'}
                  onChange={() => setSizeMode('proportional')}
                />
                Proportional / 1:1
              </label>
            </div>
          </div>

          {sizeMode === 'fixed' && (
            <div className="field">
              <label>SOL per trade</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={fixedSol}
                onChange={(e) => setFixedSol(e.target.value)}
              />
            </div>
          )}

          <div className="field">
            <label>Max SOL per trade (safety cap)</label>
            <input
              type="number"
              step="0.1"
              min="0.1"
              value={maxSol}
              onChange={(e) => setMaxSol(e.target.value)}
            />
          </div>

          <div className="field">
            <label>Max slippage %</label>
            <input
              type="number"	colorbox step="0.1"
              min="0.1"
              value={slippage}
              onChange={(e) => setSlippage(e.target.value)}
            />
          </div>

          <div className="field">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={enabled}
                onChange={(e) => setEnabled(e.target.checked)}
              />
              Enabled (start watching this wallet)
            </label>
          </div>

          <div className="notice small">
            <strong>How it works:</strong> When this wallet buys or sells, we prepare a Jupiter swap
            sized to your rules. You will be prompted to sign in your wallet. We never move funds
            without your signature.
          </div>

          <div className="form-actions">
            <button className="btn primary" onClick={handleSave}>
              {saved ? 'Saved ✓' : existing ? 'Update settings' : 'Start copying'}
            </button>
            {existing && (
              <button className="btn danger" onClick={handleRemove}>
                Stop & remove
              </button>
            )}
          </div>

          <p className="connected-as">
            Connected as {publicKey ? shortAddress(publicKey.toBase58()) : '—'}
          </p>
        </div>
      )}
    </div>
  )
}
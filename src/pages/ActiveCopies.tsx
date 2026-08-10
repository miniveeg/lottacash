import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useWallet } from '@solana/wallet-adapter-react'
import { listCopyConfigs, setCopyEnabled, removeCopyConfig } from '../lib/copyStore'
import type { CopyConfig } from '../lib/types'
import { getWalletByAddress } from '../lib/mockData'
import { shortAddress } from '../lib/format'

export function ActiveCopies() {
  const { connected } = useWallet()
  const [configs, setConfigs] = useState<CopyConfig[]>([])

  function refresh() {
    setConfigs(listCopyConfigs())
  }

  useEffect(() => {
    refresh()
  }, [])

  function toggle(address: string, enabled: boolean) {
    setCopyEnabled(address, enabled)
    refresh()
  }

  function remove(address: string) {
    removeCopyConfig(address)
    refresh()
  }

  return (
    <div className="page active-copies">
      <div className="page-header">
        <h1>My Copies</h1>
        <p>
          Wallets you are configured to mirror. Settings are stored locally in this browser for now.
        </p>
      </div>

      {!connected && (
        <div className="notice">
          <p>Connect your wallet to manage copy configurations.</p>
        </div>
      )}

      {configs.length === 0 ? (
        <div className="empty">
          <p>No copy configurations yet.</p>
          <Link to="/leaderboard" className="btn primary">
            Browse leaderboard
          </Link>
        </div>
      ) : (
        <div className="copies-list">
          {configs.map((c) => {
            const meta = getWalletByAddress(c.targetAddress)
            return (
              <div key={c.targetAddress} className="copy-card">
                <div className="copy-card-main">
                  <div className="mono">{shortAddress(c.targetAddress, 6)}</div>
                  {meta?.label && <div className="label-tag">{meta.label}</div>}
                  <div className="copy-meta">
                    {c.sizeMode === 'fixed' ? `${c.fixedSol} SOL fixed` : 'Proportional 1:1'}
                    {' · '}max {c.maxSol} SOL{' · '}
                    {(c.slippageBps / 100).toFixed(1)}% slip
                    {c.enabled ? ' · ON' : ' · OFF'}
                  </div>
                </div>
                <div className="copy-card-actions">
                  <label className="switch">
                    <input
                      type="checkbox"
                      checked={c.enabled}
                      onChange={(e) => toggle(c.targetAddress, e.target.checked)}
                    />
                    <span>{c.enabled ? 'On' : 'Off'}</span>
                  </label>
                  <Link to={`/copy/${c.targetAddress}`} className="btn small">
                    Edit
                  </Link>
                  <button className="btn small danger" onClick={() => remove(c.targetAddress)}>
                    Remove
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <div className="notice small" style={{ marginTop: '2rem' }}>
        <strong>Tip:</strong> After enabling a copy, open <Link to="/activity">Activity</Link> and
        generate a demo signal to test the Jupiter sign flow.
      </div>
    </div>
  )
}
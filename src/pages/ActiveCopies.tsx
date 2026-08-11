import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useWallet } from '@solana/wallet-adapter-react'
import { listCopyConfigs, setCopyEnabled, removeCopyConfig, saveCopyConfig } from '../lib/copyStore'
import { fetchConfigs, saveConfigApi, deleteConfigApi, apiHealth } from '../lib/api'
import type { CopyConfig } from '../lib/types'
import { getWalletByAddress } from '../lib/mockData'
import { shortAddress } from '../lib/format'

export function ActiveCopies() {
  const { connected, publicKey } = useWallet()
  const [configs, setConfigs] = useState<CopyConfig[]>([])
  const [apiOnline, setApiOnline] = useState(false)

  const refresh = useCallback(async () => {
    setConfigs(listCopyConfigs())
    if (!publicKey) return
    try {
      const ok = await apiHealth()
      setApiOnline(ok)
      if (!ok) return
      const { configs: remote } = await fetchConfigs(publicKey.toBase58())
      if (remote.length) {
        for (const c of remote) {
          saveCopyConfig({
            targetAddress: c.targetAddress,
            sizeMode: c.sizeMode,
            fixedSol: c.fixedSol,
            maxSol: c.maxSol,
            slippageBps: c.slippageBps,
            enabled: c.enabled,
            createdAt: c.createdAt,
          })
        }
        setConfigs(listCopyConfigs())
      }
    } catch {
      setApiOnline(false)
    }
  }, [publicKey])

  useEffect(() => {
    refresh()
  }, [refresh])

  async function toggle(address: string, enabled: boolean) {
    setCopyEnabled(address, enabled)
    const cfg = listCopyConfigs().find((c) => c.targetAddress === address)
    if (cfg && publicKey && apiOnline) {
      try {
        await saveConfigApi({
          ownerWallet: publicKey.toBase58(),
          targetAddress: cfg.targetAddress,
          sizeMode: cfg.sizeMode,
          fixedSol: cfg.fixedSol,
          maxSol: cfg.maxSol,
          slippageBps: cfg.slippageBps,
          enabled,
        })
      } catch {
        /* keep local */
      }
    }
    refresh()
  }

  async function remove(address: string) {
    removeCopyConfig(address)
    if (publicKey && apiOnline) {
      try {
        await deleteConfigApi(publicKey.toBase58(), address)
      } catch {
        /* keep local delete */
      }
    }
    refresh()
  }

  return (
    <div className="page active-copies">
      <div className="page-header">
        <h1>My copies</h1>
        <p>
          Wallets you follow. Turn one off anytime — you won’t get new signals for it until you turn
          it back on.
        </p>
      </div>

      {!connected && (
        <div className="banner-info">Connect your wallet to sync copies across the API when it’s running.</div>
      )}

      {configs.length === 0 ? (
        <div className="empty">
          <p>You’re not copying anyone yet.</p>
          <p className="hint">Browse the leaderboard and tap Copy on a wallet you want to follow.</p>
          <Link to="/leaderboard" className="btn primary">
            Open leaderboard
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
                    {c.sizeMode === 'fixed' ? `${c.fixedSol} SOL each trade` : 'Match their size'}
                    {' · '}max {c.maxSol} SOL
                    {' · '}
                    {(c.slippageBps / 100).toFixed(1)}% slip
                    {c.enabled ? ' · On' : ' · Off'}
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

      <p className="data-source" style={{ marginTop: '1.25rem' }}>
        {apiOnline ? 'Synced with server when possible.' : 'Saved on this device (API offline).'}
      </p>
    </div>
  )
}
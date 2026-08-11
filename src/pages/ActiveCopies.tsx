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
    const local = listCopyConfigs()
    setConfigs(local)

    if (!publicKey) return
    try {
      const ok = await apiHealth()
      setApiOnline(ok)
      if (!ok) return
      const { configs: remote } = await fetchConfigs(publicKey.toBase58())
      // Prefer remote when present; also mirror into local
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
        <h1>My Copies</h1>
        <p>
          Wallets you are configured to mirror.{' '}
          {apiOnline ? 'Synced with API.' : 'API offline — local only.'}
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
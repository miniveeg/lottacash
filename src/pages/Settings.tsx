import { useEffect, useState } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { shortAddress } from '../lib/format'
import { SOLANA_NETWORK } from '../lib/connection'
import { apiHealth } from '../lib/api'
import { StatusDot } from '../components/StatusDot'
import { CopyButton } from '../components/CopyButton'
import { useToast } from '../components/Toast'

export function Settings() {
  const { publicKey, connected } = useWallet()
  const [apiOk, setApiOk] = useState<boolean | null>(null)
  const [checking, setChecking] = useState(false)
  const { push } = useToast()

  async function recheck() {
    setChecking(true)
    setApiOk(null)
    const ok = await apiHealth()
    setApiOk(ok)
    setChecking(false)
    push(ok ? 'API is online' : 'API is offline', ok ? 'success' : 'error')
  }

  useEffect(() => {
    apiHealth().then(setApiOk)
  }, [])

  function clearLocalData() {
    const ok = window.confirm(
      'Clear copy settings and signals saved in this browser? This cannot be undone.'
    )
    if (!ok) return
    localStorage.removeItem('lottacash_copy_configs_v1')
    localStorage.removeItem('lottacash_signals_v1')
    push('Local data cleared', 'success')
  }

  return (
    <div className="page settings">
      <div className="page-header row-header">
        <div>
          <h1>Settings</h1>
          <p>Connection, storage, and safety.</p>
        </div>
        <StatusDot ok={apiOk} />
      </div>

      <div className="settings-card">
        <h3>Wallet</h3>
        {connected && publicKey ? (
          <div className="settings-row">
            <p className="mono">{shortAddress(publicKey.toBase58(), 6)}</p>
            <CopyButton text={publicKey.toBase58()} label="Copy full address" />
          </div>
        ) : (
          <p>Not connected — use the button in the top right.</p>
        )}
      </div>

      <div className="settings-card">
        <h3>Network</h3>
        <p className="mono">{SOLANA_NETWORK}</p>
        <p className="hint">
          Change with <code>VITE_SOLANA_NETWORK</code> and <code>VITE_SOLANA_RPC_URL</code> in{' '}
          <code>.env</code>.
        </p>
      </div>

      <div className="settings-card">
        <h3>Backend API</h3>
        <p>
          {apiOk === null && 'Checking…'}
          {apiOk === true && 'Online — frontend proxies /api → localhost:3001'}
          {apiOk === false && 'Offline — run: cd server && npm run dev'}
        </p>
        <button className="btn small" style={{ marginTop: '0.75rem' }} onClick={recheck} disabled={checking}>
          {checking ? 'Checking…' : 'Recheck connection'}
        </button>
      </div>

      <div className="settings-card">
        <h3>Local data</h3>
        <p>
          Copy configs and demo signals are stored in this browser when the API is offline. Clearing
          removes them from this device only.
        </p>
        <button className="btn small danger" style={{ marginTop: '0.75rem' }} onClick={clearLocalData}>
          Clear local copy data
        </button>
      </div>

      <div className="settings-card danger-zone">
        <h3>Risk reminder</h3>
        <p>
          Copy trading is high risk. Tokens can rug. Latency means worse fills than the wallet you
          copy. Never trade money you cannot afford to lose. This platform does not custody funds.
        </p>
      </div>
    </div>
  )
}
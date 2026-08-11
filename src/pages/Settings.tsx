import { useEffect, useState } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { shortAddress } from '../lib/format'
import { SOLANA_NETWORK } from '../lib/connection'
import { apiHealth } from '../lib/api'

export function Settings() {
  const { publicKey, connected } = useWallet()
  const [apiOk, setApiOk] = useState<boolean | null>(null)

  useEffect(() => {
    apiHealth().then(setApiOk)
  }, [])

  return (
    <div className="page settings">
      <div className="page-header">
        <h1>Settings</h1>
        <p>Connection and environment status.</p>
      </div>

      <div className="settings-card">
        <h3>Wallet</h3>
        <p>{connected && publicKey ? shortAddress(publicKey.toBase58(), 6) : 'Not connected'}</p>
      </div>

      <div className="settings-card">
        <h3>Network</h3>
        <p className="mono">{SOLANA_NETWORK}</p>
      </div>

      <div className="settings-card">
        <h3>Backend API</h3>
        <p>
          {apiOk === null && 'Checking…'}
          {apiOk === true && 'Online (http://localhost:3001 via /api proxy)'}
          {apiOk === false && 'Offline — start server with: cd server && npm run dev'}
        </p>
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
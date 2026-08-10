import { useWallet } from '@solana/wallet-adapter-react'
import { shortAddress } from '../lib/format'
import { SOLANA_NETWORK } from '../lib/connection'

export function Settings() {
  const { publicKey, connected } = useWallet()

  return (
    <div className="page settings">
      <div className="page-header">
        <h1>Settings</h1>
        <p>Local preferences and connection info.</p>
      </div>

      <div className="settings-card">
        <h3>Wallet</h3>
        <p>{connected && publicKey ? shortAddress(publicKey.toBase58(), 6) : 'Not connected'}</p>
      </div>

      <div className="settings-card">
        <h3>Network</h3>
        <p className="mono">{SOLANA_NETWORK}</p>
        <p className="hint">
          Set <code>VITE_SOLANA_RPC_URL</code> and <code>VITE_SOLANA_NETWORK</code> in a local{' '}
          <code>.env</code> file. Use a private RPC (Helius / QuickNode) in production.
        </p>
      </div>

      <div className="settings-card">
        <h3>Data storage</h3>
        <p>
          Copy configs and signals are stored in this browser (localStorage) for the MVP. A backend
          will replace this so settings sync across devices.
        </p>
      </div>

      <div className="settings-card danger-zone">
        <h3>Risk reminder</h3>
        <p>
          Copy trading is high risk. Tokens can rug. Latency means you often get worse fills than
          the wallet you copy. Never trade money you cannot afford to lose. This platform does not
          custody funds and does not guarantee any outcome.
        </p>
      </div>
    </div>
  )
}
import { useParams, Link } from 'react-router-dom'
import { useWallet } from '@solana/wallet-adapter-react'
import { useState } from 'react'

export function CopySetup() {
  const { address } = useParams<{ address: string }>()
  const { publicKey, connected } = useWallet()
  const [sizeMode, setSizeMode] = useState<'fixed' | 'proportional'>('fixed')
  const [fixedAmount, setFixedAmount] = useState('0.5')
  const [maxAmount, setMaxAmount] = useState('5')
  const [slippage, setSlippage] = useState('2')

  return (
    <div className="page copy-setup">
      <div className="page-header">
        <Link to="/leaderboard" className="back">← Back to leaderboard</Link>
        <h1>Copy Wallet</h1>
        <p className="mono">{address}</p>
      </div>

      {!connected ? (
        <div className="notice">
          <p>Connect your wallet to configure copy trading.</p>
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
                value={fixedAmount}
                onChange={(e) => setFixedAmount(e.target.value)}
              />
            </div>
          )}

          <div className="field">
            <label>Max SOL per trade (safety)</label>
            <input
              type="number"
              step="0.1"
              min="0.1"
              value={maxAmount}
              onChange={(e) => setMaxAmount(e.target.value)}
            />
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
          </div>

          <div className="notice small">
            <strong>How it works:</strong> When this wallet buys or sells, we will prepare a Jupiter swap sized according to your settings. You will be prompted to sign the transaction in your wallet. We never move funds without your signature.
          </div>

          <button className="btn primary" disabled>
            Start Copying (coming next)
          </button>

          <p className="connected-as">
            Connected as {publicKey?.toBase58().slice(0, 4)}…{publicKey?.toBase58().slice(-4)}
          </p>
        </div>
      )}
    </div>
  )
}
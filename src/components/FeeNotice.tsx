import { feesEnabled, formatFeePercent, estimateFeeSol, getPlatformFeeBps } from '../lib/fees'

export function FeeNotice({ tradeSol }: { tradeSol?: number }) {
  if (!feesEnabled()) {
    return (
      <p className="fee-notice muted">
        Platform fee: not active yet (owner must set <code>VITE_FEE_WALLET</code>).
      </p>
    )
  }

  const est = tradeSol !== undefined ? estimateFeeSol(tradeSol) : null

  return (
    <div className="fee-notice">
      <strong>Platform fee {formatFeePercent()}</strong>
      <span>
        Taken on each signed copy swap through Jupiter. You still hold your keys — the fee is part of
        the swap you approve.
        {est !== null && (
          <>
            {' '}
            This size ≈ <strong>{est.toFixed(4)} SOL</strong>.
          </>
        )}
      </span>
      <span className="muted">{getPlatformFeeBps()} bps · non-custodial</span>
    </div>
  )
}
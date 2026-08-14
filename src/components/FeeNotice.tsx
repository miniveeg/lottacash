import { feesEnabled, formatFeePercent, estimateFeeSol, getPlatformFeeBps } from '../lib/fees'

export function FeeNotice({ tradeSol }: { tradeSol?: number }) {
  if (!feesEnabled()) {
    return (
      <p className="fee-notice muted">
        Platform fee: off (set <code>VITE_FEE_WALLET</code> to enable).
      </p>
    )
  }

  const est =
    tradeSol !== undefined ? estimateFeeSol(tradeSol) : null

  return (
    <div className="fee-notice">
      <strong>Platform fee {formatFeePercent()}</strong>
      <span>
        Applied on each signed copy swap via Jupiter (non-custodial).{' '}
        {est !== null && (
          <>
            This trade ≈ <strong>{est.toFixed(4)} SOL</strong> fee.
          </>
        )}
      </span>
      <span className="muted">Config: {getPlatformFeeBps()} bps</span>
    </div>
  )
}
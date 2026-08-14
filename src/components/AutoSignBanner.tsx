import { Link } from 'react-router-dom'
import { getAutoSignSettings } from '../lib/autoSign'
import { useAppTick } from '../hooks/useAppTick'
import { disableAutoSign } from '../lib/autoSign'

export function AutoSignBanner() {
  useAppTick()
  const s = getAutoSignSettings()
  if (!s.enabled) return null

  return (
    <div className="auto-sign-banner" role="alert">
      <div className="auto-sign-banner-inner">
        <strong>EXPERIMENTAL auto-sign is ON</strong>
        <span>
          Pending signals may be signed automatically while this tab is open
          {s.onlyWhenFocused ? ' and focused' : ''}. Trades can fire that you did not review. Cap:{' '}
          {s.maxSolPerTrade} SOL · session {s.sessionSigned}/{s.maxPerSession}.{' '}
          <Link to="/settings">Settings</Link>
        </span>
        <button
          type="button"
          className="btn small danger"
          onClick={() => disableAutoSign('Stopped from banner')}
        >
          Turn off now
        </button>
      </div>
    </div>
  )
}

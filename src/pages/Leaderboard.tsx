import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { getLeaderboard } from '../lib/mockData'
import type { Timeframe } from '../lib/types'
import { shortAddress, formatSol, formatPct } from '../lib/format'

const TABS: { id: Timeframe; label: string }[] = [
  { id: 'daily', label: 'Daily' },
  { id: 'weekly', label: 'Weekly' },
  { id: 'all', label: 'All Time' },
]

export function Leaderboard() {
  const [timeframe, setTimeframe] = useState<Timeframe>('weekly')
  const wallets = useMemo(() => getLeaderboard(timeframe), [timeframe])

  return (
    <div className="page leaderboard">
      <div className="page-header">
        <h1>Top Wallets</h1>
        <p>
          Ranked by realized PnL. Currently using high-quality mock data — real ranking pipeline
          plugs in here next.
        </p>
      </div>

      <div className="tabs">
        {TABS.map((t) => (
          <button
            key={t.id}
            className={`tab ${timeframe === t.id ? 'active' : ''}`}
            onClick={() => setTimeframe(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="table-wrap">
        <table className="wallet-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Wallet</th>
              <th>PnL (SOL)</th>
              <th>Win Rate</th>
              <th>Trades</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {wallets.map((w, i) => (
              <tr key={w.address}>
                <td>{i + 1}</td>
                <td>
                  <div className="wallet-cell">
                    <span className="mono">{shortAddress(w.address)}</span>
                    {w.label && <span className="label-tag">{w.label}</span>}
                  </div>
                </td>
                <td className={w.pnl >= 0 ? 'positive' : 'negative'}>{formatSol(w.pnl)}</td>
                <td>{formatPct(w.winRate)}</td>
                <td>{w.trades}</td>
                <td>
                  <Link to={`/copy/${w.address}`} className="btn small">
                    Copy
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
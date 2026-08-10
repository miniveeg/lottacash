import { Link } from 'react-router-dom'
import { MOCK_WALLETS } from '../lib/mockData'

export function Leaderboard() {
  return (
    <div className="page leaderboard">
      <div className="page-header">
        <h1>Top Wallets</h1>
        <p>Ranked by realized PnL. Data is currently mocked — real pipeline coming next.</p>
      </div>

      <div className="tabs">
        <button className="tab active">Daily</button>
        <button className="tab">Weekly</button>
        <button className="tab">All Time</button>
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
            {MOCK_WALLETS.map((w, i) => (
              <tr key={w.address}>
                <td>{i + 1}</td>
                <td className="mono">{w.address.slice(0, 4)}…{w.address.slice(-4)}</td>
                <td className={w.pnl >= 0 ? 'positive' : 'negative'}>
                  {w.pnl >= 0 ? '+' : ''}{w.pnl.toFixed(2)}
                </td>
                <td>{(w.winRate * 100).toFixed(1)}%</td>
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
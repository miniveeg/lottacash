import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { getLeaderboard } from '../lib/mockData'
import { fetchLeaderboard } from '../lib/api'
import type { Timeframe, WalletStats } from '../lib/types'
import { shortAddress, formatSol, formatPct } from '../lib/format'
import { CopyButton } from '../components/CopyButton'

const TABS: { id: Timeframe; label: string }[] = [
  { id: 'daily', label: 'Daily' },
  { id: 'weekly', label: 'Weekly' },
  { id: 'all', label: 'All Time' },
]

type SortKey = 'pnl' | 'winRate' | 'trades'

export function Leaderboard() {
  const [timeframe, setTimeframe] = useState<Timeframe>('weekly')
  const [wallets, setWallets] = useState<WalletStats[]>([])
  const [source, setSource] = useState<'api' | 'mock'>('mock')
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [sort, setSort] = useState<SortKey>('pnl')
  const [minWin, setMinWin] = useState(0)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    fetchLeaderboard(timeframe)
      .then((data) => {
        if (cancelled) return
        setWallets(data.wallets)
        setSource('api')
      })
      .catch(() => {
        if (cancelled) return
        setWallets(getLeaderboard(timeframe))
        setSource('mock')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [timeframe])

  const filtered = useMemo(() => {
    let list = [...wallets]
    const query = q.trim().toLowerCase()
    if (query) {
      list = list.filter(
        (w) =>
          w.address.toLowerCase().includes(query) ||
          (w.label && w.label.toLowerCase().includes(query))
      )
    }
    if (minWin > 0) list = list.filter((w) => w.winRate >= minWin)
    list.sort((a, b) => b[sort] - a[sort])
    return list
  }, [wallets, q, sort, minWin])

  return (
    <div className="page leaderboard">
      <div className="page-header">
        <h1>Top Wallets</h1>
        <p>
          Ranked traders · {source === 'api' ? 'API data' : 'Local mock'} ·{' '}
          <Link to="/tools">Paste any address in Tools</Link>
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

      <div className="lb-filters">
        <input
          className="input grow"
          placeholder="Search address or label…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <select className="input" value={sort} onChange={(e) => setSort(e.target.value as SortKey)}>
          <option value="pnl">Sort: PnL</option>
          <option value="winRate">Sort: Win rate</option>
          <option value="trades">Sort: Trades</option>
        </select>
        <select
          className="input"
          value={minWin}
          onChange={(e) => setMinWin(Number(e.target.value))}
        >
          <option value={0}>Any win rate</option>
          <option value={0.5}>≥ 50% wins</option>
          <option value={0.6}>≥ 60% wins</option>
          <option value={0.7}>≥ 70% wins</option>
        </select>
      </div>

      {loading ? (
        <div className="notice">Loading leaderboard…</div>
      ) : filtered.length === 0 ? (
        <div className="empty">
          <p>No wallets match your filters.</p>
        </div>
      ) : (
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
              {filtered.map((w, i) => (
                <tr key={w.address}>
                  <td>{i + 1}</td>
                  <td>
                    <div className="wallet-cell">
                      <span className="mono">{shortAddress(w.address)}</span>
                      {w.label && <span className="label-tag">{w.label}</span>}
                      <CopyButton text={w.address} label="Addr" />
                    </div>
                  </td>
                  <td className={w.pnl >= 0 ? 'positive' : 'negative'}>{formatSol(w.pnl)}</td>
                  <td>{formatPct(w.winRate)}</td>
                  <td>{w.trades}</td>
                  <td>
                    <Link to={`/copy/${w.address}`} className="btn small primary">
                      Copy
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
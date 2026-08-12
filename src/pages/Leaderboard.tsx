import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useWallet } from '@solana/wallet-adapter-react'
import { getLeaderboard } from '../lib/mockData'
import { fetchLeaderboard } from '../lib/api'
import type { Timeframe, WalletStats } from '../lib/types'
import { shortAddress, formatSol, formatPct } from '../lib/format'
import { CopyButton } from '../components/CopyButton'
import { HelpTip } from '../components/HelpTip'
import { explorerAddress } from '../lib/solanaTools'

const TABS: { id: Timeframe; label: string }[] = [
  { id: 'daily', label: 'Today' },
  { id: 'weekly', label: 'This week' },
  { id: 'all', label: 'All time' },
]

type SortKey = 'pnl' | 'winRate' | 'trades'

export function Leaderboard() {
  const { connected } = useWallet()
  const [timeframe, setTimeframe] = useState<Timeframe>('weekly')
  const [wallets, setWallets] = useState<WalletStats[]>([])
  const [source, setSource] = useState<'api' | 'mock'>('mock')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [q, setQ] = useState('')
  const [sort, setSort] = useState<SortKey>('pnl')
  const [minWin, setMinWin] = useState(0)
  const [reloadKey, setReloadKey] = useState(0)

  const load = useCallback(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
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
        setError('API offline — showing demo ranks')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [timeframe])

  useEffect(() => {
    const cleanup = load()
    return cleanup
  }, [load, reloadKey])

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
      <div className="page-header row-header">
        <div>
          <h1>Leaderboard</h1>
          <p>
            Wallets ranked by profit (PnL). Tap <strong>Copy</strong> to follow one with your own
            size rules.
          </p>
        </div>
        <button className="btn small" onClick={() => setReloadKey((k) => k + 1)} disabled={loading}>
          {loading ? 'Loading…' : 'Refresh'}
        </button>
      </div>

      {!connected && (
        <div className="banner-info">
          Connect your wallet (top right) before saving a copy setup. You can still browse the list
          now.
        </div>
      )}

      {error && <div className="banner-warn">{error}</div>}

      <HelpTip title="How to read this list">
        <p>
          <strong>PnL</strong> is estimated profit in SOL for the selected period.{' '}
          <strong>Win rate</strong> is the share of trades that were profitable. Higher is not always
          better — check consistency and don’t chase one lucky streak.
        </p>
        <p>
          Don’t see someone? Paste their address in <Link to="/tools">Tools</Link> and copy from
          there.
        </p>
      </HelpTip>

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
          placeholder="Search name or address…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <select className="input" value={sort} onChange={(e) => setSort(e.target.value as SortKey)}>
          <option value="pnl">Sort by profit</option>
          <option value="winRate">Sort by win rate</option>
          <option value="trades">Sort by # of trades</option>
        </select>
        <select
          className="input"
          value={minWin}
          onChange={(e) => setMinWin(Number(e.target.value))}
        >
          <option value={0}>Any win rate</option>
          <option value={0.5}>Win rate ≥ 50%</option>
          <option value={0.6}>Win rate ≥ 60%</option>
          <option value={0.7}>Win rate ≥ 70%</option>
        </select>
      </div>

      <p className="data-source">
        Data: {source === 'api' ? 'API' : 'demo list'} · {filtered.length} shown
      </p>

      {loading ? (
        <div className="skeleton-stack">
          <div className="skeleton-row" />
          <div className="skeleton-row" />
          <div className="skeleton-row" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty">
          <p>No wallets match those filters.</p>
          <button
            className="btn ghost"
            onClick={() => {
              setQ('')
              setMinWin(0)
            }}
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="table-wrap">
          <table className="wallet-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Wallet</th>
                <th>Profit (SOL)</th>
                <th>Win rate</th>
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
                      <a
                        className="mono"
                        href={explorerAddress(w.address)}
                        target="_blank"
                        rel="noreferrer"
                        title="Open on Solscan"
                      >
                        {shortAddress(w.address)}
                      </a>
                      {w.label && <span className="label-tag">{w.label}</span>}
                      <CopyButton text={w.address} label="Copy addr" />
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
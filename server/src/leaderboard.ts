import type { WalletStats } from './types.js'

/** Mock ranking until a real indexer (Helius/Bitquery) is wired. */
const BASE: WalletStats[] = [
  {
    address: 'JDd3hy3gQn2V982mi1zqhNqUw1GfV2UL6g76STojCJPN',
    label: 'West',
    pnl: 1842.4,
    winRate: 0.62,
    trades: 412,
    volume: 9200,
  },
  {
    address: '2fg5QD1eD7rzNNCsvnhmXFm5hqNgwTTG8p7kQ6f3rx6f',
    label: 'Cupsey',
    pnl: 1290.1,
    winRate: 0.58,
    trades: 287,
    volume: 6100,
  },
  {
    address: '6S8GezkxYUfZy9JPtYnanbcZTMB87Wjt1qx3c6ELajKC',
    label: 'Nyhrox',
    pnl: 976.8,
    winRate: 0.71,
    trades: 156,
    volume: 3400,
  },
  {
    address: 'AuPp4YTMTyqxYXQnHc5KUc6pUuCSsHQpBJhgnD45yqrf',
    label: 'Dani',
    pnl: 743.2,
    winRate: 0.55,
    trades: 891,
    volume: 15400,
  },
  {
    address: '6mWEJG9LoRdto8TwTdZxmnJpkXpTsEerizcGiCNZvzXd',
    label: 'slingoor',
    pnl: 512.9,
    winRate: 0.66,
    trades: 203,
    volume: 2800,
  },
  {
    address: '9jyqFiLnruggwNn4EQwBNFXwpbLM9hrA4hV59ytyAVVz',
    pnl: 388.5,
    winRate: 0.59,
    trades: 134,
    volume: 1900,
  },
  {
    address: 'C4dfRxU41P682XUHY37uPNCx6teh7KDQb5w9KpNNWkcg',
    pnl: 271.3,
    winRate: 0.64,
    trades: 98,
    volume: 1500,
  },
]

export function getLeaderboard(timeframe: 'daily' | 'weekly' | 'all' = 'weekly'): WalletStats[] {
  const factor = timeframe === 'daily' ? 0.08 : timeframe === 'weekly' ? 0.35 : 1
  return BASE.map((w) => ({
    ...w,
    pnl: Number((w.pnl * factor).toFixed(2)),
    trades: Math.max(3, Math.floor(w.trades * factor)),
  })).sort((a, b) => b.pnl - a.pnl)
}
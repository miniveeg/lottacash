export interface WalletStats {
  address: string
  pnl: number
  winRate: number
  trades: number
}

// Temporary mock data. Replace with real ranking pipeline later.
export const MOCK_WALLETS: WalletStats[] = [
  {
    address: 'JDd3hy3gQn2V982mi1zqhNqUw1GfV2UL6g76STojCJPN',
    pnl: 1842.4,
    winRate: 0.62,
    trades: 412,
  },
  {
    address: '2fg5QD1eD7rzNNCsvnhmXFm5hqNgwTTG8p7kQ6f3rx6f',
    pnl: 1290.1,
    winRate: 0.58,
    trades: 287,
  },
  {
    address: '6S8GezkxYUfZy9JPtYnanbcZTMB87Wjt1qx3c6ELajKC',
    pnl: 976.8,
    winRate: 0.71,
    trades: 156,
  },
  {
    address: 'AuPp4YTMTyqxYXQnHc5KUc6pUuCSsHQpBJhgnD45yqrf',
    pnl: 743.2,
    winRate: 0.55,
    trades: 891,
  },
  {
    address: '6mWEJG9LoRdto8TwTdZxmnJpkXpTsEerizcGiCNZvzXd',
    pnl: 512.9,
    winRate: 0.66,
    trades: 203,
  },
]
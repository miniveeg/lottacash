export type Timeframe = 'daily' | 'weekly' | 'all'

export type SizeMode = 'fixed' | 'proportional'

export interface WalletStats {
  address: string
  label?: string
  pnl: number
  winRate: number
  trades: number
  volume?: number
  avgHoldMinutes?: number
}

export interface CopyConfig {
  targetAddress: string
  sizeMode: SizeMode
  fixedSol: number
  maxSol: number
  slippageBps: number // 100 = 1%
  enabled: boolean
  createdAt: number
  updatedAt: number
}

export interface PreparedSwap {
  inputMint: string
  outputMint: string
  amount: number // lamports or token amount depending on side
  slippageBps: number
  quote?: unknown
  // Later: serialized transaction for user to sign
}
export type SizeMode = 'fixed' | 'proportional'

export interface CopyConfig {
  id: string
  ownerWallet: string
  targetAddress: string
  sizeMode: SizeMode
  fixedSol: number
  maxSol: number
  slippageBps: number
  enabled: boolean
  createdAt: number
  updatedAt: number
}

export type SignalSide = 'buy' | 'sell'
export type SignalStatus = 'pending' | 'signed' | 'dismissed' | 'failed'

export interface TradeSignal {
  id: string
  ownerWallet: string
  targetAddress: string
  side: SignalSide
  tokenMint: string
  tokenSymbol?: string
  suggestedSol: number
  detectedAt: number
  status: SignalStatus
  txSignature?: string
  error?: string
}

export interface WalletStats {
  address: string
  label?: string
  pnl: number
  winRate: number
  trades: number
  volume?: number
}
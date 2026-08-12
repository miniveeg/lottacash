/**
 * Monitoring architecture (frontend-ready interface).
 * Local signal store + demo generator. Production uses server webhooks.
 */

import type { CopyConfig } from './types'
import { notifyApp } from './events'

export type SignalSide = 'buy' | 'sell'

export interface TradeSignal {
  id: string
  targetAddress: string
  side: SignalSide
  tokenMint: string
  tokenSymbol?: string
  suggestedSol: number
  detectedAt: number
  status: 'pending' | 'signed' | 'dismissed' | 'failed'
  txSignature?: string
  error?: string
}

export const SIGNALS_KEY = 'lottacash_signals_v1'

/** USDC mainnet — used for safe demo swaps */
const DEMO_MINT = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'

export function listSignals(): TradeSignal[] {
  try {
    const raw = localStorage.getItem(SIGNALS_KEY)
    if (!raw) return []
    return (JSON.parse(raw) as TradeSignal[]).sort((a, b) => b.detectedAt - a.detectedAt)
  } catch {
    return []
  }
}

function writeSignals(signals: TradeSignal[]) {
  localStorage.setItem(SIGNALS_KEY, JSON.stringify(signals.slice(0, 50)))
  notifyApp()
}

export function clearSignals() {
  localStorage.removeItem(SIGNALS_KEY)
  notifyApp()
}

export function upsertSignal(signal: TradeSignal) {
  const all = listSignals().filter((s) => s.id !== signal.id)
  all.unshift(signal)
  writeSignals(all)
}

export function updateSignalStatus(
  id: string,
  status: TradeSignal['status'],
  extra?: Partial<Pick<TradeSignal, 'txSignature' | 'error'>>
) {
  const all = listSignals()
  const idx = all.findIndex((s) => s.id === id)
  if (idx < 0) return
  all[idx] = { ...all[idx], status, ...extra }
  writeSignals(all)
}

/** Demo: create a fake incoming signal for an enabled config */
export function createDemoSignal(config: CopyConfig, side: SignalSide = 'buy'): TradeSignal {
  const suggested =
    config.sizeMode === 'fixed'
      ? Math.min(config.fixedSol, config.maxSol)
      : Math.min(0.75, config.maxSol)

  const signal: TradeSignal = {
    id: `sig_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    targetAddress: config.targetAddress,
    side,
    tokenMint: DEMO_MINT,
    tokenSymbol: 'USDC',
    suggestedSol: Math.max(0.01, suggested),
    detectedAt: Date.now(),
    status: 'pending',
  }
  upsertSignal(signal)
  return signal
}
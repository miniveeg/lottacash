/**
 * Monitoring architecture (frontend-ready interface).
 *
 * In production a backend service should:
 * 1. Subscribe to target wallets via Helius webhooks or Yellowstone gRPC
 * 2. Detect buy/sell swaps
 * 3. For each enabled CopyConfig, compute size and request a Jupiter quote
 * 4. Push a "signal" to the user (websocket / poll) containing the prepared swap
 * 5. User signs; platform never holds keys
 *
 * This module defines the shapes and a local demo simulator.
 */

import type { CopyConfig } from './types'

export type SignalSide = 'buy' | 'sell'

export interface TradeSignal {
  id: string
  targetAddress: string
  side: SignalSide
  tokenMint: string
  tokenSymbol?: string
  /** Suggested SOL amount for this user based on their config */
  suggestedSol: number
  detectedAt: number
  status: 'pending' | 'signed' | 'dismissed' | 'failed'
  txSignature?: string
  error?: string
}

const SIGNALS_KEY = 'lottacash_signals_v1'

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
      : Math.min(0.75, config.maxSol) // placeholder proportional size

  const signal: TradeSignal = {
    id: `sig_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    targetAddress: config.targetAddress,
    side,
    tokenMint: 'So11111111111111111111111111111111111111112', // SOL placeholder; real flow uses detected mint
    tokenSymbol: side === 'buy' ? 'DEMO' : 'DEMO',
    suggestedSol: suggested,
    detectedAt: Date.now(),
    status: 'pending',
  }
  upsertSignal(signal)
  return signal
}
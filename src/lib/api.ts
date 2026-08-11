import type { CopyConfig, TradeSignal, WalletStats, Timeframe } from './types'

const BASE = import.meta.env.VITE_API_URL || '/api'

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(text || `API ${res.status}`)
  }
  return res.json() as Promise<T>
}

export async function apiHealth(): Promise<boolean> {
  try {
    await req<{ ok: boolean }>('/health')
    return true
  } catch {
    return false
  }
}

export async function fetchLeaderboard(timeframe: Timeframe) {
  return req<{ timeframe: string; wallets: WalletStats[] }>(`/leaderboard?timeframe=${timeframe}`)
}

export async function fetchConfigs(ownerWallet: string) {
  return req<{ configs: CopyConfig[] }>(`/configs?owner=${encodeURIComponent(ownerWallet)}`)
}

export async function saveConfigApi(config: {
  ownerWallet: string
  targetAddress: string
  sizeMode: string
  fixedSol: number
  maxSol: number
  slippageBps: number
  enabled: boolean
}) {
  return req<{ config: CopyConfig }>('/configs', {
    method: 'POST',
    body: JSON.stringify(config),
  })
}

export async function deleteConfigApi(ownerWallet: string, targetAddress: string) {
  return req<{ ok: boolean }>(
    `/configs?owner=${encodeURIComponent(ownerWallet)}&target=${encodeURIComponent(targetAddress)}`,
    { method: 'DELETE' }
  )
}

export async function fetchSignals(ownerWallet: string) {
  return req<{ signals: TradeSignal[] }>(`/signals?owner=${encodeURIComponent(ownerWallet)}`)
}

export async function patchSignal(
  id: string,
  patch: Partial<Pick<TradeSignal, 'status' | 'txSignature' | 'error'>>
) {
  return req<{ signal: TradeSignal }>(`/signals/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(patch),
  })
}

export async function createDemoSignalApi(ownerWallet: string, targetAddress: string) {
  return req<{ signal: TradeSignal }>('/signals/demo', {
    method: 'POST',
    body: JSON.stringify({ ownerWallet, targetAddress, side: 'buy' }),
  })
}
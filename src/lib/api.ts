import type { CopyConfig, TradeSignal, WalletStats, Timeframe } from './types'

const BASE = (import.meta.env.VITE_API_URL as string | undefined) || '/api'

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const headers: Record<string, string> = {
    ...(init?.headers as Record<string, string> | undefined),
  }
  if (init?.body && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json'
  }

  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers,
  })

  if (!res.ok) {
    let message = `API ${res.status}`
    try {
      const data = await res.json()
      if (data?.error) message = String(data.error)
    } catch {
      const text = await res.text().catch(() => '')
      if (text) message = text.slice(0, 200)
    }
    throw new Error(message)
  }

  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

export async function apiHealth(): Promise<boolean> {
  try {
    const data = await req<{ ok: boolean }>('/health')
    return !!data?.ok
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
  return req<{ signal: TradeSignal }>(`/signals/${encodeURIComponent(id)}`, {
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
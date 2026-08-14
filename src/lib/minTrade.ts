/**
 * Minimum copy size so a trade can still make sense after round-trip costs.
 *
 * Full copy cycle is typically:
 *   SOL → token (swap + network + optional platform fee)
 *   token → SOL (again)
 *
 * Tiny sizes get eaten by fixed network fees + impact. We target ~$2 USD minimum
 * so a modest gain (e.g. ~5%+) has a chance to outrun fees — not a guarantee.
 */

import { getPlatformFeeBps, feesEnabled } from './fees'

/** Default minimum notional in USD */
export const DEFAULT_MIN_COPY_USD = 2

/** Absolute floor in SOL even if price API fails / SOL is very expensive */
export const ABSOLUTE_MIN_COPY_SOL = 0.01

/** Soft fallback SOL/USD if price fetch fails */
const FALLBACK_SOL_USD = 140

let cachedPrice: { usd: number; at: number } | null = null

export function getMinCopyUsd(): number {
  const raw = Number(import.meta.env.VITE_MIN_COPY_USD)
  if (Number.isFinite(raw) && raw > 0) return raw
  return DEFAULT_MIN_COPY_USD
}

export async function fetchSolUsdPrice(): Promise<number> {
  const now = Date.now()
  if (cachedPrice && now - cachedPrice.at < 60_000) return cachedPrice.usd

  try {
    // Jupiter price API (public)
    const res = await fetch(
      'https://api.jup.ag/price/v2?ids=So11111111111111111111111111111111111111112',
      { signal: AbortSignal.timeout(5000) }
    )
    if (res.ok) {
      const data = (await res.json()) as {
        data?: Record<string, { price?: string | number }>
      }
      const p = data?.data?.['So11111111111111111111111111111111111111112']?.price
      const n = typeof p === 'string' ? Number(p) : Number(p)
      if (Number.isFinite(n) && n > 0) {
        cachedPrice = { usd: n, at: now }
        return n
      }
    }
  } catch {
    /* fall through */
  }

  cachedPrice = { usd: FALLBACK_SOL_USD, at: now }
  return FALLBACK_SOL_USD
}

/** Minimum SOL for a copy trade given current SOL price */
export function minCopySolFromPrice(solUsd: number): number {
  const usd = getMinCopyUsd()
  const price = solUsd > 0 ? solUsd : FALLBACK_SOL_USD
  const sol = usd / price
  // Round up to 3 decimals so UI stays clean
  const rounded = Math.ceil(sol * 1000) / 1000
  return Math.max(ABSOLUTE_MIN_COPY_SOL, rounded)
}

/**
 * Rough round-trip cost as % of trade size (platform fee both ways + ballpark DEX/network).
 * Used only for education in the UI — not exact.
 */
export function estimateRoundTripCostPct(): number {
  const platformOnce = feesEnabled() ? getPlatformFeeBps() / 100 : 0 // percent points
  const platformBoth = platformOnce * 2
  // Ballpark DEX + impact + network as % for a ~$2–20 trade
  const otherBoth = 1.5
  return platformBoth + otherBoth
}

export function formatMinCopyLabel(minSol: number, solUsd: number): string {
  const usd = getMinCopyUsd()
  return `Minimum ${minSol.toFixed(3)} SOL (≈ $${usd} at ~$${solUsd.toFixed(0)}/SOL)`
}

export function validateCopySize(
  fixedSol: number,
  minSol: number
): string | null {
  if (!Number.isFinite(fixedSol) || fixedSol <= 0) {
    return 'Fixed SOL must be greater than 0'
  }
  if (fixedSol + 1e-9 < minSol) {
    return `Minimum copy size is ${minSol.toFixed(3)} SOL (≈ $${getMinCopyUsd()}). Smaller sizes often lose money to swap + network fees even if the coin is up a little.`
  }
  return null
}

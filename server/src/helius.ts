import { config, hasHelius } from './config.js'

/**
 * Optional Helius helpers. Without HELIUS_API_KEY these no-op / return null.
 * Docs: https://docs.helius.dev
 */

export async function heliusEnhancedTxs(address: string, limit = 20): Promise<unknown[] | null> {
  if (!hasHelius()) return null
  const url = `https://api.helius.xyz/v0/addresses/${address}/transactions?api-key=${config.heliusApiKey}&limit=${limit}`
  const res = await fetch(url)
  if (!res.ok) {
    console.warn('[helius] enhanced txs failed', res.status)
    return null
  }
  return (await res.json()) as unknown[]
}

export function parseHeliusSwap(tx: Record<string, unknown>): {
  side: 'buy' | 'sell'
  tokenMint: string
  tokenSymbol?: string
  amountSolApprox: number
} | null {
  // Helius enhanced txs often include type / tokenTransfers
  const type = String(tx.type || '')
  const source = String(tx.source || '')
  const isSwap =
    type.toUpperCase().includes('SWAP') ||
    source.toUpperCase().includes('JUPITER') ||
    source.toUpperCase().includes('RAYDIUM')

  if (!isSwap && type && type !== 'UNKNOWN') {
    // still allow generic activity if it looks like a token transfer involving many accounts
  }

  const tokenTransfers = (tx.tokenTransfers as Array<Record<string, unknown>>) || []
  const nativeTransfers = (tx.nativeTransfers as Array<Record<string, unknown>>) || []

  let tokenMint = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'
  let tokenSymbol: string | undefined = 'TOKEN'
  let amountSolApprox = 0.25

  for (const t of tokenTransfers) {
    if (t.mint && typeof t.mint === 'string') {
      tokenMint = t.mint
      break
    }
  }

  for (const n of nativeTransfers) {
    const amt = Number(n.amount || 0)
    if (Number.isFinite(amt) && Math.abs(amt) > 0) {
      // amount is lamports in many Helius payloads
      amountSolApprox = Math.max(0.01, Math.abs(amt) / 1e9)
      break
    }
  }

  // Heuristic: if SOL left the wallet, treat as buy of a token
  const side: 'buy' | 'sell' = amountSolApprox > 0 ? 'buy' : 'buy'

  if (!isSwap && tokenTransfers.length === 0) return null

  return { side, tokenMint, tokenSymbol, amountSolApprox: Math.min(amountSolApprox, 50) }
}
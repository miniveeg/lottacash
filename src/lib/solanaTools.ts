import { PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js'
import { getConnection } from './connection'

export function isValidSolanaAddress(address: string): boolean {
  if (!address || typeof address !== 'string') return false
  try {
    // Throws if base58 / length invalid
    // eslint-disable-next-line no-new
    new PublicKey(address.trim())
    return true
  } catch {
    return false
  }
}

export async function getSolBalance(address: string): Promise<number> {
  const connection = getConnection()
  const pk = new PublicKey(address.trim())
  const lamports = await connection.getBalance(pk, 'confirmed')
  return lamports / LAMPORTS_PER_SOL
}

export async function getRecentSignatures(address: string, limit = 12) {
  const connection = getConnection()
  const pk = new PublicKey(address.trim())
  return connection.getSignaturesForAddress(pk, { limit })
}

export function explorerAddress(address: string) {
  return `https://solscan.io/account/${address}`
}

export function explorerTx(sig: string) {
  return `https://solscan.io/tx/${sig}`
}

/** Rough size helper for proportional copies */
export function computeCopySize(opts: {
  mode: 'fixed' | 'proportional'
  fixedSol: number
  maxSol: number
  leaderSol?: number
}): number {
  const max = Math.max(0, opts.maxSol || 0)
  if (opts.mode === 'fixed') return Math.min(Math.max(0, opts.fixedSol || 0), max)
  const leader = opts.leaderSol ?? 1
  return Math.min(Math.max(leader, 0.01), max || leader)
}
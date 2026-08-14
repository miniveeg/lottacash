import { PublicKey } from '@solana/web3.js'
import { SOL_MINT } from './jupiter'

/** Default 50 bps = 0.5% on each copy swap (buy and sell). */
export const DEFAULT_PLATFORM_FEE_BPS = 50

const TOKEN_PROGRAM_ID = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA')
const ASSOCIATED_TOKEN_PROGRAM_ID = new PublicKey('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL')

export function getPlatformFeeBps(): number {
  const raw = Number(import.meta.env.VITE_PLATFORM_FEE_BPS)
  if (!Number.isFinite(raw) || raw < 0) return DEFAULT_PLATFORM_FEE_BPS
  return Math.min(1000, Math.floor(raw)) // cap at 10%
}

/** Treasury wallet that owns fee token accounts (not a private key — public only). */
export function getFeeWallet(): string | null {
  const w = (import.meta.env.VITE_FEE_WALLET as string | undefined)?.trim()
  if (!w) return null
  try {
    // eslint-disable-next-line no-new
    new PublicKey(w)
    return w
  } catch {
    return null
  }
}

export function feesEnabled(): boolean {
  return getPlatformFeeBps() > 0 && !!getFeeWallet()
}

export function getAssociatedTokenAddress(mint: string, owner: string): string {
  const [pda] = PublicKey.findProgramAddressSync(
    [
      new PublicKey(owner).toBuffer(),
      TOKEN_PROGRAM_ID.toBuffer(),
      new PublicKey(mint).toBuffer(),
    ],
    ASSOCIATED_TOKEN_PROGRAM_ID
  )
  return pda.toBase58()
}

/**
 * Jupiter requires feeAccount mint ∈ {inputMint, outputMint}.
 * Prefer SOL/WSOL when it's in the pair so one WSOL ATA covers most copy buys/sells.
 */
export function pickFeeMint(inputMint: string, outputMint: string): string {
  if (inputMint === SOL_MINT || outputMint === SOL_MINT) return SOL_MINT
  return inputMint
}

export function resolveFeeAccount(inputMint: string, outputMint: string): string | null {
  const wallet = getFeeWallet()
  if (!wallet || getPlatformFeeBps() <= 0) return null
  const mint = pickFeeMint(inputMint, outputMint)
  return getAssociatedTokenAddress(mint, wallet)
}

export function formatFeePercent(bps = getPlatformFeeBps()): string {
  return `${(bps / 100).toFixed(bps % 100 === 0 ? 1 : 2)}%`
}

/** Rough fee in SOL terms for display only */
export function estimateFeeSol(tradeSol: number, bps = getPlatformFeeBps()): number {
  return Math.max(0, tradeSol * (bps / 10_000))
}
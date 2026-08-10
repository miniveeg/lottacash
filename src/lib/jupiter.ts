/**
 * Jupiter helpers (quote + swap construction).
 *
 * These are structured for real integration.
 * For production you will call:
 *   GET https://quote-api.jup.ag/v6/quote
 *   POST https://quote-api.jup.ag/v6/swap
 *
 * Then send the returned transaction to the user's wallet for signing.
 */

export const SOL_MINT = 'So11111111111111111111111111111111111111112'

export interface QuoteParams {
  inputMint: string
  outputMint: string
  amount: number // in smallest units (lamports for SOL)
  slippageBps: number
}

export async function getJupiterQuote(params: QuoteParams): Promise<unknown> {
  const url = new URL('https://quote-api.jup.ag/v6/quote')
  url.searchParams.set('inputMint', params.inputMint)
  url.searchParams.set('outputMint', params.outputMint)
  url.searchParams.set('amount', String(params.amount))
  url.searchParams.set('slippageBps', String(params.slippageBps))

  const res = await fetch(url.toString())
  if (!res.ok) {
    throw new Error(`Jupiter quote failed: ${res.status}`)
  }
  return res.json()
}

/**
 * Build a swap transaction for the user to sign.
 * Requires a connected wallet public key.
 */
export async function getJupiterSwapTransaction(opts: {
  quoteResponse: unknown
  userPublicKey: string
  wrapAndUnwrapSol?: boolean
}): Promise<{ swapTransaction: string }> {
  const res = await fetch('https://quote-api.jup.ag/v6/swap', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      quoteResponse: opts.quoteResponse,
      userPublicKey: opts.userPublicKey,
      wrapAndUnwrapSol: opts.wrapAndUnwrapSol ?? true,
      dynamicComputeUnitLimit: true,
      prioritizationFeeLamports: 'auto',
    }),
  })

  if (!res.ok) {
    throw new Error(`Jupiter swap failed: ${res.status}`)
  }

  return res.json()
}

/** Convert SOL to lamports */
export function solToLamports(sol: number): number {
  return Math.floor(sol * 1_000_000_000)
}
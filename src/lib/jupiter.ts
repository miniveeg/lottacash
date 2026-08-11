export const SOL_MINT = 'So11111111111111111111111111111111111111112'

export interface QuoteParams {
  inputMint: string
  outputMint: string
  amount: number
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
    const body = await res.text().catch(() => '')
    throw new Error(`Jupiter quote failed (${res.status})${body ? `: ${body.slice(0, 180)}` : ''}`)
  }
  return res.json()
}

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
    const body = await res.text().catch(() => '')
    throw new Error(`Jupiter swap failed (${res.status})${body ? `: ${body.slice(0, 180)}` : ''}`)
  }

  return res.json()
}

export function solToLamports(sol: number): number {
  if (!Number.isFinite(sol) || sol <= 0) return 0
  return Math.floor(sol * 1_000_000_000)
}
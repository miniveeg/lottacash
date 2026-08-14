import { getPlatformFeeBps, resolveFeeAccount, feesEnabled } from './fees'

export const SOL_MINT = 'So11111111111111111111111111111111111111112'

export interface QuoteParams {
  inputMint: string
  outputMint: string
  amount: number
  slippageBps: number
  /** Override; defaults to platform config when fees enabled */
  platformFeeBps?: number
}

function jupiterHeaders(): HeadersInit {
  const key = import.meta.env.VITE_JUPITER_API_KEY as string | undefined
  return key ? { 'x-api-key': key } : {}
}

export async function getJupiterQuote(params: QuoteParams): Promise<unknown> {
  // Prefer legacy quote host (works without key for light traffic); fee params supported
  const url = new URL('https://quote-api.jup.ag/v6/quote')
  url.searchParams.set('inputMint', params.inputMint)
  url.searchParams.set('outputMint', params.outputMint)
  url.searchParams.set('amount', String(params.amount))
  url.searchParams.set('slippageBps', String(params.slippageBps))

  const feeBps =
    params.platformFeeBps ??
    (feesEnabled() ? getPlatformFeeBps() : 0)
  if (feeBps > 0) {
    url.searchParams.set('platformFeeBps', String(feeBps))
  }

  const res = await fetch(url.toString(), { headers: jupiterHeaders() })
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`Jupiter quote failed (${res.status})${body ? `: ${body.slice(0, 180)}` : ''}`)
  }
  return res.json()
}

export async function getJupiterSwapTransaction(opts: {
  quoteResponse: unknown
  userPublicKey: string
  inputMint: string
  outputMint: string
  wrapAndUnwrapSol?: boolean
}): Promise<{ swapTransaction: string }> {
  const feeAccount = resolveFeeAccount(opts.inputMint, opts.outputMint)
  const body: Record<string, unknown> = {
    quoteResponse: opts.quoteResponse,
    userPublicKey: opts.userPublicKey,
    wrapAndUnwrapSol: opts.wrapAndUnwrapSol ?? true,
    dynamicComputeUnitLimit: true,
    prioritizationFeeLamports: 'auto',
  }
  if (feeAccount && feesEnabled()) {
    body.feeAccount = feeAccount
  }

  const res = await fetch('https://quote-api.jup.ag/v6/swap', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...jupiterHeaders(),
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    // If fee ATA missing, retry once without fee so the user can still trade
    if (feeAccount && text.toLowerCase().includes('fee')) {
      const retry = await fetch('https://quote-api.jup.ag/v6/swap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...jupiterHeaders() },
        body: JSON.stringify({
          quoteResponse: opts.quoteResponse,
          userPublicKey: opts.userPublicKey,
          wrapAndUnwrapSol: opts.wrapAndUnwrapSol ?? true,
          dynamicComputeUnitLimit: true,
          prioritizationFeeLamports: 'auto',
        }),
      })
      if (retry.ok) return retry.json()
    }
    throw new Error(`Jupiter swap failed (${res.status})${text ? `: ${text.slice(0, 180)}` : ''}`)
  }

  return res.json()
}

export function solToLamports(sol: number): number {
  if (!Number.isFinite(sol) || sol <= 0) return 0
  return Math.floor(sol * 1_000_000_000)
}
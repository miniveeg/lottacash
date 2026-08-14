import { VersionedTransaction } from '@solana/web3.js'
import type { WalletContextState } from '@solana/wallet-adapter-react'
import { getJupiterQuote, getJupiterSwapTransaction, solToLamports, SOL_MINT } from './jupiter'
import { getConnection } from './connection'
import { estimateFeeSol, feesEnabled, getPlatformFeeBps } from './fees'
import { reportFeeEvent } from './api'

/**
 * Copy / demo swap flow with optional platform fee (Jupiter platformFeeBps).
 */
export async function executeDemoSwap(opts: {
  wallet: WalletContextState
  side: 'buy' | 'sell'
  tokenMint: string
  solAmount: number
  slippageBps: number
}): Promise<string> {
  const { wallet, side, tokenMint, solAmount, slippageBps } = opts

  if (!wallet.publicKey) {
    throw new Error('Wallet not connected')
  }
  if (!wallet.signTransaction) {
    throw new Error('This wallet cannot sign transactions in the browser')
  }

  const lamports = solToLamports(solAmount)
  if (lamports <= 0) throw new Error('Invalid amount')

  const inputMint = side === 'buy' ? SOL_MINT : tokenMint
  const outputMint = side === 'buy' ? tokenMint : SOL_MINT

  if (inputMint === outputMint) {
    throw new Error('Input and output mint cannot be the same')
  }

  const quote = await getJupiterQuote({
    inputMint,
    outputMint,
    amount: lamports,
    slippageBps,
  })

  const { swapTransaction } = await getJupiterSwapTransaction({
    quoteResponse: quote,
    userPublicKey: wallet.publicKey.toBase58(),
    inputMint,
    outputMint,
  })

  if (!swapTransaction) {
    throw new Error('Jupiter did not return a swap transaction')
  }

  const raw = Uint8Array.from(atob(swapTransaction), (c) => c.charCodeAt(0))
  const vtx = VersionedTransaction.deserialize(raw)

  const signed = await wallet.signTransaction(vtx)
  const connection = getConnection()

  const sig = await connection.sendRawTransaction(signed.serialize(), {
    skipPreflight: false,
    maxRetries: 3,
  })

  const latest = await connection.getLatestBlockhash('confirmed')
  await connection.confirmTransaction(
    {
      signature: sig,
      blockhash: latest.blockhash,
      lastValidBlockHeight: latest.lastValidBlockHeight,
    },
    'confirmed'
  )

  // Fire-and-forget revenue tracking (does not block UX)
  if (feesEnabled()) {
    reportFeeEvent({
      txSignature: sig,
      ownerWallet: wallet.publicKey.toBase58(),
      side,
      tradeSol: solAmount,
      feeBps: getPlatformFeeBps(),
      feeSolEstimate: estimateFeeSol(solAmount),
    }).catch(() => {
      /* ignore */
    })
  }

  return sig
}
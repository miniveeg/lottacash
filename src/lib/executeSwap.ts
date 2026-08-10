import { VersionedTransaction } from '@solana/web3.js'
import type { WalletContextState } from '@solana/wallet-adapter-react'
import { getJupiterQuote, getJupiterSwapTransaction, solToLamports, SOL_MINT } from './jupiter'
import { getConnection } from './connection'

/**
 * Full demo flow:
 * 1. Get Jupiter quote for SOL -> target mint (or reverse on sell)
 * 2. Build swap transaction
 * 3. User signs via wallet adapter
 * 4. Send raw transaction
 *
 * For a real copy: target mint and side come from the monitored trade.
 */
export async function executeDemoSwap(opts: {
  wallet: WalletContextState
  side: 'buy' | 'sell'
  /** For buy: output mint. For sell: input mint (token being sold). */
  tokenMint: string
  solAmount: number
  slippageBps: number
}): Promise<string> {
  const { wallet, side, tokenMint, solAmount, slippageBps } = opts

  if (!wallet.publicKey || !wallet.signTransaction) {
    throw new Error('Wallet not connected or does not support signing')
  }

  const lamports = solToLamports(solAmount)
  if (lamports <= 0) throw new Error('Invalid amount')

  // Demo uses SOL <-> token. Real copy uses the exact mint from the target trade.
  const inputMint = side === 'buy' ? SOL_MINT : tokenMint
  const outputMint = side === 'buy' ? tokenMint : SOL_MINT

  // For sell demo we still size in SOL terms approximately; production needs token balance sizing.
  const amount = side === 'buy' ? lamports : lamports

  const quote = await getJupiterQuote({
    inputMint,
    outputMint,
    amount,
    slippageBps,
  })

  const { swapTransaction } = await getJupiterSwapTransaction({
    quoteResponse: quote,
    userPublicKey: wallet.publicKey.toBase58(),
  })

  const txBuf = Buffer.from(swapTransaction, 'base64')
  const vtx = VersionedTransaction.deserialize(txBuf)

  const signed = await wallet.signTransaction(vtx)
  const connection = getConnection()
  const sig = await connection.sendRawTransaction(signed.serialize(), {
    skipPreflight: false,
    maxRetries: 3,
  })

  await connection.confirmTransaction(sig, 'confirmed')
  return sig
}
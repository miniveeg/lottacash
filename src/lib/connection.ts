import { Connection, clusterApiUrl } from '@solana/web3.js'

const rpc = import.meta.env.VITE_SOLANA_RPC_URL as string | undefined
const network = (import.meta.env.VITE_SOLANA_NETWORK as string) || 'mainnet-beta'

export const SOLANA_NETWORK = network === 'devnet' ? 'devnet' : 'mainnet-beta'

let cached: Connection | null = null
let cachedEndpoint: string | null = null

export function getRpcEndpoint(): string {
  if (rpc && rpc.length > 0) return rpc
  return clusterApiUrl(SOLANA_NETWORK as 'mainnet-beta' | 'devnet')
}

export function getConnection(): Connection {
  const endpoint = getRpcEndpoint()
  if (!cached || cachedEndpoint !== endpoint) {
    cached = new Connection(endpoint, {
      commitment: 'confirmed',
      confirmTransactionInitialTimeout: 60_000,
    })
    cachedEndpoint = endpoint
  }
  return cached
}
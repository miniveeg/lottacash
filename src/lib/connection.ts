import { Connection, clusterApiUrl } from '@solana/web3.js'

const rpc = import.meta.env.VITE_SOLANA_RPC_URL as string | undefined
const network = (import.meta.env.VITE_SOLANA_NETWORK as string) || 'mainnet-beta'

export const SOLANA_NETWORK = network === 'devnet' ? 'devnet' : 'mainnet-beta'

export function getConnection(): Connection {
  const endpoint = rpc && rpc.length > 0 ? rpc : clusterApiUrl(SOLANA_NETWORK as 'mainnet-beta' | 'devnet')
  return new Connection(endpoint, 'confirmed')
}
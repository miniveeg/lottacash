import { config } from './config.js'

interface RpcResult<T> {
  result?: T
  error?: { message: string; code?: number }
}

export async function rpcCall<T>(method: string, params: unknown[]): Promise<T> {
  const res = await fetch(config.rpcUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method,
      params,
    }),
  })

  if (!res.ok) {
    throw new Error(`RPC HTTP ${res.status}`)
  }

  const json = (await res.json()) as RpcResult<T>
  if (json.error) {
    throw new Error(json.error.message || 'RPC error')
  }
  return json.result as T
}

export interface SignatureInfo {
  signature: string
  err: unknown
  blockTime: number | null
  memo?: string | null
}

export async function getSignaturesForAddress(
  address: string,
  limit = 15
): Promise<SignatureInfo[]> {
  return rpcCall<SignatureInfo[]>('getSignaturesForAddress', [
    address,
    { limit },
  ])
}

export async function getTransaction(signature: string): Promise<unknown | null> {
  return rpcCall('getTransaction', [
    signature,
    { encoding: 'jsonParsed', maxSupportedTransactionVersion: 0 },
  ])
}
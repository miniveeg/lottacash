export const config = {
  port: Number(process.env.PORT || 3001),
  webhookSecret: process.env.WEBHOOK_SECRET || 'dev-secret-change-me',
  heliusApiKey: process.env.HELIUS_API_KEY || '',
  /** Public RPC or Helius RPC URL */
  rpcUrl:
    process.env.SOLANA_RPC_URL ||
    (process.env.HELIUS_API_KEY
      ? `https://mainnet.helius-rpc.com/?api-key=${process.env.HELIUS_API_KEY}`
      : 'https://api.mainnet-beta.solana.com'),
  /** Enable background polling of watched wallets */
  monitorEnabled: process.env.MONITOR_ENABLED !== 'false',
  monitorIntervalMs: Math.max(15_000, Number(process.env.MONITOR_INTERVAL_MS || 45_000)),
  version: '0.2.0',
}

export function hasHelius() {
  return Boolean(config.heliusApiKey)
}
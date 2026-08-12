import express from 'express'
import cors from 'cors'
import { randomUUID } from 'crypto'
import {
  listConfigs,
  upsertConfig,
  deleteConfig,
  listSignals,
  addSignal,
  updateSignal,
  listWatchedTargets,
  configsForTarget,
} from './store.js'
import { getLeaderboard } from './leaderboard.js'
import { config, hasHelius } from './config.js'
import { startMonitorWorker, getMonitorStatus, runMonitorCycle } from './monitorWorker.js'
import type { CopyConfig, TradeSignal } from './types.js'

const app = express()
const PORT = config.port
const WEBHOOK_SECRET = config.webhookSecret
const VERSION = config.version

app.use(cors({ origin: true }))
app.use(express.json({ limit: '2mb' }))

app.use((req, res, next) => {
  const id = randomUUID().slice(0, 8)
  res.setHeader('x-request-id', id)
  const start = Date.now()
  res.on('finish', () => {
    if (req.path !== '/api/health') {
      console.log(`${req.method} ${req.path} ${res.statusCode} ${Date.now() - start}ms [${id}]`)
    }
  })
  next()
})

function finiteNumber(value: unknown, fallback: number): number {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    service: 'lottacash-server',
    version: VERSION,
    time: Date.now(),
    helius: hasHelius(),
    monitor: getMonitorStatus(),
  })
})

app.get('/api/monitor/status', (_req, res) => {
  res.json(getMonitorStatus())
})

app.post('/api/monitor/run', async (_req, res) => {
  try {
    await runMonitorCycle()
    res.json({ ok: true, status: getMonitorStatus() })
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : 'run failed' })
  }
})

app.get('/api/leaderboard', (req, res) => {
  const tf = (req.query.timeframe as string) || 'weekly'
  const timeframe = tf === 'daily' || tf === 'all' ? tf : 'weekly'
  res.json({ timeframe, wallets: getLeaderboard(timeframe), source: 'seed+activity' })
})

app.get('/api/configs', (req, res) => {
  const owner = String(req.query.owner || '').trim()
  if (!owner) return res.status(400).json({ error: 'owner query required' })
  res.json({ configs: listConfigs(owner) })
})

app.post('/api/configs', (req, res) => {
  const body = req.body as Partial<CopyConfig>
  const ownerWallet = String(body.ownerWallet || '').trim()
  const targetAddress = String(body.targetAddress || '').trim()
  if (!ownerWallet || !targetAddress) {
    return res.status(400).json({ error: 'ownerWallet and targetAddress required' })
  }
  if (ownerWallet.length > 64 || targetAddress.length > 64) {
    return res.status(400).json({ error: 'invalid address length' })
  }

  const now = Date.now()
  const existing = listConfigs(ownerWallet).find((c) => c.targetAddress === targetAddress)
  const fixedSol = Math.max(0.01, finiteNumber(body.fixedSol, 0.5))
  const maxSol = Math.max(fixedSol, finiteNumber(body.maxSol, 5))
  const slippageBps = Math.min(5000, Math.max(1, Math.round(finiteNumber(body.slippageBps, 200))))

  const configRow: CopyConfig = {
    id: existing?.id || randomUUID(),
    ownerWallet,
    targetAddress,
    sizeMode: body.sizeMode === 'proportional' ? 'proportional' : 'fixed',
    fixedSol,
    maxSol,
    slippageBps,
    enabled: body.enabled !== false,
    createdAt: existing?.createdAt || now,
    updatedAt: now,
  }
  upsertConfig(configRow)
  res.json({ config: configRow })
})

app.delete('/api/configs', (req, res) => {
  const owner = String(req.query.owner || '').trim()
  const target = String(req.query.target || '').trim()
  if (!owner || !target) return res.status(400).json({ error: 'owner and target required' })
  deleteConfig(owner, target)
  res.json({ ok: true })
})

app.get('/api/signals', (req, res) => {
  const owner = String(req.query.owner || '').trim()
  if (!owner) return res.status(400).json({ error: 'owner query required' })
  res.json({ signals: listSignals(owner) })
})

app.patch('/api/signals/:id', (req, res) => {
  const id = String(req.params.id || '')
  const body = (req.body || {}) as Partial<TradeSignal>
  const allowedStatus = ['pending', 'signed', 'dismissed', 'failed'] as const
  const patch: Partial<Pick<TradeSignal, 'status' | 'txSignature' | 'error'>> = {}

  if (body.status && (allowedStatus as readonly string[]).includes(body.status)) {
    patch.status = body.status
  }
  if (typeof body.txSignature === 'string') patch.txSignature = body.txSignature.slice(0, 128)
  if (typeof body.error === 'string') patch.error = body.error.slice(0, 500)

  const updated = updateSignal(id, patch)
  if (!updated) return res.status(404).json({ error: 'not found' })
  res.json({ signal: updated })
})

app.post('/api/signals/demo', (req, res) => {
  const ownerWallet = String(req.body?.ownerWallet || '').trim()
  const targetAddress = String(req.body?.targetAddress || '').trim()
  const side = req.body?.side === 'sell' ? 'sell' : 'buy'

  if (!ownerWallet || !targetAddress) {
    return res.status(400).json({ error: 'ownerWallet and targetAddress required' })
  }

  const cfg = listConfigs(ownerWallet).find((c) => c.targetAddress === targetAddress)
  const suggested =
    cfg?.sizeMode === 'fixed'
      ? Math.min(cfg.fixedSol, cfg.maxSol)
      : Math.min(0.75, cfg?.maxSol ?? 1)

  const signal: TradeSignal = {
    id: randomUUID(),
    ownerWallet,
    targetAddress,
    side,
    tokenMint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    tokenSymbol: 'USDC',
    suggestedSol: Math.max(0.01, suggested),
    detectedAt: Date.now(),
    status: 'pending',
  }
  addSignal(signal)
  res.json({ signal })
})

/**
 * Helius / external webhook.
 * Point Helius Address Webhook or custom worker here.
 * Header: x-webhook-secret
 */
app.post('/api/webhook/trade', (req, res) => {
  const secret = req.header('x-webhook-secret')
  if (secret !== WEBHOOK_SECRET) return res.status(401).json({ error: 'unauthorized' })

  // Support both our simple schema and a Helius-like payload
  let targetAddress = String(req.body?.targetAddress || req.body?.accountData?.[0]?.account || '').trim()
  let tokenMint = String(req.body?.tokenMint || '').trim()
  let tokenSymbol = req.body?.tokenSymbol ? String(req.body.tokenSymbol) : undefined
  let side: 'buy' | 'sell' = req.body?.side === 'sell' ? 'sell' : 'buy'
  let amountSolApprox = finiteNumber(req.body?.amountSolApprox, 0.5)

  // Helius raw webhook: try feePayer as target
  if (!targetAddress && req.body?.feePayer) {
    targetAddress = String(req.body.feePayer)
  }
  if (!tokenMint && Array.isArray(req.body?.tokenTransfers) && req.body.tokenTransfers[0]?.mint) {
    tokenMint = String(req.body.tokenTransfers[0].mint)
  }
  if (!tokenMint) tokenMint = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'

  if (!targetAddress) {
    return res.status(400).json({ error: 'targetAddress required' })
  }

  const configs = configsForTarget(targetAddress)
  const created: TradeSignal[] = []

  for (const cfg of configs) {
    let suggested = cfg.sizeMode === 'fixed' ? cfg.fixedSol : amountSolApprox
    suggested = Math.min(suggested, cfg.maxSol)
    if (suggested <= 0) continue

    const signal: TradeSignal = {
      id: randomUUID(),
      ownerWallet: cfg.ownerWallet,
      targetAddress,
      side,
      tokenMint,
      tokenSymbol,
      suggestedSol: suggested,
      detectedAt: Date.now(),
      status: 'pending',
    }
    addSignal(signal)
    created.push(signal)
  }

  res.json({ ok: true, signalsCreated: created.length, watched: listWatchedTargets().length })
})

app.get('/api/watched', (_req, res) => {
  res.json({ targets: listWatchedTargets() })
})

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err)
  res.status(500).json({ error: 'internal_error' })
})

app.listen(PORT, () => {
  console.log(`LottaCash API v${VERSION} on http://localhost:${PORT}`)
  startMonitorWorker()
})
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
import type { CopyConfig, TradeSignal } from './types.js'

const app = express()
const PORT = Number(process.env.PORT || 3001)
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || 'dev-secret-change-me'

app.use(cors({ origin: true }))
app.use(express.json({ limit: '1mb' }))

function finiteNumber(value: unknown, fallback: number): number {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'lottacash-server', time: Date.now() })
})

app.get('/api/leaderboard', (req, res) => {
  const tf = (req.query.timeframe as string) || 'weekly'
  const timeframe = tf === 'daily' || tf === 'all' ? tf : 'weekly'
  res.json({ timeframe, wallets: getLeaderboard(timeframe) })
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

  const now = Date.now()
  const existing = listConfigs(ownerWallet).find((c) => c.targetAddress === targetAddress)
  const fixedSol = Math.max(0.01, finiteNumber(body.fixedSol, 0.5))
  const maxSol = Math.max(fixedSol, finiteNumber(body.maxSol, 5))
  const slippageBps = Math.min(5000, Math.max(1, Math.round(finiteNumber(body.slippageBps, 200))))

  const config: CopyConfig = {
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
  upsertConfig(config)
  res.json({ config })
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
  if (typeof body.txSignature === 'string') patch.txSignature = body.txSignature
  if (typeof body.error === 'string') patch.error = body.error

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

app.post('/api/webhook/trade', (req, res) => {
  const secret = req.header('x-webhook-secret')
  if (secret !== WEBHOOK_SECRET) return res.status(401).json({ error: 'unauthorized' })

  const targetAddress = String(req.body?.targetAddress || '').trim()
  const tokenMint = String(req.body?.tokenMint || '').trim()
  const tokenSymbol = req.body?.tokenSymbol ? String(req.body.tokenSymbol) : undefined
  const side = req.body?.side === 'sell' ? 'sell' : 'buy'
  const amountSolApprox = finiteNumber(req.body?.amountSolApprox, 0.5)

  if (!targetAddress || !tokenMint) {
    return res.status(400).json({ error: 'targetAddress and tokenMint required' })
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
  console.log(`LottaCash API listening on http://localhost:${PORT}`)
})
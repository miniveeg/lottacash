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

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'lottacash-server', time: Date.now() })
})

app.get('/api/leaderboard', (req, res) => {
  const tf = (req.query.timeframe as string) || 'weekly'
  const timeframe = tf === 'daily' || tf === 'all' ? tf : 'weekly'
  res.json({ timeframe, wallets: getLeaderboard(timeframe) })
})

/** List copy configs for a wallet */
app.get('/api/configs', (req, res) => {
  const owner = String(req.query.owner || '')
  if (!owner) return res.status(400).json({ error: 'owner query required' })
  res.json({ configs: listConfigs(owner) })
})

/** Create / update a copy config */
app.post('/api/configs', (req, res) => {
  const body = req.body as Partial<CopyConfig>
  if (!body.ownerWallet || !body.targetAddress) {
    return res.status(400).json({ error: 'ownerWallet and targetAddress required' })
  }
  const now = Date.now()
  const existing = listConfigs(body.ownerWallet).find((c) => c.targetAddress === body.targetAddress)
  const config: CopyConfig = {
    id: existing?.id || randomUUID(),
    ownerWallet: body.ownerWallet,
    targetAddress: body.targetAddress,
    sizeMode: body.sizeMode === 'proportional' ? 'proportional' : 'fixed',
    fixedSol: Number(body.fixedSol ?? 0.5),
    maxSol: Number(body.maxSol ?? 5),
    slippageBps: Number(body.slippageBps ?? 200),
    enabled: body.enabled !== false,
    createdAt: existing?.createdAt || now,
    updatedAt: now,
  }
  upsertConfig(config)
  res.json({ config })
})

app.delete('/api/configs', (req, res) => {
  const owner = String(req.query.owner || '')
  const target = String(req.query.target || '')
  if (!owner || !target) return res.status(400).json({ error: 'owner and target required' })
  deleteConfig(owner, target)
  res.json({ ok: true })
})

app.get('/api/signals', (req, res) => {
  const owner = String(req.query.owner || '')
  if (!owner) return res.status(400).json({ error: 'owner query required' })
  res.json({ signals: listSignals(owner) })
})

app.patch('/api/signals/:id', (req, res) => {
  const updated = updateSignal(req.params.id, req.body || {})
  if (!updated) return res.status(404).json({ error: 'not found' })
  res.json({ signal: updated })
})

/** Manual demo signal (mirrors frontend demo button, but server-side) */
app.post('/api/signals/demo', (req, res) => {
  const { ownerWallet, targetAddress, side } = req.body || {}
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
    side: side === 'sell' ? 'sell' : 'buy',
    tokenMint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    tokenSymbol: 'USDC',
    suggestedSol: suggested,
    detectedAt: Date.now(),
    status: 'pending',
  }
  addSignal(signal)
  res.json({ signal })
})

/**
 * Webhook for external monitors (e.g. Helius address activity).
 * Header: x-webhook-secret must match WEBHOOK_SECRET
 *
 * Body example:
 * {
 *   "targetAddress": "...",
 *   "side": "buy",
 *   "tokenMint": "...",
 *   "tokenSymbol": "BONK",
 *   "amountSolApprox": 1.2
 * }
 */
app.post('/api/webhook/trade', (req, res) => {
  const secret = req.header('x-webhook-secret')
  if (secret !== WEBHOOK_SECRET) return res.status(401).json({ error: 'unauthorized' })

  const { targetAddress, side, tokenMint, tokenSymbol, amountSolApprox } = req.body || {}
  if (!targetAddress || !tokenMint) {
    return res.status(400).json({ error: 'targetAddress and tokenMint required' })
  }

  const configs = configsForTarget(targetAddress)
  const created: TradeSignal[] = []

  for (const cfg of configs) {
    let suggested =
      cfg.sizeMode === 'fixed'
        ? cfg.fixedSol
        : Number(amountSolApprox || 0.5)
    suggested = Math.min(suggested, cfg.maxSol)
    if (suggested <= 0) continue

    const signal: TradeSignal = {
      id: randomUUID(),
      ownerWallet: cfg.ownerWallet,
      targetAddress,
      side: side === 'sell' ? 'sell' : 'buy',
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

app.listen(PORT, () => {
  console.log(`LottaCash API listening on http://localhost:${PORT}`)
})
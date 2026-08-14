import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DATA_DIR = path.join(__dirname, '..', 'data')
const FILE = path.join(DATA_DIR, 'fee-events.json')

export interface FeeEvent {
  id: string
  txSignature: string
  ownerWallet: string
  side: string
  tradeSol: number
  feeBps: number
  feeSolEstimate: number
  at: number
}

function ensure() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true })
}

function readAll(): FeeEvent[] {
  ensure()
  try {
    if (!fs.existsSync(FILE)) return []
    return JSON.parse(fs.readFileSync(FILE, 'utf8')) as FeeEvent[]
  } catch {
    return []
  }
}

function writeAll(events: FeeEvent[]) {
  ensure()
  const tmp = `${FILE}.tmp`
  fs.writeFileSync(tmp, JSON.stringify(events.slice(0, 2000), null, 2), 'utf8')
  fs.renameSync(tmp, FILE)
}

export function addFeeEvent(event: FeeEvent) {
  const all = readAll()
  if (all.some((e) => e.txSignature === event.txSignature)) return
  all.unshift(event)
  writeAll(all)
}

export function feeStats() {
  const all = readAll()
  const totalTradeSol = all.reduce((s, e) => s + (e.tradeSol || 0), 0)
  const totalFeeSolEstimate = all.reduce((s, e) => s + (e.feeSolEstimate || 0), 0)
  return {
    totalEvents: all.length,
    totalTradeSol: Number(totalTradeSol.toFixed(6)),
    totalFeeSolEstimate: Number(totalFeeSolEstimate.toFixed(6)),
    recent: all.slice(0, 20),
  }
}
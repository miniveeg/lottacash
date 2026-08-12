import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DATA_DIR = path.join(__dirname, '..', 'data')
const FILE = path.join(DATA_DIR, 'monitor-state.json')

interface MonitorState {
  /** address -> last processed signature */
  lastSig: Record<string, string>
  /** signatures already turned into signals */
  seenSigs: string[]
  lastRunAt: number
  lastError?: string
  cycles: number
  signalsEmitted: number
}

function ensure() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true })
}

export function readMonitorState(): MonitorState {
  ensure()
  try {
    if (!fs.existsSync(FILE)) {
      return { lastSig: {}, seenSigs: [], lastRunAt: 0, cycles: 0, signalsEmitted: 0 }
    }
    return JSON.parse(fs.readFileSync(FILE, 'utf8')) as MonitorState
  } catch {
    return { lastSig: {}, seenSigs: [], lastRunAt: 0, cycles: 0, signalsEmitted: 0 }
  }
}

export function writeMonitorState(state: MonitorState) {
  ensure()
  const tmp = `${FILE}.tmp`
  fs.writeFileSync(tmp, JSON.stringify(state, null, 2), 'utf8')
  fs.renameSync(tmp, FILE)
}
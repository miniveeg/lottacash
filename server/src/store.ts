import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import type { CopyConfig, TradeSignal } from './types.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DATA_DIR = path.join(__dirname, '..', 'data')
const CONFIGS_FILE = path.join(DATA_DIR, 'configs.json')
const SIGNALS_FILE = path.join(DATA_DIR, 'signals.json')

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true })
}

function readJson<T>(file: string, fallback: T): T {
  ensureDataDir()
  try {
    if (!fs.existsSync(file)) return fallback
    return JSON.parse(fs.readFileSync(file, 'utf8')) as T
  } catch {
    return fallback
  }
}

function writeJson(file: string, data: unknown) {
  ensureDataDir()
  const tmp = `${file}.tmp`
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2), 'utf8')
  fs.renameSync(tmp, file)
}

export function listConfigs(ownerWallet?: string): CopyConfig[] {
  const all = readJson<CopyConfig[]>(CONFIGS_FILE, [])
  if (!ownerWallet) return all
  return all.filter((c) => c.ownerWallet === ownerWallet)
}

export function upsertConfig(config: CopyConfig): CopyConfig {
  const all = readJson<CopyConfig[]>(CONFIGS_FILE, [])
  const idx = all.findIndex(
    (c) => c.ownerWallet === config.ownerWallet && c.targetAddress === config.targetAddress
  )
  if (idx >= 0) all[idx] = config
  else all.push(config)
  writeJson(CONFIGS_FILE, all)
  return config
}

export function deleteConfig(ownerWallet: string, targetAddress: string) {
  const all = readJson<CopyConfig[]>(CONFIGS_FILE, [])
  writeJson(
    CONFIGS_FILE,
    all.filter((c) => !(c.ownerWallet === ownerWallet && c.targetAddress === targetAddress))
  )
}

export function listSignals(ownerWallet?: string): TradeSignal[] {
  const all = readJson<TradeSignal[]>(SIGNALS_FILE, [])
  const filtered = ownerWallet ? all.filter((s) => s.ownerWallet === ownerWallet) : all
  return filtered.sort((a, b) => b.detectedAt - a.detectedAt).slice(0, 100)
}

export function addSignal(signal: TradeSignal) {
  const all = readJson<TradeSignal[]>(SIGNALS_FILE, [])
  all.unshift(signal)
  writeJson(SIGNALS_FILE, all.slice(0, 200))
  return signal
}

export function updateSignal(
  id: string,
  patch: Partial<Pick<TradeSignal, 'status' | 'txSignature' | 'error'>>
) {
  const all = readJson<TradeSignal[]>(SIGNALS_FILE, [])
  const idx = all.findIndex((s) => s.id === id)
  if (idx < 0) return null
  all[idx] = { ...all[idx], ...patch }
  writeJson(SIGNALS_FILE, all)
  return all[idx]
}

export function listWatchedTargets(): string[] {
  const all = listConfigs()
  return [...new Set(all.filter((c) => c.enabled).map((c) => c.targetAddress))]
}

export function configsForTarget(targetAddress: string): CopyConfig[] {
  return listConfigs().filter((c) => c.enabled && c.targetAddress === targetAddress)
}
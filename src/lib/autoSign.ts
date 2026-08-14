import { notifyApp } from './events'
import { ABSOLUTE_MIN_COPY_SOL } from './minTrade'

const KEY = 'lottacash_auto_sign_v1'

export interface AutoSignSettings {
  enabled: boolean
  acknowledged: boolean
  maxSolPerTrade: number
  maxPerSession: number
  pollSeconds: number
  onlyWhenFocused: boolean
  sessionSigned: number
  sessionFailed: number
  lastError?: string
  lastRunAt?: number
}

const DEFAULTS: AutoSignSettings = {
  enabled: false,
  acknowledged: false,
  // Default auto max should still clear the ~$2 idea when SOL isn’t sky-high
  maxSolPerTrade: 0.05,
  maxPerSession: 10,
  pollSeconds: 12,
  onlyWhenFocused: true,
  sessionSigned: 0,
  sessionFailed: 0,
}

export function getAutoSignSettings(): AutoSignSettings {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return { ...DEFAULTS }
    const parsed = JSON.parse(raw) as Partial<AutoSignSettings>
    return {
      ...DEFAULTS,
      ...parsed,
      enabled: Boolean(parsed.enabled) && Boolean(parsed.acknowledged),
      maxSolPerTrade: Math.min(
        5,
        Math.max(ABSOLUTE_MIN_COPY_SOL, Number(parsed.maxSolPerTrade) || DEFAULTS.maxSolPerTrade)
      ),
      maxPerSession: Math.min(100, Math.max(1, Math.floor(Number(parsed.maxPerSession) || 10))),
      pollSeconds: Math.min(120, Math.max(8, Math.floor(Number(parsed.pollSeconds) || 12))),
      sessionSigned: Number(parsed.sessionSigned) || 0,
      sessionFailed: Number(parsed.sessionFailed) || 0,
    }
  } catch {
    return { ...DEFAULTS }
  }
}

export function saveAutoSignSettings(patch: Partial<AutoSignSettings>) {
  const next = { ...getAutoSignSettings(), ...patch }
  localStorage.setItem(KEY, JSON.stringify(next))
  notifyApp()
  return next
}

export function disableAutoSign(reason?: string) {
  return saveAutoSignSettings({
    enabled: false,
    lastError: reason,
    lastRunAt: Date.now(),
  })
}

export function bumpAutoSignStat(kind: 'signed' | 'failed', error?: string) {
  const s = getAutoSignSettings()
  if (kind === 'signed') {
    return saveAutoSignSettings({
      sessionSigned: s.sessionSigned + 1,
      lastRunAt: Date.now(),
      lastError: undefined,
    })
  }
  return saveAutoSignSettings({
    sessionFailed: s.sessionFailed + 1,
    lastRunAt: Date.now(),
    lastError: error,
  })
}

const attempted = new Set<string>()

export function wasAutoAttempted(id: string) {
  return attempted.has(id)
}

export function markAutoAttempted(id: string) {
  attempted.add(id)
}

export function clearAutoAttempted() {
  attempted.clear()
}

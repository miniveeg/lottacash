import { notifyApp } from './events'

const KEY = 'lottacash_auto_sign_v1'

export interface AutoSignSettings {
  /** Master switch — off by default */
  enabled: boolean
  /** User acknowledged experimental risks */
  acknowledged: boolean
  /** Hard cap per auto trade in SOL */
  maxSolPerTrade: number
  /** Stop after this many auto trades in the current browser session */
  maxPerSession: number
  /** Seconds between scans for pending signals */
  pollSeconds: number
  /** Only auto-sign while this browser tab is focused */
  onlyWhenFocused: boolean
  /** Session counters (reset on reload) */
  sessionSigned: number
  sessionFailed: number
  lastError?: string
  lastRunAt?: number
}

const DEFAULTS: AutoSignSettings = {
  enabled: false,
  acknowledged: false,
  maxSolPerTrade: 0.1,
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
      // Never restore enabled across cold starts without re-ack in same session flags
      enabled: Boolean(parsed.enabled) && Boolean(parsed.acknowledged),
      maxSolPerTrade: Math.min(5, Math.max(0.01, Number(parsed.maxSolPerTrade) || 0.1)),
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

/** Signals already attempted this session (avoid double-fire) */
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

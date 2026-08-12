/** Tiny pub/sub so nav badges and dashboards refresh when local data changes */

const listeners = new Set<() => void>()

export function subscribeApp(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function notifyApp() {
  listeners.forEach((l) => {
    try {
      l()
    } catch {
      /* ignore */
    }
  })
  try {
    window.dispatchEvent(new Event('lottacash:update'))
  } catch {
    /* ignore */
  }
}

export function useAppVersion(): number {
  // Lazy import pattern avoided — consumers use useSyncExternalStore directly
  return 0
}
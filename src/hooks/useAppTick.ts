import { useSyncExternalStore } from 'react'
import { subscribeApp } from '../lib/events'

let version = 0

function subscribe(onStoreChange: () => void) {
  return subscribeApp(() => {
    version += 1
    onStoreChange()
  })
}

function getSnapshot() {
  return version
}

/** Re-render when copy configs or signals change in localStorage stores */
export function useAppTick() {
  return useSyncExternalStore(subscribe, getSnapshot, () => 0)
}
import type { CopyConfig } from './types'

const STORAGE_KEY = 'lottacash_copy_configs_v1'

function readAll(): CopyConfig[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    return JSON.parse(raw) as CopyConfig[]
  } catch {
    return []
  }
}

function writeAll(configs: CopyConfig[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(configs))
}

export function listCopyConfigs(): CopyConfig[] {
  return readAll().sort((a, b) => b.updatedAt - a.updatedAt)
}

export function getCopyConfig(targetAddress: string): CopyConfig | undefined {
  return readAll().find((c) => c.targetAddress === targetAddress)
}

export function saveCopyConfig(config: Omit<CopyConfig, 'createdAt' | 'updatedAt'> & { createdAt?: number }): CopyConfig {
  const now = Date.now()
  const existing = readAll()
  const idx = existing.findIndex((c) => c.targetAddress === config.targetAddress)

  const full: CopyConfig = {
    ...config,
    createdAt: config.createdAt ?? (idx >= 0 ? existing[idx].createdAt : now),
    updatedAt: now,
  }

  if (idx >= 0) {
    existing[idx] = full
  } else {
    existing.push(full)
  }

  writeAll(existing)
  return full
}

export function removeCopyConfig(targetAddress: string) {
  writeAll(readAll().filter((c) => c.targetAddress !== targetAddress))
}

export function setCopyEnabled(targetAddress: string, enabled: boolean) {
  const existing = getCopyConfig(targetAddress)
  if (!existing) return
  saveCopyConfig({ ...existing, enabled })
}
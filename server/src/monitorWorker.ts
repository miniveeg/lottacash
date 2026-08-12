import { randomUUID } from 'crypto'
import { config, hasHelius } from './config.js'
import { getSignaturesForAddress, getTransaction } from './rpc.js'
import { heliusEnhancedTxs, parseHeliusSwap } from './helius.js'
import { listWatchedTargets, configsForTarget, addSignal } from './store.js'
import { readMonitorState, writeMonitorState } from './monitorState.js'
import type { TradeSignal } from './types.js'

const JUPITER_HINTS = ['JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4', 'JUP4Fb2cqiRUcaTHdrPC8h2gNsA2ETXiPDD33WcGuJB']

let timer: ReturnType<typeof setInterval> | null = null
let running = false

function looksLikeSwap(tx: unknown): boolean {
  if (!tx || typeof tx !== 'object') return false
  const str = JSON.stringify(tx)
  return JUPITER_HINTS.some((h) => str.includes(h)) || str.includes('Jupiter') || str.includes('raydium')
}

function emitForTarget(
  targetAddress: string,
  opts: {
    side: 'buy' | 'sell'
    tokenMint: string
    tokenSymbol?: string
    amountSolApprox: number
    sourceSig: string
  }
) {
  const configs = configsForTarget(targetAddress)
  if (configs.length === 0) return 0

  let count = 0
  for (const cfg of configs) {
    let suggested = cfg.sizeMode === 'fixed' ? cfg.fixedSol : opts.amountSolApprox
    suggested = Math.min(Math.max(suggested, 0.01), cfg.maxSol)
    const signal: TradeSignal = {
      id: randomUUID(),
      ownerWallet: cfg.ownerWallet,
      targetAddress,
      side: opts.side,
      tokenMint: opts.tokenMint,
      tokenSymbol: opts.tokenSymbol,
      suggestedSol: suggested,
      detectedAt: Date.now(),
      status: 'pending',
    }
    addSignal(signal)
    count += 1
  }
  return count
}

async function processAddress(address: string, state: ReturnType<typeof readMonitorState>) {
  // Prefer Helius enhanced txs when available
  if (hasHelius()) {
    const txs = await heliusEnhancedTxs(address, 12)
    if (txs) {
      for (const raw of txs) {
        const tx = raw as Record<string, unknown>
        const sig = String(tx.signature || '')
        if (!sig || state.seenSigs.includes(sig)) continue
        const parsed = parseHeliusSwap(tx)
        state.seenSigs.unshift(sig)
        if (!parsed) continue
        const n = emitForTarget(address, { ...parsed, sourceSig: sig })
        state.signalsEmitted += n
        if (n > 0) console.log(`[monitor] Helius signal(s) for ${address.slice(0, 8)}… sig=${sig.slice(0, 8)}`)
      }
      state.lastSig[address] = String((txs[0] as { signature?: string })?.signature || state.lastSig[address] || '')
      return
    }
  }

  // RPC fallback: new signatures + Jupiter program presence
  const sigs = await getSignaturesForAddress(address, 12)
  if (sigs.length === 0) return

  const last = state.lastSig[address]
  for (const s of sigs) {
    if (s.signature === last) break
    if (state.seenSigs.includes(s.signature)) continue
    if (s.err) {
      state.seenSigs.unshift(s.signature)
      continue
    }

    let isSwap = false
    try {
      const tx = await getTransaction(s.signature)
      isSwap = looksLikeSwap(tx)
    } catch {
      isSwap = false
    }

    state.seenSigs.unshift(s.signature)
    if (!isSwap) continue

    const n = emitForTarget(address, {
      side: 'buy',
      tokenMint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
      tokenSymbol: 'TOKEN',
      amountSolApprox: 0.25,
      sourceSig: s.signature,
    })
    state.signalsEmitted += n
    if (n > 0) console.log(`[monitor] RPC swap signal for ${address.slice(0, 8)}…`)
  }

  state.lastSig[address] = sigs[0].signature
}

export async function runMonitorCycle() {
  if (running) return
  running = true
  const state = readMonitorState()
  try {
    const targets = listWatchedTargets()
    if (targets.length === 0) {
      state.lastRunAt = Date.now()
      state.cycles += 1
      state.lastError = undefined
      writeMonitorState(state)
      return
    }

    for (const address of targets) {
      try {
        await processAddress(address, state)
      } catch (e) {
        console.warn('[monitor] address error', address.slice(0, 8), e)
      }
      // be gentle on public RPC
      await new Promise((r) => setTimeout(r, 400))
    }

    state.seenSigs = state.seenSigs.slice(0, 500)
    state.lastRunAt = Date.now()
    state.cycles += 1
    state.lastError = undefined
    writeMonitorState(state)
  } catch (e) {
    state.lastError = e instanceof Error ? e.message : String(e)
    state.lastRunAt = Date.now()
    writeMonitorState(state)
    console.error('[monitor] cycle failed', e)
  } finally {
    running = false
  }
}

export function startMonitorWorker() {
  if (!config.monitorEnabled) {
    console.log('[monitor] disabled (MONITOR_ENABLED=false)')
    return
  }
  console.log(
    `[monitor] starting · interval ${config.monitorIntervalMs}ms · helius=${hasHelius()} · rpc=${config.rpcUrl.slice(0, 48)}…`
  )
  // initial delay so server boots cleanly
  setTimeout(() => {
    runMonitorCycle().catch(console.error)
  }, 5_000)
  timer = setInterval(() => {
    runMonitorCycle().catch(console.error)
  }, config.monitorIntervalMs)
}

export function stopMonitorWorker() {
  if (timer) clearInterval(timer)
  timer = null
}

export function getMonitorStatus() {
  const state = readMonitorState()
  return {
    enabled: config.monitorEnabled,
    helius: hasHelius(),
    intervalMs: config.monitorIntervalMs,
    watched: listWatchedTargets().length,
    ...state,
  }
}